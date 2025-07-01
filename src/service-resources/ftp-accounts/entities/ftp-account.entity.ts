// src/service-resources/ftp-accounts/entities/ftp-account.entity.ts
import { Service } from '../../../services/entities/service.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'ftp_accounts' })
export class FtpAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Exclude()
  @Column({ type: 'text' }) // Szyfrowane
  password: string;

  @Column()
  path: string;

  @ManyToOne(() => Service, (service) => service.ftpAccounts, {
    onDelete: 'CASCADE',
  })
  service: Service;
}
