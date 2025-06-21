import { Injectable, NotFoundException } from '@nestjs/common';
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

  // Metoda create() pozostaje bez zmian...
  async create(createTicketDto: CreateTicketDto, authorId: string): Promise<Ticket> {
    return this.dataSource.transaction(async (manager) => {
      const newTicket = manager.create(Ticket, {
        subject: createTicketDto.subject,
        priority: createTicketDto.priority,
        author: { id: authorId },
      });
      await manager.save(newTicket);

      const newMessage = manager.create(TicketMessage, {
        content: createTicketDto.message,
        ticket: newTicket,
        author: { id: authorId },
      });
      await manager.save(newMessage);

      // Zwracamy ticket z załadowaną relacją do wiadomości, aby odpowiedź była kompletna
      const result = await manager.findOne(Ticket, {
        where: { id: newTicket.id },
        relations: ['author', 'messages'],
      });
      return result!;
    });
  }

  // --- NOWA METODA ---
  // Znajduje wszystkie zgłoszenia dla danego użytkownika
  async findAllForUser(authorId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: {
        author: { id: authorId },
      },
      // Sortujemy od najnowszych
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  // Znajduje jedno zgłoszenie, ale sprawdza, czy należy do zalogowanego użytkownika
  async findOneForUser(id: string, authorId: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      // Warunek jest podwójny: ID ticketa musi się zgadzać ORAZ ID autora musi się zgadzać.
      // To jest kluczowe dla bezpieczeństwa, aby użytkownik nie mógł odczytać cudzego zgłoszenia.
      where: {
        id: id,
        author: { id: authorId },
      },
      // Ładujemy relacje: wiadomości, autorów wiadomości oraz autora i przypisanego pracownika ticketa
      relations: ['messages', 'messages.author', 'author', 'assignee'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }
    return ticket;
  }
}