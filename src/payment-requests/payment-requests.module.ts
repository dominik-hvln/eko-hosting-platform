import { Module } from '@nestjs/common';
import { PaymentRequestsService } from './payment-requests.service';
import { PaymentRequestsController } from './payment-requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- BRAKUJĄCY IMPORT
import { PaymentRequest } from './entities/payment-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRequest])],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService],
  exports: [PaymentRequestsService],
})
export class PaymentRequestsModule {}