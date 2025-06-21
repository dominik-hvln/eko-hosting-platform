import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketMessage } from '../ticket-messages/entities/ticket-message.entity';

@Module({
  // Udostępniamy oba repozytoria
  imports: [TypeOrmModule.forFeature([Ticket, TicketMessage])],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}