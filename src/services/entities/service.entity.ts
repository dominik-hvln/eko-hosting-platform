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

    // --- RELACJA Z UŻYTKOWNIKIEM ---
    // Wiele usług może należeć do jednego użytkownika
    @ManyToOne(() => User, (user) => user.services)
    user: User;

    // --- RELACJA Z PLANEM ---
    // Wiele usług może być opartych na jednym planie
    @ManyToOne(() => Plan, (plan) => plan.services)
    plan: Plan;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}