import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(
      private readonly servicesService: ServicesService,
  ) {}

  @Get('my-services')
  findOwnServices(@Request() req) {
    return this.servicesService.findAllForUser(req.user.userId);
  }

  @Get('my-services/:id')
  findOwnOne(@Param('id') id: string, @Request() req) {
    return this.servicesService.findOneForUser(id, req.user.userId);
  }

  @Patch('my-services/:id/toggle-renew')
  toggleAutoRenew(@Param('id') id: string, @Request() req) {
    return this.servicesService.toggleAutoRenewForUser(id, req.user.userId);
  }

  // --- ENDPOINTY ADMINA ---
  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  // Metoda jest teraz znacznie prostsza - tylko przekazuje DTO
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id); // Poprawnie wywołuje findOne z jednym argumentem
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}