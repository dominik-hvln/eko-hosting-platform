// src/eko/eko.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  Query,
  Res,
  HttpCode,
  Req,
} from '@nestjs/common';
import { EkoService } from './eko.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateEkoSettingsDto } from './dto/update-eko-settings.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { IsUUID } from 'class-validator';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { BadgeImpressionDto } from './dto/badge-impression.dto';

class UserIdQueryDto {
  @IsUUID()
  userId: string;
}

@Controller('eko')
export class EkoController {
  constructor(private readonly ekoService: EkoService) {}

  @Get('badge.js')
  async getBadgeScript(@Query() query: UserIdQueryDto, @Res() res: Response) {
    const script = await this.ekoService.generateBadgeScript(query.userId);
    res.setHeader('Content-Type', 'application/javascript');
    res.send(script);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('badge-impression')
  @HttpCode(204)
  grantPointsForBadgeImpression(@Body() dto: BadgeImpressionDto) {
    this.ekoService.grantPointsForBadgeImpression(dto.userId);
  }

  @Get('settings')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getSettings() {
    return this.ekoService.getSettings();
  }

  @Patch('settings')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  updateSettings(@Body() dto: UpdateEkoSettingsDto) {
    return this.ekoService.updateSettings(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('redeem')
  redeemPoints(
    @GetUser() user: { userId: string },
    @Body() dto: RedeemPointsDto,
  ) {
    return this.ekoService.redeemPointsForCredit(user.userId, dto.points);
  }

  // --- POPRAWKA - PRZYWRÓCENIE ORYGINALNEJ METODY ---
  @UseGuards(AuthGuard('jwt'))
  @Get('summary')
  getSummary(@Req() req) {
    // Używamy ponownie dekoratora @Req(), aby uzyskać dostęp
    // do obiektu 'user' w sposób, który działał poprawnie.
    return this.ekoService.getSummaryForUser(req.user.userId);
  }
  // ----------------------------------------------------
}
