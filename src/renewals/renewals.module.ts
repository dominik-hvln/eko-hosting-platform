import { Module } from '@nestjs/common';
import { RenewalsService } from './renewals.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Wallet, Transaction])],
  providers: [RenewalsService],
})
export class RenewalsModule {}