import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispatcher } from '../entities/dispatcher.entity';
import { DispatcherConfig, NotificationFrequency, NotificationChannel, NegotiationAggressiveness, OfferMode } from '../entities/dispatcher-config.entity';
import { BrokerContact } from '../entities/broker-contact.entity';

@Injectable()
export class DataSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Dispatcher)
    private dispatcherRepository: Repository<Dispatcher>,
    @InjectRepository(DispatcherConfig)
    private dispatcherConfigRepository: Repository<DispatcherConfig>,
    @InjectRepository(BrokerContact)
    private brokerContactRepository: Repository<BrokerContact>,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultData();
  }

  async initializeDefaultData(): Promise<void> {
    console.log('🔍 Checking for default dispatcher and broker...');

    // Check and create dispatcher
    let dispatcher = await this.dispatcherRepository.findOne({
      where: { email: 'dispatcher@cargoai.com' },
    });

    if (!dispatcher) {
      dispatcher = this.dispatcherRepository.create({
        email: 'dispatcher@cargoai.com',
        name: 'John Dispatcher',
        phone: '+1234567890',
        telegramChatId: '123456789',
        isActive: true,
      });
      dispatcher = await this.dispatcherRepository.save(dispatcher);
      console.log('✅ Created default dispatcher:', dispatcher.id);
    } else {
      console.log('✅ Default dispatcher already exists:', dispatcher.id);
    }

    // Check and create dispatcher config
    let config = await this.dispatcherConfigRepository.findOne({
      where: { dispatcherId: dispatcher.id },
    });

    if (!config) {
      config = this.dispatcherConfigRepository.create({
        dispatcherId: dispatcher.id,
        minPricePerMile: 2.0,
        startingAskingPrice: 2000,
        minAcceptableThreshold: 1500,
        pickupRadius: 50,
        preferredStates: ['CA', 'TX', 'NY', 'FL'],
        cargoTypePreferences: ['dry_van', 'reefer'],
        maxWeight: 45000,
        deadheadRange: 100,
        minBrokerRating: 4.0,
        autoRejectBrokerIds: [],
        notificationFrequency: NotificationFrequency.DAILY,
        notificationChannels: [NotificationChannel.EMAIL, NotificationChannel.TELEGRAM],
        negotiationAggressiveness: NegotiationAggressiveness.NORMAL,
        maxNegotiationAttempts: 3,
        forbiddenPhrases: [],
        extraInfoToRequest: ['commodity', 'FCFS/APPT'],
        offerMode: OfferMode.APPROVAL_REQUIRED,
      });
      config = await this.dispatcherConfigRepository.save(config);
      console.log('✅ Created default dispatcher config');
    } else {
      console.log('✅ Default dispatcher config already exists');
    }

    // Check and create broker
    let broker = await this.brokerContactRepository.findOne({
      where: { brokerId: 'broker-default' },
    });

    if (!broker) {
      broker = this.brokerContactRepository.create({
        brokerId: 'broker-default',
        brokerName: 'Default Broker',
        email: 'broker@example.com',
        phone: '+1987654321',
        telegram: '@defaultbroker',
        rating: 4.5,
      });
      broker = await this.brokerContactRepository.save(broker);
      console.log('✅ Created default broker:', broker.id);
    } else {
      console.log('✅ Default broker already exists:', broker.id);
    }

    console.log('✅ Default data initialization complete');
  }

  async getOrCreateDispatcher(dispatcherId?: string): Promise<{ dispatcher: Dispatcher; config: DispatcherConfig }> {
    let dispatcher: Dispatcher | null = null;

    // If dispatcherId provided, try to find it
    if (dispatcherId) {
      dispatcher = await this.dispatcherRepository.findOne({
        where: { id: dispatcherId },
      });
      if (dispatcher) {
        console.log('✅ Using provided dispatcher:', dispatcher.id);
      } else {
        console.log('⚠️ Provided dispatcher ID not found, creating new one');
      }
    }

    // If not found or not provided, check for default dispatcher
    if (!dispatcher) {
      dispatcher = await this.dispatcherRepository.findOne({
        where: { email: 'dispatcher@cargoai.com' },
      });
    }

    if (!dispatcher) {
      // Create dispatcher if it doesn't exist
      dispatcher = this.dispatcherRepository.create({
        email: 'dispatcher@cargoai.com',
        name: 'John Dispatcher',
        phone: '+1234567890',
        telegramChatId: '123456789',
        isActive: true,
      });
      dispatcher = await this.dispatcherRepository.save(dispatcher);
      console.log('✅ Created new dispatcher:', dispatcher.id);
    } else if (!dispatcherId) {
      console.log('✅ Using existing dispatcher:', dispatcher.id);
    }

    // Check if config exists
    let config = await this.dispatcherConfigRepository.findOne({
      where: { dispatcherId: dispatcher.id },
    });

    if (!config) {
      // Create config if it doesn't exist
      config = this.dispatcherConfigRepository.create({
        dispatcherId: dispatcher.id,
        minPricePerMile: 2.0,
        startingAskingPrice: 2000,
        minAcceptableThreshold: 1500,
        pickupRadius: 50,
        preferredStates: ['CA', 'TX', 'NY', 'FL'],
        cargoTypePreferences: ['dry_van', 'reefer'],
        maxWeight: 45000,
        deadheadRange: 100,
        minBrokerRating: 4.0,
        autoRejectBrokerIds: [],
        notificationFrequency: NotificationFrequency.DAILY,
        notificationChannels: [NotificationChannel.EMAIL, NotificationChannel.TELEGRAM],
        negotiationAggressiveness: NegotiationAggressiveness.NORMAL,
        maxNegotiationAttempts: 3,
        forbiddenPhrases: [],
        extraInfoToRequest: ['commodity', 'FCFS/APPT'],
        offerMode: OfferMode.APPROVAL_REQUIRED,
      });
      config = await this.dispatcherConfigRepository.save(config);
      console.log('✅ Created new dispatcher config');
    } else {
      console.log('✅ Using existing dispatcher config');
    }

    return { dispatcher, config };
  }
}

