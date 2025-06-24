import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        UsersModule, // Importujemy, aby mieć dostęp do UsersService
        PassportModule,
        ConfigModule, // Importujemy, aby mieć dostęp do ConfigService
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '60m' }, // Token będzie ważny przez 60 minut
            }),
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService, PassportModule],
})
export class AuthModule {}