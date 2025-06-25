import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { BillingCycle } from '../common/enums/billing-cycle.enum';
import { ServiceStatus } from '../common/enums/service-status.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { Plan } from '../plans/entities/plan.entity';
import { Service } from '../services/entities/service.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { EkoActionHistory, EkoActionType } from '../eko/entities/eko-action-history.entity';

@Injectable()
export class RenewalsService {
    private readonly logger = new Logger(RenewalsService.name);
    private readonly EKO_POINTS_FOR_RENEWAL = 10; // Stała dla punktów

    constructor(
        @InjectRepository(Service)
        private readonly servicesRepository: Repository<Service>,
        private readonly dataSource: DataSource,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_1AM) // Zmieniamy na r_az dziennie w nocy
    async handleRenewals() {
        this.logger.log('--- Running renewals cron job! ---');

        const today = new Date();
        const servicesToRenew = await this.servicesRepository.find({
            where: {
                autoRenew: true,
                expiresAt: LessThan(today), // Bierzemy tylko te usługi, które już wygasły
                status: ServiceStatus.ACTIVE,
            },
            relations: ['user', 'user.wallet', 'plan'],
        });

        if (servicesToRenew.length === 0) {
            this.logger.log('No services to renew.');
            return;
        }

        for (const service of servicesToRenew) {
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
            // 1. Pobieramy z portfela
            wallet.balance = parseFloat(wallet.balance.toString()) - price;

            // 2. Dodajemy punkty EKO do obu pul
            wallet.ekoPoints += this.EKO_POINTS_FOR_RENEWAL;
            wallet.lifetimeEkoPoints += this.EKO_POINTS_FOR_RENEWAL;
            await manager.save(wallet);

            // 3. Przedłużamy ważność usługi
            const newExpiryDate = new Date(service.expiresAt!);
            if (isYearly) {
                newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
            } else {
                newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
            }
            service.expiresAt = newExpiryDate;
            await manager.save(service);

            // 4. Tworzymy transakcję finansową
            const transaction = manager.create(Transaction, {
                wallet: wallet,
                amount: -price,
                currency: 'pln',
                status: TransactionStatus.COMPLETED,
                type: TransactionType.PAYMENT,
                description: `Automatyczne odnowienie usługi: <span class="math-inline">\{service\.name\} \(</span>{ isYearly ? 'rocznie' : 'miesięcznie' })`,
            });
            await manager.save(transaction);

            // 5. Zapisujemy historię akcji EKO
            const ekoAction = manager.create(EkoActionHistory, {
                user: service.user,
                actionType: EkoActionType.AUTO_RENEWAL_REWARD,
                pointsChange: this.EKO_POINTS_FOR_RENEWAL,
            });
            await manager.save(ekoAction);
        });
    }

    private async suspendService(service: Service) {
        this.logger.warn(`Insufficient funds for service ${service.id}. Suspending.`);
        service.status = ServiceStatus.SUSPENDED;
        await this.servicesRepository.save(service);
    }
}