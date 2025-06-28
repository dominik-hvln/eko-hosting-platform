// src/services/services.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';
import { UpdateServiceDto } from './dto/update-service.dto';
import { User } from '../users/entities/user.entity';
import { BillingCycle } from '../common/enums/billing-cycle.enum';
import { EkoService } from '../eko/eko.service';
import { EkoActionType } from '../eko/entities/eko-action-history.entity';
import { Plan } from '../plans/entities/plan.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
      @InjectRepository(Service)
      private readonly servicesRepository: Repository<Service>,
      @InjectRepository(User)
      private readonly usersRepository: Repository<User>,
      @InjectRepository(Plan)
      private readonly plansRepository: Repository<Plan>,
      private readonly ekoService: EkoService,
      @InjectQueue('provisioning') private readonly provisioningQueue: Queue,
  ) {}

  async queueProvisioningForService(serviceId: string) {
    const service = await this.servicesRepository.findOneBy({ id: serviceId });
    if (!service) {
      throw new NotFoundException(`Usługa o ID ${serviceId} nie istnieje.`);
    }
    this.logger.log(`[PRODUCER] Ręczne dodawanie zadania dla usługi ${serviceId} do kolejki.`);
    await this.provisioningQueue.add('create-hosting-account', { serviceId });
    return { message: `Zadanie provisioningu dla usługi ${serviceId} zostało dodane do kolejki.` };
  }

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    let expiresAt: Date | undefined = createServiceDto.expiresAt;
    if (!expiresAt) {
      expiresAt = new Date();
      if (createServiceDto.billingCycle === BillingCycle.YEARLY) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
    }
    const newService = this.servicesRepository.create({
      name: createServiceDto.name,
      plan: { id: createServiceDto.planId },
      user: { id: createServiceDto.userId },
      billingCycle: createServiceDto.billingCycle,
      autoRenew: createServiceDto.autoRenew,
      expiresAt: expiresAt,
    });
    return this.servicesRepository.save(newService);
  }

  findAllForUser(userId: string): Promise<Service[]> {
    return this.servicesRepository.find({ where: { user: { id: userId } }, relations: ['plan'] });
  }

  async findOneForUser(id: string, userId: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id: id, user: { id: userId } },
      relations: ['plan', 'user'],
    });
    if (!service) {
      throw new NotFoundException(`Usługa o ID "${id}" nie została znaleziona lub nie masz do niej dostępu`);
    }
    return service;
  }

  async toggleAutoRenewForUser(id: string, userId: string): Promise<Service> {
    const service = await this.findOneForUser(id, userId);
    service.autoRenew = !service.autoRenew;
    if (service.autoRenew) {
      this.ekoService.grantPointsForAction(userId, EkoActionType.AUTO_RENEWAL_REWARD);
    }
    return this.servicesRepository.save(service);
  }

  findAll(): Promise<Service[]> {
    return this.servicesRepository.find({ relations: ['user', 'plan'] });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ where: { id }, relations: ['user', 'plan'] });
    if (!service) {
      throw new NotFoundException(`Usługa o ID "${id}" nie została znaleziona`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, updateServiceDto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);
  }
}