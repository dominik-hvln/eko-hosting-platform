import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { DataSource, Repository } from 'typeorm';
import { BillingCycle } from '../common/enums/billing-cycle.enum';
import { PaymentRequestStatus } from '../common/enums/payment-request-status.enum';
import { ServiceStatus } from '../common/enums/service-status.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentRequest } from '../payment-requests/entities/payment-request.entity';
import { PaymentRequestsService } from '../payment-requests/payment-requests.service';
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
  private readonly frontendUrl: string;

  constructor(
      @InjectRepository(User) private readonly usersRepository: Repository<User>, // Dodajemy repozytorium User
      @InjectRepository(Service) private readonly servicesRepository: Repository<Service>,
      private readonly stripeService: StripeService,
      private readonly payuService: PayUService,
      private readonly configService: ConfigService,
      private readonly invoicesService: InvoicesService,
      private readonly servicesService: ServicesService,
      private readonly paymentRequestsService: PaymentRequestsService,
      private readonly dataSource: DataSource,
  ) {
    // POPRAWKA 1: Dodajemy '!' aby zapewnić, że zmienna istnieje, lub fallback.
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
  }

  async createSubscription(userId: string, serviceId: string) {
    this.logger.log(`Attempting to create subscription for service ${serviceId} for user ${userId}`);
    const service = await this.servicesService.findOneForUser(serviceId, userId);

    const isYearly = service.billingCycle === BillingCycle.YEARLY;
    const priceId = isYearly ? service.plan.stripeYearlyPriceId : service.plan.stripeMonthlyPriceId;

    if (!priceId) {
      this.logger.error(`Stripe Price ID for service ${serviceId} and billing cycle ${service.billingCycle} is not defined.`);
      throw new BadRequestException(`Płatność subskrypcyjna dla tego planu i cyklu rozliczeniowego nie jest skonfigurowana.`);
    }

    const args = {
      priceId: priceId,
      userEmail: service.user.email,
      successUrl: `${this.frontendUrl}/dashboard/services/${serviceId}?subscription=success`,
      cancelUrl: `${this.frontendUrl}/dashboard/services/${serviceId}`,
      metadata: {
        type: 'service_subscription',
        serviceId: service.id,
        userId: userId,
      },
    };

    return this.stripeService.createSubscriptionSession(args);
  }

  async createTopUpSession(user: Omit<User, 'password'>, createPaymentDto: CreatePaymentDto, provider: 'stripe' | 'payu') {
    const amountInPLN = createPaymentDto.amount.toFixed(2);
    const args = {
      amount: createPaymentDto.amount * 100,
      currency: 'pln',
      userEmail: user.email,
      successUrl: `${this.frontendUrl}/payment/success`, // Użycie zmiennej
      cancelUrl: `${this.frontendUrl}/payment/cancel`,   // Użycie zmiennej
      paymentDescription: `Doładowanie portfela EKO-HOSTING za ${amountInPLN} PLN`,
      metadata: { type: 'wallet_top_up', userId: user.id },
    };
    if (provider === 'stripe') return this.stripeService.createPaymentSession(args);
    if (provider === 'payu') return this.payuService.createPaymentSession(args);
    throw new BadRequestException('Invalid payment provider');
  }

  async createServiceRenewalSession(userId: string, serviceId: string) {
    const service = await this.servicesService.findOneForUser(serviceId, userId);
    const isYearly = service.billingCycle === BillingCycle.YEARLY;
    const price = isYearly ? service.plan.yearlyPrice : service.plan.price;

    if (price === null || price === undefined) {
      throw new BadRequestException(`Cena dla cyklu rozliczeniowego "${isYearly ? 'rocznego' : 'miesięcznego'}" w planie "${service.plan.name}" nie jest zdefiniowana.`);
    }

    const amountInGr = Math.round(parseFloat(price) * 100);
    const args = {
      amount: amountInGr,
      currency: 'pln',
      userEmail: service.user.email,
      successUrl: `${this.frontendUrl}/dashboard/services/${serviceId}?payment=success`, // Użycie zmiennej
      cancelUrl: `${this.frontendUrl}/dashboard/services/${serviceId}`,                     // Użycie zmiennej
      paymentDescription: `Odnowienie usługi: ${service.name} (${isYearly ? 'rocznie' : 'miesięcznie'})`,
      metadata: { type: 'service_renewal', serviceId: service.id, userId: userId },
    };
    return this.stripeService.createPaymentSession(args);
  }

  async createRequestPaymentSession(userId: string, requestId: string) {
    const request = await this.paymentRequestsService.findOneForUser(requestId, userId);
    const args = {
      amount: request.amount,
      currency: 'pln',
      userEmail: request.user.email,
      successUrl: `${this.frontendUrl}/dashboard/wallet?payment=success`, // Użycie zmiennej
      cancelUrl: `${this.frontendUrl}/dashboard/wallet`,                   // Użycie zmiennej
      paymentDescription: request.title,
      metadata: { type: 'payment_request', requestId: request.id },
    };
    return this.stripeService.createPaymentSession(args);
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, { apiVersion: '2025-05-28.basil' });
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    // Używamy switcha do obsługi różnych typów zdarzeń
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Sprawdzamy metadane, aby wywołać odpowiednią logikę
        if (session.metadata?.type === 'service_subscription') {
          await this.handleSubscriptionCreation(session);
        } else if (session.metadata?.type === 'service_renewal') {
          await this.handleServiceRenewalPayment(session);
        } else if (session.metadata?.type === 'payment_request') {
          await this.handlePaymentRequestPayment(session);
        } else {
          await this.handleWalletTopUpPayment(session);
        }
        break;

      case 'invoice.payment_succeeded':
        // To zdarzenie jest kluczowe dla automatycznych odnowień subskrypcji
        const invoice = event.data.object as Stripe.Invoice;
        // Ignorujemy pierwszą fakturę subskrypcji, bo jest obsługiwana przez checkout.session.completed
        if (invoice.billing_reason === 'subscription_cycle') {
          await this.handleSubscriptionRenewal(invoice);
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCancellation(subscription);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleSubscriptionCreation(session: Stripe.Checkout.Session) {
    this.logger.log(`Handling new subscription from session: ${session.id}`);
    if (!session.metadata) {
      this.logger.error(`Webhook "checkout.session.completed" is missing metadata. Session: ${session.id}`);
      return;
    }
    const { userId, serviceId } = session.metadata;
    const stripeSubscriptionId = session.subscription?.toString();
    const stripeCustomerId = session.customer?.toString();

    if (!userId || !serviceId || !stripeSubscriptionId || !stripeCustomerId) {
      this.logger.error(`Webhook "checkout.session.completed" for subscription is missing metadata. Session: ${session.id}`);
      return;
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOneBy(User, { id: userId });
      const service = await manager.findOneBy(Service, { id: serviceId });

      if (!user || !service) {
        this.logger.error(`User (${userId}) or Service (${serviceId}) not found for subscription creation.`);
        return;
      }

      // Zapisujemy ID klienta i subskrypcji
      user.stripeCustomerId = stripeCustomerId;
      service.stripeSubscriptionId = stripeSubscriptionId;
      // Wyłączamy auto-odnawianie z portfela, bo subskrypcja przejmuje kontrolę
      service.autoRenew = false;

      // Ustawiamy datę wygaśnięcia na miesiąc/rok do przodu
      const newExpiryDate = new Date();
      if (service.billingCycle === BillingCycle.YEARLY) {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      } else {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      }
      service.expiresAt = newExpiryDate;

      await manager.save(user);
      await manager.save(service);
      this.logger.log(`Subscription ${stripeSubscriptionId} successfully linked to service ${serviceId}.`);
    });
  }

  private async handleSubscriptionRenewal(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = invoice.lines.data[0]?.subscription;
    if (typeof stripeSubscriptionId !== 'string') {
      this.logger.error(`Could not extract a valid subscription ID string from invoice: ${invoice.id}`);
      return;
    }

    this.logger.log(`Handling subscription renewal for subscription: ${stripeSubscriptionId}`);

    return this.dataSource.transaction(async (manager) => {
      const service = await manager.findOne(Service, {
        where: { stripeSubscriptionId },
        relations: ['user', 'user.wallet'],
      });

      if (!service) {
        this.logger.warn(`Received renewal for unknown subscription: ${stripeSubscriptionId}`);
        return;
      }

      // Przedłużamy usługę
      const newExpiryDate = new Date(service.expiresAt || new Date());
      if (service.billingCycle === BillingCycle.YEARLY) {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      } else {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      }
      service.expiresAt = newExpiryDate;
      await manager.save(service);
      this.logger.log(`Service ${service.id} renewed via subscription until ${newExpiryDate.toISOString()}`);

      // Tworzymy transakcję i fakturę
      const amount = invoice.amount_paid / 100;
      const newTransaction = manager.create(Transaction, {
        wallet: service.user.wallet,
        amount: -amount,
        currency: 'pln',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        provider: 'stripe',
        providerTransactionId: invoice.id,
        description: `Odnowienie subskrypcji: ${service.name}`,
      });
      await manager.save(newTransaction);
      await this.invoicesService.createForTransaction(service.user, newTransaction);
    });
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    this.logger.log(`Handling subscription cancellation for: ${subscription.id}`);
    const service = await this.servicesRepository.findOneBy({ stripeSubscriptionId: subscription.id });

    if (service) {
      // Usługa pozostaje aktywna do końca opłaconego okresu.
      // Możemy tu dodać logikę powiadomień dla admina lub klienta.
      this.logger.log(`Subscription for service ${service.id} was cancelled. It will expire on ${service.expiresAt}.`);
    }
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

  private async handlePaymentRequestPayment(session: Stripe.Checkout.Session) {
    const requestId = session.metadata?.requestId;
    const amountTotal = session.amount_total;

    if (!requestId || !amountTotal) {
      this.logger.error(`Webhook "payment_request" missing data. Session: ${session.id}`);
      return;
    }

    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PaymentRequest, {
        where: { id: requestId },
        relations: ['user', 'user.wallet'],
      });

      if (!request || request.status === PaymentRequestStatus.PAID) {
        this.logger.warn(`Payment request ${requestId} not found or already paid.`);
        return;
      }

      // 1. Oznaczamy żądanie jako opłacone
      request.status = PaymentRequestStatus.PAID;
      await manager.save(request);
      this.logger.log(`PaymentRequest ${requestId} marked as PAID.`);

      // 2. Tworzymy wpis w historii transakcji
      const amount = amountTotal / 100;
      const newTransaction = manager.create(Transaction, {
        wallet: request.user.wallet,
        amount: -amount, // Zapisujemy jako przychód/wpłatę
        currency: 'pln',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT, // Typ to ogólna "płatność"
        provider: 'stripe',
        providerTransactionId: session.id,
        description: request.title, // Używamy tytułu z żądania jako opisu
      });
      await manager.save(newTransaction);
      this.logger.log(`Created transaction ${newTransaction.id} for payment request.`);

      // 3. Generujemy fakturę do tej transakcji
      await this.invoicesService.createForTransaction(
          request.user,
          newTransaction,
      );
      this.logger.log(`Invoice created for transaction ${newTransaction.id}.`);
    });
  }

  async handlePayuWebhook(signatureHeader: string, rawBody: Buffer) { /* Puste na razie */ }
}