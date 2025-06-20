import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Repository } from 'typeorm';

const POINTS_FOR_DARK_MODE = 10;

@Injectable()
export class EkoService {
  constructor(
      @InjectRepository(Wallet)
      private readonly walletsRepository: Repository<Wallet>,
  ) {}

  async addPointsForDarkMode(userId: string): Promise<Wallet> {
    // Znajdujemy portfel użytkownika
    const wallet = await this.walletsRepository.findOneBy({
      user: { id: userId },
    });

    if (!wallet) {
      throw new NotFoundException(
          `Wallet for user with ID "${userId}" not found`,
      );
    }

    // Dodajemy punkty i zapisujemy zmiany
    wallet.ekoPoints += POINTS_FOR_DARK_MODE;
    return this.walletsRepository.save(wallet);
  }
  async getSummaryForUser(userId: string): Promise<{ ekoPoints: number }> {
    const wallet = await this.walletsRepository.findOneBy({
      user: { id: userId },
    });

    if (!wallet) {
      throw new NotFoundException(
          `Wallet for user with ID "${userId}" not found`,
      );
    }

    // Zwracamy tylko interesujące nas dane, a nie cały obiekt portfela
    return { ekoPoints: wallet.ekoPoints };
  }
}