import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../../common/enums/ticket-status.enum';
import { TicketPriority } from '../../common/enums/ticket-priority.enum';
import { User } from '../../users/entities/user.entity';
import { TicketMessage } from '../../ticket-messages/entities/ticket-message.entity';
import { TicketType } from '../../common/enums/ticket-type.enum';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column({ type: 'enum', enum: TicketType, default: TicketType.GENERAL })
  type: TicketType;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  // Relacja: Wiele zgłoszeń może być stworzonych przez jednego użytkownika (autora)
  @ManyToOne(() => User, (user) => user.createdTickets)
  author: User;

  // Relacja: Zgłoszenie może być przypisane do jednego pracownika (lub nie)
  @ManyToOne(() => User, (user) => user.assignedTickets, { nullable: true })
  assignee: User | null;

  // Relacja: Jedno zgłoszenie ma wiele wiadomości
  @OneToMany(() => TicketMessage, (message) => message.ticket)
  messages: TicketMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
