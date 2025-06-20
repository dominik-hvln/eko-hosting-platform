import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config'; // Importujemy
import { StripeService } from './providers/stripe.service'; // Importujemy
import { AuthModule } from '../auth/auth.module'; // Importujemy

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService], // Rejestrujemy StripeService
})
export class PaymentsModule {}