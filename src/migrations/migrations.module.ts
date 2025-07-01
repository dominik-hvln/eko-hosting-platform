import { Module } from '@nestjs/common';
import { MigrationsService } from './migrations.service';
import { MigrationsController } from './migrations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationRequest } from './entities/migration.entity';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MigrationRequest]),
    EncryptionModule, // Importujemy nasz serwis szyfrujący
  ],
  controllers: [MigrationsController],
  providers: [MigrationsService],
})
export class MigrationsModule {}
