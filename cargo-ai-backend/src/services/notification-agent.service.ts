import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import * as nodemailer from 'nodemailer';
import { Dispatcher } from '../entities/dispatcher.entity';
import { FilteredResult, FilterScore } from '../entities/filtered-result.entity';
import { NotificationLog, NotificationType } from '../entities/notification-log.entity';
import {
  DispatcherConfig,
  NotificationChannel,
} from '../entities/dispatcher-config.entity';

@Injectable()
export class NotificationAgentService {
  private telegramBot: TelegramBot;
  private emailTransporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(Dispatcher)
    private dispatcherRepository: Repository<Dispatcher>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
    @InjectRepository(FilteredResult)
    private filteredResultRepository: Repository<FilteredResult>,
    private configService: ConfigService,
  ) {
    // Initialize Telegram bot
    const telegramToken = this.configService.get<string>('telegram.botToken');
    if (telegramToken) {
      this.telegramBot = new TelegramBot(telegramToken, { polling: false });
    }

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    });
  }

  async sendDailyTopLoads(dispatcherId: string): Promise<void> {
    const dispatcher = await this.dispatcherRepository.findOne({
      where: { id: dispatcherId },
      relations: ['config'],
    });

    if (!dispatcher || !dispatcher.config) {
      throw new Error(`Dispatcher or config not found: ${dispatcherId}`);
    }

    const config = dispatcher.config;
    const topLoads = await this.filteredResultRepository.find({
      where: {
        dispatcherId,
        score: FilterScore.GREEN,
      },
      relations: ['brokerPost'],
      order: {
        matchScore: 'DESC',
        createdAt: 'DESC',
      },
      take: 5,
    });

    if (topLoads.length === 0) {
      return; // No loads to notify about
    }

    const message = this.formatTopLoadsMessage(topLoads);
    const subject = `Daily Top ${topLoads.length} Loads - CargoAI`;

    // Send via configured channels
    for (const channel of config.notificationChannels) {
      try {
        if (channel === NotificationChannel.TELEGRAM && dispatcher.telegramChatId) {
          await this.sendTelegramMessage(dispatcher.telegramChatId, message);
        } else if (channel === NotificationChannel.EMAIL && dispatcher.email) {
          await this.sendEmail(dispatcher.email, subject, message);
        }

        // Log notification
        await this.notificationLogRepository.save({
          dispatcherId,
          type: NotificationType.DAILY_TOP_LOADS,
          channel,
          subject,
          message,
          isSent: true,
        });
      } catch (error) {
        // Log error
        await this.notificationLogRepository.save({
          dispatcherId,
          type: NotificationType.DAILY_TOP_LOADS,
          channel,
          subject,
          message,
          isSent: false,
          errorMessage: error.message,
        });
      }
    }
  }

  async sendRealTimeAlert(
    dispatcherId: string,
    filteredResult: FilteredResult,
  ): Promise<void> {
    const dispatcher = await this.dispatcherRepository.findOne({
      where: { id: dispatcherId },
      relations: ['config'],
    });

    if (!dispatcher || !dispatcher.config) {
      return;
    }

    const config = dispatcher.config;
    if (config.notificationFrequency !== 'real-time') {
      return; // Not configured for real-time
    }

    const message = this.formatLoadAlert(filteredResult);
    const post = filteredResult.brokerPost;
    const subject = `New Load Alert - ${post.origin} to ${post.destination}`;

    for (const channel of config.notificationChannels) {
      try {
        if (channel === NotificationChannel.TELEGRAM && dispatcher.telegramChatId) {
          await this.sendTelegramMessage(dispatcher.telegramChatId, message);
        } else if (channel === NotificationChannel.EMAIL && dispatcher.email) {
          await this.sendEmail(dispatcher.email, subject, message);
        }

        await this.notificationLogRepository.save({
          dispatcherId,
          type: NotificationType.REAL_TIME_ALERT,
          channel,
          subject,
          message,
          isSent: true,
          metadata: { filteredResultId: filteredResult.id },
        });
      } catch (error) {
        await this.notificationLogRepository.save({
          dispatcherId,
          type: NotificationType.REAL_TIME_ALERT,
          channel,
          subject,
          message,
          isSent: false,
          errorMessage: error.message,
        });
      }
    }
  }

  private formatTopLoadsMessage(loads: FilteredResult[]): string {
    let message = `🚚 *Top ${loads.length} Loads Today*\n\n`;

    loads.forEach((load, index) => {
      const post = load.brokerPost;
      const distance = post.getDistance();
      const rate = post.getOfferedPrice();
      const pricePerMile = distance > 0 ? (rate / distance).toFixed(2) : '0.00';

      message += `${index + 1}. *${post.origin} → ${post.destination}*\n`;
      message += `   💰 $${rate.toLocaleString()} ($${pricePerMile}/mile)\n`;
      message += `   📏 ${post.tripMiles} miles | ${post.truck || 'N/A'}\n`;
      message += `   🏢 ${post.company}\n`;
      message += `   ⭐ Match Score: ${load.matchScore.toString()}%\n\n`;
    });

    return message;
  }

  private formatLoadAlert(load: FilteredResult): string {
    const post = load.brokerPost;
    const distance = post.getDistance();
    const rate = post.getOfferedPrice();
    const pricePerMile = distance > 0 ? (rate / distance).toFixed(2) : '0.00';

    return `🚨 *New Load Alert*\n\n` +
      `📍 ${post.origin} → ${post.destination}\n` +
      `💰 $${rate.toLocaleString()} ($${pricePerMile}/mile)\n` +
      `📏 ${post.tripMiles} miles\n` +
      `🚚 ${post.truck || 'N/A'}\n` +
      `🏢 ${post.company}\n` +
      `⭐ Match Score: ${load.matchScore.toFixed(0)}%\n` +
      `\nView details in dashboard.`;
  }

  private async sendTelegramMessage(chatId: string, message: string): Promise<void> {
    if (!this.telegramBot) {
      throw new Error('Telegram bot not initialized');
    }
    await this.telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    await this.emailTransporter.sendMail({
      from: this.configService.get<string>('email.from'),
      to,
      subject,
      text: text.replace(/\*/g, ''), // Remove markdown for plain text email
      html: text.replace(/\n/g, '<br>').replace(/\*/g, '<b>').replace(/\*/g, '</b>'),
    });
  }

  async notifyDispatcher(dispatcherId: string): Promise<void> {
    const dispatcher = await this.dispatcherRepository.findOne({
      where: { id: dispatcherId },
      relations: ['config'],
    });

    if (!dispatcher || !dispatcher.config) {
      throw new Error(`Dispatcher or config not found: ${dispatcherId}`);
    }

    const config = dispatcher.config;

    if (config.notificationFrequency === 'daily') {
      await this.sendDailyTopLoads(dispatcherId);
    }
    // Weekly and real-time handled separately
  }
}

