import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispatcher } from '../../entities/dispatcher.entity';
import { DispatcherConfig } from '../../entities/dispatcher-config.entity';
import { DispatcherController } from '../../controllers/dispatcher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dispatcher, DispatcherConfig])],
  controllers: [DispatcherController],
  exports: [TypeOrmModule],
})
export class DispatcherModule {}

