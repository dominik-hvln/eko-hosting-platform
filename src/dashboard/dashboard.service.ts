import { Injectable } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { ServicesService } from '../services/services.service';

@Injectable()
export class DashboardService {
  constructor(
      private readonly walletService: WalletService,
      private readonly servicesService: ServicesService,
  ) {}

  async getSummary(userId: string) {
    // Używamy Promise.all, aby wykonać oba zapytania do bazy równocześnie,
    // co jest bardziej wydajne niż czekanie na każde z osobna.
    const [wallet, services] = await Promise.all([
      this.walletService.findOneByUserId(userId),
      this.servicesService.findAllForUser(userId),
    ]);

    // Składamy finalny obiekt odpowiedzi
    return {
      balance: wallet.balance,
      ekoPoints: wallet.ekoPoints,
      services: services,
    };
  }
}