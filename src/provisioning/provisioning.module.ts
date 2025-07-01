// src/provisioning/provisioning.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProvisioningProcessor } from './provisioning.processor';
import { ServersModule } from '../admin/servers/servers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { Server } from '../admin/servers/entities/server.entity';
import { ServicesModule } from '../services/services.module';
import { Domain } from '../service-resources/domains/entities/domain.entity';
import { Database } from '../service-resources/databases/entities/database.entity';
import { EncryptionModule } from '../common/encryption/encryption.module'; // NOWY IMPORT

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'provisioning',
    }),
    ServersModule,
    ServicesModule,
    TypeOrmModule.forFeature([Service, Server]),
  ],
  providers: [ProvisioningProcessor],
})
export class ProvisioningModule {}
