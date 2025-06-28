// src/admin/servers/servers.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { Server } from './entities/server.entity';
import { NodeSSH } from 'node-ssh';
import { ServerStatus } from '../../common/enums/server-status.enum';

@Injectable()
export class ServersService {
    private readonly logger = new Logger(ServersService.name);

    constructor(
        @InjectRepository(Server)
        private readonly serversRepository: Repository<Server>,
        private readonly encryptionService: EncryptionService,
    ) {}

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
        const server = await this.findOne(id);
        if (!server) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }
        const ssh = new NodeSSH();
        try {
            await ssh.connect({
                host: server.ipAddress,
                port: server.sshPort,
                username: server.sshUser,
                privateKey: server.sshPrivateKey,
                readyTimeout: 10000,
            });

            const result = await ssh.execCommand('df -h /');
            ssh.dispose();

            if (result.code === 0) {
                server.status = ServerStatus.ONLINE;
                server.sshPrivateKey = this.encryptionService.encrypt(server.sshPrivateKey);
                await this.serversRepository.save(server);
                return { success: true, message: 'Połączenie udane!', output: result.stdout };
            } else {
                throw new Error(result.stderr || `Komenda zakończyła się kodem błędu: ${result.code}`);
            }
        } catch (error) {
            ssh.dispose();
            server.status = ServerStatus.ERROR;
            server.sshPrivateKey = this.encryptionService.encrypt(server.sshPrivateKey);
            await this.serversRepository.save(server);
            return { success: false, message: error.message };
        }
    }

    async create(createServerDto: CreateServerDto): Promise<Server> {
        const encryptedKey = this.encryptionService.encrypt(createServerDto.sshPrivateKey);
        const serverData = { ...createServerDto, sshPrivateKey: encryptedKey, status: ServerStatus.OFFLINE };

        const newServer = this.serversRepository.create(serverData);
        return this.serversRepository.save(newServer);
    }

    async findAll(): Promise<Server[]> {
        return this.serversRepository.find({
            select: ['id', 'name', 'ipAddress', 'sshPort', 'sshUser', 'status', 'loadIndex', 'createdAt'],
        });
    }

    async findOne(id: string): Promise<Server> {
        const server = await this.serversRepository.findOneBy({ id });
        if (!server) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }

        if (server.sshPrivateKey) {
            try {
                server.sshPrivateKey = this.encryptionService.decrypt(server.sshPrivateKey);
            } catch (e) {
                this.logger.error(`Could not decrypt private key for server ${id}. It might be corrupted or not encrypted.`);
                server.sshPrivateKey = 'BŁĄD DESZYFROWANIA KLUCZA';
            }
        }
        return server;
    }

    async update(id: string, updateServerDto: UpdateServerDto): Promise<Server> {
        if (updateServerDto.sshPrivateKey && updateServerDto.sshPrivateKey.trim() !== '') {
            updateServerDto.sshPrivateKey = this.encryptionService.encrypt(updateServerDto.sshPrivateKey);
        } else {
            delete updateServerDto.sshPrivateKey;
        }
        const server = await this.serversRepository.preload({
            id: id,
            ...updateServerDto,
        });
        if (!server) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }
        return this.serversRepository.save(server);
    }

    async remove(id: string): Promise<void> {
        const result = await this.serversRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }
    }
}