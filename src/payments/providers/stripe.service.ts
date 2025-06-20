import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
    CreateSessionArgs,
    CreateSessionResult,
    PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class StripeService implements PaymentProvider {
    private readonly stripe: Stripe;

    constructor(private configService: ConfigService) {
        // Inicjalizujemy klienta Stripe z naszym kluczem sekretnym
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET_KEY')!,
            {
                apiVersion: '2025-05-28.basil', // Najnowsza wersja API na dzień pisania kodu
            },
        );
    }

    async createPaymentSession(
        args: CreateSessionArgs,
    ): Promise<CreateSessionResult> {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card', 'p24', 'blik'], // Metody płatności
            mode: 'payment',
            customer_email: args.userEmail,
            line_items: [
                {
                    price_data: {
                        currency: args.currency,
                        product_data: {
                            name: 'Doładowanie portfela',
                        },
                        unit_amount: args.amount, // Kwota w groszach
                    },
                    quantity: 1,
                },
            ],
            success_url: args.successUrl,
            cancel_url: args.cancelUrl,
        });

        return {
            paymentUrl: session.url!, // Wykrzyknik, bo wiemy, że URL nie będzie nullem
            sessionId: session.id,
        };
    }
}