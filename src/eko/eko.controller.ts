import { Controller, Get, Post, Body, UseGuards, Patch, Req } from '@nestjs/common';
import { EkoService } from './eko.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateEkoSettingsDto } from './dto/update-eko-settings.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('eko')
@UseGuards(AuthGuard('jwt'))
export class EkoController {
  constructor(private readonly ekoService: EkoService) {}

  @Get('settings')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  getSettings() {
    return this.ekoService.getSettings();
  }

  @Patch('settings')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  updateSettings(@Body() dto: UpdateEkoSettingsDto) {
    return this.ekoService.updateSettings(dto);
  }

  @Post('redeem')
  redeemPoints(
      @GetUser() user: { userId: string },
      @Body() dto: RedeemPointsDto,
  ) {
    return this.ekoService.redeemPointsForCredit(user.userId, dto.points);
  }

  @Get('summary')
  getSummary(@Req() req) {
    return this.ekoService.getSummaryForUser(req.user.userId);
  }
}