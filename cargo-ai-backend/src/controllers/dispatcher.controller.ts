import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispatcher } from '../entities/dispatcher.entity';
import { DispatcherConfig } from '../entities/dispatcher-config.entity';
import { UpdateDispatcherConfigDto } from '../dto/dispatcher-config.dto';

@ApiTags('dispatcher')
@Controller('dispatcher')
export class DispatcherController {
  constructor(
    @InjectRepository(Dispatcher)
    private dispatcherRepository: Repository<Dispatcher>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get dispatcher by ID' })
  @ApiParam({ name: 'id', description: 'Dispatcher UUID' })
  @ApiResponse({ status: 200, description: 'Dispatcher found' })
  @ApiResponse({ status: 404, description: 'Dispatcher not found' })
  async getDispatcher(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispatcherRepository.findOne({
      where: { id },
      relations: ['config'],
    });
  }

  @Get(':id/config')
  @ApiOperation({ summary: 'Get dispatcher configuration' })
  @ApiParam({ name: 'id', description: 'Dispatcher UUID' })
  @ApiResponse({ status: 200, description: 'Configuration found' })
  async getDispatcherConfig(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispatcherConfigRepository.findOne({
      where: { dispatcherId: id },
    });
  }

  @Put(':id/config')
  @ApiOperation({ summary: 'Update dispatcher configuration' })
  @ApiParam({ name: 'id', description: 'Dispatcher UUID' })
  @ApiBody({ type: UpdateDispatcherConfigDto })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateDispatcherConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDispatcherConfigDto,
  ) {
    let config = await this.dispatcherConfigRepository.findOne({
      where: { dispatcherId: id },
    });

    if (!config) {
      config = this.dispatcherConfigRepository.create({
        dispatcherId: id,
        ...updateDto,
      });
    } else {
      Object.assign(config, updateDto);
    }

    return this.dispatcherConfigRepository.save(config);
  }
}

