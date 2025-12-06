import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Dispatcher } from './dispatcher.entity';
import { BrokerPost } from './broker-post.entity';
import { NegotiationSession } from './negotiation-session.entity';

export enum OfferStatus {
  PENDING_APPROVAL = 'pending-approval',
  SENT = 'sent',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

@Entity('offer_logs')
export class OfferLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispatcherId: string;

  @ManyToOne(() => Dispatcher, (dispatcher) => dispatcher.offers)
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher: Dispatcher;

  @Column({ type: 'uuid' })
  brokerPostId: string;

  @ManyToOne(() => BrokerPost, (post) => post.offers)
  @JoinColumn({ name: 'brokerPostId' })
  brokerPost: BrokerPost;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING_APPROVAL,
  })
  status: OfferStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  initialPrice: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  brokerResponse: string;

  @Column({ type: 'text', nullable: true })
  channel: string; // email, telegram, etc.

  @OneToOne(() => NegotiationSession, (session) => session.offer)
  negotiationSession: NegotiationSession;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

