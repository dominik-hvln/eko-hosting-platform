import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
      @InjectRepository(Service)
      private readonly servicesRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { name, userId, planId } = createServiceDto;
    const newService = this.servicesRepository.create({
      name,
      user: { id: userId },
      plan: { id: planId },
    });
    return this.servicesRepository.save(newService);
  }

  async findAllForUser(userId: string): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { user: { id: userId } },
      relations: ['plan'],
    });
  }

  // --- NOWE METODY ADMINISTRACYJNE ---

  // Znajduje wszystkie usługi w systemie (dla admina)
  async findAll(): Promise<Service[]> {
    return this.servicesRepository.find({
      relations: ['user', 'plan'], // Dołączamy dane usera i planu
    });
  }

  // Znajduje jedną, konkretną usługę
  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: ['user', 'plan'],
    });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return service;
  }

  // Aktualizuje usługę
  async update(
      id: string,
      updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.servicesRepository.preload({
      id: id,
      ...updateServiceDto,
    });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return this.servicesRepository.save(service);
  }

  // Usuwa usługę
  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);
  }
}