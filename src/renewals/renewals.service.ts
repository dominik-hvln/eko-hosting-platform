import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { LessThan, Repository } from 'typeorm';
import { ServiceStatus } from '../common/enums/service-status.enum';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Plan } from '../plans/entities/plan.entity';
import { DataSource } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { BillingCycle } from '../common/enums/billing-cycle.enum';

@Injectable()
export class RenewalsService {
    private readonly logger = new Logger(RenewalsService.name);

    constructor(
        @InjectRepository(Service)
        private readonly servicesRepository: Repository<Service>,
        private readonly dataSource: DataSource,
    ) {}

    @Cron(CronExpression.EVERY_30_SECONDS)
    async handleRenewals() {
        this.logger.log('--- Running renewals cron job! ---');

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const servicesToRenew = await this.servicesRepository.find({
            where: {
                autoRenew: true,
                expiresAt: LessThan(thirtyDaysFromNow),
                status: ServiceStatus.ACTIVE,
            },
            relations: ['user', 'user.wallet', 'plan'],
        });

        if (servicesToRenew.length === 0) {
            this.logger.log('No services to renew.');
            return;
        }

        for (const service of servicesToRenew) {
            // Sprawdzamy, czy usługa już wygasła
            if (service.expiresAt && new Date(service.expiresAt) > new Date()) {
                continue; // Pomijamy, jeśli data wygaśnięcia jest w przyszłości
            }

            const wallet = service.user.wallet;
            const plan = service.plan;
            this.logger.log(`Checking service ${service.id} for user ${service.user.email}`);

            const isYearly = service.billingCycle === BillingCycle.YEARLY;
            const priceString = isYearly ? plan.yearlyPrice : plan.price;

            if (priceString === null || priceString === undefined) {
                this.logger.warn(`Price for billing cycle "<span class="math-inline">\{service\.billingCycle\}" on plan "</span>{plan.name}" is not defined. Suspending service ${service.id}`);
                await this.suspendService(service);
                continue;
            }

            const price = parseFloat(priceString);
            const balance = parseFloat(wallet.balance.toString());

            if (balance >= price) {
                await this.renewService(service, wallet, price, isYearly);
            } else {
                await this.suspendService(service);
            }
        }
    }

    private async renewService(service: Service, wallet: Wallet, price: number, isYearly: boolean) {
        this.logger.log(`Renewing service ${service.id} for ${price} PLN.`);
        await this.dataSource.transaction(async (manager) => {
            const newBalance = parseFloat(wallet.balance.toString()) - price;
            await manager.update(Wallet, wallet.id, { balance: newBalance });

            // POPRAWKA: Jeśli expiresAt jest null, bazujemy na dacie dzisiejszej
            const newExpiryDate = service.expiresAt ? new Date(service.expiresAt) : new Date();
            if (isYearly) {
                newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
            } else {
                newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
            }
            service.expiresAt = newExpiryDate;
            await manager.save(service);

            const transaction = manager.create(Transaction, {
                wallet: wallet,
                amount: -price,
                currency: 'pln',
                status: TransactionStatus.COMPLETED,
                type: TransactionType.PAYMENT,
                description: `Automatyczne odnowienie usługi: <span class="math-inline">\{service\.name\} \(</span>{ isYearly ? 'rocznie' : 'miesięcznie' })`,
            });
            await manager.save(transaction);
        });
    }

    private async suspendService(service: Service) {
        this.logger.warn(`Insufficient funds for service ${service.id}. Suspending.`);
        service.status = ServiceStatus.SUSPENDED;
        await this.servicesRepository.save(service);
    }
}