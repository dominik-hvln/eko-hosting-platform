import { Injectable } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(
      private readonly walletService: WalletService,
      private readonly servicesService: ServicesService,
      private readonly usersService: UsersService,
  ) {}

  async getSummary(userId: string) {
    const [wallet, services, user] = await Promise.all([
      this.walletService.findOneByUserId(userId),
      this.servicesService.findAllForUser(userId),
      this.usersService.findOne(userId),
    ]);

    return {
      user: {
        firstName: user.firstName,
        email: user.email,
      },
      balance: wallet.balance,
      ekoPoints: wallet.ekoPoints,
      services: services,
    };
  }
}