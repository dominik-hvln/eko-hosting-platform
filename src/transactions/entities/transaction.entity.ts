import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string; // np. 'pln'

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column()
  provider: string; // np. 'stripe'

  @Column({ name: 'provider_transaction_id', unique: true })
  providerTransactionId: string; // ID transakcji z systemu dostawcy (np. Stripe)

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  wallet: Wallet;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
