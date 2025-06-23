import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';
import { UpdateServiceDto } from './dto/update-service.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ServicesService {
  constructor(
      @InjectRepository(Service)
      private readonly servicesRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const newService = this.servicesRepository.create({
      name: createServiceDto.name,
      // Do stworzenia relacji wystarczy podać obiekty z samym ID
      plan: { id: createServiceDto.planId },
      user: { id: createServiceDto.userId },
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