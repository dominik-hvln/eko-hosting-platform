import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Database } from './entities/database.entity';
import { DatabasesService } from './databases.service';
import { DatabasesController } from './databases.controller';
import { ServicesModule } from '../../services/services.module';
import { EncryptionModule } from '../../common/encryption/encryption.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Database]),
        ServicesModule,
        EncryptionModule,
        BullModule.registerQueue({ name: 'provisioning' }),
    ],
    controllers: [DatabasesController],
    providers: [DatabasesService],
})
export class DatabasesModule {}