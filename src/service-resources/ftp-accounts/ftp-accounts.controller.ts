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
import { FtpAccountsService } from './ftp-accounts.service';
import { CreateFtpAccountDto } from './dto/create-ftp-account.dto';

@Controller('services/:serviceId/ftp-accounts')
@UseGuards(AuthGuard('jwt'))
export class FtpAccountsController {
  constructor(private readonly ftpAccountsService: FtpAccountsService) {}

  @Post()
  create(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateFtpAccountDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ftpAccountsService.create(dto, serviceId, req.user.userId);
  }

  @Get()
  findAll(
    @Param('serviceId') serviceId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ftpAccountsService.findAllForService(
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
    return this.ftpAccountsService.remove(id, serviceId, req.user.userId);
  }
}
