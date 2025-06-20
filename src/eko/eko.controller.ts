import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { EkoService } from './eko.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('eko')
@UseGuards(AuthGuard('jwt')) // Tylko zalogowani użytkownicy mogą zbierać punkty
export class EkoController {
  constructor(private readonly ekoService: EkoService) {}

  // Endpoint symulujący akcję "włączyłem tryb ciemny"
  @Post('dark-mode/enable')
  addPointsForDarkMode(@Request() req) {
    const userId = req.user.userId;
    return this.ekoService.addPointsForDarkMode(userId);
  }
}