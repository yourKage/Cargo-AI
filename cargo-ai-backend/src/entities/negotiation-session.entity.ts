import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Dispatcher } from './dispatcher.entity';
import { OfferLog } from './offer-log.entity';
import { NegotiationMessage } from './negotiation-message.entity';

export enum NegotiationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('negotiation_sessions')
export class NegotiationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispatcherId: string;

  @ManyToOne(() => Dispatcher, (dispatcher) => dispatcher.negotiationSessions)
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher: Dispatcher;

  @Column({ type: 'uuid', nullable: true })
  offerId: string;

  @OneToOne(() => OfferLog, (offer) => offer.negotiationSession)
  @JoinColumn({ name: 'offerId' })
  offer: OfferLog;

  @Column({
    type: 'enum',
    enum: NegotiationStatus,
    default: NegotiationStatus.PENDING,
  })
  status: NegotiationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  startingPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minimumThreshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalAgreedPrice: number;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidenceScore: number; // 0-100

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ default: false })
  requiresHumanFallback: boolean;

  @Column({ type: 'jsonb', nullable: true })
  priceHistory: Array<{ price: number; timestamp: Date; source: string }>;

  @OneToMany(() => NegotiationMessage, (message) => message.session)
  messages: NegotiationMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

