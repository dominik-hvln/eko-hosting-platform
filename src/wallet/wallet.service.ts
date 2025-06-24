import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
      @InjectRepository(Wallet)
      private readonly walletsRepository: Repository<Wallet>,
      // Dodajemy wstrzyknięcie DataSource, aby móc używać transakcji
      private readonly dataSource: DataSource,
  ) {}

  async create(userId: string): Promise<Wallet> {
    const wallet = this.walletsRepository.create({
      user: { id: userId },
      balance: 0,
      ekoPoints: 0,
    });
    return this.walletsRepository.save(wallet);
  }

  async findOneByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet for user ID ${userId} not found`);
    }
    return wallet;
  }

  async handleEkoRedemption(userId: string, pointsSpent: number, creditAmount: number) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOneBy(Wallet, { user: { id: userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      wallet.ekoPoints -= pointsSpent;
      wallet.balance = parseFloat(wallet.balance.toString()) + creditAmount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        wallet: wallet,
        amount: creditAmount,
        currency: 'pln',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.EKO_CREDIT,
        provider: 'internal', // Oznaczamy jako transakcję wewnętrzną
        providerTransactionId: `eko-${uuidv4()}`, // Generujemy unikalne ID
        description: `Wymiana ${pointsSpent} pkt EKO na środki.`,
      });
      await manager.save(transaction);
      return { message: 'Punkty pomyślnie wymienione na środki.' };
    });
  }
}