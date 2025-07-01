import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Domain } from './entities/domain.entity';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { ServicesModule } from '../../services/services.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Domain]),
        ServicesModule,
        BullModule.registerQueue({ name: 'provisioning' }),
    ],
    controllers: [DomainsController],
    providers: [DomainsService],
})
export class DomainsModule {}