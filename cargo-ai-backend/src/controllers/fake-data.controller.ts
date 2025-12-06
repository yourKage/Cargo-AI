import {
  Controller,
  Post,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FakeDataGeneratorService } from '../services/fake-data-generator.service';
import { DataSeederService } from '../services/data-seeder.service';
import { CreateBrokerPostDto } from '../dto/broker-post.dto';

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(
    private fakeDataGeneratorService: FakeDataGeneratorService,
    private dataSeederService: DataSeederService,
  ) {}

  @Post('json')
  @ApiOperation({ summary: 'Import broker posts from JSON file/data. Accepts both camelCase and Title_Case formats. Auto-creates dispatcher if not exists.' })
  @ApiQuery({ name: 'dispatcherId', description: 'Dispatcher UUID (optional - will auto-create if not provided)', required: false, type: String })
  @ApiBody({ 
    description: 'Array of broker posts. Can use field names: No, Origin, Destination, Trip_Miles, Total_Miles, Rate (as "$2,500"), Company, Phone, Email, Truck, Commodity, Reference_ID, MC_Number, DH-O, DH-D',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          No: { type: 'number' },
          Origin: { type: 'string' },
          Destination: { type: 'string' },
          Trip_Miles: { type: 'string' },
          Total_Miles: { type: 'number' },
          Rate: { type: 'string', example: '$2,500' },
          Company: { type: 'string' },
          Phone: { type: 'string' },
          Email: { type: 'string' },
          Truck: { type: 'string' },
          Commodity: { type: 'string' },
          Reference_ID: { type: 'string' },
          MC_Number: { type: 'string' },
          'DH-O': { type: 'string' },
          'DH-D': { type: 'string' },
        },
      },
    }
  })
  @ApiResponse({ status: 200, description: 'Posts imported successfully' })
  async importPosts(
    @Query('dispatcherId') dispatcherId?: string,
    @Body() posts: any[] = [],
  ) {
    // Get or create dispatcher
    const { dispatcher } = await this.dataSeederService.getOrCreateDispatcher(dispatcherId);
    const finalDispatcherId = dispatcher.id;

    const result = await this.fakeDataGeneratorService.importPosts(finalDispatcherId, posts);
    return {
      message: `Imported ${result.imported} posts, ${result.failed} failed`,
      dispatcherId: finalDispatcherId,
      dispatcher: {
        id: dispatcher.id,
        email: dispatcher.email,
        name: dispatcher.name,
      },
      imported: result.imported,
      failed: result.failed,
      errors: result.errors,
    };
  }
}

