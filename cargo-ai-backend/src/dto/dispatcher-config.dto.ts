import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import {
  NotificationFrequency,
  NotificationChannel,
  NegotiationAggressiveness,
  OfferMode,
} from '../entities/dispatcher-config.entity';

export class UpdateDispatcherConfigDto {
  @IsOptional()
  @IsNumber()
  minPricePerMile?: number;

  @IsOptional()
  @IsNumber()
  startingAskingPrice?: number;

  @IsOptional()
  @IsNumber()
  minAcceptableThreshold?: number;

  @IsOptional()
  @IsNumber()
  pickupRadius?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredStates?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cargoTypePreferences?: string[];

  @IsOptional()
  @IsNumber()
  maxWeight?: number;

  @IsOptional()
  @IsNumber()
  deadheadRange?: number;

  @IsOptional()
  @IsNumber()
  minBrokerRating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  autoRejectBrokerIds?: string[];

  @IsOptional()
  @IsEnum(NotificationFrequency)
  notificationFrequency?: NotificationFrequency;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  notificationChannels?: NotificationChannel[];

  @IsOptional()
  @IsEnum(NegotiationAggressiveness)
  negotiationAggressiveness?: NegotiationAggressiveness;

  @IsOptional()
  @IsNumber()
  maxNegotiationAttempts?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forbiddenPhrases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraInfoToRequest?: string[];

  @IsOptional()
  @IsEnum(OfferMode)
  offerMode?: OfferMode;
}

