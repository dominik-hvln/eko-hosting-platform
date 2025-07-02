import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFtpAccountDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  path: string;
}
