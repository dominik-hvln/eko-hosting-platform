// src/admin/servers/servers.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin/servers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class ServersController {
    constructor(private readonly serversService: ServersService) {}

    @Post()
    create(@Body() createServerDto: CreateServerDto) {
        return this.serversService.create(createServerDto);
    }

    @Get()
    findAll() {
        return this.serversService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.serversService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateServerDto: UpdateServerDto) {
        return this.serversService.update(id, updateServerDto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.serversService.remove(id);
    }
}