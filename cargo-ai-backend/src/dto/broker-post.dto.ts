import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBrokerPostDto {
  @IsOptional()
  @IsNumber()
  no?: number;

  @IsOptional()
  @IsString()
  origin?: string; // Format: "Aurora, IL"

  @IsOptional()
  @IsString()
  destination?: string; // Format: "Fairburn, GA"

  @IsOptional()
  tripMiles?: number | string; // Can be number or string like "768"

  @IsOptional()
  @IsNumber()
  totalMiles?: number;

  @IsOptional()
  rate?: number | string; // Can be number or string like "$2,500"

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  truck?: string; // "Van w/Team", "Dry Van", etc.

  @IsOptional()
  @IsString()
  commodity?: string; // Can be "–"

  @IsOptional()
  @IsString()
  referenceId?: string; // Can be "–"

  @IsOptional()
  @IsString()
  mcNumber?: string;

  @IsOptional()
  @IsString()
  dhO?: string; // Deadhead Origin

  @IsOptional()
  @IsString()
  dhD?: string; // Deadhead Destination

  // Legacy fields for backward compatibility
  @IsOptional()
  @IsString()
  brokerId?: string;

  @IsOptional()
  @IsString()
  brokerName?: string;

  @IsOptional()
  @IsNumber()
  brokerRating?: number;

  @IsOptional()
  @IsNumber()
  originLatitude?: number;

  @IsOptional()
  @IsNumber()
  originLongitude?: number;

  @IsOptional()
  @IsNumber()
  destinationLatitude?: number;

  @IsOptional()
  @IsNumber()
  destinationLongitude?: number;

  @IsOptional()
  @IsObject()
  rawData?: Record<string, any>;
}
