import { Controller, Get, Body, UseGuards, Patch } from '@nestjs/common';
import { EkoService } from './eko.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateEkoSettingsDto } from './dto/update-eko-settings.dto';

@Controller('eko')
export class EkoController {
  constructor(private readonly ekoService: EkoService) {}

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
}