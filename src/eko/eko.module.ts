import { Module } from '@nestjs/common';
import { EkoService } from './eko.service';
import { EkoController } from './eko.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EkoSettings } from './entities/eko-settings.entity'; // Poprawiona ścieżka

@Module({
  imports: [TypeOrmModule.forFeature([EkoSettings])],
  controllers: [EkoController],
  providers: [EkoService],
  exports: [EkoService], // Eksportujemy, aby inne moduły mogły z niego korzystać
})
export class EkoModule {}