import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WalletModule } from '../wallet/wallet.module'; // <-- Importujemy
import { ServicesModule } from '../services/services.module'; // <-- Importujemy
import { AuthModule } from '../auth/auth.module'; // <-- Importujemy dla Guardów

@Module({
  imports: [AuthModule, WalletModule, ServicesModule], // <-- Dodajemy moduły
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}