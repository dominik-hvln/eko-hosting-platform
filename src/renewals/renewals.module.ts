import { Module } from '@nestjs/common';
import { RenewalsService } from './renewals.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { EkoActionHistory } from '../eko/entities/eko-action-history.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      EkoActionHistory,
      Transaction,
      Wallet,
    ]),
  ],
  providers: [RenewalsService],
})
export class RenewalsModule {}