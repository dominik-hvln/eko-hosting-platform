import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { ServiceStatus } from '../common/enums/service-status.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { InvoicesService } from '../invoices/invoices.service';
import { Service } from '../services/entities/service.entity';
import { ServicesService } from '../services/services.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PayUService } from './providers/payu.service';
import { StripeService } from './providers/stripe.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
      private readonly stripeService: StripeService,
      private readonly payuService: PayUService,
      private readonly configService: ConfigService,
      private readonly invoicesService: InvoicesService,
      private readonly servicesService: ServicesService,
      private readonly dataSource: DataSource,
  ) {}

  async createTopUpSession(user: Omit<User, 'password'>, createPaymentDto: CreatePaymentDto, provider: 'stripe' | 'payu') {
    const amountInPLN = createPaymentDto.amount.toFixed(2);
    const args = {
      amount: createPaymentDto.amount * 100,
      currency: 'pln',
      userEmail: user.email,
      successUrl: 'http://localhost:3000/payment/success',
      cancelUrl: 'http://localhost:3000/payment/cancel',
      paymentDescription: `Doładowanie portfela EKO-HOSTING za ${amountInPLN} PLN`, // NOWY OPIS
      metadata: { type: 'wallet_top_up' },
    };
    if (provider === 'stripe') return this.stripeService.createPaymentSession(args);
    if (provider === 'payu') return this.payuService.createPaymentSession(args);
    throw new BadRequestException('Invalid payment provider');
  }

  async createServiceRenewalSession(userId: string, serviceId: string) {
    const service = await this.servicesService.findOneForUser(serviceId, userId);

    // Krok 1: Jawnie potraktuj cenę jako string
    const priceString: string = String(service.plan.price);

    // Krok 2: Sparsuj ten string na liczbę
    const priceFloat: number = parseFloat(priceString);

    // Krok 3: Przekonwertuj na grosze jako liczbę całkowitą
    const amountInGr: number = Math.round(priceFloat * 100);

    const args = {
      amount: amountInGr,
      currency: 'pln',
      userEmail: service.user.email,
      successUrl: `http://localhost:3000/dashboard/services/${serviceId}?payment=success`,
      cancelUrl: `http://localhost:3000/dashboard/services/${serviceId}`,
      paymentDescription: `Odnowienie usługi: ${service.name}`, // NOWY OPIS
      metadata: { type: 'service_renewal', serviceId: service.id },
    };
    return this.stripeService.createPaymentSession(args);
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

      // --- OSTATECZNY KROK DEBUGOWANIA ---
      // Logujemy całą zawartość obiektu sesji, aby zobaczyć, co przysyła Stripe
      this.logger.debug('--- OTRZYMANO WEBHOOK: checkout.session.completed ---');
      this.logger.debug(JSON.stringify(session, null, 2));
      // --- KONIEC DEBUGOWANIA ---

      if (session.metadata?.type === 'service_renewal') {
        await this.handleServiceRenewalPayment(session);
      } else {
        await this.handleWalletTopUpPayment(session);
      }
    }
    return { received: true };
  }

  private async handleWalletTopUpPayment(session: Stripe.Checkout.Session) {
    const { customer_email: customerEmail, amount_total: amountTotal, id: sessionId } = session;
    if (!customerEmail || !amountTotal) return;

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const transactionRepo = manager.getRepository(Transaction);
      const wallet = await walletRepo.findOne({ where: { user: { email: customerEmail } }, relations: ['user'] });
      if (!wallet) return;

      const existingTx = await transactionRepo.findOne({ where: { providerTransactionId: sessionId } });
      if (existingTx) return;

      const amountToAdd = amountTotal / 100;
      wallet.balance = parseFloat(wallet.balance.toString()) + amountToAdd;
      await walletRepo.save(wallet);

      const newTx = transactionRepo.create({
        wallet, amount: amountToAdd, currency: 'pln', status: TransactionStatus.COMPLETED,
        type: TransactionType.TOP_UP, provider: 'stripe', providerTransactionId: sessionId,
      });
      await transactionRepo.save(newTx);
      await this.invoicesService.createForTransaction(wallet.user, newTx);
    });
  }

  private async handleServiceRenewalPayment(session: Stripe.Checkout.Session) {
    this.logger.log(`Handling service renewal for session: ${session.id}`);
    const serviceId = session.metadata?.serviceId;
    const amountTotal = session.amount_total;

    if (!serviceId || amountTotal === null || amountTotal === undefined) {
      this.logger.error(`Webhook event "service_renewal" is missing data. Session: ${session.id}`);
      return;
    }

    return this.dataSource.transaction(async (manager) => {
      const service = await manager.findOne(Service, {
        where: { id: serviceId },
        relations: ['user', 'user.wallet'],
      });

      if (!service) {
        this.logger.error(`Service with ID ${serviceId} not found for renewal.`);
        return;
      }
      this.logger.log(`Found service ${service.id} to renew. Current expiry: ${service.expiresAt}`);

      const newExpiryDate = service.expiresAt ? new Date(service.expiresAt) : new Date();
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      service.expiresAt = newExpiryDate;
      service.status = ServiceStatus.ACTIVE;
      await manager.save(service);

      this.logger.log(`Service ${service.id} renewed successfully. New expiry: ${service.expiresAt}`);

      const amount = amountTotal / 100;
      const newTransaction = manager.create(Transaction, {
        wallet: service.user.wallet,
        amount: -amount,
        currency: 'pln',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        provider: 'stripe',
        providerTransactionId: session.id,
        description: `Odnowienie usługi: ${service.name}`,
      });
      await manager.save(newTransaction);
      this.logger.log(`Created transaction ${newTransaction.id} for renewal.`);

      await this.invoicesService.createForTransaction(service.user, newTransaction);
      this.logger.log(`Invoice created for transaction ${newTransaction.id}.`);
    });
  }

  async handlePayuWebhook(signatureHeader: string, rawBody: Buffer) { /* Puste na razie */ }
}