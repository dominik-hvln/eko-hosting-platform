import { Injectable } from '@nestjs/common';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentRequest } from './entities/payment-request.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentRequestsService {
  constructor(
      @InjectRepository(PaymentRequest)
      private readonly paymentRequestsRepository: Repository<PaymentRequest>,
  ) {}

  createByAdmin(createPaymentRequestDto: CreatePaymentRequestDto) {
    const newRequest = this.paymentRequestsRepository.create({
      title: createPaymentRequestDto.title,
      amount: createPaymentRequestDto.amount,
      user: { id: createPaymentRequestDto.userId },
    });
    return this.paymentRequestsRepository.save(newRequest);
  }
}