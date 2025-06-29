// src/services/entities/service.entity.ts
import {
    Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';
import { Server } from '../../admin/servers/entities/server.entity';
import { Domain } from '../../service-resources/domains/entities/domain.entity';
import { Database } from '../../service-resources/databases/entities/database.entity';
import { FtpAccount } from '../../service-resources/ftp-accounts/entities/ftp-account.entity';
import { EmailAccount } from '../../service-resources/email-accounts/entities/email-account.entity';

@Entity({ name: 'services' })
export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.ACTIVE })
    status: ServiceStatus;

    @Column({ name: 'stripe_subscription_id', type: 'varchar', nullable: true, unique: true })
    stripeSubscriptionId: string | null;

    @ManyToOne(() => User, (user) => user.services)
    user: User;

    @ManyToOne(() => Plan, (plan) => plan.services)
    plan: Plan;

    @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
    expiresAt: Date | null;

    @Column({ name: 'billing_cycle', type: 'enum', enum: BillingCycle, default: BillingCycle.MONTHLY })
    billingCycle: BillingCycle;

    @Column({ name: 'auto_renew', default: true })
    autoRenew: boolean;

    @ManyToOne(() => Server, { nullable: true, eager: true })
    provisionedOnServer: Server | null;

    @Column({ name: 'system_user', type: 'varchar', nullable: true, unique: true })
    systemUser: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // NOWE RELACJE
    @OneToMany(() => Domain, (domain) => domain.service)
    domains: Domain[];

    @OneToMany(() => Database, (database) => database.service)
    databases: Database[];

    @OneToMany(() => FtpAccount, (ftpAccount) => ftpAccount.service)
    ftpAccounts: FtpAccount[];

    @OneToMany(() => EmailAccount, (emailAccount) => emailAccount.service)
    emailAccounts: EmailAccount[];
}