// src/eko/entities/eko-action-history.entity.ts

import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum EkoActionType {
  AUTO_RENEWAL_REWARD = 'auto_renewal_reward',
  YEARLY_PAYMENT_REWARD = 'yearly_payment_reward',
  TWO_FACTOR_ENABLED_REWARD = '2fa_enabled_reward',
  LOW_USAGE_REWARD = 'low_usage_reward',
  REDEEM_FOR_CREDIT = 'redeem_for_credit',
  DARK_MODE_ENABLED = 'dark_mode_enabled',
}

@Entity({ name: 'eko_action_history' })
@Unique(['user', 'actionType'])
export class EkoActionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'enum', enum: EkoActionType })
  actionType: EkoActionType;

  // --- POPRAWKA ---
  // Usuwamy 'pointsChange' i 'pointsGranted'. Zastępujemy je jedną kolumną 'points'.
  // Typ 'decimal' jest spójny z encją Wallet i obsługuje ułamkowe wartości z badge'a.
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  points: number;
  // ----------------

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
