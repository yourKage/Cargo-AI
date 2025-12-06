import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { OfferAgentService } from '../services/offer-agent.service';
import { OfferStatus } from '../entities/offer-log.entity';

export class CreateOfferDto {
  @ApiProperty({ description: 'Broker post UUID' })
  brokerPostId: string;

  @ApiProperty({ description: 'Initial offer price', example: 2400 })
  initialPrice: number;
}

@ApiTags('offer')
@Controller('offer')
export class OfferController {
  constructor(private offerAgentService: OfferAgentService) {}

  @Post('send')
  @ApiOperation({ summary: 'Create and send an offer to a broker' })
  @ApiQuery({ name: 'dispatcherId', description: 'Dispatcher UUID', required: true })
  @ApiBody({ type: CreateOfferDto })
  @ApiResponse({ status: 201, description: 'Offer created' })
  async sendOffer(
    @Body() createDto: CreateOfferDto,
    @Query('dispatcherId', ParseUUIDPipe) dispatcherId: string,
  ) {
    return this.offerAgentService.createOffer(
      dispatcherId,
      createDto.brokerPostId,
      createDto.initialPrice,
    );
  }

  @Post('approve/:id')
  @ApiOperation({ summary: 'Approve a pending offer' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiResponse({ status: 200, description: 'Offer approved and sent' })
  async approveOffer(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerAgentService.approveOffer(id);
  }

  @Put('reject/:id')
  @ApiOperation({ summary: 'Reject an offer' })
  @ApiParam({ name: 'id', description: 'Offer UUID' })
  @ApiResponse({ status: 200, description: 'Offer rejected' })
  async rejectOffer(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerAgentService.rejectOffer(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get offers for a dispatcher' })
  @ApiQuery({ name: 'dispatcherId', description: 'Dispatcher UUID', required: true })
  @ApiQuery({ name: 'status', description: 'Filter by status', required: false, enum: OfferStatus })
  @ApiResponse({ status: 200, description: 'Offers retrieved' })
  async getOffers(
    @Query('dispatcherId', ParseUUIDPipe) dispatcherId: string,
    @Query('status') status?: OfferStatus,
  ) {
    return this.offerAgentService.getOffers(dispatcherId, status);
  }
}

