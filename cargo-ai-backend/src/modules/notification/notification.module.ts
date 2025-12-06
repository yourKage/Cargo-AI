import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NotificationLog } from '../../entities/notification-log.entity';
import { Dispatcher } from '../../entities/dispatcher.entity';
import { DispatcherConfig } from '../../entities/dispatcher-config.entity';
import { FilteredResult } from '../../entities/filtered-result.entity';
import { NotificationAgentService } from '../../services/notification-agent.service';
import { NotificationController } from '../../controllers/notification.controller';
import { NotificationScheduler } from '../../schedulers/notification.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationLog,
      Dispatcher,
      DispatcherConfig,
      FilteredResult,
    ]),
    ConfigModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationAgentService, NotificationScheduler],
  exports: [NotificationAgentService],
})
export class NotificationModule {}

