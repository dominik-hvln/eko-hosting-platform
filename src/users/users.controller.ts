import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard'; // <-- 1. IMPORTUJEMY RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // <-- 2. IMPORTUJEMY Roles
import { Role } from '../common/enums/role.enum'; // <-- 3. IMPORTUJEMY Role

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Rejestracja - publiczna, bez guardów
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Profil zalogowanego użytkownika - dla każdego zalogowanego
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // --- ZMODYFIKOWANA METODA ---
  // Lista wszystkich użytkowników - tylko dla admina
  @Get()
  @Roles(Role.ADMIN) // <-- 4. OZNACZAMY WYMAGANĄ ROLĘ
  @UseGuards(AuthGuard('jwt'), RolesGuard) // <-- 5. UŻYWAMY OBU STRAŻNIKÓW
  findAll() {
    return this.usersService.findAll();
  }
}