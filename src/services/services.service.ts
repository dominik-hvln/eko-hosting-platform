import { Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ServicesService {
  constructor(
      @InjectRepository(Service)
      private readonly servicesRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { name, userId, planId } = createServiceDto;

    // Zwróć uwagę, jak przypisujemy relacje – TypeORM jest na tyle sprytny,
    // że wystarczy mu podać obiekty z samym `id`, aby poprawnie
    // utworzył klucze obce w bazie danych.
    const newService = this.servicesRepository.create({
      name,
      user: { id: userId },
      plan: { id: planId },
    });

    return this.servicesRepository.save(newService);
  }
}