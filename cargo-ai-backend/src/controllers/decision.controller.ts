import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { DecisionAgentService } from '../services/decision-agent.service';

export class BrokerRejectionDto {
  @ApiProperty({ description: 'Rejection reason', required: false })
  reason?: string;
}

@ApiTags('decision')
@Controller('decision')
export class DecisionController {
  constructor(private decisionAgentService: DecisionAgentService) {}

  @Get('evaluate/:sessionId')
  @ApiOperation({ summary: 'Evaluate negotiation outcome' })
  @ApiParam({ name: 'sessionId', description: 'Negotiation session UUID' })
  @ApiResponse({ status: 200, description: 'Evaluation result' })
  async evaluateNegotiation(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.decisionAgentService.evaluateNegotiation(sessionId);
  }

  @Post('reject/:sessionId')
  @ApiOperation({ summary: 'Handle broker rejection' })
  @ApiParam({ name: 'sessionId', description: 'Negotiation session UUID' })
  @ApiBody({ type: BrokerRejectionDto })
  @ApiResponse({ status: 200, description: 'Rejection handled' })
  async handleBrokerRejection(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() rejectionDto: BrokerRejectionDto,
  ) {
    return this.decisionAgentService.handleBrokerRejection(
      sessionId,
      rejectionDto.reason,
    );
  }

  @Post('human-call/:sessionId')
  @ApiOperation({ summary: 'Request human-to-human call' })
  @ApiParam({ name: 'sessionId', description: 'Negotiation session UUID' })
  @ApiResponse({ status: 200, description: 'Human call requested' })
  async requestHumanCall(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    await this.decisionAgentService.requestHumanCall(sessionId);
    return { message: 'Human call requested' };
  }

  @Post('retry/:sessionId')
  @ApiOperation({ summary: 'Retry a failed negotiation' })
  @ApiParam({ name: 'sessionId', description: 'Negotiation session UUID' })
  @ApiResponse({ status: 200, description: 'Negotiation retried' })
  async retryNegotiation(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.decisionAgentService.retryNegotiation(sessionId);
  }
}

