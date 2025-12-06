import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  NegotiationSession,
  NegotiationStatus,
} from '../entities/negotiation-session.entity';
import { NegotiationMessage, MessageSource } from '../entities/negotiation-message.entity';
import { DispatcherConfig, NegotiationAggressiveness } from '../entities/dispatcher-config.entity';
import { OfferLog } from '../entities/offer-log.entity';

@Injectable()
export class NegotiationAgentService {
  private gemini: GoogleGenerativeAI;
  private model: any;

  constructor(
    @InjectRepository(NegotiationSession)
    private negotiationSessionRepository: Repository<NegotiationSession>,
    @InjectRepository(NegotiationMessage)
    private negotiationMessageRepository: Repository<NegotiationMessage>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
    @InjectRepository(OfferLog)
    private offerLogRepository: Repository<OfferLog>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (apiKey) {
      this.gemini = new GoogleGenerativeAI(apiKey);
      this.model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  async startNegotiation(
    dispatcherId: string,
    offerId: string,
  ): Promise<NegotiationSession> {
    const offer = await this.offerLogRepository.findOne({
      where: { id: offerId },
      relations: ['brokerPost'],
    });

    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    const config = await this.dispatcherConfigRepository.findOne({
      where: { dispatcherId },
    });

    if (!config) {
      throw new Error(`Dispatcher config not found: ${dispatcherId}`);
    }

    const session = this.negotiationSessionRepository.create({
      dispatcherId,
      offerId,
      startingPrice: offer.initialPrice,
      minimumThreshold: config.minAcceptableThreshold || offer.initialPrice * 0.9,
      status: NegotiationStatus.IN_PROGRESS,
      priceHistory: [
        {
          price: offer.initialPrice,
          timestamp: new Date(),
          source: 'initial',
        },
      ],
    });

    await this.negotiationSessionRepository.save(session);

    // Generate initial negotiation message
    const initialMessage = this.generateInitialNegotiationMessage(
      offer,
      config,
    );

    await this.negotiationMessageRepository.save({
      session: session,
      source: MessageSource.AI_AGENT,
      content: initialMessage,
      mentionedPrice: offer.initialPrice,
    });

    return session;
  }

  async processBrokerResponse(
    sessionId: string,
    brokerMessage: string,
  ): Promise<{ response: string; shouldContinue: boolean }> {
    const session = await this.negotiationSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['offer', 'messages'],
    });

    if (!session) {
      throw new Error(`Negotiation session not found: ${sessionId}`);
    }

    if (session.status !== NegotiationStatus.IN_PROGRESS) {
      throw new Error(`Negotiation session is not in progress`);
    }

    // Save broker message
    const extractedPrice = this.extractPriceFromMessage(brokerMessage);
    await this.negotiationMessageRepository.save({
      session: { id: sessionId } as NegotiationSession,
      source: MessageSource.BROKER,
      content: brokerMessage,
      mentionedPrice: extractedPrice ?? undefined,
    });

    // Update price history if price mentioned
    if (extractedPrice) {
      session.priceHistory.push({
        price: extractedPrice,
        timestamp: new Date(),
        source: 'broker',
      });
      await this.negotiationSessionRepository.save(session);
    }

    // Check if we've exceeded max attempts
    session.attemptCount += 1;
    const config = await this.dispatcherConfigRepository.findOne({
      where: { dispatcherId: session.dispatcherId },
    });

    if (session.attemptCount >= (config?.maxNegotiationAttempts || 3)) {
      session.status = NegotiationStatus.FAILED;
      session.failureReason = 'Maximum negotiation attempts reached';
      await this.negotiationSessionRepository.save(session);

      return {
        response: 'We have reached our maximum negotiation attempts. Please contact our dispatcher directly.',
        shouldContinue: false,
      };
    }

    // Generate AI response using OpenAI
    const aiResponse = await this.generateNegotiationResponse(
      session,
      brokerMessage,
      config || ({} as DispatcherConfig),
    );

    // Check if price is acceptable
    const finalPrice = extractedPrice || session.finalAgreedPrice || session.startingPrice;
    const isAcceptable = finalPrice >= session.minimumThreshold;

    if (isAcceptable && extractedPrice) {
      // Accept the offer
      session.status = NegotiationStatus.COMPLETED;
      session.finalAgreedPrice = extractedPrice;
      await this.negotiationSessionRepository.save(session);

      await this.negotiationMessageRepository.save({
        session: { id: sessionId } as NegotiationSession,
        source: MessageSource.AI_AGENT,
        content: aiResponse,
        mentionedPrice: extractedPrice ?? undefined,
      });

      return {
        response: aiResponse,
        shouldContinue: false,
      };
    }

    // Continue negotiation
    const aiMentionedPrice = this.extractPriceFromMessage(aiResponse);
    await this.negotiationMessageRepository.save({
      session: { id: sessionId } as NegotiationSession,
      source: MessageSource.AI_AGENT,
      content: aiResponse,
      mentionedPrice: aiMentionedPrice ?? undefined,
    });

    await this.negotiationSessionRepository.save(session);

    return {
      response: aiResponse,
      shouldContinue: true,
    };
  }

