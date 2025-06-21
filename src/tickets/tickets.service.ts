import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { DataSource, Repository } from 'typeorm';
import { TicketMessage } from '../ticket-messages/entities/ticket-message.entity';

@Injectable()
export class TicketsService {
  constructor(
      @InjectRepository(Ticket)
      private readonly ticketsRepository: Repository<Ticket>,
      @InjectRepository(TicketMessage)
      private readonly ticketMessagesRepository: Repository<TicketMessage>,
      private readonly dataSource: DataSource,
  ) {}

  async create(
      createTicketDto: CreateTicketDto,
      authorId: string,
  ): Promise<Ticket> {
    // Używamy transakcji, aby mieć pewność, że albo stworzymy ticket I wiadomość,
    // albo żadne z nich, jeśli wystąpi błąd.
    return this.dataSource.transaction(async (manager) => {
      // 1. Stwórz główny obiekt Ticketa
      const newTicket = manager.create(Ticket, {
        subject: createTicketDto.subject,
        priority: createTicketDto.priority,
        author: { id: authorId }, // Przypisujemy autora (zalogowanego użytkownika)
      });
      await manager.save(newTicket);

      // 2. Stwórz pierwszą Wiadomość w tym tickecie
      const newMessage = manager.create(TicketMessage, {
        content: createTicketDto.message,
        ticket: newTicket, // Przypisujemy wiadomość do nowo utworzonego ticketa
        author: { id: authorId }, // Autorem wiadomości jest ten sam użytkownik
      });
      await manager.save(newMessage);

      // Zwracamy nowo utworzony ticket
      return newTicket;
    });
  }
}