import { IsNumber, IsPositive } from 'class-validator';

export class CreatePaymentDto {
    @IsNumber()
    @IsPositive()
    amount: number; // kwota w ZŁOTYCH, np. 20
}