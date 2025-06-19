import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Wallet])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Ważne, aby inne moduły mogły używać UsersService
})
export class UsersModule {}