import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ServiceStatus } from '../common/enums/service-status.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';

@Injectable()
export class RenewalsService {
    private readonly logger = new Logger(RenewalsService.name);

    constructor(
        @InjectRepository(Service)
        private readonly servicesRepository: Repository<Service>,
        private readonly dataSource: DataSource,
    ) {}

    // Używamy dekoratora @Cron, aby ta metoda uruchamiała się cyklicznie.
    // Dla celów testowych ustawiamy ją na "co 30 sekund".
    // W produkcji byłoby to np. CronExpression.EVERY_DAY_AT_2AM
    @Cron(CronExpression.EVERY_30_SECONDS)
    async handleRenewals() {
        this.logger.log('--- Running renewals cron job! ---');

        const servicesToRenew = await this.servicesRepository.find({
            where: {
                autoRenew: true, // Tylko te z włączonym autoodnawianiem
                expiresAt: LessThan(new Date()), // Których data wygaśnięcia już minęła
                status: ServiceStatus.ACTIVE, // Tylko te, które są obecnie aktywne
            },
            relations: ['user', 'user.wallet', 'plan'], // Ładujemy powiązane dane
        });

        if (servicesToRenew.length === 0) {
            this.logger.log('No services to renew.');
            return;
        }

        for (const service of servicesToRenew) {
            const wallet = service.user.wallet;
            const plan = service.plan;
            const price = parseFloat(plan.price.toString());
            const balance = parseFloat(wallet.balance.toString());

            this.logger.log(`Checking service ${service.id} for user ${service.user.email}`);

            if (balance >= price) {
                // Użytkownik ma środki - odnawiamy usługę
                await this.renewService(service, wallet, plan, price);
            } else {
                // Brak środków - zawieszamy usługę
                await this.suspendService(service);
            }
        }
    }

    private async renewService(service: Service, wallet: Wallet, plan: any, price: number) {
        await this.dataSource.transaction(async (manager) => {
            // 1. Pobieramy środki z portfela
            wallet.balance -= price;
            await manager.save(wallet);

            // 2. Przedłużamy ważność usługi o miesiąc
            const newExpiryDate = new Date(service.expiresAt!);
            newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
            service.expiresAt = newExpiryDate;
            await manager.save(service);

            // 3. Tworzymy zapis w transakcjach
            const transaction = manager.create(Transaction, {
                wallet: wallet,
                amount: -price, // Ujemna kwota, bo to wydatek
                currency: 'pln',
                status: TransactionStatus.COMPLETED,
                type: TransactionType.PAYMENT,
                provider: 'system',
                providerTransactionId: `renewal-<span class="math-inline">\{service\.id\}\-</span>{Date.now()}`,
            });
            await manager.save(transaction);

            this.logger.log(`SUCCESS: Renewed service ${service.id}. New balance: ${wallet.balance}`);
        });
    }

    private async suspendService(service: Service) {
        service.status = ServiceStatus.SUSPENDED;
        await this.servicesRepository.save(service);
        this.logger.warn(`SUSPENDED: Service ${service.id} due to insufficient funds.`);
    }
}