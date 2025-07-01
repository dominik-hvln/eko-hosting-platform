import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('services/:serviceId/domains')
@UseGuards(AuthGuard('jwt'))
export class DomainsController {
    constructor(private readonly domainsService: DomainsService) {}

    @Post()
    create(@Param('serviceId') serviceId: string, @Body() createDomainDto: CreateDomainDto, @Request() req) {
        return this.domainsService.create(createDomainDto, serviceId, req.user.userId);
    }

    @Get()
    findAll(@Param('serviceId') serviceId: string, @Request() req) {
        return this.domainsService.findAllForService(serviceId, req.user.userId);
    }

    @Patch(':domainId')
    updatePhpVersion(
        @Param('serviceId') serviceId: string,
        @Param('domainId') domainId: string,
        @Body() updateDomainDto: UpdateDomainDto,
        @Request() req
    ) {
        return this.domainsService.updatePhpVersion(domainId, updateDomainDto, serviceId, req.user.userId);
    }

    @Delete(':domainId')
    remove(@Param('serviceId') serviceId: string, @Param('domainId') domainId: string, @Request() req) {
        return this.domainsService.remove(domainId, serviceId, req.user.userId);
    }
}