import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { UsersModule } from '../users/users.module';
import { EkoModule } from '../eko/eko.module';

@Module({
  // Dodajemy EkoModule, aby ServicesService mógł używać EkoService
  imports: [TypeOrmModule.forFeature([Service]), UsersModule, EkoModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}