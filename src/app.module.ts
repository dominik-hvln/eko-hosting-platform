import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PlansModule } from './plans/plans.module';
import { ServicesModule } from './services/services.module';
import { WalletModule } from './wallet/wallet.module';
import { EkoModule } from './eko/eko.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RenewalsModule } from './renewals/renewals.module';
import { TicketsModule } from './tickets/tickets.module';
import { TicketMessagesModule } from './ticket-messages/ticket-messages.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { MigrationsModule } from './migrations/migrations.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentRequestsModule } from './payment-requests/payment-requests.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Konfiguracja Throttlera - ochrona przed atakami brute-force
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuta w milisekundach
        limit: 60, // 60 zapytań na minutę z jednego IP
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    PlansModule,
    ServicesModule,
    WalletModule,
    EkoModule,
    DashboardModule,
    PaymentsModule,
    TransactionsModule,
    RenewalsModule,
    TicketsModule,
    TicketMessagesModule,
    EncryptionModule,
    MigrationsModule,
    InvoicesModule,
    PaymentRequestsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}