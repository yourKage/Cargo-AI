import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FilterAgentService } from '../services/filter-agent.service';
import { NotificationAgentService } from '../services/notification-agent.service';
import { CreateBrokerPostDto } from '../dto/broker-post.dto';
import { FilterScore } from '../entities/filtered-result.entity';

@ApiTags('broker-post')
@Controller('broker-post')
export class BrokerPostController {
  constructor(
    private filterAgentService: FilterAgentService,
    private notificationAgentService: NotificationAgentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new broker post for filtering' })
  @ApiQuery({ name: 'dispatcherId', description: 'Dispatcher UUID', type: String })
  @ApiBody({ type: CreateBrokerPostDto })
  @ApiResponse({ status: 201, description: 'Broker post processed and filtered' })
  async createBrokerPost(
    @Body() createDto: CreateBrokerPostDto,
    @Query('dispatcherId', ParseUUIDPipe) dispatcherId: string,
  ) {
    const result = await this.filterAgentService.processBrokerPost(
      createDto,
      dispatcherId,
    );

    // Send real-time notification if score is green/yellow
    if (result.score !== FilterScore.RED) {
      await this.notificationAgentService.sendRealTimeAlert(
        dispatcherId,
        result,
      );
    }

    return result;
  }
}

@ApiTags('loads')
@Controller('loads')
export class LoadsController {
  constructor(private filterAgentService: FilterAgentService) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top filtered loads for a dispatcher' })
  @ApiQuery({ name: 'dispatcherId', description: 'Dispatcher UUID', required: true })
  @ApiQuery({ name: 'limit', description: 'Number of loads to return', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top loads retrieved' })
  async getTopLoads(
    @Query('dispatcherId', ParseUUIDPipe) dispatcherId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.filterAgentService.getTopLoads(dispatcherId, limitNum);
  }

  @Get('filtered')
  @ApiOperation({ summary: 'Get all filtered loads for a dispatcher' })
  @ApiQuery({ name: 'dispatcherId', description: 'Dispatcher UUID', required: true })
  @ApiQuery({ name: 'score', description: 'Filter by score (green, yellow, red)', required: false, enum: FilterScore })
  @ApiResponse({ status: 200, description: 'Filtered loads retrieved' })
  async getFilteredLoads(
    @Query('dispatcherId', ParseUUIDPipe) dispatcherId: string,
    @Query('score') score?: FilterScore,
  ) {
    return this.filterAgentService.getAllFilteredLoads(dispatcherId, score);
  }
}

