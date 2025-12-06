import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferLog, OfferStatus } from '../entities/offer-log.entity';
import { DispatcherConfig, OfferMode } from '../entities/dispatcher-config.entity';
import { BrokerPost } from '../entities/broker-post.entity';
import { FilteredResult } from '../entities/filtered-result.entity';

@Injectable()
export class OfferAgentService {
  constructor(
    @InjectRepository(OfferLog)
    private offerLogRepository: Repository<OfferLog>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
    @InjectRepository(BrokerPost)
    private brokerPostRepository: Repository<BrokerPost>,
    @InjectRepository(FilteredResult)
    private filteredResultRepository: Repository<FilteredResult>,
  ) {}

  async createOffer(
    dispatcherId: string,
    brokerPostId: string,
    initialPrice: number,
  ): Promise<OfferLog> {
    const config = await this.dispatcherConfigRepository.findOne({
      where: { dispatcherId },
    });

    if (!config) {
      throw new Error(`Dispatcher config not found: ${dispatcherId}`);
    }

    const brokerPost = await this.brokerPostRepository.findOne({
      where: { id: brokerPostId },
    });

    if (!brokerPost) {
      throw new Error(`Broker post not found: ${brokerPostId}`);
    }

    const message = this.generateOfferMessage(brokerPost, initialPrice, config);

    const offer = this.offerLogRepository.create({
      dispatcherId,
      brokerPostId,
      initialPrice,
      message,
      status:
        config.offerMode === OfferMode.AUTO_SEND
          ? OfferStatus.SENT
          : OfferStatus.PENDING_APPROVAL,
      channel: brokerPost.email ? 'email' : 'telegram',
    });

    await this.offerLogRepository.save(offer);

    // Auto-send if configured
    if (config.offerMode === OfferMode.AUTO_SEND) {
      await this.sendOffer(offer.id);
    }

    return offer;
  }

  async approveOffer(offerId: string): Promise<OfferLog> {
    const offer = await this.offerLogRepository.findOne({
      where: { id: offerId },
      relations: ['brokerPost'],
    });

    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    if (offer.status !== OfferStatus.PENDING_APPROVAL) {
      throw new Error(`Offer is not pending approval`);
    }

    offer.status = OfferStatus.SENT;
    await this.offerLogRepository.save(offer);

    await this.sendOffer(offerId);

    return offer;
  }

  async sendOffer(offerId: string): Promise<void> {
    const offer = await this.offerLogRepository.findOne({
      where: { id: offerId },
      relations: ['brokerPost'],
    });

    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    // In a real implementation, this would send via email/Telegram
    // For now, we'll just mark it as sent and log it
    // TODO: Integrate with email/Telegram services

    offer.status = OfferStatus.SENT;
    await this.offerLogRepository.save(offer);
  }

  async rejectOffer(offerId: string): Promise<OfferLog> {
    const offer = await this.offerLogRepository.findOne({
      where: { id: offerId },
    });

    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    offer.status = OfferStatus.REJECTED;
    await this.offerLogRepository.save(offer);

    return offer;
  }

  private generateOfferMessage(
    post: BrokerPost,
    price: number,
    config: DispatcherConfig,
  ): string {
    const distance = post.getDistance();
    const pricePerMile = distance > 0 ? (price / distance).toFixed(2) : '0.00';

    let message = `Hello,\n\n`;
    message += `We are interested in taking this load:\n\n`;
    message += `Route: ${post.origin} → ${post.destination}\n`;
    message += `Trip Miles: ${post.tripMiles} miles\n`;
    message += `Total Miles: ${post.totalMiles} miles\n`;
    message += `Truck Type: ${post.truck || 'N/A'}\n`;
    message += `Company: ${post.company}\n`;
    if (post.commodity && post.commodity !== '–') {
      message += `Commodity: ${post.commodity}\n`;
    }
    message += `\nOur initial offer: $${price.toLocaleString()} ($${pricePerMile}/mile)\n\n`;
    message += `Please let us know if this works for you.\n\n`;
    message += `Best regards,\nCargoAI Agent`;

    return message;
  }

  async getOffers(dispatcherId: string, status?: OfferStatus): Promise<OfferLog[]> {
    const where: any = { dispatcherId };
    if (status) {
      where.status = status;
    }

    return this.offerLogRepository.find({
      where,
      relations: ['brokerPost'],
      order: { createdAt: 'DESC' },
    });
  }
}

