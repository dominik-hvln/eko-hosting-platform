import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateEmailAccountDto {
  @IsEmail()
  emailAddress: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quotaMb?: number;
}
