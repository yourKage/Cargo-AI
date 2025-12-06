import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrokerPost } from '../entities/broker-post.entity';
import { FilteredResult, FilterScore } from '../entities/filtered-result.entity';
import { DispatcherConfig } from '../entities/dispatcher-config.entity';
import { CreateBrokerPostDto } from '../dto/broker-post.dto';

@Injectable()
export class FilterAgentService {
  constructor(
    @InjectRepository(BrokerPost)
    private brokerPostRepository: Repository<BrokerPost>,
    @InjectRepository(FilteredResult)
    private filteredResultRepository: Repository<FilteredResult>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
  ) {}

  async processBrokerPost(
    postDto: CreateBrokerPostDto,
    dispatcherId: string,
  ): Promise<FilteredResult> {
    // Parse tripMiles from string if needed
    let tripMiles: number | undefined;
    if (postDto.tripMiles !== undefined && postDto.tripMiles !== null) {
      tripMiles = typeof postDto.tripMiles === 'string' 
        ? parseInt(postDto.tripMiles.replace(/,/g, ''), 10) 
        : postDto.tripMiles;
    }

    // Parse rate from string format like "$2,500" if needed
    let rate: number | undefined;
    if (postDto.rate !== undefined && postDto.rate !== null) {
      if (typeof postDto.rate === 'string') {
        // Remove $ and commas, then parse
        const cleaned = postDto.rate.replace(/[$,]/g, '');
        rate = parseFloat(cleaned);
      } else {
        rate = postDto.rate;
      }
    }

    // Save broker post
    const brokerPost = this.brokerPostRepository.create({
      ...postDto,
      tripMiles,
      rate,
    });
    await this.brokerPostRepository.save(brokerPost);

    // Get dispatcher config
    const config = await this.dispatcherConfigRepository.findOne({
      where: { dispatcherId },
    });

    if (!config) {
      throw new Error(`Dispatcher config not found for ${dispatcherId}`);
    }

    // Run filtering logic
    const filterResult = this.filterLoad(brokerPost, config);

    // Save filtered result
    const filteredResult = this.filteredResultRepository.create({
      dispatcherId,
      brokerPostId: brokerPost.id,
      score: filterResult.score,
      matchScore: filterResult.matchScore,
      rejectionReason: filterResult.rejectionReason,
      filterDetails: filterResult.details,
    });

    await this.filteredResultRepository.save(filteredResult);

    return filteredResult;
  }

  private filterLoad(
    post: BrokerPost,
    config: DispatcherConfig,
  ): {
    score: FilterScore;
    matchScore: number;
    rejectionReason?: string;
    details: Record<string, any>;
  } {
    const details: Record<string, any> = {};
    let matchScore = 100;
    const rejectionReasons: string[] = [];

    // Extract city and state from origin/destination (handle null)
    const originState = post.origin ? post.getOriginState() : null;
    const destState = post.destination ? post.getDestinationState() : null;
    const distance = post.getDistance();
    const offeredPrice = post.getOfferedPrice();

    // Check auto-reject list (using MC number or broker ID)
    const rejectId = post.mcNumber || post.brokerId;
    if (rejectId && config.autoRejectBrokerIds.includes(rejectId)) {
      return {
        score: FilterScore.RED,
        matchScore: 0,
        rejectionReason: 'Broker is in auto-reject list',
        details: { autoReject: true },
      };
    }

    // Check broker rating (if available)
    if (
      config.minBrokerRating &&
      post.brokerRating &&
      post.brokerRating < config.minBrokerRating
    ) {
      rejectionReasons.push(
        `Broker rating ${post.brokerRating} below minimum ${config.minBrokerRating}`,
      );
      matchScore -= 30;
      details.brokerRating = {
        actual: post.brokerRating,
        required: config.minBrokerRating,
        passed: false,
      };
    } else if (post.brokerRating) {
      details.brokerRating = { actual: post.brokerRating, passed: true };
    }

    // Check price per mile
    const pricePerMile = distance > 0 ? offeredPrice / distance : 0;
    if (config.minPricePerMile && pricePerMile < config.minPricePerMile) {
      rejectionReasons.push(
        `Price per mile $${pricePerMile.toFixed(2)} below minimum $${config.minPricePerMile}`,
      );
      matchScore -= 40;
      details.pricePerMile = {
        actual: pricePerMile,
        required: config.minPricePerMile,
        passed: false,
      };
    } else if (pricePerMile > 0) {
      details.pricePerMile = { actual: pricePerMile, passed: true };
      // Bonus for good pricing
      if (config.minPricePerMile && pricePerMile > config.minPricePerMile * 1.2) {
        matchScore += 10;
      }
    }

    // Check cargo type (map from truck type)
    const truckType = post.truck?.toLowerCase() || '';
    let cargoType = 'other';
    if (truckType.includes('van') && !truckType.includes('reefer')) {
      cargoType = 'dry_van';
    } else if (truckType.includes('reefer')) {
      cargoType = 'reefer';
    } else if (truckType.includes('flatbed')) {
      cargoType = 'flatbed';
    } else if (truckType.includes('step')) {
      cargoType = 'step_deck';
    } else if (truckType.includes('hotshot')) {
      cargoType = 'hotshot';
    }

    if (
      config.cargoTypePreferences.length > 0 &&
      !config.cargoTypePreferences.includes(cargoType)
    ) {
      matchScore -= 15;
      details.cargoType = {
        actual: cargoType,
        truckType: post.truck,
        preferred: config.cargoTypePreferences,
        passed: false,
      };
    } else {
      details.cargoType = { actual: cargoType, truckType: post.truck, passed: true };
    }

    // Check preferred states
    if (config.preferredStates.length > 0 && originState && destState) {
      const originMatch = config.preferredStates.includes(originState);
      const destMatch = config.preferredStates.includes(destState);
      if (!originMatch && !destMatch) {
        matchScore -= 10;
        details.statePreference = {
          origin: originState,
          destination: destState,
          preferred: config.preferredStates,
          passed: false,
        };
      } else {
        details.statePreference = {
          origin: originState,
          destination: destState,
          passed: true,
        };
        if (originMatch && destMatch) {
          matchScore += 5;
        }
      }
    }

    // Determine final score
    let score: FilterScore;
    if (rejectionReasons.length > 0 || matchScore < 50) {
      score = FilterScore.RED;
    } else if (matchScore >= 80) {
      score = FilterScore.GREEN;
    } else {
      score = FilterScore.YELLOW;
    }

    return {
      score,
      matchScore: Math.max(0, Math.min(100, matchScore)),
      rejectionReason:
        rejectionReasons.length > 0 ? rejectionReasons.join('; ') : undefined,
      details,
    };
  }

  async getTopLoads(
    dispatcherId: string,
    limit: number = 5,
  ): Promise<FilteredResult[]> {
    return this.filteredResultRepository.find({
      where: {
        dispatcherId,
        score: FilterScore.GREEN,
      },
      relations: ['brokerPost'],
      order: {
        matchScore: 'DESC',
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async getAllFilteredLoads(
    dispatcherId: string,
    score?: FilterScore,
  ): Promise<FilteredResult[]> {
    const where: any = { dispatcherId };
    if (score) {
      where.score = score;
    }

    return this.filteredResultRepository.find({
      where,
      relations: ['brokerPost'],
      order: {
        matchScore: 'DESC',
        createdAt: 'DESC',
      },
    });
  }
}

