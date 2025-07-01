import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsPositive()
  amount: number; // Oczekujemy kwoty w groszach

  @IsUUID()
  userId: string;
}
