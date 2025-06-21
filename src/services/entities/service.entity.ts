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

    @ManyToOne(() => User, (user) => user.services)
    user: User;

    @ManyToOne(() => Plan, (plan) => plan.services)
    plan: Plan;

    @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
    expiresAt: Date | null;

    @Column({ name: 'auto_renew', default: true })
    autoRenew: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}