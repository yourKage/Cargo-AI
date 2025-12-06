import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrokerPost } from '../../entities/broker-post.entity';
import { FakeDataGeneratorService } from '../../services/fake-data-generator.service';
import { ImportController } from '../../controllers/fake-data.controller';
import { ApiDiscoveryController } from '../../controllers/api-discovery.controller';
import { DataSeederService } from '../../services/data-seeder.service';
import { FilterModule } from '../filter/filter.module';
import { DispatcherConfig } from '../../entities/dispatcher-config.entity';
import { FilteredResult } from '../../entities/filtered-result.entity';
import { Dispatcher } from '../../entities/dispatcher.entity';
import { BrokerContact } from '../../entities/broker-contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrokerPost, DispatcherConfig, FilteredResult, Dispatcher, BrokerContact]),
    FilterModule,
  ],
  controllers: [ImportController, ApiDiscoveryController],
  providers: [FakeDataGeneratorService, DataSeederService],
  exports: [FakeDataGeneratorService],
})
export class FakeDataModule {}

