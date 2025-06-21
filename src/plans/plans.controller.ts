import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard'; // <-- 1. IMPORTUJEMY RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // <-- 2. IMPORTUJEMY Roles
import { Role } from '../common/enums/role.enum'; // <-- 3. IMPORTUJEMY Role

@Controller('plans')
@Roles(Role.ADMIN) // <-- 4. OZNACZAMY, ŻE CAŁY KONTROLER JEST DLA ADMINA
@UseGuards(AuthGuard('jwt'), RolesGuard) // <-- 5. DODAJEMY RolesGuard
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}