import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Request as ExpressRequest } from 'express'; // Używamy standardowego typu Request

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('top-up/stripe')
  @UseGuards(AuthGuard('jwt'))
  createStripeTopUpSession(
      @Body() createPaymentDto: CreatePaymentDto,
      @Request() req,
  ) {
    return this.paymentsService.createTopUpSession(createPaymentDto, req.user);
  }

  @Post('webhook/stripe')
  async handleStripeWebhook(
      @Headers('stripe-signature') signature: string,
      @Req() req: ExpressRequest, // Używamy standardowego typu Request z Expressa
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Dostęp do rawBody przez rzutowanie na 'any', bo dodaliśmy to pole dynamicznie
    const rawBody = (req as any).rawBody;

    if (!rawBody) {
      throw new BadRequestException('Webhook request is missing a raw body');
    }

    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }
}