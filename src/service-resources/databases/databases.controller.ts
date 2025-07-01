import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('services/:serviceId/databases')
@UseGuards(AuthGuard('jwt'))
export class DatabasesController {
    constructor(private readonly databasesService: DatabasesService) {}

    @Post()
    create(@Param('serviceId') serviceId: string, @Body() createDatabaseDto: CreateDatabaseDto, @Request() req) {
        return this.databasesService.create(createDatabaseDto, serviceId, req.user.userId);
    }

    @Get()
    findAll(@Param('serviceId') serviceId: string, @Request() req) {
        return this.databasesService.findAllForService(serviceId, req.user.userId);
    }

    @Get(':databaseId/credentials')
    getCredentials(@Param('serviceId') serviceId: string, @Param('databaseId') databaseId: string, @Request() req) {
        return this.databasesService.getCredentials(databaseId, serviceId, req.user.userId);
    }

    @Delete(':databaseId')
    remove(@Param('serviceId') serviceId: string, @Param('databaseId') databaseId: string, @Request() req) {
        return this.databasesService.remove(databaseId, serviceId, req.user.userId);
    }
}