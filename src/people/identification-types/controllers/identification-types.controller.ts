import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IdentificationTypesService } from '../services/identification-types.service';
import { CreateIdentificationTypeDto } from '../dto/create-identification-type.dto';
import { UpdateIdentificationTypeDto } from '../dto/update-identification-type.dto';
import { QueryIdentificationTypeDto } from '../dto/query-identification-type.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';

@Controller('identification-types')
@UseGuards(JwtAuthGuard)
export class IdentificationTypesController {
  constructor(private readonly identificationTypesService: IdentificationTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createIdentificationTypeDto: CreateIdentificationTypeDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.identificationTypesService.create(createIdentificationTypeDto, user);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryIdentificationTypeDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.identificationTypesService.findAll(queryDto, user);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.identificationTypesService.findOne(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIdentificationTypeDto: UpdateIdentificationTypeDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.identificationTypesService.update(id, updateIdentificationTypeDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserWithDetails,
  ) {
    await this.identificationTypesService.remove(id, user);
  }
}

