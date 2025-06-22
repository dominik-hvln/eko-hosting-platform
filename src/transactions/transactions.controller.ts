import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('transactions')
@UseGuards(AuthGuard('jwt')) // Chronimy cały kontroler
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAllForUser(@Request() req) {
    const userId = req.user.userId;
    return this.transactionsService.findAllForUser(userId);
  }
}