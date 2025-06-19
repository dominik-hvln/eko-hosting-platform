import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    // Ten endpoint będzie chroniony przez strategię 'local'
    // Oznacza to, że zanim kod tej metody się wykona, Passport.js
    // zweryfikuje email i hasło za pomocą naszej logiki w AuthService.
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        // Jeśli doszliśmy tutaj, to znaczy, że użytkownik jest poprawny.
        // Passport.js dołączył obiekt użytkownika do obiektu żądania (req.user).
        return this.authService.login(req.user);
    }
}