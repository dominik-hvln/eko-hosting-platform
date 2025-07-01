import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FtpAccount } from './entities/ftp-account.entity';

@Module({
    imports: [TypeOrmModule.forFeature([FtpAccount])],
    providers: [], // Serwis i kontroler dodamy w kolejnym kroku
    controllers: [],
})
export class FtpAccountsModule {}