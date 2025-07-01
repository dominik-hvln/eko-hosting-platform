// src/services/services.module.ts

import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { UsersModule } from '../users/users.module';
import { EkoModule } from '../eko/eko.module';
import { Plan } from '../plans/entities/plan.entity';
import { AuthModule } from '../auth/auth.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, Plan]),
    UsersModule, // UsersModule jest potrzebny, bo Twój ServicesService go używa pośrednio
    EkoModule,
    AuthModule,
    // Przenosimy rejestrację kolejki tutaj
    BullModule.registerQueue({
      name: 'provisioning',
    }),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
