import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;
}