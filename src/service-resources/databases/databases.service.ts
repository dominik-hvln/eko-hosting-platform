import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Database } from './entities/database.entity';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { ServicesService } from '../../services/services.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EncryptionService } from '../../common/encryption/encryption.service';
import * as crypto from 'crypto';
import { DatabaseCredentialsDto } from './dto/database-credentials.dto';

@Injectable()
export class DatabasesService {
    private readonly logger = new Logger(DatabasesService.name);

    constructor(
        @InjectRepository(Database)
        private readonly databasesRepository: Repository<Database>,
        private readonly servicesService: ServicesService,
        private readonly encryptionService: EncryptionService,
        @InjectQueue('provisioning') private readonly provisioningQueue: Queue,
    ) {}

    async findAllForService(serviceId: string, userId: string): Promise<Omit<Database, 'password'>[]> {
        await this.servicesService.findOneForUser(serviceId, userId);
        return this.databasesRepository.find({
            where: { service: { id: serviceId } },
            select: ['id', 'name', 'user'], // Nie zwracamy hasła
        });
    }

    async getCredentials(databaseId: string, serviceId: string, userId: string): Promise<DatabaseCredentialsDto> {
        await this.servicesService.findOneForUser(serviceId, userId);
        const database = await this.databasesRepository.findOneBy({ id: databaseId, service: { id: serviceId }});
        if (!database) {
            throw new NotFoundException('Baza danych nie została znaleziona.');
        }
        return {
            ...database,
            password: this.encryptionService.decrypt(database.password),
        };
    }

    // POPRAWKA: Zmieniono zwracany typ na Promise<Omit<Database, 'password'>>
    async create(createDatabaseDto: CreateDatabaseDto, serviceId: string, userId: string): Promise<Omit<Database, 'password'>> {
        const service = await this.servicesService.findOneForUser(serviceId, userId);

        const password = crypto.randomBytes(12).toString('hex');
        const dbUser = `${service.systemUser}_${createDatabaseDto.name}`.substring(0, 32);
        const dbName = dbUser;

        const newDatabase = this.databasesRepository.create({
            name: dbName,
            user: dbUser,
            password: this.encryptionService.encrypt(password),
            service: service,
        });

        const savedDatabase = await this.databasesRepository.save(newDatabase);

        this.logger.log(`Dodawanie zadania 'create-database' do kolejki dla bazy ${dbName}`);
        await this.provisioningQueue.add('create-database', {
            dbName: dbName,
            dbUser: dbUser,
            dbPassword: password,
            serviceId: service.id,
        });

        // Tworzymy obiekt bez hasła do zwrócenia
        const { password: _, ...result } = savedDatabase;
        return result;
    }

    async remove(databaseId: string, serviceId: string, userId: string): Promise<void> {
        const service = await this.servicesService.findOneForUser(serviceId, userId);
        const database = await this.databasesRepository.findOneBy({ id: databaseId, service: { id: serviceId } });

        if (!database) {
            throw new NotFoundException(`Baza danych o ID ${databaseId} nie została znaleziona.`);
        }

        this.logger.log(`Dodawanie zadania 'delete-database' dla bazy ${database.name}`);
        await this.provisioningQueue.add('delete-database', {
            dbName: database.name,
            dbUser: database.user,
            serviceId: service.id,
        });

        await this.databasesRepository.delete(databaseId);
    }
}
