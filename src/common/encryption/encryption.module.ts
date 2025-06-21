import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Importujemy, aby mieć dostęp do ConfigService
  providers: [EncryptionService],
  exports: [EncryptionService], // Eksportujemy, aby inne moduły mogły go używać
})
export class EncryptionModule {}