import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketMessagesService } from './ticket-messages.service';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { UpdateTicketMessageDto } from './dto/update-ticket-message.dto';

@Controller('ticket-messages')
export class TicketMessagesController {
  constructor(private readonly ticketMessagesService: TicketMessagesService) {}

  @Post()
  create(@Body() createTicketMessageDto: CreateTicketMessageDto) {
    return this.ticketMessagesService.create(createTicketMessageDto);
  }

  @Get()
  findAll() {
    return this.ticketMessagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketMessagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketMessageDto: UpdateTicketMessageDto) {
    return this.ticketMessagesService.update(+id, updateTicketMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketMessagesService.remove(+id);
  }
}
