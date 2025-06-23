    import { Injectable, NotFoundException } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';
    import { Invoice } from './entities/invoice.entity';
    import { User } from '../users/entities/user.entity';
    import { Transaction } from '../transactions/entities/transaction.entity';
    import * as PDFDocument from 'pdfkit';
    import * as path from 'path';
    import * as fs from 'fs';
    import { TransactionType } from '../common/enums/transaction-type.enum';

    @Injectable()
    export class InvoicesService {
      constructor(
          @InjectRepository(Invoice)
          private invoicesRepository: Repository<Invoice>,
      ) {}

      async createForTransaction(user: User, transaction: Transaction): Promise<Invoice> {
        const count = await this.invoicesRepository.count({ where: { user: { id: user.id } } });
        const invoiceNumber = `FV-PRO/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${count + 1}`;
        const issueDate = new Date();
        const amountInGr = Math.round(parseFloat(transaction.amount.toString()) * 100);
        const isPayment = amountInGr < 0;
        const grossValue = isPayment ? -amountInGr : amountInGr;

        const vatRate = 23;
        const netValue = Math.round(grossValue / (1 + vatRate / 100));
        const vatValue = grossValue - netValue;

        const buyerName = user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

        let itemName = 'Doładowanie portfela w serwisie';
        if (transaction.type === TransactionType.PAYMENT && transaction.description) {
          itemName = transaction.description;
        }

        const invoice = this.invoicesRepository.create({
          invoiceNumber, issueDate, saleDate: issueDate,
          buyer: { name: buyerName, taxId: user.taxId, addressLine1: user.addressLine1, zipCode: user.zipCode, city: user.city, country: user.country },
          seller: { name: 'EKO-HOSTING Sp. z o.o.', taxId: '123-456-78-90', addressLine1: 'ul. Wymyślona 1', zipCode: '00-000', city: 'Warszawa', country: 'Polska' },
          items: [{ name: itemName, quantity: 1, unitPrice: netValue, netValue, vatRate, vatValue, grossValue }],
          totalNetValue: netValue, totalGrossValue: grossValue, user: user,
        });

        return this.invoicesRepository.save(invoice);
      }

      findAllForUser(userId: string) {
        return this.invoicesRepository.find({
          where: { user: { id: userId } },
          order: { issueDate: 'DESC' },
          select: ['id', 'invoiceNumber', 'issueDate', 'totalGrossValue', 'totalNetValue'],
        });
      }

      async findOneForUser(id: string, userId: string): Promise<Invoice> {
        const invoice = await this.invoicesRepository.findOneBy({ id, user: { id: userId } });
        if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found.`);
        return invoice;
      }

      // --- POPRAWIONA METODA GENEROWANIA PDF ---
      async generatePdf(invoice: Invoice): Promise<Buffer> {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const regularFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Regular.ttf');
        const boldFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Bold.ttf');
        doc.registerFont('Roboto', regularFontPath);
        doc.registerFont('Roboto-Bold', boldFontPath);
        const formatCurrency = (amountInGr: number) => `${(amountInGr / 100).toFixed(2)} PLN`;

        doc.fontSize(20).font('Roboto-Bold').text(`Faktura Pro-Forma nr: ${invoice.invoiceNumber}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(10).font('Roboto');
        doc.text(`Data wystawienia: ${new Date(invoice.issueDate).toLocaleDateString()}`);
        doc.text(`Data sprzedaży: ${new Date(invoice.saleDate).toLocaleDateString()}`);
        doc.moveDown();

        const sellerX = 50;
        const buyerX = 350;
        const yPos = doc.y;

        doc.font('Roboto-Bold').text('Sprzedawca:', sellerX, yPos);
        doc.font('Roboto').text(invoice.seller.name, sellerX, doc.y);
        doc.text(invoice.seller.addressLine1 || '', sellerX, doc.y);
        doc.text(`${invoice.seller.zipCode || ''} ${invoice.seller.city || ''}`, sellerX, doc.y);
        doc.text(`NIP: ${invoice.seller.taxId}`, sellerX, doc.y);

        doc.font('Roboto-Bold').text('Nabywca:', buyerX, yPos);
        doc.font('Roboto').text(invoice.buyer.name, buyerX, doc.y);
        doc.text(invoice.buyer.addressLine1 || '', buyerX, doc.y);
        doc.text(`${invoice.buyer.zipCode || ''} ${invoice.buyer.city || ''}`, buyerX, doc.y);
        doc.text(`NIP: ${invoice.buyer.taxId || 'Brak'}`, buyerX, doc.y);

        doc.moveDown(3);

        const tableTop = doc.y;
        const itemX = 50;
        const qtyX = 300;
        const priceX = 370;
        const totalX = 440;

        doc.font('Roboto-Bold');
        doc.text('Nazwa usługi/towaru', itemX, tableTop);
        doc.text('Ilość', qtyX, tableTop, { width: 50, align: 'right' });
        doc.text('Cena netto', priceX, tableTop, { width: 60, align: 'right' });
        doc.text('Wartość brutto', totalX, tableTop, { width: 90, align: 'right' });

        const drawLine = (y) => doc.moveTo(itemX, y).lineTo(540, y).strokeColor("#aaaaaa").stroke();
        drawLine(doc.y + 3);
        doc.moveDown();

        doc.font('Roboto');
        invoice.items.forEach(item => {
          const y = doc.y;
          doc.text(item.name, itemX, y);
          doc.text(item.quantity.toString(), qtyX, y, { width: 50, align: 'right' });
          doc.text(formatCurrency(item.netValue), priceX, y, { width: 60, align: 'right' });
          doc.text(formatCurrency(item.grossValue), totalX, y, { width: 90, align: 'right' });
          doc.moveDown();
        });
        drawLine(doc.y);
        doc.moveDown(2);

        doc.font('Roboto');
        doc.fontSize(10).text(`Suma netto: ${formatCurrency(invoice.totalNetValue)}`, { align: 'right' });
        doc.text(`VAT (23%): ${formatCurrency(invoice.totalGrossValue - invoice.totalNetValue)}`, { align: 'right' });
        doc.moveDown();
        doc.font('Roboto-Bold').fontSize(12).text(`Do zapłaty: ${formatCurrency(invoice.totalGrossValue)}`, { align: 'right' });

        doc.end();

        return new Promise((resolve) => {
          const buffers: any[] = [];
          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
          });
        });
      }
    }