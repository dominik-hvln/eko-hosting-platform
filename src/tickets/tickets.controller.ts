import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('tickets')
@UseGuards(AuthGuard('jwt'))
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAllForAdmin() {
    return this.ticketsService.findAllForAdmin();
  }

  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    return this.ticketsService.create(createTicketDto, req.user.userId);
  }

  @Get()
  findAllForUser(@Request() req) {
    return this.ticketsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ticketsService.findOne(id, req.user);
  }

  @Post(':id/messages')
  addMessage(
      @Param('id') id: string,
      @Body() createMessageDto: CreateMessageDto,
      @Request() req,
  ) {
    return this.ticketsService.addMessage(id, createMessageDto, req.user);
  }
}