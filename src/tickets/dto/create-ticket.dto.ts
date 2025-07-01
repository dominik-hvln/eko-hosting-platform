import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketPriority } from '../../common/enums/ticket-priority.enum';
import { TicketType } from '../../common/enums/ticket-type.enum';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsEnum(TicketType)
  @IsOptional()
  type?: TicketType;

  @IsEnum(TicketPriority)
  @IsOptional() // Priorytet może być opcjonalny, z wartością domyślną
  priority?: TicketPriority;

  @IsString()
  @IsNotEmpty()
  message: string; // Treść pierwszej wiadomości w zgłoszeniu
}
