import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { NegotiationSession } from './negotiation-session.entity';

export enum MessageSource {
  AI_AGENT = 'ai-agent',
  BROKER = 'broker',
  SYSTEM = 'system',
}

@Entity('negotiation_messages')
export class NegotiationMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => NegotiationSession, (session) => session.messages)
  @JoinColumn({ name: 'sessionId' })
  session: NegotiationSession;

  @Column({
    type: 'enum',
    enum: MessageSource,
  })
  source: MessageSource;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  mentionedPrice: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

