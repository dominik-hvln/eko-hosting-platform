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
    const newService = this.servicesRepository.create({
      name,
      user: { id: userId },
      plan: { id: planId },
    });
    return this.servicesRepository.save(newService);
  }

  // --- NOWA METODA ---
  // Znajduje wszystkie usługi dla danego użytkownika
  async findAllForUser(userId: string): Promise<Service[]> {
    // Używamy metody find z warunkiem 'where', aby filtrować wyniki.
    // Szukamy usług, gdzie relacja 'user' ma podane 'id'.
    // Dodatkowo 'relations: ['plan']' sprawia, że TypeORM dołączy
    // pełne dane planu do każdej usługi, a nie tylko jego ID.
    return this.servicesRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: ['plan'],
    });
  }
}