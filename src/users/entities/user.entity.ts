import { Exclude } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketMessage } from '../../ticket-messages/entities/ticket-message.entity';
import { MigrationRequest } from '../../migrations/entities/migration.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

@Entity({ name: 'users' }) // Mówi TypeORM, że ta klasa to encja mapowana na tabelę 'users'
export class User {
    @PrimaryGeneratedColumn('uuid') // Klucz główny, automatycznie generowany jako UUID
    id: string;

    @Column({ unique: true }) // Kolumna z adresem email, musi być unikalny
    email: string;

    @Exclude()
    @Column() // Kolumna z hasłem (będziemy je hashować przed zapisem)
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

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

    @CreateDateColumn() // Automatycznie ustawiana data utworzenia
    createdAt: Date;

    @UpdateDateColumn() // Automatycznie ustawiana data ostatniej aktualizacji
    updatedAt: Date;

    @OneToMany(() => Service, (service) => service.user)
    services: Service[];

    // Jeden użytkownik ma jeden portfel
    @OneToOne(() => Wallet, (wallet) => wallet.user)
    wallet: Wallet;

    // Zgłoszenia stworzone przez tego użytkownika
    @OneToMany(() => Ticket, (ticket) => ticket.author)
    createdTickets: Ticket[];

    // Zgłoszenia przypisane do tego użytkownika (jeśli jest pracownikiem)
    @OneToMany(() => Ticket, (ticket) => ticket.assignee)
    assignedTickets: Ticket[];

    // Wiadomości napisane przez tego użytkownika
    @OneToMany(() => TicketMessage, (message) => message.author)
    ticketMessages: TicketMessage[];

    @OneToMany(() => MigrationRequest, (request) => request.user)
    migrationRequests: MigrationRequest[];

    @OneToMany(() => Invoice, (invoice) => invoice.user)
    invoices: Invoice[];
}