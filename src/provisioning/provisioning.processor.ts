// src/provisioning/provisioning.processor.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ServersService } from '../admin/servers/servers.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { Server } from '../admin/servers/entities/server.entity';
import { Repository } from 'typeorm';
import { NodeSSH } from 'node-ssh';
import { Domain } from '../service-resources/domains/entities/domain.entity';
import { Database } from '../service-resources/databases/entities/database.entity';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { ServerStatus } from '../common/enums/server-status.enum';
import { ServiceStatus } from '../common/enums/service-status.enum';

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
      @InjectRepository(Domain)
      private readonly domainsRepository: Repository<Domain>,
      @InjectRepository(Database)
      private readonly databasesRepository: Repository<Database>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
        `[WORKER] Otrzymano zadanie [${job.id}] o nazwie: ${job.name}`,
    );

    switch (job.name) {
      case 'provision-server':
        return this.handleServerProvisioning(job);
      case 'create-hosting-account':
        return this.handleCreateHostingAccount(job);
      case 'create-domain':
        return this.handleCreateDomain(job.data);
      case 'change-php-version':
        return this.handleChangePhpVersion(job.data);
      case 'create-database':
        return this.handleCreateDatabase(job.data);
      case 'delete-database':
        return this.handleDeleteDatabase(job.data);
      default:
        this.logger.warn(`Otrzymano nieznany typ zadania: ${job.name}`);
        break;
    }
  }

  private async handleServerProvisioning(job: Job) {
    const { serverId, rootPassword } = job.data;
    this.logger.log(`Rozpoczynam provisioning dla serwera: ${serverId}`);


    const server = await this.serversService.findOneRaw(serverId);
    if (!server) {
      this.logger.error(`Serwer o ID ${serverId} nie został znaleziony w bazie danych.`);
      throw new Error(`Serwer o ID ${serverId} nie istnieje.`);
    }

    const serverToUpdate = await this.serversRepository.findOneBy({ id: serverId });
    if (serverToUpdate) {
      serverToUpdate.status = ServerStatus.PROVISIONING;
      await this.serversRepository.save(serverToUpdate);
    }

    const keyPath = path.join('/tmp', `ssh_key_${serverId}`);

    try {
      this.logger.log(`Deszyfrowanie klucza SSH dla serwera ${serverId}...`);
      const decryptedKey = this.encryptionService.decrypt(server.sshPrivateKey);

      this.logger.log(`Zapisywanie klucza SSH do tymczasowego pliku: ${keyPath}`);
      fs.writeFileSync(keyPath, decryptedKey);

      this.logger.log(`Ustawianie uprawnień 600 dla pliku ${keyPath}`);
      fs.chmodSync(keyPath, '600');

      const playbookPath = path.resolve(process.cwd(), 'ansible/playbook.yml');
      this.logger.log(`Ścieżka do playbooka Ansible: ${playbookPath}`);

      if (!fs.existsSync(playbookPath)) {
        throw new Error(`Plik playbooka Ansible nie został znaleziony pod ścieżką: ${playbookPath}`);
      }

      const args = [
        '-vvv',
        playbookPath,
        '-i',
        `${server.ipAddress},`,
        '--user',
        server.sshUser,
        '--private-key',
        keyPath,
        '--extra-vars',
        `ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' mysql_root_password='${rootPassword}'`,
      ];

      this.logger.log(`Uruchamiam komendę Ansible z argumentami: ${args.join(' ')}`);

      await new Promise<void>((resolve, reject) => {
        const child = spawn('ansible-playbook', args);
        child.stdout.on('data', (data: Buffer) => {
          this.logger.log(`[Ansible STDOUT]: ${data.toString().trim()}`);
        });
        child.stderr.on('data', (data: Buffer) => {
          this.logger.warn(`[Ansible STDERR]: ${data.toString().trim()}`);
        });
        child.on('close', (code) => {
          if (code === 0) {
            this.logger.log(`Proces Ansible dla serwera ${serverId} zakończył się sukcesem (kod 0).`);
            resolve();
          } else {
            reject(new Error(`Proces Ansible zakończył się błędem (kod ${code})`));
          }
        });
        child.on('error', (err) => {
          this.logger.error(`Błąd uruchomienia procesu Ansible: ${err.message}`);
          reject(err);
        });
      });

      if (serverToUpdate) {
        serverToUpdate.status = ServerStatus.ONLINE;
        await this.serversRepository.save(serverToUpdate);
      }
      this.logger.log(`Provisioning serwera ${serverId} zakończony pomyślnie.`);

    } catch (error) {
      this.logger.error(`KRYTYCZNY BŁĄD podczas provisioningu serwera ${serverId}:`, error.stack);
      if (serverToUpdate) {
        serverToUpdate.status = ServerStatus.ERROR;
        await this.serversRepository.save(serverToUpdate);
      }
      throw error;
    } finally {
      this.logger.log(`Sprzątanie po provisioningu - usuwanie pliku klucza: ${keyPath}`);
      if (fs.existsSync(keyPath)) {
        fs.unlinkSync(keyPath);
      }
    }

    return {
      done: true,
      serverId: server.id,
      message: 'Provisioning zakończony',
    };
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

    const username =
        `${service.user.email.split('@')[0]}${Math.floor(Math.random() * 1000)}`.replace(
            /[^a-zA-Z0-9]/g,
            '',
        );
    const command = `/usr/local/bin/create_account.sh ${username}`;

    await this.executeRemoteScript(server, command);

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

  private async executeRemoteScript(server: Server, command: string) {
    const ssh = new NodeSSH();
    const serverWithKey = await this.serversService.findOne(server.id);

    await ssh.connect({
      host: serverWithKey.ipAddress,
      port: serverWithKey.sshPort,
      username: serverWithKey.sshUser,
      privateKey: this.encryptionService.decrypt(serverWithKey.sshPrivateKey),
      readyTimeout: 15000,
    });

    this.logger.log(
        `Wykonywanie komendy na serwerze ${server.name}: ${command}`,
    );
    const result = await ssh.execCommand(command);
    ssh.dispose();

    if (result.code !== 0) {
      this.logger.error(
          `Błąd skryptu na serwerze ${server.name}: ${result.stderr}`,
      );
      throw new Error(`Błąd wykonywania skryptu na serwerze: ${result.stderr}`);
    }

    this.logger.log(`Pomyślnie wykonano skrypt. Odpowiedź: ${result.stdout}`);
    return result.stdout;
  }

  private async findServerForService(serviceId: string): Promise<Server> {
    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: ['provisionedOnServer'],
    });
    if (!service || !service.provisionedOnServer) {
      throw new Error(
          `Nie można wykonać operacji, usługa ${serviceId} nie ma przypisanego serwera.`,
      );
    }
    return service.provisionedOnServer;
  }

  private async getDecryptedRootPassword(server: Server): Promise<string> {
    if (!server.mysqlRootPassword) {
      throw new Error(`Brak zapisanego hasła roota dla serwera ${server.id}`);
    }
    return this.encryptionService.decrypt(server.mysqlRootPassword);
  }

  private async handleCreateDomain(data: {
    domainId: string;
    domainName: string;
    systemUser: string;
    phpVersion: string;
  }) {
    const { domainId, domainName, systemUser, phpVersion } = data;
    const domain = await this.domainsRepository.findOne({
      where: { id: domainId },
      relations: ['service', 'service.provisionedOnServer'],
    });
    if (!domain || !domain.service || !domain.service.provisionedOnServer) {
      throw new Error(
          `Nie można utworzyć domeny, brak powiązanej usługi lub serwera.`,
      );
    }

    const server = domain.service.provisionedOnServer;
    const command = `/usr/local/bin/manage_domain.sh create ${domainName} ${systemUser} ${phpVersion}`;

    return this.executeRemoteScript(server, command);
  }

  private async handleChangePhpVersion(data: {
    domainName: string;
    phpVersion: string;
  }) {
    const domain = await this.domainsRepository.findOne({
      where: { name: data.domainName },
      relations: ['service', 'service.provisionedOnServer'],
    });
    if (!domain || !domain.service || !domain.service.provisionedOnServer) {
      throw new Error(
          `Nie można zmienić wersji PHP, brak powiązanej usługi lub serwera.`,
      );
    }

    const server = domain.service.provisionedOnServer;
    const command = `/usr/local/bin/manage_domain.sh change-php ${data.domainName} ${domain.service.systemUser} ${data.phpVersion}`;

    return this.executeRemoteScript(server, command);
  }

  private async handleCreateDatabase(data: {
    dbName: string;
    dbUser: string;
    dbPassword: string;
    serviceId: string;
  }) {
    const { dbName, dbUser, dbPassword, serviceId } = data;
    const server = await this.findServerForService(serviceId);
    const rootPassword = await this.getDecryptedRootPassword(server);
    const command = `/usr/local/bin/manage_database.sh create ${dbName} ${dbUser} '${dbPassword}' '${rootPassword}'`;
    return this.executeRemoteScript(server, command);
  }

  private async handleDeleteDatabase(data: {
    dbName: string;
    dbUser: string;
    serviceId: string;
  }) {
    const { dbName, dbUser, serviceId } = data;
    const server = await this.findServerForService(serviceId);
    const rootPassword = await this.getDecryptedRootPassword(server);
    const command = `/usr/local/bin/manage_database.sh delete ${dbName} ${dbUser} '' '${rootPassword}'`;
    return this.executeRemoteScript(server, command);
  }
}