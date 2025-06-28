// src/users/entities/user.entity.ts

import { Exclude } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, ManyToOne } from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketMessage } from '../../ticket-messages/entities/ticket-message.entity';
import { MigrationRequest } from '../../migrations/entities/migration.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { PaymentRequest } from '../../payment-requests/entities/payment-request.entity';
import { EkoLevel } from '../../common/enums/eko-level.enum';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column()
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true, unique: true })
    stripeCustomerId: string | null;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    // --- KLUCZOWA POPRAWKA - DODAJEMY BRAKUJĄCE RELACJE IAM ---
    @ManyToOne(() => User, (user) => user.subaccounts, { nullable: true, onDelete: 'SET NULL' })
    parent: User | null;

    @OneToMany(() => User, (user) => user.parent)
    subaccounts: User[];
    // --------------------------------------------------------

    @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
    firstName: string | null;

    @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
    lastName: string | null;

    @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
    companyName: string | null;

    @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
    taxId: string | null;

    @Column({ name: 'address_line_1', type: 'varchar', length: 255, nullable: true })
    addressLine1: string | null;

    @Column({ name: 'address_line_2', type: 'varchar', length: 255, nullable: true })
    addressLine2: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string | null;

    @Column({ name: 'zip_code', type: 'varchar', length: 20, nullable: true })
    zipCode: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    country: string | null;

    @Column({ name: 'eko_level', type: 'enum', enum: EkoLevel, default: EkoLevel.SEEDLING })
    ekoLevel: EkoLevel;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Service, (service) => service.user)
    services: Service[];

    @OneToOne(() => Wallet, (wallet) => wallet.user)
    wallet: Wallet;

    @OneToMany(() => Ticket, (ticket) => ticket.author)
    createdTickets: Ticket[];

    @OneToMany(() => Ticket, (ticket) => ticket.assignee)
    assignedTickets: Ticket[];

    @OneToMany(() => TicketMessage, (message) => message.author)
    ticketMessages: TicketMessage[];

    @OneToMany(() => MigrationRequest, (request) => request.user)
    migrationRequests: MigrationRequest[];

    @OneToMany(() => Invoice, (invoice) => invoice.user)
    invoices: Invoice[];

    @OneToMany(() => PaymentRequest, (request) => request.user)
    paymentRequests: PaymentRequest[];
}