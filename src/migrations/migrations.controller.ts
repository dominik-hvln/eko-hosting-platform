import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MigrationsService } from './migrations.service';
import { CreateMigrationDto } from './dto/create-migration.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('migrations')
@UseGuards(AuthGuard('jwt'))
export class MigrationsController {
  constructor(private readonly migrationsService: MigrationsService) {}

  @Post()
  create(@Body() createMigrationDto: CreateMigrationDto, @Request() req) {
    const userId = req.user.userId;
    return this.migrationsService.create(createMigrationDto, userId);
  }
}
