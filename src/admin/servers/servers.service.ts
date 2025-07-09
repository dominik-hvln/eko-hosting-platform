// src/admin/servers/servers.service.ts

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { Server } from './entities/server.entity';
import { NodeSSH } from 'node-ssh';
import { ServerStatus } from '../../common/enums/server-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';

@Injectable()
export class ServersService {
    private readonly logger = new Logger(ServersService.name);

    constructor(
        @InjectRepository(Server)
        private readonly serversRepository: Repository<Server>,
        private readonly encryptionService: EncryptionService,
        @InjectQueue('provisioning') private readonly provisioningQueue: Queue,
    ) {}

    private async findServerById(id: string): Promise<Server> {
        const server = await this.serversRepository.findOneBy({ id });
        if (!server) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }
        return server;
    }

    async findOneRaw(id: string): Promise<Server> {
        return this.findServerById(id);
    }

    async queueServerProvisioning(serverId: string) {
        // Używamy findOneRaw, żeby nie deszyfrować klucza bez potrzeby
        const server = await this.findOneRaw(serverId);
        if (!server) {
            throw new NotFoundException(`Serwer o ID ${serverId} nie istnieje.`);
        }
        const rootPassword = crypto.randomBytes(16).toString('hex');
        server.mysqlRootPassword = this.encryptionService.encrypt(rootPassword);
        await this.serversRepository.save(server);
        this.logger.log(`[PRODUCER] Zlecanie zadania 'provision-server' dla serwera ${serverId}`);
        await this.provisioningQueue.add('provision-server', { serverId: serverId, rootPassword: rootPassword });
        return { message: `Zadanie provisioningu dla serwera ${serverId} zostało dodane do kolejki.` };
    }

    async findLeastLoadedServer(): Promise<Server> {
        const server = await this.serversRepository.findOne({
            where: { status: ServerStatus.ONLINE },
            order: { loadIndex: 'ASC' },
        });
        if (!server) {
            throw new Error('Brak dostępnych serwerów online do provisioningu.');
        }
        return server;
    }

    async testConnection(id: string): Promise<{ success: boolean; message: string; output?: string }> {
        const server = await this.findServerById(id);
        let decryptedKey: string;

        try {
            decryptedKey = this.encryptionService.decrypt(server.sshPrivateKey);
        } catch (error) {
            this.logger.error(`Błąd deszyfrowania klucza SSH dla serwera ${id}: ${error.message}`);
            throw new BadRequestException('Zapisany klucz SSH jest uszkodzony lub ma nieprawidłowy format. Proszę, zaktualizuj go.');
        }

        const ssh = new NodeSSH();
        try {
            await ssh.connect({
                host: server.ipAddress,
                port: server.sshPort,
                username: server.sshUser,
                privateKey: decryptedKey,
                readyTimeout: 10000,
            });

            const result = await ssh.execCommand('df -h /');
            ssh.dispose();

            if (result.code === 0) {
                server.status = ServerStatus.ONLINE;
                await this.serversRepository.save(server);
                return { success: true, message: 'Połączenie udane!', output: result.stdout };
            } else {
                throw new Error(result.stderr || `Komenda zakończyła się kodem błędu: ${result.code}`);
            }
        } catch (error) {
            ssh.dispose();
            server.status = ServerStatus.ERROR;
            await this.serversRepository.save(server);
            return { success: false, message: error.message };
        }
    }

    async create(createServerDto: CreateServerDto): Promise<Server> {
        const encryptedKey = this.encryptionService.encrypt(
            createServerDto.sshPrivateKey,
        );
        const serverData = {
            ...createServerDto,
            sshPrivateKey: encryptedKey,
            status: ServerStatus.OFFLINE,
        };
        const newServer = this.serversRepository.create(serverData);
        return this.serversRepository.save(newServer);
    }

    async findAll(): Promise<Server[]> {
        return this.serversRepository.find({
            select: [
                'id',
                'name',
                'ipAddress',
                'sshPort',
                'sshUser',
                'status',
                'loadIndex',
                'createdAt',
            ],
        });
    }

    async findOne(id: string): Promise<Server> {
        const server = await this.findServerById(id);
        try {
            server.sshPrivateKey = this.encryptionService.decrypt(server.sshPrivateKey);
        } catch (e) {
            this.logger.error(`Could not decrypt private key for server ${id}. It might be corrupted or not encrypted.`);
            server.sshPrivateKey = 'BŁĄD DESZYFROWANIA KLUCZA';
        }
        return server;
    }

    // --- POCZĄTEK POPRAWIONEJ METODY ---
    async update(id: string, updateServerDto: UpdateServerDto): Promise<Server> {
        // Sprawdzamy, czy w żądaniu aktualizacji podano nowy, niepusty klucz prywatny.
        if (
            updateServerDto.sshPrivateKey &&
            updateServerDto.sshPrivateKey.trim() !== ''
        ) {
            // Jeśli tak, szyfrujemy go przed aktualizacją.
            this.logger.log(`Otrzymano nowy klucz SSH dla serwera ${id}. Szyfrowanie...`);
            updateServerDto.sshPrivateKey = this.encryptionService.encrypt(
                updateServerDto.sshPrivateKey,
            );
        } else {
            // Jeśli nie podano nowego klucza, usuwamy to pole z obiektu DTO.
            // Dzięki temu `preload` nie nadpisze istniejącego klucza w bazie
            // wartością pustą lub `undefined`. Zachowa starą wartość.
            delete updateServerDto.sshPrivateKey;
        }

        const server = await this.serversRepository.preload({
            id: id,
            ...updateServerDto,
        });

        if (!server) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }

        this.logger.log(`Zapisywanie zmian dla serwera ${id}.`);
        return this.serversRepository.save(server);
    }
    // --- KONIEC POPRAWIONEJ METODY ---

    async remove(id: string): Promise<void> {
        const result = await this.serversRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }
    }
}