  private async generateNegotiationResponse(
    session: NegotiationSession,
    brokerMessage: string,
    config: DispatcherConfig,
  ): Promise<string> {
    if (!this.model) {
      // Fallback to rule-based response if Gemini not configured
      return this.generateRuleBasedResponse(session, brokerMessage, config);
    }

    const systemPrompt = this.buildNegotiationSystemPrompt(session, config);
    const conversationHistory = await this.buildConversationHistory(session);

    try {
      // Build conversation context for Gemini
      let prompt = systemPrompt + '\n\n';
      
      // Add conversation history
      for (const msg of conversationHistory) {
        prompt += `${msg.role === 'user' ? 'Broker' : 'You'}: ${msg.content}\n`;
      }
      
      // Add current broker message
      prompt += `Broker: ${brokerMessage}\n`;
      prompt += 'You: ';

      const result = await this.model.generateContent(prompt, {
        temperature: config.negotiationAggressiveness === NegotiationAggressiveness.AGGRESSIVE ? 0.7 : 0.5,
        maxOutputTokens: 200,
      });

      const response = result.response;
      const text = response.text();
      
      return text || this.generateRuleBasedResponse(session, brokerMessage, config);
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.generateRuleBasedResponse(session, brokerMessage, config);
    }
  }

  private buildNegotiationSystemPrompt(
    session: NegotiationSession,
    config: DispatcherConfig,
  ): string {
    let prompt = `You are a professional freight negotiation agent. `;
    prompt += `Starting price: $${session.startingPrice.toLocaleString()}. `;
    prompt += `Minimum acceptable price: $${session.minimumThreshold.toLocaleString()}. `;
    prompt += `You cannot go below the minimum threshold. `;
    prompt += `Negotiation style: ${config.negotiationAggressiveness}. `;
    prompt += `Attempt ${session.attemptCount} of ${config.maxNegotiationAttempts}. `;
    prompt += `Be professional, concise, and aim to maximize the price while staying within acceptable range. `;
    prompt += `If the broker's offer is below minimum, politely decline and suggest they contact the dispatcher directly.`;

    return prompt;
  }

  private async buildConversationHistory(
    session: NegotiationSession,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const messages = await this.negotiationMessageRepository.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
    });

    return messages.map((msg) => ({
      role: msg.source === MessageSource.BROKER ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  private generateRuleBasedResponse(
    session: NegotiationSession,
    brokerMessage: string,
    config: DispatcherConfig,
  ): string {
    const brokerPrice = this.extractPriceFromMessage(brokerMessage);
    const lastPrice = session.priceHistory[session.priceHistory.length - 1]?.price || session.startingPrice;

    if (brokerPrice) {
      if (brokerPrice >= session.minimumThreshold) {
        return `Thank you! We accept your offer of $${brokerPrice.toLocaleString()}. Let's proceed with the details.`;
      } else {
        const counterOffer = Math.max(
          session.minimumThreshold,
          lastPrice * 0.95, // 5% reduction
        );
        return `We appreciate your offer. However, we need at least $${counterOffer.toLocaleString()} to make this work. Can we meet at $${counterOffer.toLocaleString()}?`;
      }
    }

    // Generic response based on aggressiveness
    const counterOffer = Math.max(
      session.minimumThreshold,
      lastPrice * (config.negotiationAggressiveness === NegotiationAggressiveness.AGGRESSIVE ? 0.98 : 0.95),
    );

    return `We understand. Our best offer is $${counterOffer.toLocaleString()}. This is our final position.`;
  }

  private extractPriceFromMessage(message: string): number | null {
    const priceRegex = /\$?([\d,]+\.?\d*)/g;
    const matches = message.match(priceRegex);
    if (matches && matches.length > 0) {
      const price = parseFloat(matches[0].replace(/[$,]/g, ''));
      return isNaN(price) ? null : price;
    }
    return null;
  }

  private generateInitialNegotiationMessage(
    offer: OfferLog,
    config: DispatcherConfig,
  ): string {
    const post = offer.brokerPost;
    return `Hello, we're interested in your load from ${post.origin} to ${post.destination}. ` +
      `Our initial offer is $${offer.initialPrice.toLocaleString()}. ` +
      `We're ready to discuss terms and finalize details. What do you think?`;
  }

  async endNegotiation(sessionId: string): Promise<NegotiationSession> {
    const session = await this.negotiationSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Negotiation session not found: ${sessionId}`);
    }

    if (session.status === NegotiationStatus.IN_PROGRESS) {
      session.status = NegotiationStatus.CANCELLED;
      await this.negotiationSessionRepository.save(session);
    }

    return session;
  }

  async getSessionStatus(sessionId: string): Promise<NegotiationSession> {
    const session = await this.negotiationSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['messages', 'offer'],
    });

    if (!session) {
      throw new Error(`Negotiation session not found: ${sessionId}`);
    }

    return session;
  }
}

