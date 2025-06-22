import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { DataSource, Repository } from 'typeorm';
import { TicketMessage } from '../ticket-messages/entities/ticket-message.entity';
import { Role } from '../common/enums/role.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class TicketsService {
  constructor(
      @InjectRepository(Ticket)
      private readonly ticketsRepository: Repository<Ticket>,
      @InjectRepository(TicketMessage)
      private readonly ticketMessagesRepository: Repository<TicketMessage>,
      private readonly dataSource: DataSource,
  ) {}

  async create(createTicketDto: CreateTicketDto, authorId: string): Promise<Ticket> {
    return this.dataSource.transaction(async (manager) => {
      const newTicket = manager.create(Ticket, {
        subject: createTicketDto.subject,
        priority: createTicketDto.priority,
        type: createTicketDto.type,
        author: { id: authorId },
      });
      await manager.save(newTicket);

      const newMessage = manager.create(TicketMessage, {
        content: createTicketDto.message,
        ticket: newTicket,
        author: { id: authorId },
      });
      await manager.save(newMessage);

      return manager.findOneByOrFail(Ticket, { id: newTicket.id });
    });
  }

  async addMessage(
      ticketId: string,
      createMessageDto: CreateMessageDto,
      user: { userId: string; role: Role },
  ): Promise<TicketMessage> {
    // Używamy findOne, aby pobrać ticket i zweryfikować uprawnienia
    const ticket = await this.findOne(ticketId, user);

    const newMessage = this.ticketMessagesRepository.create({
      content: createMessageDto.content,
      ticket: ticket,
      author: { id: user.userId },
    });

    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await this.ticketsRepository.save(ticket);
    }

    return this.ticketMessagesRepository.save(newMessage);
  }

  async findAllForUser(authorId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { author: { id: authorId } },
      order: { updatedAt: 'DESC' },
    });
  }

  async findAllForAdmin(): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      relations: { author: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, user: { userId: string; role: Role }): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['messages', 'messages.author', 'author', 'assignee'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }

    if (user.role !== Role.ADMIN && ticket.author.id !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    return ticket;
  }
}