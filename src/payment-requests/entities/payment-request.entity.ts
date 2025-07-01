import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentRequestStatus } from '../../common/enums/payment-request-status.enum';

@Entity({ name: 'payment_requests' })
export class PaymentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'integer' }) // kwota w groszach
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentRequestStatus,
    default: PaymentRequestStatus.PENDING,
  })
  status: PaymentRequestStatus;

  @ManyToOne(() => User, (user) => user.paymentRequests)
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
