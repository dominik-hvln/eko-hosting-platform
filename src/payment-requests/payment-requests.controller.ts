import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { PaymentRequestsService } from './payment-requests.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('payment-requests')
@UseGuards(AuthGuard('jwt'))
export class PaymentRequestsController {
  constructor(
      private readonly paymentRequestsService: PaymentRequestsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN) // Tylko admin może tworzyć żądania zapłaty
  @UseGuards(RolesGuard)
  create(@Body() createPaymentRequestDto: CreatePaymentRequestDto) {
    return this.paymentRequestsService.createByAdmin(createPaymentRequestDto);
  }

  @Get()
  findAllForUser(@Request() req) {
    return this.paymentRequestsService.findAllForUser(req.user.userId);
  }
}