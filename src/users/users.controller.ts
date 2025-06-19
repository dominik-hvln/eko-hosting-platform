import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users') // Ustawia bazowy adres dla tego kontrolera na /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // NOWA, CHRONIONA METODA
  @UseGuards(AuthGuard('jwt')) // Ten strażnik uruchomi naszą JwtStrategy
  @Get('profile')
  getProfile(@Request() req) {
    // Po pomyślnej weryfikacji tokenu, nasza JwtStrategy dołączyła
    // zdekodowany payload do `req.user`. Możemy go teraz po prostu zwrócić.
    return req.user;
  }
}