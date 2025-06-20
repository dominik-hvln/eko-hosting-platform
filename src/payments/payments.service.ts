import { BadRequestException, Injectable } from '@nestjs/common';
import { StripeService } from './providers/stripe.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from '../wallet/entities/wallet.entity';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { PayUService } from './providers/payu.service';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
      private readonly stripeService: StripeService,
      private readonly payuService: PayUService,
      private readonly configService: ConfigService,
      @InjectRepository(Wallet)
      private readonly walletsRepository: Repository<Wallet>,
      @InjectRepository(Transaction)
      private readonly transactionsRepository: Repository<Transaction>,
      private readonly dataSource: DataSource, // Wstrzykujemy DataSource do obsługi transakcji
  ) {}

  async createTopUpSession(
      createPaymentDto: CreatePaymentDto,
      user: Omit<User, 'password'>,
      provider: 'stripe' | 'payu',
  ) {
    const args = {
      amount: createPaymentDto.amount * 100,
      currency: 'pln',
      userEmail: user.email,
      successUrl: 'http://localhost:3001/payment/success',
      cancelUrl: 'http://localhost:3001/payment/cancel',
    };

    // Używamy switcha, aby wybrać odpowiedni adapter
    switch (provider) {
      case 'stripe':
        return this.stripeService.createPaymentSession(args);
      case 'payu':
        return this.payuService.createPaymentSession(args);
      default:
        throw new BadRequestException('Invalid payment provider');
    }
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const stripe = new Stripe(
        this.configService.get<string>('STRIPE_SECRET_KEY')!,
        { apiVersion: '2025-05-28.basil' },
    );

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_email;
      const amountTotal = session.amount_total;

      if (!customerEmail || !amountTotal) {
        console.error(
            `Webhook event "checkout.session.completed" is missing data. Session ID: ${session.id}`,
        );
        return { received: true, message: 'Event ignored due to missing data.' };
      }

      await this.dataSource.transaction(async (manager) => {
        const wallet = await manager.findOne(Wallet, {
          where: { user: { email: customerEmail } },
        });

        if (!wallet) {
          console.error('Wallet not found for email:', customerEmail);
          return;
        }

        const existingTransaction = await manager.findOne(Transaction, {
          where: { providerTransactionId: session.id },
        });
        if (existingTransaction) {
          console.log('Transaction already processed:', session.id);
          return;
        }

        const amountToAdd = amountTotal / 100;
        wallet.balance = parseFloat(wallet.balance.toString()) + amountToAdd;
        await manager.save(wallet);

        const newTransaction = manager.create(Transaction, {
          wallet: wallet,
          amount: amountToAdd,
          currency: 'pln',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.TOP_UP,
          provider: 'stripe',
          providerTransactionId: session.id,
        });
        await manager.save(newTransaction);
      });
    }
    return { received: true };
  }

  async handlePayuWebhook(signatureHeader: string, rawBody: Buffer) {
    // 1. Weryfikacja podpisu - krok bezpieczeństwa
    const secondKey = this.configService.get<string>('PAYU_SECOND_KEY')!;
    const bodyString = rawBody.toString();
    const expectedSignature = crypto
        .createHash('md5')
        .update(bodyString + secondKey)
        .digest('hex');

    // Wyciągamy właściwy podpis z nagłówka
    const signature = signatureHeader.split(';').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key.trim()] = value;
      return acc;
    }, {})['signature'];

    if (signature !== expectedSignature) {
      throw new BadRequestException('Invalid PayU signature');
    }

    // 2. Obsługa zdarzenia
    const notification = JSON.parse(bodyString);

    if (notification.order.status === 'COMPLETED') {
      const orderId = notification.order.orderId;
      const customerEmail = notification.order.buyer.email;
      const amountTotal = notification.order.totalAmount; // kwota w groszach

      await this.dataSource.transaction(async (manager) => {
        const wallet = await manager.findOne(Wallet, {
          where: { user: { email: customerEmail } },
        });

        if (!wallet) {
          console.error('Wallet not found for email:', customerEmail);
          return;
        }

        const existingTransaction = await manager.findOne(Transaction, {
          where: { providerTransactionId: orderId },
        });
        if (existingTransaction) {
          console.log('Transaction already processed:', orderId);
          return;
        }

        const amountToAdd = parseInt(amountTotal) / 100;
        wallet.balance = parseFloat(wallet.balance.toString()) + amountToAdd;
        await manager.save(wallet);

        const newTransaction = manager.create(Transaction, {
          wallet: wallet,
          amount: amountToAdd,
          currency: 'pln',
          status: TransactionStatus.COMPLETED,
          type: TransactionType.TOP_UP,
          provider: 'payu',
          providerTransactionId: orderId,
        });
        await manager.save(newTransaction);
      });
    }
    // PayU oczekuje odpowiedzi 200 OK, aby wiedzieć, że powiadomienie dotarło
    return { received: true };
  }
}