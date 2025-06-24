import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EkoSettings } from './entities/eko-settings.entity';
import { Repository } from 'typeorm';
import { UpdateEkoSettingsDto } from './dto/update-eko-settings.dto';
import { WalletService } from '../wallet/wallet.service';
import {EkoActionHistory} from "./entities/eko-action-history.entity";

@Injectable()
export class EkoService {
  constructor(
      @InjectRepository(EkoSettings)
      private readonly settingsRepository: Repository<EkoSettings>,
      @InjectRepository(EkoActionHistory)
      private readonly historyRepository: Repository<EkoActionHistory>,
      private readonly walletService: WalletService,
  ) {}

  // Pobiera ustawienia. Jeśli nie istnieją, tworzy domyślne.
  async getSettings(): Promise<EkoSettings> {
    const settings = await this.settingsRepository.find();
    if (settings.length > 0) {
      return settings[0];
    }
    return this.settingsRepository.save(new EkoSettings());
  }

  // Aktualizuje ustawienia
  async updateSettings(dto: UpdateEkoSettingsDto): Promise<EkoSettings> {
    let settings = await this.getSettings();
    Object.assign(settings, dto);
    return this.settingsRepository.save(settings);
  }

  async redeemPointsForCredit(userId: string, pointsToRedeem: number) {
    if (pointsToRedeem <= 0) {
      throw new BadRequestException('Liczba punktów musi być dodatnia.');
    }

    const settings = await this.getSettings();
    const userWallet = await this.walletService.findOneByUserId(userId);

    if (userWallet.ekoPoints < pointsToRedeem) {
      throw new BadRequestException('Niewystarczająca liczba punktów EKO.');
    }

    const creditAmount = pointsToRedeem / settings.pointsPerPln;

    // Zlecamy wykonanie operacji do WalletService
    return this.walletService.handleEkoRedemption(userId, pointsToRedeem, creditAmount);
  }

  async getSummaryForUser(userId: string) {
    const settings = await this.getSettings();
    const wallet = await this.walletService.findOneByUserId(userId);
    const history = await this.historyRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10, // Pobieramy 10 ostatnich akcji
    });

    // Prosta logika obliczania postępu "sadzenia drzew"
    const treesPlanted = Math.floor(wallet.ekoPoints / settings.pointsToPlantTree);
    const pointsTowardsNextTree = wallet.ekoPoints % settings.pointsToPlantTree;
    const progressToNextTree = (pointsTowardsNextTree / settings.pointsToPlantTree) * 100;

    return {
      currentPoints: wallet.ekoPoints,
      pointsPerPln: settings.pointsPerPln,
      treesPlanted,
      progressToNextTree: Math.round(progressToNextTree),
      history,
    };
  }
}