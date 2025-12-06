import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Dispatcher,
  DispatcherConfig,
  BrokerPost,
  FilteredResult,
  NotificationLog,
  OfferLog,
  NegotiationSession,
  NegotiationMessage,
  BrokerContact,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'atabek'),
        password: configService.get('DB_PASSWORD', 'victus'),
        database: configService.get('DB_NAME', 'travels_db'),
        entities: [
          Dispatcher,
          DispatcherConfig,
          BrokerPost,
          FilteredResult,
          NotificationLog,
          OfferLog,
          NegotiationSession,
          NegotiationMessage,
          BrokerContact,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Dispatcher,
      DispatcherConfig,
      BrokerPost,
      FilteredResult,
      NotificationLog,
      OfferLog,
      NegotiationSession,
      NegotiationMessage,
      BrokerContact,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

