// src/admin/servers/servers.module.ts

import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities/server.entity';
import { EncryptionModule } from '../../common/encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    EncryptionModule,
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService], // Eksportujemy serwis
})
export class ServersModule {}