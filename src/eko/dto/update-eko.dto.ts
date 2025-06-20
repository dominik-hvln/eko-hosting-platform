import { PartialType } from '@nestjs/mapped-types';
import { CreateEkoDto } from './create-eko.dto';

export class UpdateEkoDto extends PartialType(CreateEkoDto) {}
