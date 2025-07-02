import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailAccount } from './entities/email-account.entity';
import { EmailAccountsService } from './email-accounts.service';
import { EmailAccountsController } from './email-accounts.controller';
import { ServicesModule } from '../../services/services.module';
import { EncryptionModule } from '../../common/encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount]),
    ServicesModule,
    EncryptionModule,
  ],
  providers: [EmailAccountsService],
  controllers: [EmailAccountsController],
})
export class EmailAccountsModule {}
