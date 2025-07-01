import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Metoda weryfikująca użytkownika (używana przez Passport.js)
  async validateUser(email: string, pass: string): Promise<any> {
    // Musimy rozszerzyć UsersService, aby móc wyszukiwać użytkowników
    // Na razie zostawimy to uproszczone, zakładając, że mamy taką metodę.
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // Metoda generująca token JWT po pomyślnym zalogowaniu
  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async impersonate(userIdToImpersonate: string) {
    // Znajdujemy użytkownika, w którego chcemy się wcielić
    // Używamy findOne z serwisu użytkowników, który zwraca usera bez hasła
    const user = await this.usersService.findOne(userIdToImpersonate);
    if (!user) {
      throw new NotFoundException('User to impersonate not found');
    }

    // Generujemy dla niego standardowy token, tak jak przy logowaniu
    // W przyszłości można tu dodać specjalne oznaczenie w tokenie, np. "impersonatedBy: adminId"
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
