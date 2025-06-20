import { Injectable } from '@nestjs/common';
import { StripeService } from './providers/stripe.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  // Wstrzykujemy nasz adapter Stripe
  constructor(private readonly stripeService: StripeService) {}

  // Ta metoda będzie w przyszłości decydować, której bramki użyć.
  // Na razie wywołuje bezpośrednio Stripe.
  async createTopUpSession(
      createPaymentDto: CreatePaymentDto,
      user: Omit<User, 'password'>, // Używamy typu z poprzednich lekcji
  ) {
    return this.stripeService.createPaymentSession({
      amount: createPaymentDto.amount * 100, // Zamieniamy ZŁ na grosze
      currency: 'pln',
      userEmail: user.email,
      // TODO: W przyszłości te URL-e będą pochodzić z konfiguracji
      successUrl: 'http://localhost:3001/payment/success', // Adres, na który trafi user po sukcesie
      cancelUrl: 'http://localhost:3001/payment/cancel', // Adres, na który trafi user po anulowaniu
    });
  }
}