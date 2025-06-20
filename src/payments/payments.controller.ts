import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('top-up/stripe')
  createStripeTopUpSession(
      @Body() createPaymentDto: CreatePaymentDto,
      @Request() req,
  ) {
    return this.paymentsService.createTopUpSession(createPaymentDto, req.user);
  }
}