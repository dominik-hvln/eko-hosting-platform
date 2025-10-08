import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Server } from '../admin/servers/entities/server.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerStatus } from '../common/enums/server-status.enum';
import { ProvisioningStage } from '../common/enums/provisioning-stage.enum';
import { NodeSSH } from 'node-ssh';
import * as fs from 'fs';
import * as path from 'path';

@Processor('provisioning')
export class ProvisioningProcessor extends WorkerHost {
    private readonly logger = new Logger(ProvisioningProcessor.name);

    constructor(
        @InjectRepository(Server)
        private readonly serversRepository: Repository<Server>,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`[WORKER] Otrzymano zadanie [${job.id}] o nazwie: ${job.name}`);

        if (job.name.startsWith('provision-stage-')) {
            const stage = job.name.replace('provision-stage-', '');
            if (['cloudlinux', 'litespeed', 'config'].includes(stage)) {
                return this.handleServerProvisioning(job, stage);
            }
        }

        // Tutaj w przyszłości będzie logika dla innych zadań, np. 'create-hosting-account'
        this.logger.warn(`Otrzymano nieobsługiwany typ zadania: ${job.name}`);
    }

    private async handleServerProvisioning(job: Job, stage: string) {
        const { serverId } = job.data;
        this.logger.log(`Rozpoczynam etap '${stage}' dla serwera docelowego: ${serverId}`);

        const targetServer = await this.serversRepository.findOneBy({ id: serverId });
        if (!targetServer) {
            throw new Error(`Serwer docelowy o ID ${serverId} nie istnieje.`);
        }

        // Zmiana statusu serwera na 'provisioning'
        targetServer.status = ServerStatus.PROVISIONING;
        await this.serversRepository.save(targetServer);

        const ssh = new NodeSSH();

        // Zmienne środowiskowe dla Kontrolera Ansible
        const ansibleControllerIp = process.env.ANSIBLE_CONTROLLER_IP;
        const ansibleControllerUser = process.env.ANSIBLE_CONTROLLER_USER;
        const ansibleControllerKeyPath = process.env.ANSIBLE_CONTROLLER_KEY_PATH;

        if (!ansibleControllerIp || !ansibleControllerUser || !ansibleControllerKeyPath) {
            throw new Error('Zmienne środowiskowe dla Kontrolera Ansible nie są w pełni skonfigurowane (.env)');
        }

        const privateKey = fs.readFileSync(ansibleControllerKeyPath, 'utf8');

        try {
            this.logger.log(`Łączenie z Kontrolerem Ansible (${ansibleControllerUser}@${ansibleControllerIp})...`);
            await ssh.connect({
                host: ansibleControllerIp,
                username: ansibleControllerUser,
                privateKey: privateKey,
            });

            const playbookPath = '/home/ansible/playbooks/playbook.yml'; // Ścieżka do playbooka na kontrolerze
            const targetIp = targetServer.ipAddress;

            // Budujemy komendę do zdalnego uruchomienia na Kontrolerze Ansible
            const command = `cd /home/ansible/playbooks && ansible-playbook ${playbookPath} --tags ${stage} --limit ${targetIp} --ask-vault-pass`;

            this.logger.log(`Uruchamiam zdalną komendę na Kontrolerze Ansible: ${command}`);

            const result = await ssh.execCommand(command, {
                stream: 'stdout', // Przekierowujemy stderr do stdout, aby wszystko logować w jednym miejscu
                onStdout: (chunk) => this.logger.log(`[Ansible Remote]: ${chunk.toString('utf8').trim()}`),
                stdin: `${process.env.ANSIBLE_VAULT_PASSWORD}\n`, // Przekazujemy hasło do Vault przez stdin
            });

            if (result.code !== 0) {
                throw new Error(`Zdalny proces Ansible dla etapu '${stage}' zakończył się błędem (kod ${result.code})`);
            }

            // Aktualizacja statusu po pomyślnym etapie
            const stageMap = {
                cloudlinux: ProvisioningStage.CLOUDLINUX_DONE,
                litespeed: ProvisioningStage.LITESPEED_DONE,
                config: ProvisioningStage.COMPLETED,
            };

            const currentStage = stageMap[stage];
            if (currentStage) {
                targetServer.provisioningStage = currentStage;
            }

            // Po ostatnim etapie ('config') zmieniamy status na ONLINE
            if (stage === 'config') {
                targetServer.status = ServerStatus.ONLINE;
            }
            await this.serversRepository.save(targetServer);

            this.logger.log(`Etap '${stage}' dla serwera ${serverId} zakończony pomyślnie.`);

        } catch (error) {
            this.logger.error(`KRYTYCZNY BŁĄD podczas etapu '${stage}' dla serwera ${serverId}:`, error.stack);
            targetServer.status = ServerStatus.ERROR;
            targetServer.provisioningStage = ProvisioningStage.FAILED;
            await this.serversRepository.save(targetServer);
            throw error;
        } finally {
            if (ssh.isConnected()) {
                ssh.dispose();
            }
        }
    }
}