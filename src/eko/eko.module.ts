import { Module } from '@nestjs/common';
import { EkoService } from './eko.service';
import { EkoController } from './eko.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../wallet/entities/wallet.entity'; // Importujemy encję Wallet
import { AuthModule } from '../auth/auth.module'; // Importujemy, aby móc używać guardów

@Module({
  // Udostępniamy WalletRepository oraz mechanizmy autoryzacji
  imports: [TypeOrmModule.forFeature([Wallet]), AuthModule],
  controllers: [EkoController],
  providers: [EkoService],
})
export class EkoModule {}