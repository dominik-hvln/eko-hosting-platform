import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentRequest } from './entities/payment-request.entity';
import { Repository } from 'typeorm';
import { PaymentRequestStatus } from '../common/enums/payment-request-status.enum';

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

  findAllForUser(userId: string) {
    return this.paymentRequestsRepository.find({
      where: { user: { id: userId }, status: PaymentRequestStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(id: string, userId: string): Promise<PaymentRequest> {
    // Dodajemy 'relations', aby mieć dostęp do emaila użytkownika
    const request = await this.paymentRequestsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });
    if (!request) {
      throw new NotFoundException(`Payment request with ID ${id} not found.`);
    }
    return request;
  }

  // Ta metoda będzie nam potrzebna w webhooku
  async markAsPaid(id: string): Promise<PaymentRequest> {
    const request = await this.paymentRequestsRepository.findOneBy({ id });
    if (!request) {
      throw new NotFoundException(`Payment request with ID ${id} not found.`);
    }
    request.status = PaymentRequestStatus.PAID;
    return this.paymentRequestsRepository.save(request);
  }
}
