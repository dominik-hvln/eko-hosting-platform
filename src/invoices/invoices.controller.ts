import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAllForUser(@Req() req) {
    return this.invoicesService.findAllForUser(req.user.userId);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Req() req, @Res() res: Response) {
    const invoice = await this.invoicesService.findOneForUser(
      id,
      req.user.userId,
    );
    const pdfBuffer = await this.invoicesService.generatePdf(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="faktura-${invoice.invoiceNumber.replace(/\//g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
