// src/admin/servers/servers.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { Server } from './entities/server.entity';

@Injectable()
export class ServersService {
    constructor(
        @InjectRepository(Server)
        private readonly serversRepository: Repository<Server>,
        private readonly encryptionService: EncryptionService,
    ) {}

    async create(createServerDto: CreateServerDto): Promise<Server> {
        const encryptedKey = this.encryptionService.encrypt(createServerDto.sshPrivateKey);
        const serverData = { ...createServerDto, sshPrivateKey: encryptedKey };

        const newServer = this.serversRepository.create(serverData);
        return this.serversRepository.save(newServer);
    }

    async findAll(): Promise<Server[]> {
        // Zwracamy listę bez kluczy prywatnych
        return this.serversRepository.find({
            select: ['id', 'name', 'ipAddress', 'sshPort', 'sshUser', 'status', 'loadIndex', 'createdAt'],
        });
    }

    async findOne(id: string): Promise<Server> {
        const server = await this.serversRepository.findOneBy({ id });
        if (!server) {
            throw new NotFoundException(`Serwer o ID ${id} nie został znaleziony.`);
        }
        // Deszyfrujemy klucz, aby można go było wyświetlić w formularzu edycji
        server.sshPrivateKey = this.encryptionService.decrypt(server.sshPrivateKey);
        return server;
    }

    async update(id: string, updateServerDto: UpdateServerDto): Promise<Server> {
        if (updateServerDto.sshPrivateKey) {
            updateServerDto.sshPrivateKey = this.encryptionService.encrypt(updateServerDto.sshPrivateKey);
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