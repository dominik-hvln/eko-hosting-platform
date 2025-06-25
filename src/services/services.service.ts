import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';
import { UpdateServiceDto } from './dto/update-service.dto';
import { User } from '../users/entities/user.entity';
import { BillingCycle } from '../common/enums/billing-cycle.enum';
import { EkoService } from '../eko/eko.service';
import { EkoActionType } from '../eko/entities/eko-action-history.entity';

@Injectable()
export class ServicesService {
  constructor(
      @InjectRepository(Service)
      private readonly servicesRepository: Repository<Service>,
      private readonly ekoService: EkoService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    let expiresAt: Date | undefined = createServiceDto.expiresAt;

    // Jeśli data wygaśnięcia nie została podana ręcznie, obliczamy ją automatycznie
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
      expiresAt: expiresAt, // Używamy naszej nowej, obliczonej lub podanej daty
    });
    return this.servicesRepository.save(newService);
  }

  findAllForUser(userId: string) {
    return this.servicesRepository.find({ where: { user: { id: userId } }, relations: ['plan'] });
  }

  async findOneForUser(id: string, userId: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id: id, user: { id: userId } },
      relations: ['plan', 'user'],
    });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found or access denied`);
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

  // --- Metody dla Admina ---
  findAll(): Promise<Service[]> {
    return this.servicesRepository.find({ relations: ['user', 'plan'] });
  }

  // POPRAWIONA WERSJA findOne dla admina
  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ where: { id }, relations: ['user', 'plan'] });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id); // Poprawnie używa findOne z jednym argumentem
    Object.assign(service, updateServiceDto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id); // Poprawnie używa findOne z jednym argumentem
    await this.servicesRepository.remove(service);
  }
}