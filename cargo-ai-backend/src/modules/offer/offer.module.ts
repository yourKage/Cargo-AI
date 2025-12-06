import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferLog } from '../../entities/offer-log.entity';
import { DispatcherConfig } from '../../entities/dispatcher-config.entity';
import { BrokerPost } from '../../entities/broker-post.entity';
import { FilteredResult } from '../../entities/filtered-result.entity';
import { OfferAgentService } from '../../services/offer-agent.service';
import { OfferController } from '../../controllers/offer.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OfferLog,
      DispatcherConfig,
      BrokerPost,
      FilteredResult,
    ]),
  ],
  controllers: [OfferController],
  providers: [OfferAgentService],
  exports: [OfferAgentService],
})
export class OfferModule {}

