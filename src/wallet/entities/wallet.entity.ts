import { User } from '../../users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity({ name: 'wallets' })
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
    balance: number;

    @Column({ name: 'eko_points', type: 'integer', default: 0 })
    ekoPoints: number;

    @Column({ name: 'eko_discount_percentage', type: 'integer', default: 0 })
    ekoDiscountPercentage: number;

    @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @OneToMany(() => Transaction, (transaction) => transaction.wallet)
    transactions: Transaction[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}