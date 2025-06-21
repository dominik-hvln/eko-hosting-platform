import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly key: Buffer;
    private readonly iv: Buffer;
    private readonly algorithm = 'aes-256-cbc';

    constructor(private configService: ConfigService) {
        // Pobieramy klucz i wektor inicjalizacyjny z pliku .env
        const secretKey = this.configService.get<string>('ENCRYPTION_KEY')!;
        const initVector = this.configService.get<string>('ENCRYPTION_IV')!;

        // Konwertujemy je na bufory o odpowiedniej długości
        this.key = Buffer.from(secretKey, 'hex');
        this.iv = Buffer.from(initVector, 'hex');
    }

    // Metoda do szyfrowania tekstu
    encrypt(text: string): string {
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    // Metoda do deszyfrowania tekstu
    decrypt(encryptedText: string): string {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}