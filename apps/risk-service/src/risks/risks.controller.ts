import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateRiskProfileDto } from './dto/create-risk-profile.dto';
import { UpdateRiskProfileDto } from './dto/update-risk-profile.dto';
import { RisksService } from './risks.service';

@Controller('risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Post()
  create(@Body() createRiskProfileDto: CreateRiskProfileDto) {
    return this.risksService.create(createRiskProfileDto);
  }

  @Get()
  findAll() {
    return this.risksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.risksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRiskProfileDto: UpdateRiskProfileDto) {
    return this.risksService.update(id, updateRiskProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.risksService.remove(id);
  }
}
