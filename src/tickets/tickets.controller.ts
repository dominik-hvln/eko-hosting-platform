import {
  Controller,
  Get, // <-- Dodajemy Get
  Post,
  Body,
  UseGuards,
  Request,
  Param, // <-- Dodajemy Param
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('tickets')
@UseGuards(AuthGuard('jwt'))
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    const authorId = req.user.userId;
    return this.ticketsService.create(createTicketDto, authorId);
  }

  // Zwraca listę ticketów zalogowanego użytkownika
  @Get()
  findAll(@Request() req) {
    const authorId = req.user.userId;
    return this.ticketsService.findAllForUser(authorId);
  }

  // Zwraca szczegóły jednego ticketa wraz z całą konwersacją
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const authorId = req.user.userId;
    return this.ticketsService.findOneForUser(id, authorId);
  }
}