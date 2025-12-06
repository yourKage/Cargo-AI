import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NegotiationSession, NegotiationStatus } from '../entities/negotiation-session.entity';
import { NotificationAgentService } from './notification-agent.service';
import { DispatcherConfig } from '../entities/dispatcher-config.entity';

export interface DecisionResult {
  success: boolean;
  finalPrice?: number;
  startingPrice: number;
  improvement?: number;
  improvementPercentage?: number;
  requiresHumanFallback: boolean;
  message: string;
}

@Injectable()
export class DecisionAgentService {
  constructor(
    @InjectRepository(NegotiationSession)
    private negotiationSessionRepository: Repository<NegotiationSession>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
    private notificationAgentService: NotificationAgentService,
  ) {}

  async evaluateNegotiation(sessionId: string): Promise<DecisionResult> {
    const session = await this.negotiationSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Negotiation session not found: ${sessionId}`);
    }

    if (session.status === NegotiationStatus.COMPLETED && session.finalAgreedPrice) {
      // Calculate improvement
      const improvement = session.finalAgreedPrice - session.startingPrice;
      const improvementPercentage = (improvement / session.startingPrice) * 100;

      return {
        success: true,
        finalPrice: session.finalAgreedPrice,
        startingPrice: session.startingPrice,
        improvement,
        improvementPercentage,
        requiresHumanFallback: false,
        message: `Negotiation completed successfully. Final price: $${session.finalAgreedPrice.toLocaleString()} (${improvementPercentage >= 0 ? '+' : ''}${improvementPercentage.toFixed(2)}% from starting price)`,
      };
    }

    if (session.status === NegotiationStatus.FAILED) {
      // Check if we need human fallback
      const config = await this.dispatcherConfigRepository.findOne({
        where: { dispatcherId: session.dispatcherId },
      });

      return {
        success: false,
        startingPrice: session.startingPrice,
        requiresHumanFallback: true,
        message: `Negotiation failed: ${session.failureReason || 'Unknown reason'}. Human intervention required.`,
      };
    }

    // Still in progress
    return {
      success: false,
      startingPrice: session.startingPrice,
      requiresHumanFallback: false,
      message: 'Negotiation is still in progress',
    };
  }

  async handleBrokerRejection(
    sessionId: string,
    rejectionReason?: string,
  ): Promise<DecisionResult> {
    const session = await this.negotiationSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Negotiation session not found: ${sessionId}`);
    }

    session.status = NegotiationStatus.FAILED;
    session.failureReason = rejectionReason || 'Broker rejected the offer';
    session.requiresHumanFallback = true;
    await this.negotiationSessionRepository.save(session);

    // Notify dispatcher
    await this.notifyDispatcherOfRejection(session.dispatcherId, session, rejectionReason);

    return {
      success: false,
      startingPrice: session.startingPrice,
      requiresHumanFallback: true,
      message: `Broker cannot accept the required price. ${rejectionReason || ''}`,
    };
  }

  async requestHumanCall(sessionId: string): Promise<void> {
    const session = await this.negotiationSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['offer', 'offer.brokerPost'],
    });

    if (!session) {
      throw new Error(`Negotiation session not found: ${sessionId}`);
    }

    // Send message to broker that dispatcher will call
    // TODO: Integrate with communication service
    const message = `Thank you for your time. Our dispatcher will call you back shortly to discuss this further.`;

    // Log the request
    session.requiresHumanFallback = true;
    await this.negotiationSessionRepository.save(session);

    // Notify dispatcher
    await this.notifyDispatcherOfHumanCallRequest(session.dispatcherId, session);
  }

  private async notifyDispatcherOfRejection(
    dispatcherId: string,
    session: NegotiationSession,
    reason?: string,
  ): Promise<void> {
    // In a real implementation, this would send a notification
    // For now, we'll use the notification service
    const message = `❌ Negotiation Failed\n\n` +
      `Session ID: ${session.id}\n` +
      `Starting Price: $${session.startingPrice.toLocaleString()}\n` +
      `Reason: ${reason || 'Broker rejected the offer'}\n\n` +
      `Options:\n` +
      `1. Retry negotiation\n` +
      `2. Trigger human-to-human call`;

    // This would be sent via the notification service
    console.log(`Notifying dispatcher ${dispatcherId}: ${message}`);
  }

  private async notifyDispatcherOfHumanCallRequest(
    dispatcherId: string,
    session: NegotiationSession,
  ): Promise<void> {
    const message = `📞 Human Call Requested\n\n` +
      `Session ID: ${session.id}\n` +
      `Broker contact information available in dashboard\n` +
      `Please call to continue negotiation`;

    console.log(`Notifying dispatcher ${dispatcherId}: ${message}`);
  }

  async retryNegotiation(sessionId: string): Promise<NegotiationSession> {
    const session = await this.negotiationSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Negotiation session not found: ${sessionId}`);
    }

    // Reset session for retry
    session.status = NegotiationStatus.IN_PROGRESS;
    session.attemptCount = 0;
    session.failureReason = "";
    session.requiresHumanFallback = false;

    await this.negotiationSessionRepository.save(session);

    return session;
  }
}

