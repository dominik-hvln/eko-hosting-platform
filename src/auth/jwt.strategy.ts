import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // Ta metoda uruchomi się DOPIERO po pomyślnej weryfikacji tokenu.
  // Jej zadaniem jest zdekodowanie "payloadu" (danych wewnątrz tokenu)
  // i dołączenie go do obiektu żądania (request).
  async validate(payload: any) {
    // `payload` to zdekodowane dane z tokenu, które umieściliśmy tam podczas logowania
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
