import { Controller, Post, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('impersonate/:userId')
  @Roles(Role.ADMIN) // Tylko admin może używać tej funkcji
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async impersonate(@Param('userId') userId: string) {
    return this.authService.impersonate(userId);
  }
}
