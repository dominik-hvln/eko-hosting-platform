import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from './entities/domain.entity';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { ServicesService } from '../../services/services.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class DomainsService {
    private readonly logger = new Logger(DomainsService.name);

    constructor(
        @InjectRepository(Domain)
        private readonly domainsRepository: Repository<Domain>,
        private readonly servicesService: ServicesService,
        @InjectQueue('provisioning') private readonly provisioningQueue: Queue,
    ) {}

    async findAllForService(serviceId: string, userId: string): Promise<Domain[]> {
        await this.servicesService.findOneForUser(serviceId, userId); // Walidacja uprawnień
        return this.domainsRepository.find({ where: { service: { id: serviceId } } });
    }

    async create(createDomainDto: CreateDomainDto, serviceId: string, userId: string): Promise<Domain> {
        const service = await this.servicesService.findOneForUser(serviceId, userId); // Walidacja uprawnień

        const newDomain = this.domainsRepository.create({
            name: createDomainDto.name,
            service: service,
        });

        const savedDomain = await this.domainsRepository.save(newDomain);

        this.logger.log(`Dodawanie zadania 'create-domain' do kolejki dla domeny ${savedDomain.name}`);
        await this.provisioningQueue.add('create-domain', {
            domainId: savedDomain.id,
            domainName: savedDomain.name,
            systemUser: service.systemUser,
            phpVersion: savedDomain.phpVersion,
        });

        return savedDomain;
    }

    async updatePhpVersion(domainId: string, updateDomainDto: UpdateDomainDto, serviceId: string, userId: string): Promise<Domain> {
        const service = await this.servicesService.findOneForUser(serviceId, userId);
        const domain = await this.domainsRepository.findOneBy({ id: domainId, service: { id: serviceId } });

        if (!domain) {
            throw new NotFoundException(`Domena o ID ${domainId} nie została znaleziona.`);
        }

        domain.phpVersion = updateDomainDto.phpVersion;
        const updatedDomain = await this.domainsRepository.save(domain);

        this.logger.log(`Dodawanie zadania 'change-php-version' dla domeny ${domain.name}`);
        await this.provisioningQueue.add('change-php-version', {
            domainName: domain.name,
            phpVersion: updatedDomain.phpVersion,
        });

        return updatedDomain;
    }

    async remove(domainId: string, serviceId: string, userId: string): Promise<void> {
        await this.servicesService.findOneForUser(serviceId, userId);
        const domain = await this.domainsRepository.findOneBy({ id: domainId, service: { id: serviceId } });

        if (!domain) {
            throw new NotFoundException(`Domena o ID ${domainId} nie została znaleziona.`);
        }

        // TODO: Dodać zadanie do kolejki usuwające domenę z serwera

        const result = await this.domainsRepository.delete(domainId);
        if (result.affected === 0) {
            throw new NotFoundException(`Domena o ID ${domainId} nie została znaleziona.`);
        }
    }
}