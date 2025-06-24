import { User } from '../../users/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'eko_action_history' })
export class EkoActionHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    actionType: string; // np. 'LOW_USAGE_REWARD', 'REDEEM_FOR_CREDIT'

    @Column({ type: 'integer' })
    pointsChange: number; // np. +10 lub -500

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}