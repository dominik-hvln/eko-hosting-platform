import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  // --- NOWA METODA ---
  async findAllForUser(userId: string): Promise<Transaction[]> {
    // Znajdujemy transakcje, gdzie portfel (wallet) należy do danego użytkownika (user)
    return this.transactionsRepository.find({
      where: {
        wallet: {
          user: {
            id: userId,
          },
        },
      },
      // Sortujemy od najnowszych
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
