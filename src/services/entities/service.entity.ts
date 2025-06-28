import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';
import { Server } from '../../admin/servers/entities/server.entity';

@Entity({ name: 'services' })
export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // np. "Moja strona firmowa"

    @Column({
        type: 'enum',
        enum: ServiceStatus,
        default: ServiceStatus.ACTIVE,
    })
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

    @ManyToOne(() => Server, { nullable: true, eager: true }) // eager: true - zawsze dołączaj dane serwera
    provisionedOnServer: Server | null;

    @Column({ name: 'system_user', type: 'varchar', nullable: true })
    systemUser: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}