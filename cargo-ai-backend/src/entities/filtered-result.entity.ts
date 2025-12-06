import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Dispatcher } from './dispatcher.entity';
import { BrokerPost } from './broker-post.entity';

export enum FilterScore {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

@Entity('filtered_results')
export class FilteredResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispatcherId: string;

  @ManyToOne(() => Dispatcher, (dispatcher) => dispatcher.filteredResults)
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher: Dispatcher;

  @Column({ type: 'uuid' })
  brokerPostId: string;

  @ManyToOne(() => BrokerPost, (post) => post.filteredResults)
  @JoinColumn({ name: 'brokerPostId' })
  brokerPost: BrokerPost;

  @Column({
    type: 'enum',
    enum: FilterScore,
  })
  score: FilterScore;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  matchScore: number; // 0-100

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'jsonb', nullable: true })
  filterDetails: Record<string, any>; // Store detailed filter results

  @Column({ default: false })
  isNotified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

