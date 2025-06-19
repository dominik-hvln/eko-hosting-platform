import {
  Controller,
  Get, // <-- Dodajemy Get
  Post,
  Body,
  UseGuards,
  Request, // <-- Dodajemy Request
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  // --- ZMODYFIKOWANA METODA ---
  @Get()
  // Używamy dekoratora @Request(), aby uzyskać dostęp do obiektu żądania,
  // do którego Passport dołączył dane użytkownika z tokenu.
  findAll(@Request() req) {
    // Wyciągamy ID zalogowanego użytkownika z obiektu `req.user`,
    // który został tam umieszczony przez naszą JwtStrategy.
    const userId = req.user.userId;
    // Wywołujemy nową metodę z serwisu, przekazując ID użytkownika.
    return this.servicesService.findAllForUser(userId);
  }
}