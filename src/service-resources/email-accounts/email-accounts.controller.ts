import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmailAccountsService } from './email-accounts.service';
import { CreateEmailAccountDto } from './dto/create-email-account.dto';

@Controller('services/:serviceId/email-accounts')
@UseGuards(AuthGuard('jwt'))
export class EmailAccountsController {
  constructor(private readonly emailAccountsService: EmailAccountsService) {}

  @Post(':domainId')
  create(
    @Param('serviceId') serviceId: string,
    @Param('domainId') domainId: string,
    @Body() dto: CreateEmailAccountDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.emailAccountsService.create(
      dto,
      serviceId,
      domainId,
      req.user.userId,
    );
  }

  @Get()
  findAll(
    @Param('serviceId') serviceId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.emailAccountsService.findAllForService(
      serviceId,
      req.user.userId,
    );
  }

  @Delete(':id')
  remove(
    @Param('serviceId') serviceId: string,
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.emailAccountsService.remove(id, serviceId, req.user.userId);
  }
}
