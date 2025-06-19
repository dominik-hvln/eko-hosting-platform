import { User } from '../../users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'wallets' })
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Saldo portfela, z dużą precyzją, domyślnie 0.00
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
    balance: number;

    // --- RELACJA JEDEN-DO-JEDNEGO Z UŻYTKOWNIKIEM ---
    // @JoinColumn jest kluczowy! Oznacza, że w tej tabeli ('wallets')
    // znajdzie się klucz obcy (kolumna 'userId').
    // Stawiamy go zawsze po "właścicielskiej" stronie relacji.
    @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}