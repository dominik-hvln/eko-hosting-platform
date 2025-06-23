import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateSessionArgs, CreateSessionResult, PaymentProvider } from './payment-provider.interface';

@Injectable()
export class StripeService implements PaymentProvider {
    private readonly stripe: Stripe;
    constructor(private configService: ConfigService) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, { apiVersion: '2025-05-28.basil' });
    }

    async createPaymentSession(args: CreateSessionArgs): Promise<CreateSessionResult> {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card', 'p24', 'blik'],
            line_items: [
                {
                    price_data: {
                        currency: args.currency,
                        product_data: {
                            name: args.paymentDescription, // Używamy dynamicznego opisu
                        },
                        unit_amount: args.amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: args.successUrl,
            cancel_url: args.cancelUrl,
            customer_email: args.userEmail,
            // POPRAWKA: Przesuwamy metadane na główny poziom obiektu sesji.
            // Po rozwiązaniu innych błędów, to jest teraz poprawne podejście.
            metadata: args.metadata,
        });
        return { paymentUrl: session.url!, sessionId: session.id };
    }
}