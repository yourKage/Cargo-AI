import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NegotiationSession } from '../../entities/negotiation-session.entity';
import { NegotiationMessage } from '../../entities/negotiation-message.entity';
import { DispatcherConfig } from '../../entities/dispatcher-config.entity';
import { OfferLog } from '../../entities/offer-log.entity';
import { NegotiationAgentService } from '../../services/negotiation-agent.service';
import { NegotiationController } from '../../controllers/negotiation.controller';
import { NegotiationGateway } from '../../gateways/negotiation.gateway';
import { DecisionModule } from '../decision/decision.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NegotiationSession,
      NegotiationMessage,
      DispatcherConfig,
      OfferLog,
    ]),
    ConfigModule,
    DecisionModule,
  ],
  controllers: [NegotiationController],
  providers: [NegotiationAgentService, NegotiationGateway],
  exports: [NegotiationAgentService],
})
export class NegotiationModule {}

