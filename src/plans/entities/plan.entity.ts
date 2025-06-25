// src/plans/entities/plan.entity.ts

import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

@Entity({ name: 'plans' })
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: string;

    @Column({ name: 'yearly_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
    yearlyPrice: string | null;

    @Column({ name: 'cpu_limit' })
    cpuLimit: number;

    @Column({ name: 'ram_limit' })
    ramLimit: number;

    @Column({ name: 'disk_space_limit' })
    diskSpaceLimit: number;

    @Column({ name: 'monthly_transfer_limit' })
    monthlyTransferLimit: number;

    @Column({ name: 'is_public', default: true })
    isPublic: boolean;

    // --- NOWE POLA DLA INTEGRACJI ZE STRIPE ---
    // ID produktu w systemie Stripe, do którego podpięte są ceny.
    @Column({ name: 'stripe_product_id', type: 'varchar', nullable: true })
    stripeProductId: string | null;

    // ID ceny dla cyklu MIESIĘCZNEGO w Stripe.
    @Column({ name: 'stripe_monthly_price_id', type: 'varchar', nullable: true })
    stripeMonthlyPriceId: string | null;

    // ID ceny dla cyklu ROCZNEGO w Stripe.
    @Column({ name: 'stripe_yearly_price_id', type: 'varchar', nullable: true })
    stripeYearlyPriceId: string | null;
    // ------------------------------------------

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Service, (service) => service.plan)
    services: Service[];
}