import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DispatcherConfig } from './dispatcher-config.entity';
import { FilteredResult } from './filtered-result.entity';
import { NotificationLog } from './notification-log.entity';
import { NegotiationSession } from './negotiation-session.entity';
import { OfferLog } from './offer-log.entity';

@Entity('dispatchers')
export class Dispatcher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  telegramChatId: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => DispatcherConfig, (config) => config.dispatcher)
  config: DispatcherConfig;

  @OneToMany(() => FilteredResult, (result) => result.dispatcher)
  filteredResults: FilteredResult[];

  @OneToMany(() => NotificationLog, (log) => log.dispatcher)
  notifications: NotificationLog[];

  @OneToMany(() => NegotiationSession, (session) => session.dispatcher)
  negotiationSessions: NegotiationSession[];

  @OneToMany(() => OfferLog, (offer) => offer.dispatcher)
  offers: OfferLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

