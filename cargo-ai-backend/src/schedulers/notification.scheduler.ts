import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispatcher } from '../entities/dispatcher.entity';
import { DispatcherConfig, NotificationFrequency } from '../entities/dispatcher-config.entity';
import { NotificationAgentService } from '../services/notification-agent.service';

@Injectable()
export class NotificationScheduler {
  constructor(
    @InjectRepository(Dispatcher)
    private dispatcherRepository: Repository<Dispatcher>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
    private notificationAgentService: NotificationAgentService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyNotifications() {
    const dispatchers = await this.dispatcherRepository.find({
      where: { isActive: true },
      relations: ['config'],
    });

    for (const dispatcher of dispatchers) {
      if (
        dispatcher.config &&
        dispatcher.config.notificationFrequency === NotificationFrequency.DAILY
      ) {
        try {
          await this.notificationAgentService.sendDailyTopLoads(dispatcher.id);
        } catch (error) {
          console.error(
            `Failed to send daily notification to dispatcher ${dispatcher.id}:`,
            error,
          );
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyNotifications() {
    const dispatchers = await this.dispatcherRepository.find({
      where: { isActive: true },
      relations: ['config'],
    });

    for (const dispatcher of dispatchers) {
      if (
        dispatcher.config &&
        dispatcher.config.notificationFrequency === NotificationFrequency.WEEKLY
      ) {
        try {
          await this.notificationAgentService.sendDailyTopLoads(dispatcher.id);
        } catch (error) {
          console.error(
            `Failed to send weekly notification to dispatcher ${dispatcher.id}:`,
            error,
          );
        }
      }
    }
  }
}

