import {
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
    CreateSessionArgs,
    CreateSessionResult,
    PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class PayUService implements PaymentProvider {
    private readonly posId: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly apiUrl: string = 'https://secure.snd.payu.com'; // Adres API dla środowiska Sandbox

    constructor(private configService: ConfigService) {
        this.posId = this.configService.get<string>('PAYU_POS_ID')!;
        this.clientId = this.configService.get<string>('PAYU_CLIENT_ID')!;
        this.clientSecret = this.configService.get<string>('PAYU_CLIENT_SECRET')!;
    }

    // Prywatna metoda do pobierania tokenu dostępowego od PayU
    private async getAccessToken(): Promise<string> {
        const url = `${this.apiUrl}/pl/standard/user/oauth/authorize`;
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);

        try {
            const response = await axios.post(url, params);
            return response.data.access_token;
        } catch (error) {
            console.error('Error getting PayU access token:', error.response?.data);
            throw new InternalServerErrorException('Could not authenticate with PayU');
        }
    }

    async createPaymentSession(
        args: CreateSessionArgs,
    ): Promise<CreateSessionResult> {
        const accessToken = await this.getAccessToken();
        const url = `${this.apiUrl}/api/v2_1/orders`;

        // PayU wymaga bardzo szczegółowego obiektu zamówienia
        const orderData = {
            notifyUrl: 'https://localhost:3000/payments/webhook/payu', // Nasz przyszły webhook
            continueUrl: args.successUrl, // Adres po udanej płatności
            customerIp: '127.0.0.1', // W produkcji tu będzie IP klienta
            merchantPosId: this.posId,
            description: 'Doładowanie portfela',
            currencyCode: args.currency.toUpperCase(),
            totalAmount: args.amount.toString(), // Kwota w groszach jako string
            buyer: {
                email: args.userEmail,
            },
            products: [
                {
                    name: 'Doładowanie portfela',
                    unitPrice: args.amount.toString(),
                    quantity: '1',
                },
            ],
        };

        try {
            const response = await axios.post(url, orderData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                // Ważne, aby nie rzucać błędu przy przekierowaniach, które zwraca PayU
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status >= 200 && status < 400;
                },
            });

            return {
                paymentUrl: response.data.redirectUri,
                sessionId: response.data.orderId,
            };
        } catch (error) {
            console.error('Error creating PayU order:', error.response?.data);
            throw new HttpException(
                'Could not create PayU order',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}