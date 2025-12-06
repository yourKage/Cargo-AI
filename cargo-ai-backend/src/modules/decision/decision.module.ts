import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NegotiationSession } from '../../entities/negotiation-session.entity';
import { DispatcherConfig } from '../../entities/dispatcher-config.entity';
import { DecisionAgentService } from '../../services/decision-agent.service';
import { DecisionController } from '../../controllers/decision.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NegotiationSession, DispatcherConfig]),
    NotificationModule,
  ],
  controllers: [DecisionController],
  providers: [DecisionAgentService],
  exports: [DecisionAgentService],
})
export class DecisionModule {}

