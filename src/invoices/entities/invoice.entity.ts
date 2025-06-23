import { User } from '../../users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export interface InvoiceParty {
    name: string;
    taxId: string | null;
    addressLine1: string | null;
    zipCode: string | null;
    city: string | null;
    country: string | null;
}

export interface InvoiceItem {
    name: string;
    quantity: number;
    unitPrice: number; // <-- DODAJEMY BRAKUJĄCE POLE
    netValue: number;
    vatRate: number;
    vatValue: number;
    grossValue: number;
}

@Entity({ name: 'invoices' })
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_number', type: 'varchar', unique: true })
    invoiceNumber: string;

    @Column({ type: 'jsonb' })
    buyer: InvoiceParty;

    @Column({ type: 'jsonb' })
    seller: InvoiceParty;

    @Column({ type: 'jsonb' })
    items: InvoiceItem[];

    @Column({ name: 'total_gross_value', type: 'integer' })
    totalGrossValue: number;

    @Column({ name: 'total_net_value', type: 'integer' })
    totalNetValue: number;

    @Column({ type: 'date', name: 'issue_date' })
    issueDate: Date;

    @Column({ type: 'date', name: 'sale_date' })
    saleDate: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.invoices)
    @JoinColumn({ name: 'user_id' })
    user: User;
}