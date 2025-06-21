import { Module } from '@nestjs/common';
import { TicketMessagesService } from './ticket-messages.service';
import { TicketMessagesController } from './ticket-messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketMessage } from './entities/ticket-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TicketMessage])],
  controllers: [TicketMessagesController],
  providers: [TicketMessagesService],
})
export class TicketMessagesModule {}