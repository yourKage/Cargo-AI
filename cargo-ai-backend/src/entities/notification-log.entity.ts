import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Dispatcher } from './dispatcher.entity';
import { NotificationChannel } from './dispatcher-config.entity';

export enum NotificationType {
  DAILY_TOP_LOADS = 'daily-top-loads',
  REAL_TIME_ALERT = 'real-time-alert',
  WEEKLY_SUMMARY = 'weekly-summary',
}

@Entity('notifications_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispatcherId: string;

  @ManyToOne(() => Dispatcher, (dispatcher) => dispatcher.notifications)
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher: Dispatcher;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isSent: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

