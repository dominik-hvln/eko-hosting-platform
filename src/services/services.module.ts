// src/services/services.module.ts

import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { EkoModule } from '../eko/eko.module';
import { AuthModule } from '../auth/auth.module';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, Plan, User]),
    AuthModule,
    EkoModule,
    BullModule.registerQueue({ name: 'provisioning' }),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}