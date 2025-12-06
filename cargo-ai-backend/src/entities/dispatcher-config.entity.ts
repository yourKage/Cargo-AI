import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Dispatcher } from './dispatcher.entity';

export enum NotificationFrequency {
  REAL_TIME = 'real-time',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export enum NotificationChannel {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
}

export enum NegotiationAggressiveness {
  AGGRESSIVE = 'aggressive',
  NORMAL = 'normal',
  SOFT = 'soft',
}

export enum OfferMode {
  AUTO_SEND = 'auto-send',
  APPROVAL_REQUIRED = 'approval-required',
}

@Entity('dispatcher_config')
export class DispatcherConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  dispatcherId: string;

  @OneToOne(() => Dispatcher, (dispatcher) => dispatcher.config)
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher: Dispatcher;

  // Load Filter Settings
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minPricePerMile: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  startingAskingPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minAcceptableThreshold: number;

  @Column({ type: 'int', nullable: true })
  pickupRadius: number; // in miles

  @Column({ type: 'text', array: true, default: [] })
  preferredStates: string[];

  @Column({ type: 'text', array: true, default: [] })
  cargoTypePreferences: string[]; // reefer, dry_van, flatbed, etc.

  @Column({ type: 'int', nullable: true })
  maxWeight: number; // in lbs

  @Column({ type: 'int', nullable: true })
  deadheadRange: number; // in miles

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  minBrokerRating: number; // 0-5 scale

  @Column({ type: 'text', array: true, default: [] })
  autoRejectBrokerIds: string[];

  // Notification Settings
  @Column({
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.DAILY,
  })
  notificationFrequency: NotificationFrequency;

  @Column({
    type: 'text',
    array: true,
    default: [NotificationChannel.EMAIL],
  })
  notificationChannels: NotificationChannel[];

  // Negotiation Settings
  @Column({
    type: 'enum',
    enum: NegotiationAggressiveness,
    default: NegotiationAggressiveness.NORMAL,
  })
  negotiationAggressiveness: NegotiationAggressiveness;

  @Column({ type: 'int', default: 3 })
  maxNegotiationAttempts: number;

  @Column({ type: 'text', array: true, default: [] })
  forbiddenPhrases: string[];

  @Column({ type: 'text', array: true, default: [] })
  extraInfoToRequest: string[]; // commodity, FCFS/APPT, dimensions, etc.

  // Offer Settings
  @Column({
    type: 'enum',
    enum: OfferMode,
    default: OfferMode.APPROVAL_REQUIRED,
  })
  offerMode: OfferMode;
}

