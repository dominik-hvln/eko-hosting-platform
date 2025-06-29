// src/service-resources/email-accounts/entities/email-account.entity.ts
import { Service } from '../../../services/entities/service.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Domain } from '../../domains/entities/domain.entity';

@Entity({ name: 'email_accounts' })
export class EmailAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'email_address', unique: true })
    emailAddress: string;

    @Exclude()
    @Column({ type: 'text' }) // Szyfrowane
    password: string;

    @Column({ name: 'quota_mb', default: 1024 })
    quotaMb: number;

    @ManyToOne(() => Service, (service) => service.emailAccounts, { onDelete: 'CASCADE' })
    service: Service;

    @ManyToOne(() => Domain, (domain) => domain.emailAccounts, { onDelete: 'CASCADE' })
    domain: Domain;
}
