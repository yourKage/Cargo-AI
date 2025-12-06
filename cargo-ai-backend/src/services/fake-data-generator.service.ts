import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrokerPost } from '../entities/broker-post.entity';
import { FilterAgentService } from './filter-agent.service';
import { CreateBrokerPostDto } from '../dto/broker-post.dto';
import { transformBrokerPostJson } from '../utils/json-transformer.util';

@Injectable()
export class FakeDataGeneratorService {
  private readonly cities = [
    { city: 'Aurora', state: 'IL', lat: 41.7606, lon: -88.3201 },
    { city: 'Fairburn', state: 'GA', lat: 33.5671, lon: -84.5810 },
    { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
    { city: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
    { city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
    { city: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
    { city: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
    { city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
    { city: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
    { city: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
    { city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
    { city: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863 },
    { city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
    { city: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557 },
    { city: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
    { city: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
    { city: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
    { city: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
    { city: 'Indianapolis', state: 'IN', lat: 39.7684, lon: -86.1581 },
    { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
    { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
    { city: 'Washington', state: 'DC', lat: 38.9072, lon: -77.0369 },
    { city: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
    { city: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
    { city: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
  ];

  private readonly companies = [
    'Traffix',
    'ABC Logistics',
    'XYZ Freight Solutions',
    'Global Transport Co',
    'Express Cargo Inc',
    'Prime Movers LLC',
    'Swift Logistics',
    'Reliable Freight',
    'Elite Transport',
    'National Carriers',
    'United Shipping',
    'Pacific Freight',
    'Atlantic Logistics',
    'Midwest Transport',
    'Southern Cargo',
    'Western Express',
    'Central Freight',
    'Eastern Logistics',
    'Northern Transport',
    'Coastal Shipping',
  ];

  private readonly truckTypes = [
    'Van w/Team',
    'Dry Van',
    'Reefer',
    'Flatbed',
    'Step Deck',
    'Hotshot',
    'Box Truck',
    'Straight Truck',
    'Van',
    'Van Solo',
  ];

  private readonly commodities = [
    'General Freight',
    'Electronics',
    'Food Products',
    'Building Materials',
    'Machinery',
    'Automotive Parts',
    'Furniture',
    'Textiles',
    'Chemicals',
    'Paper Products',
    '–', // Can be dash
  ];

  constructor(
    @InjectRepository(BrokerPost)
    private brokerPostRepository: Repository<BrokerPost>,
    private filterAgentService: FilterAgentService,
  ) {}

  async importPosts(
    dispatcherId: string,
    posts: CreateBrokerPostDto[],
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log(`Importing ${posts.length} broker posts for dispatcher ${dispatcherId}...`);

    for (let i = 0; i < posts.length; i++) {
      const rawPost = posts[i];
      try {
        // Transform JSON format (handles both camelCase and snake_case/Title_Case)
        const postData = transformBrokerPostJson(rawPost);

        // Parse Trip_Miles from string if needed
        let tripMiles: number | undefined;
        if (postData.tripMiles !== undefined && postData.tripMiles !== null) {
          tripMiles = typeof postData.tripMiles === 'string' 
            ? parseInt(postData.tripMiles.replace(/,/g, ''), 10) 
            : postData.tripMiles;
        }

        // Parse Rate from string format like "$2,500" if needed
        let rate: number | undefined;
        if (postData.rate !== undefined && postData.rate !== null) {
          if (typeof postData.rate === 'string') {
            // Remove $ and commas, then parse
            const cleaned = postData.rate.replace(/[$,]/g, '');
            rate = parseFloat(cleaned);
          } else {
            rate = postData.rate;
          }
        }

        // Create broker post
        const brokerPost = this.brokerPostRepository.create({
          no: postData.no ?? i + 1,
          origin: postData.origin,
          destination: postData.destination,
          tripMiles,
          totalMiles: postData.totalMiles,
          rate,
          company: postData.company,
          phone: postData.phone,
          email: postData.email,
          truck: postData.truck,
          commodity: postData.commodity,
          referenceId: postData.referenceId,
          mcNumber: postData.mcNumber,
          dhO: postData.dhO,
          dhD: postData.dhD,
          // Legacy fields
          brokerId: postData.brokerId || `broker-${postData.mcNumber || i}`,
          brokerName: postData.brokerName || postData.company,
          originLatitude: postData.originLatitude,
          originLongitude: postData.originLongitude,
          destinationLatitude: postData.destinationLatitude,
          destinationLongitude: postData.destinationLongitude,
        });

        await this.brokerPostRepository.save(brokerPost);

        // Process through filter agent
        await this.filterAgentService.processBrokerPost(postData, dispatcherId);
        imported++;
      } catch (error) {
        failed++;
        const errorMsg = `Post ${i + 1}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }

      // Small delay to avoid overwhelming the system
      if (i % 10 === 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Imported ${imported} posts, ${failed} failed for dispatcher ${dispatcherId}`);
    return { imported, failed, errors: errors.slice(0, 10) }; // Return first 10 errors
  }
}
