import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8, { message: 'Hasło musi mieć co najmniej 8 znaków.' })
  oldPassword: string;

  @IsString()
  @MinLength(8, { message: 'Hasło musi mieć co najmniej 8 znaków.' })
  newPassword: string;
}
