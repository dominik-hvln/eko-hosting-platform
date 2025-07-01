import { Service } from '../../../services/entities/service.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EmailAccount } from '../../email-accounts/entities/email-account.entity';

@Entity({ name: 'domains' })
export class Domain {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ name: 'php_version', default: '8.2' })
    phpVersion: string;

    @ManyToOne(() => Service, (service) => service.domains, { onDelete: 'CASCADE' })
    service: Service;

    // POPRAWKA: Definiujemy typ relacji jawnie, aby pomóc TypeORM
    @OneToMany(type => EmailAccount, account => account.domain)
    emailAccounts: EmailAccount[];
}