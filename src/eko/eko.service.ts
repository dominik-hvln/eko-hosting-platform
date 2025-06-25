// src/eko/eko.service.ts

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EkoSettings } from './entities/eko-settings.entity';
import { Repository } from 'typeorm';
import { UpdateEkoSettingsDto } from './dto/update-eko-settings.dto';
import { WalletService } from '../wallet/wallet.service';
import { EkoActionHistory, EkoActionType } from './entities/eko-action-history.entity';

@Injectable()
export class EkoService {
  private readonly logger = new Logger(EkoService.name);
  private readonly EKO_POINTS_PER_IMPRESSION = 0.01;

  constructor(
      @InjectRepository(EkoSettings)
      private readonly settingsRepository: Repository<EkoSettings>,
      @InjectRepository(EkoActionHistory)
      private readonly historyRepository: Repository<EkoActionHistory>,
      private readonly walletService: WalletService,
  ) {}

  async generateBadgeScript(userId: string): Promise<string> {
    try {
      const summary = await this.getSummaryForUser(userId);
      const treesPlanted = summary.treesPlanted;
      const apiUrl = process.env.API_URL || 'http://localhost:4000';

      return `
(function() {
    const userId = '${userId}';
    const trees = ${treesPlanted};
    const badgeHtml = \`
        <div id="eko-hosting-badge" style="position: fixed; bottom: 10px; right: 10px; z-index: 9999; background-color: #ffffff; color: #1a202c; padding: 8px 12px; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif; font-size: 12px; display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0;">
            <span>🌱</span>
            <div>Zasilany przez <strong>EKO-Hosting</strong> | Posadzono: \${trees} drzew</div>
        </div>
    \`;
    document.body.insertAdjacentHTML('beforeend', badgeHtml);

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
        console.log('EKO-Hosting: Wykryto tryb ciemny, przyznajemy punkty!');
        fetch('${apiUrl}/eko/badge-impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
        }).catch(err => console.error('EKO-Hosting Badge Error:', err));
    }
})();
        `;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Attempted to generate badge for non-existent user: ${userId}`);
      } else {
        this.logger.error(`Error generating badge for user: ${userId}`, error.stack);
      }
      return `/* EKO-Hosting: Użytkownik nie został znaleziony. */`;
    }
  }

  async grantPointsForBadgeImpression(userId: string): Promise<void> {
    try {
      await this.walletService.addEkoPoints(userId, this.EKO_POINTS_PER_IMPRESSION);
      this.logger.log(`Granted ${this.EKO_POINTS_PER_IMPRESSION} EKO points to user ${userId} for a dark mode badge impression.`);
    } catch (error) {
      this.logger.warn(`Could not grant points for badge impression to user ${userId}: ${error.message}`);
    }
  }

  async getSettings(): Promise<EkoSettings> {
    const settings = await this.settingsRepository.find();
    if (settings.length > 0) {
      return settings[0];
    }
    return this.settingsRepository.save(new EkoSettings());
  }

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

    if (parseFloat(userWallet.ekoPoints.toString()) < pointsToRedeem) {
      throw new BadRequestException('Niewystarczająca liczba punktów EKO.');
    }

    const creditAmount = pointsToRedeem / settings.pointsPerPln;
    return this.walletService.handleEkoRedemption(userId, pointsToRedeem, creditAmount);
  }

  async getSummaryForUser(userId: string) {
    const settings = await this.getSettings();
    const wallet = await this.walletService.findOneByUserId(userId);
    const history = await this.historyRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const treesPlanted = Math.floor(parseFloat(wallet.lifetimeEkoPoints.toString()) / settings.pointsToPlantTree);
    const pointsTowardsNextTree = parseFloat(wallet.lifetimeEkoPoints.toString()) % settings.pointsToPlantTree;
    const progressToNextTree = (pointsTowardsNextTree / settings.pointsToPlantTree) * 100;

    let currentTreeStage = 1;
    if (progressToNextTree >= 75) {
      currentTreeStage = 4;
    } else if (progressToNextTree >= 50) {
      currentTreeStage = 3;
    } else if (progressToNextTree >= 25) {
      currentTreeStage = 2;
    }

    return {
      currentPoints: wallet.ekoPoints,
      pointsPerPln: settings.pointsPerPln,
      treesPlanted,
      progressToNextTree: Math.round(progressToNextTree),
      currentTreeStage,
      history,
    };
  }

  async grantPointsForAction(userId: string, actionType: EkoActionType) {
    this.logger.log(`Attempting to grant points for action ${actionType} to user ${userId}`);

    const existingAction = await this.historyRepository.findOneBy({
      user: { id: userId },
      actionType: actionType,
    });
    if (existingAction) {
      this.logger.log(`User ${userId} already received points for ${actionType}.`);
      return;
    }

    const settings = await this.getSettings();
    const pointsMap = {
      [EkoActionType.AUTO_RENEWAL_REWARD]: settings.pointsForAutoRenew,
      [EkoActionType.YEARLY_PAYMENT_REWARD]: settings.pointsForYearlyPayment,
      [EkoActionType.TWO_FACTOR_ENABLED_REWARD]: settings.pointsFor2FA,
      [EkoActionType.DARK_MODE_ENABLED]: settings.pointsForDarkMode,
    };
    const pointsToGrant = pointsMap[actionType];

    if (!pointsToGrant) {
      this.logger.warn(`No points defined for action type: ${actionType}`);
      return;
    }

    await this.walletService.addEkoPoints(userId, pointsToGrant);

    // --- POPRAWKA ---
    // Zapisujemy historię używając nowej, pojedynczej kolumny 'points'
    const historyEntry = this.historyRepository.create({
      user: { id: userId },
      actionType,
      points: pointsToGrant, // Wartość dodatnia oznacza przyznane punkty
    });
    await this.historyRepository.save(historyEntry);
    // ----------------

    this.logger.log(`Granted ${pointsToGrant} EKO points to user ${userId} for action ${actionType}`);
  }
}