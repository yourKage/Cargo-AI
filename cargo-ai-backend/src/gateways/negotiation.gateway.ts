import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NegotiationAgentService } from '../services/negotiation-agent.service';
import { DecisionAgentService } from '../services/decision-agent.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/negotiation',
})
export class NegotiationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private negotiationAgentService: NegotiationAgentService,
    private decisionAgentService: DecisionAgentService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('start-negotiation')
  async handleStartNegotiation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { dispatcherId: string; offerId: string },
  ) {
    try {
      const session = await this.negotiationAgentService.startNegotiation(
        data.dispatcherId,
        data.offerId,
      );

      client.join(`session:${session.id}`);
      client.emit('negotiation-started', { sessionId: session.id, session });

      // Send initial message
      const messages = await this.negotiationAgentService.getSessionStatus(
        session.id,
      );
      client.emit('message', {
        source: 'ai-agent',
        content: messages.messages[messages.messages.length - 1]?.content || '',
        sessionId: session.id,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('broker-message')
  async handleBrokerMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; message: string },
  ) {
    try {
      const result = await this.negotiationAgentService.processBrokerResponse(
        data.sessionId,
        data.message,
      );

      // Broadcast AI response to all clients in the session
      this.server.to(`session:${data.sessionId}`).emit('message', {
        source: 'ai-agent',
        content: result.response,
        sessionId: data.sessionId,
        shouldContinue: result.shouldContinue,
      });

      // If negotiation completed, evaluate it
      if (!result.shouldContinue) {
        const decision = await this.decisionAgentService.evaluateNegotiation(
          data.sessionId,
        );
        this.server.to(`session:${data.sessionId}`).emit('negotiation-complete', {
          sessionId: data.sessionId,
          decision,
        });
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('end-negotiation')
  async handleEndNegotiation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    try {
      const session = await this.negotiationAgentService.endNegotiation(
        data.sessionId,
      );
      client.emit('negotiation-ended', { sessionId: data.sessionId, session });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('get-status')
  async handleGetStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    try {
      const session = await this.negotiationAgentService.getSessionStatus(
        data.sessionId,
      );
      client.emit('status-update', { sessionId: data.sessionId, session });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}

