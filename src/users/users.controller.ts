import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users') // Ustawia bazowy adres dla tego kontrolera na /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Dekorator @Post() oznacza, że ta metoda będzie obsługiwać żądania POST na adres /users
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // Dekorator @Body() wyciąga całą treść żądania (body)
    // i automatycznie waliduje ją względem naszej klasy CreateUserDto.
    // Jeśli dane będą niepoprawne (np. zły email, za krótkie hasło),
    // NestJS sam zwróci błąd 400 Bad Request.

    // Jeśli dane są poprawne, po prostu wywołujemy metodę z naszego serwisu
    return this.usersService.create(createUserDto);
  }
}