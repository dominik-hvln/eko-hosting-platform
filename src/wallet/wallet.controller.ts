import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('wallet')
@UseGuards(AuthGuard('jwt')) // Chronimy cały kontroler
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  findOwn(@Request() req) {
    // Wyciągamy ID zalogowanego użytkownika z tokenu
    const userId = req.user.userId;
    // Wywołujemy metodę z serwisu, aby pobrać portfel dla tego użytkownika
    return this.walletService.findOneByUserId(userId);
  }
}