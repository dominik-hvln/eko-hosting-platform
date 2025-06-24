    import { Injectable, NotFoundException } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Between, Repository } from 'typeorm';
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
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const countInMonth = await this.invoicesRepository.count({
          where: { createdAt: Between(startOfMonth, endOfMonth) },
        });
        const invoiceNumber = `FV/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${countInMonth + 1}`;
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

        // Rejestracja czcionek z polskimi znakami
        const regularFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Regular.ttf');
        const boldFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Bold.ttf');
        doc.registerFont('Roboto', regularFontPath);
        doc.registerFont('Roboto-Bold', boldFontPath);

        const formatCurrency = (amountInGr: number) => (amountInGr / 100).toFixed(2);
        const formatDate = (date: Date) => new Date(date).toLocaleDateString('pl-PL');

        // --- Nagłówek ---
        const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 40, { width: 50 });
        }
        doc.fontSize(20).font('Roboto-Bold').text(`Faktura VAT`, { align: 'center' });
        doc.fontSize(20).font('Roboto-Bold').text(`${invoice.invoiceNumber}`, { align: 'center' });

        doc.fontSize(8).font('Roboto').text(`Miejsce wystawienia: Warszawa`, 400, 50, { align: 'right' });
        doc.text(`Data wystawienia: ${formatDate(invoice.issueDate)}`, { align: 'right' });
        doc.text(`Data sprzedaży: ${formatDate(invoice.saleDate)}`, { align: 'right' });

        // --- Dane stron ---
        const sellerX = 50;
        const buyerX = 320;
        let yPos = 150;
        doc.fontSize(10).font('Roboto-Bold');
        doc.text('Sprzedawca:', sellerX, yPos);
        doc.text('Nabywca:', buyerX, yPos);
        doc.moveDown(0.5);

        yPos = doc.y;
        doc.font('Roboto');
        doc.text(invoice.seller.name, sellerX);
        doc.text(invoice.seller.addressLine1 || '');
        doc.text(`${invoice.seller.zipCode || ''} ${invoice.seller.city || ''}`);
        doc.text(`NIP: ${invoice.seller.taxId}`);

        doc.text(invoice.buyer.name, buyerX);
        doc.text(invoice.buyer.addressLine1 || '');
        doc.text(`${invoice.buyer.zipCode || ''} ${invoice.buyer.city || ''}`);
        doc.text(`NIP: ${invoice.buyer.taxId || 'Brak'}`);
        doc.moveDown(3);

        // --- Tabela z pozycjami ---
        const tableTop = doc.y;
        const positions = { lp: 50, nazwa: 70, ilosc: 300, jm: 340, cenaNetto: 370, wartoscNetto: 430, vat: 490, wartoscBrutto: 520 };

        const drawLine = (y: number) => doc.moveTo(50, y).lineTo(550, y).strokeColor("#cccccc").lineWidth(0.5).stroke();

        doc.font('Roboto-Bold');
        doc.fontSize(8);
        doc.text('Lp.', positions.lp, tableTop);
        doc.text('Nazwa towaru/usługi', positions.nazwa, tableTop);
        doc.text('Ilość', positions.ilosc, tableTop);
        doc.text('J.m.', positions.jm, tableTop);
        doc.text('Cena netto', positions.cenaNetto, tableTop);
        doc.text('Wartość netto', positions.wartoscNetto, tableTop);
        doc.text('% VAT', positions.vat, tableTop);
        doc.text('Wartość brutto', positions.wartoscBrutto, tableTop, { align: 'right' });
        drawLine(doc.y + 2);

        doc.font('Roboto').fontSize(9);
        invoice.items.forEach((item, index) => {
          const y = doc.y + 5;
          doc.text(String(index + 1), positions.lp, y);
          doc.text(item.name, positions.nazwa, y, { width: 230 });
          doc.text(String(item.quantity), positions.ilosc, y);
          doc.text('szt.', positions.jm, y);
          doc.text(formatCurrency(item.netValue), positions.cenaNetto, y);
          doc.text(formatCurrency(item.netValue), positions.wartoscNetto, y);
          doc.text(String(item.vatRate), positions.vat, y);
          doc.text(formatCurrency(item.grossValue), positions.wartoscBrutto, y, { align: 'right' });
          doc.moveDown();
        });
        drawLine(doc.y);

        // --- Podsumowanie ---
        const summaryX_label = 380;
        const summaryX_value = 450;
        doc.moveDown(2);
        doc.fontSize(10).font('Roboto');

        yPos = doc.y;
        doc.text('Razem netto:', summaryX_label, yPos, { align: 'left' });
        doc.text(`${formatCurrency(invoice.totalNetValue)} PLN`, summaryX_value, yPos, { align: 'right' });
        yPos += 15;
        doc.text('W tym VAT (23%):', summaryX_label, yPos, { align: 'left' });
        doc.text(`${formatCurrency(invoice.totalGrossValue - invoice.totalNetValue)} PLN`, summaryX_value, yPos, { align: 'right' });
        yPos += 15;
        doc.font('Roboto-Bold').fontSize(12);
        doc.text('Do zapłaty:', summaryX_label, yPos, { align: 'left' });
        doc.text(`${formatCurrency(invoice.totalGrossValue)} PLN`, summaryX_value, yPos, { align: 'right' });

        doc.y = doc.y + 30; // Zwiększamy odstęp, aby nie nachodziło na stopkę
        yPos = doc.y;
        doc.font('Roboto').fontSize(10);
        doc.text(`Forma płatności: Płatność online`, 50, yPos);
        doc.text(`Status płatności: Opłacono`, 50, doc.y);

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