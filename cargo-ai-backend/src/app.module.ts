import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { DispatcherModule } from './modules/dispatcher/dispatcher.module';
import { FilterModule } from './modules/filter/filter.module';
import { NotificationModule } from './modules/notification/notification.module';
import { OfferModule } from './modules/offer/offer.module';
import { NegotiationModule } from './modules/negotiation/negotiation.module';
import { DecisionModule } from './modules/decision/decision.module';
import { FakeDataModule } from './modules/fake-data/fake-data.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    DispatcherModule,
    FilterModule,
    NotificationModule,
    OfferModule,
    NegotiationModule,
    DecisionModule,
    FakeDataModule,
  ],
})
export class AppModule {}
