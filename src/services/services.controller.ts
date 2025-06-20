import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
@UseGuards(AuthGuard('jwt')) // Cały kontroler wymaga zalogowania
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // --- ENDPOINT DLA ZALOGOWANEGO UŻYTKOWNIKA ---
  @Get('my-services') // Zmieniliśmy ścieżkę dla jasności
  findOwnServices(@Request() req) {
    const userId = req.user.userId;
    return this.servicesService.findAllForUser(userId);
  }

  // --- ENDPOINTY TYLKO DLA ADMINA ---

  // Tworzenie usługi - operacja administracyjna
  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  // Pobieranie wszystkich usług w systemie
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.servicesService.findAll();
  }

  // Pobieranie szczegółów jednej usługi
  @Get(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  // Aktualizacja usługi
  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  update(
      @Param('id') id: string,
      @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  // Usuwanie usługi
  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}