import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlansService {
  constructor(
    // Wstrzykujemy repozytorium Plan, aby móc operować na tabeli 'plans'
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
  ) {}

  // --- TĘ METODĘ NAPRAWIAMY ---
  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    // Tworzymy nową instancję encji Plan na podstawie danych z DTO
    const newPlan = this.plansRepository.create(createPlanDto);
    // Zapisujemy nową encję w bazie danych
    return this.plansRepository.save(newPlan);
  }

  // --- Implementujemy pozostałe metody ---
  async findAll(): Promise<Plan[]> {
    return this.plansRepository.find();
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    // `preload` tworzy nową encję na podstawie obiektu.
    // Jeśli znajdzie encję z podanym ID w bazie, to zwraca ją ze zaktualizowanymi polami.
    const plan = await this.plansRepository.preload({
      id: id,
      ...updatePlanDto,
    });
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return this.plansRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id); // Używamy findOne, aby rzucić błąd, jeśli nie znajdzie
    await this.plansRepository.remove(plan);
  }
}
