import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'ticket_messages' })
export class TicketMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    // Relacja: Wiele wiadomości należy do jednego zgłoszenia
    @ManyToOne(() => Ticket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
    ticket: Ticket;

    // Relacja: Wiele wiadomości może być napisanych przez jednego użytkownika/autora
    @ManyToOne(() => User, (user) => user.ticketMessages)
    author: User;
}