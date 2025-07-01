// src/provisioning/provisioning.processor.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ServersService } from '../admin/servers/servers.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { NodeSSH } from 'node-ssh';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { Repository } from 'typeorm';
import { Server } from '../admin/servers/entities/server.entity';
import { ServiceStatus } from '../common/enums/service-status.enum';
import { ServerStatus } from '../common/enums/server-status.enum';
import * as cmd from 'node-cmd';
import * as fs from 'fs';
import * as path from 'path';

@Processor('provisioning')
export class ProvisioningProcessor extends WorkerHost {
  private readonly logger = new Logger(ProvisioningProcessor.name);

  constructor(
    private readonly serversService: ServersService,
    private readonly encryptionService: EncryptionService,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(Server)
    private readonly serversRepository: Repository<Server>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[WORKER] Otrzymano zadanie [${job.id}] o nazwie: ${job.name}`,
    );

    switch (job.name) {
      case 'provision-server':
        const { serverId } = job.data;
        return this.handleServerProvisioning(job, serverId);

      case 'create-hosting-account':
        return this.handleCreateHostingAccount(job);

      default:
        this.logger.warn(`Otrzymano nieznany typ zadania: ${job.name}`);
        break;
    }
  }

  private async handleServerProvisioning(job: Job, serverId: string) {
    this.logger.log(`Rozpoczynam provisioning dla serwera: ${serverId}`);
    const server = await this.serversService.findOne(serverId);
    if (!server) throw new Error(`Serwer o ID ${serverId} nie istnieje.`);

    server.status = ServerStatus.PROVISIONING;
    await this.serversRepository.save(server);

    const keyPath = path.join('/tmp', `ssh_key_${serverId}`);
    const decryptedKey = this.encryptionService.decrypt(server.sshPrivateKey);
    fs.writeFileSync(keyPath, decryptedKey);
    fs.chmodSync(keyPath, '600');

    const command = `
            ansible-playbook ansible/playbook.yml \
            -i "${server.ipAddress}," \
            --user ${server.sshUser} \
            --private-key ${keyPath} \
            --extra-vars "ansible_ssh_common_args='-o StrictHostKeyChecking=no'"
        `
      .replace(/\s+/g, ' ')
      .trim(); // Normalizujemy komendę

    this.logger.log(`Uruchamiam komendę Ansible: ${command}`);

    try {
      await new Promise<void>((resolve, reject) => {
        cmd.run(command, (err, data, stderr) => {
          this.logger.log(`[ANSIBLE STDOUT] dla serwera ${serverId}:\n${data}`);
          if (err || stderr) {
            this.logger.error(
              `[ANSIBLE STDERR] dla serwera ${serverId}:\n${stderr}`,
            );
            reject(err || new Error(stderr));
          } else {
            resolve();
          }
        });
      });

      server.status = ServerStatus.ONLINE;
      await this.serversRepository.save(server);
      this.logger.log(`Provisioning serwera ${serverId} zakończony sukcesem.`);
    } catch (error) {
      server.status = ServerStatus.ERROR;
      await this.serversRepository.save(server);
      this.logger.error(
        `Provisioning serwera ${serverId} zakończył się błędem:`,
        error,
      );
      throw error;
    } finally {
      if (fs.existsSync(keyPath)) {
        fs.unlinkSync(keyPath);
      }
    }

    return { done: true, serverId: server.id };
  }

  private async handleCreateHostingAccount(job: Job) {
    const { serviceId } = job.data;
    this.logger.log(
      `Rozpoczynam logikę dla 'create-hosting-account', usługa: ${serviceId}`,
    );

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: ['user', 'plan'],
    });
    if (!service) throw new Error(`Usługa o ID ${serviceId} nie istnieje.`);

    const server = await this.serversService.findLeastLoadedServer();
    this.logger.log(
      `Wybrano serwer: ${server.name} (${server.ipAddress}) dla usługi ${serviceId}`,
    );

    const ssh = new NodeSSH();
    const serverWithKey = await this.serversService.findOne(server.id);

    await ssh.connect({
      host: serverWithKey.ipAddress,
      port: serverWithKey.sshPort,
      username: serverWithKey.sshUser,
      privateKey: this.encryptionService.decrypt(serverWithKey.sshPrivateKey),
      readyTimeout: 15000,
    });
    this.logger.log(`Połączono z serwerem ${server.name} przez SSH.`);

    const username = `${service.user.email.split('@')[0]}${Math.floor(Math.random() * 100)}`;
    const domain = service.name;
    const command = `/usr/local/bin/create_account.sh ${username} ${domain}`;

    const result = await ssh.execCommand(command);
    ssh.dispose();

    if (result.code !== 0) {
      throw new Error(
        `Błąd wykonywania skryptu provisioningu na serwerze: ${result.stderr}`,
      );
    }
    this.logger.log(
      `Pomyślnie wykonano skrypt tworzenia konta dla usługi ${serviceId}. Odpowiedź: ${result.stdout}`,
    );

    service.provisionedOnServer = server;
    service.systemUser = username;
    service.status = ServiceStatus.ACTIVE;
    await this.servicesRepository.save(service);

    server.loadIndex += 1;
    await this.serversRepository.save(server);

    this.logger.log(
      `[WORKER] Zakończono przetwarzanie zadania [${job.id}] dla usługi: ${serviceId}`,
    );
    return { done: true, serverId: server.id, username };
  }
}
