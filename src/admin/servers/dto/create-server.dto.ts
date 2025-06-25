// src/admin/servers/dto/create-server.dto.ts

import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    ipAddress: string;

    @IsNumber()
    @IsInt()
    @Min(1)
    @Max(65535)
    @IsOptional()
    @Type(() => Number)
    sshPort?: number;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    sshUser?: string;

    @IsString()
    @IsNotEmpty()
    sshPrivateKey: string;
}