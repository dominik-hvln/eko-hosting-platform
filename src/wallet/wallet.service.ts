import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WalletService {
  constructor(
      @InjectRepository(Wallet)
      private readonly walletsRepository: Repository<Wallet>,
  ) {}

  // Ta metoda będzie znajdować portfel po ID użytkownika
  async findOneByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet for user with ID "${userId}" not found`);
    }
    return wallet;
  }
}