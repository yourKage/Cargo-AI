import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FilteredResult } from './filtered-result.entity';
import { OfferLog } from './offer-log.entity';

@Entity('broker_posts')
export class BrokerPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  no: number;

  @Column({ type: 'text', nullable: true })
  origin: string; // Format: "Aurora, IL"

  @Column({ type: 'text', nullable: true })
  destination: string; // Format: "Fairburn, GA"

  @Column({ type: 'int', nullable: true })
  tripMiles: number; // Trip miles (can be parsed from string)

  @Column({ type: 'int', nullable: true })
  totalMiles: number; // Total miles

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rate: number; // Rate in dollars (can be parsed from "$2,500" format)

  @Column({ type: 'text', nullable: true })
  company: string; // Company name

  @Column({ type: 'text', nullable: true })
  phone: string; // Phone number

  @Column({ type: 'text', nullable: true })
  email: string; // Email address

  @Column({ type: 'text', nullable: true })
  truck: string; // Truck type: "Van w/Team", "Dry Van", etc.

  @Column({ type: 'text', nullable: true })
  commodity: string; // Commodity type (can be "–")

  @Column({ type: 'text', nullable: true })
  referenceId: string; // Reference ID (can be "–")

  @Column({ type: 'text', nullable: true })
  mcNumber: string; // MC Number

  @Column({ type: 'text', nullable: true })
  dhO: string; // Deadhead Origin (can be number as string or "N/A")

  @Column({ type: 'text', nullable: true })
  dhD: string; // Deadhead Destination (can be "N/A" or number as string)

  // Legacy fields for backward compatibility (optional)
  @Column({ type: 'text', nullable: true })
  brokerId: string;

  @Column({ type: 'text', nullable: true })
  brokerName: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  brokerRating: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  originLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  originLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  destinationLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  destinationLongitude: number;

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>; // Store original post data

  @OneToMany(() => FilteredResult, (result) => result.brokerPost)
  filteredResults: FilteredResult[];

  @OneToMany(() => OfferLog, (offer) => offer.brokerPost)
  offers: OfferLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  // Helper to get distance (use tripMiles as primary)
  getDistance(): number {
    return this.tripMiles ?? this.totalMiles ?? 0;
  }

  // Helper to get price
  getOfferedPrice(): number {
    return this.rate ?? 0;
  }

  // Helper to get origin (safe for null)
  getOriginCity(): string {
    return this.origin?.split(',')[0]?.trim() || '';
  }

  getOriginState(): string {
    return this.origin?.split(',')[1]?.trim() || '';
  }

  // Helper to get destination (safe for null)
  getDestinationCity(): string {
    return this.destination?.split(',')[0]?.trim() || '';
  }

  getDestinationState(): string {
    return this.destination?.split(',')[1]?.trim() || '';
  }
}
