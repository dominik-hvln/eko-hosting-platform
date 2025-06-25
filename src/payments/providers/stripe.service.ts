// src/payments/providers/stripe.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateSessionArgs, CreateSessionResult, PaymentProvider } from './payment-provider.interface';

// Definiujemy nowy interfejs dla argumentów subskrypcji
export interface CreateSubscriptionArgs {
    priceId: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: { [key: string]: string | number | null };
}

@Injectable()
export class StripeService implements PaymentProvider {
    private readonly stripe: Stripe;

    constructor(private configService: ConfigService) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, { apiVersion: '2025-05-28.basil' });
    }

    // Istniejąca metoda dla płatności jednorazowych - bez zmian
    async createPaymentSession(args: CreateSessionArgs): Promise<CreateSessionResult> {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card', 'p24', 'blik'],
            line_items: [
                {
                    price_data: {
                        currency: args.currency,
                        product_data: {
                            name: args.paymentDescription,
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
            metadata: args.metadata,
        });
        return { paymentUrl: session.url!, sessionId: session.id };
    }

    // --- NOWA METODA DLA SUBSKRYPCJI ---
    async createSubscriptionSession(args: CreateSubscriptionArgs): Promise<CreateSessionResult> {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Subskrypcje zazwyczaj obsługuje się tylko kartami
            line_items: [
                {
                    price: args.priceId, // Używamy Price ID zamiast tworzyć cenę dynamicznie
                    quantity: 1,
                },
            ],
            mode: 'subscription', // Najważniejsza zmiana - tryb subskrypcji
            success_url: args.successUrl,
            cancel_url: args.cancelUrl,
            customer_email: args.userEmail,
            // Prosimy Stripe o zapisanie metody płatności, jeśli jest to wymagane do przyszłych obciążeń
            payment_method_collection: 'if_required',
            metadata: args.metadata,
        });
        return { paymentUrl: session.url!, sessionId: session.id };
    }
}