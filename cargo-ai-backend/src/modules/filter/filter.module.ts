import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrokerPost } from '../../entities/broker-post.entity';
import { FilteredResult } from '../../entities/filtered-result.entity';
import { DispatcherConfig } from '../../entities/dispatcher-config.entity';
import { FilterAgentService } from '../../services/filter-agent.service';
import { BrokerPostController, LoadsController } from '../../controllers/broker-post.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrokerPost, FilteredResult, DispatcherConfig]),
    NotificationModule,
  ],
  controllers: [BrokerPostController, LoadsController],
  providers: [FilterAgentService],
  exports: [FilterAgentService],
})
export class FilterModule {}

