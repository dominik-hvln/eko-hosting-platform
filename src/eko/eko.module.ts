import { Module } from '@nestjs/common';
import { EkoService } from './eko.service';
import { EkoController } from './eko.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EkoSettings } from './entities/eko-settings.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { EkoActionHistory } from './entities/eko-action-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EkoSettings, EkoActionHistory]),
    WalletModule,
    AuthModule, // <-- DODAJEMY MODUŁ TUTAJ
  ],
  controllers: [EkoController],
  providers: [EkoService],
  exports: [EkoService], // Eksportujemy, aby inne moduły mogły z niego korzystać
})
export class EkoModule {}
