import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './providers/stripe.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { PayUService } from './providers/payu.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { ServicesModule } from '../services/services.module';
import { PaymentRequestsModule } from '../payment-requests/payment-requests.module';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([Wallet, Transaction, User, Service]),
    InvoicesModule,
    ServicesModule,
    PaymentRequestsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService, PayUService],
})
export class PaymentsModule {}