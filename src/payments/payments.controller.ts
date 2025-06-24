import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

interface RequestWithRawBody extends ExpressRequest {
  rawBody: Buffer;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('top-up/stripe')
  createStripeTopUpSession(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.createTopUpSession(req.user, createPaymentDto, 'stripe');
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('top-up/payu')
  createPayuTopUpSession(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.createTopUpSession(req.user, createPaymentDto, 'payu');
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('service-renewal/:serviceId')
  createServiceRenewalSession(@Param('serviceId') serviceId: string, @Request() req) {
    return this.paymentsService.createServiceRenewalSession(req.user.userId, serviceId);
  }

  @Post('webhook/stripe')
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: RequestWithRawBody) {
    if (!signature) throw new BadRequestException('Missing stripe-signature header');
    if (!req.rawBody) throw new BadRequestException('Webhook request is missing a raw body');
    return this.paymentsService.handleStripeWebhook(signature, req.rawBody);
  }

  @Post('webhook/payu')
  async handlePayuWebhook(@Headers('openpayu-signature') signature: string, @Req() req: RequestWithRawBody) {
    // Puste na razie
  }

  @Post('pay-for-request/:requestId')
  @UseGuards(AuthGuard('jwt'))
  createRequestPaymentSession(
      @Param('requestId') requestId: string,
      @GetUser() user: { userId: string }, // Używamy naszego nowego dekoratora
  ) {
    // Teraz obiekt 'user' na pewno nie będzie undefined
    return this.paymentsService.createRequestPaymentSession(user.userId, requestId);
  }
}