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
import { StoresService } from '../services/stores.service';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { QueryStoreDto } from '../dto/query-store.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createStoreDto: CreateStoreDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.storesService.create(createStoreDto, user);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryStoreDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.storesService.findAll(queryDto, user);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.storesService.findOne(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.storesService.update(id, updateStoreDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserWithDetails,
  ) {
    await this.storesService.remove(id, user);
  }
}

