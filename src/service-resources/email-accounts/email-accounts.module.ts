// src/service-resources/email-accounts/email-accounts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailAccount } from './entities/email-account.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EmailAccount])],
    providers: [], // Na razie puste, serwis dodamy później
    controllers: [], // Na razie puste, kontroler dodamy później
})
export class EmailAccountsModule {}