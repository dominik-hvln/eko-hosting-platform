import { Module } from '@nestjs/common';
import { DomainsModule } from './domains/domains.module';
import { DatabasesModule } from './databases/databases.module';
import { EmailAccountsModule } from './email-accounts/email-accounts.module';
import { FtpAccountsModule } from './ftp-accounts/ftp-accounts.module'; // NOWY IMPORT

@Module({
    imports: [
        DomainsModule,
        DatabasesModule,
        EmailAccountsModule,
        FtpAccountsModule // <-- DODAJEMY NOWY MODUŁ
    ],
    exports: [
        DomainsModule,
        DatabasesModule,
        EmailAccountsModule,
        FtpAccountsModule
    ],
})
export class ServiceResourcesModule {}