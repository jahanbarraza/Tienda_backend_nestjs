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
import { PersonsService } from '../services/persons.service';
import { CreatePersonDto } from '../dto/create-person.dto';
import { UpdatePersonDto } from '../dto/update-person.dto';
import { QueryPersonDto } from '../dto/query-person.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';

@Controller('persons')
@UseGuards(JwtAuthGuard)
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPersonDto: CreatePersonDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.personsService.create(createPersonDto, user);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryPersonDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.personsService.findAll(queryDto, user);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.personsService.findOne(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePersonDto: UpdatePersonDto,
    @CurrentUser() user: UserWithDetails,
  ) {
    return this.personsService.update(id, updatePersonDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserWithDetails,
  ) {
    await this.personsService.remove(id, user);
  }
}

