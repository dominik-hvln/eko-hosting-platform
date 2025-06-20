import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './providers/stripe.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- NOWY IMPORT
import { Wallet } from '../wallet/entities/wallet.entity'; // <-- NOWY IMPORT
import { Transaction } from '../transactions/entities/transaction.entity'; // <-- NOWY IMPORT

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    // Dajemy dostęp do repozytoriów Wallet i Transaction
    TypeOrmModule.forFeature([Wallet, Transaction]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService],
})
export class PaymentsModule {}