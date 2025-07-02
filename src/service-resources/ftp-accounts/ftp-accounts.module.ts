import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FtpAccount } from './entities/ftp-account.entity';
import { FtpAccountsService } from './ftp-accounts.service';
import { FtpAccountsController } from './ftp-accounts.controller';
import { ServicesModule } from '../../services/services.module';
import { EncryptionModule } from '../../common/encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FtpAccount]),
    ServicesModule,
    EncryptionModule,
  ],
  providers: [FtpAccountsService],
  controllers: [FtpAccountsController],
})
export class FtpAccountsModule {}
