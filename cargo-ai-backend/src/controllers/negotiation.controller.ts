import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { NegotiationAgentService } from '../services/negotiation-agent.service';

export class StartNegotiationDto {
  @ApiProperty({ description: 'Offer UUID' })
  offerId: string;
}

export class BrokerResponseDto {
  @ApiProperty({ description: 'Broker message', example: 'We can do $2300, that\'s our best offer.' })
  message: string;
}

@ApiTags('negotiation')
@Controller('negotiation')
export class NegotiationController {
  constructor(
    private negotiationAgentService: NegotiationAgentService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new negotiation session' })
  @ApiQuery({ name: 'dispatcherId', description: 'Dispatcher UUID', required: true })
  @ApiBody({ type: StartNegotiationDto })
  @ApiResponse({ status: 201, description: 'Negotiation session started' })
  async startNegotiation(
    @Body() startDto: StartNegotiationDto,
    @Query('dispatcherId', ParseUUIDPipe) dispatcherId: string,
  ) {
    return this.negotiationAgentService.startNegotiation(
      dispatcherId,
      startDto.offerId,
    );
  }

  @Post('process/:sessionId')
  @ApiOperation({ summary: 'Process broker response in negotiation' })
  @ApiParam({ name: 'sessionId', description: 'Negotiation session UUID' })
  @ApiBody({ type: BrokerResponseDto })
  @ApiResponse({ status: 200, description: 'Response processed' })
  async processBrokerResponse(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() responseDto: BrokerResponseDto,
  ) {
    return this.negotiationAgentService.processBrokerResponse(
      sessionId,
      responseDto.message,
    );
  }

  @Get('status/:sessionId')
  @ApiOperation({ summary: 'Get negotiation session status' })
  @ApiParam({ name: 'sessionId', description: 'Negotiation session UUID' })
  @ApiResponse({ status: 200, description: 'Session status retrieved' })
  async getStatus(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.negotiationAgentService.getSessionStatus(sessionId);
  }

  @Post('end/:sessionId')
  @ApiOperation({ summary: 'End a negotiation session' })
  @ApiParam({ name: 'sessionId', description: 'Negotiation session UUID' })
  @ApiResponse({ status: 200, description: 'Session ended' })
  async endNegotiation(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.negotiationAgentService.endNegotiation(sessionId);
  }
}

