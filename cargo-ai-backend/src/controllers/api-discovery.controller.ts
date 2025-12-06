import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('api')
@Controller('api')
export class ApiDiscoveryController {
  @Get('endpoints')
  @ApiOperation({ summary: 'Get all available API endpoints for frontend integration' })
  @ApiResponse({ status: 200, description: 'List of all API endpoints' })
  getEndpoints() {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    return {
      baseUrl,
      version: '1.0',
      endpoints: {
        dispatcher: [
          {
            method: 'GET',
            path: '/dispatcher/:id',
            description: 'Get dispatcher by ID',
            parameters: {
              path: [{ name: 'id', type: 'string', required: true, description: 'Dispatcher UUID' }],
            },
            example: `${baseUrl}/dispatcher/{uuid}`,
          },
          {
            method: 'GET',
            path: '/dispatcher/:id/config',
            description: 'Get dispatcher configuration',
            parameters: {
              path: [{ name: 'id', type: 'string', required: true, description: 'Dispatcher UUID' }],
            },
            example: `${baseUrl}/dispatcher/{uuid}/config`,
          },
          {
            method: 'PUT',
            path: '/dispatcher/:id/config',
            description: 'Update dispatcher configuration',
            parameters: {
              path: [{ name: 'id', type: 'string', required: true, description: 'Dispatcher UUID' }],
              body: {
                type: 'object',
                properties: {
                  minPricePerMile: { type: 'number', example: 2.5 },
                  startingAskingPrice: { type: 'number', example: 2000 },
                  minAcceptableThreshold: { type: 'number', example: 1500 },
                  preferredStates: { type: 'array', items: { type: 'string' }, example: ['CA', 'TX', 'NY'] },
                  cargoTypePreferences: { type: 'array', items: { type: 'string' }, example: ['dry_van', 'reefer'] },
                },
              },
            },
            example: `${baseUrl}/dispatcher/{uuid}/config`,
          },
        ],
        brokerPost: [
          {
            method: 'POST',
            path: '/broker-post',
            description: 'Submit a new broker post for filtering',
            parameters: {
              query: [{ name: 'dispatcherId', type: 'string', required: true, description: 'Dispatcher UUID' }],
              body: {
                type: 'object',
                required: ['origin', 'destination', 'tripMiles', 'totalMiles', 'rate', 'company'],
                properties: {
                  no: { type: 'number', example: 1 },
                  origin: { type: 'string', example: 'Aurora, IL' },
                  destination: { type: 'string', example: 'Fairburn, GA' },
                  tripMiles: { type: 'number', example: 768 },
                  totalMiles: { type: 'number', example: 792 },
                  rate: { type: 'number', example: 2500 },
                  company: { type: 'string', example: 'Traffix' },
                  phone: { type: 'string', example: '(312) 815-8364' },
                  email: { type: 'string', example: 'syali@traffix.com' },
                  truck: { type: 'string', example: 'Van w/Team' },
                  commodity: { type: 'string', example: 'General Freight' },
                  referenceId: { type: 'string', example: 'REF-1234' },
                  mcNumber: { type: 'string', example: '211991' },
                  dhO: { type: 'string', example: '24' },
                  dhD: { type: 'string', example: 'N/A' },
                },
              },
            },
            example: `${baseUrl}/broker-post?dispatcherId={uuid}`,
          },
        ],
        loads: [
          {
            method: 'GET',
            path: '/loads/top',
            description: 'Get top filtered loads for a dispatcher',
            parameters: {
              query: [
                { name: 'dispatcherId', type: 'string', required: true, description: 'Dispatcher UUID' },
                { name: 'limit', type: 'number', required: false, description: 'Number of loads to return', example: 10 },
              ],
            },
            example: `${baseUrl}/loads/top?dispatcherId={uuid}&limit=10`,
          },
          {
            method: 'GET',
            path: '/loads/filtered',
            description: 'Get all filtered loads for a dispatcher',
            parameters: {
              query: [
                { name: 'dispatcherId', type: 'string', required: true, description: 'Dispatcher UUID' },
                { name: 'score', type: 'string', required: false, description: 'Filter by score (green, yellow, red)', enum: ['green', 'yellow', 'red'] },
              ],
            },
            example: `${baseUrl}/loads/filtered?dispatcherId={uuid}&score=green`,
          },
        ],
        import: [
          {
            method: 'POST',
            path: '/import/json',
            description: 'Import broker posts from JSON file/data. Auto-creates dispatcher if not exists.',
            parameters: {
              query: [{ name: 'dispatcherId', type: 'string', required: false, description: 'Dispatcher UUID (optional - will auto-create if not provided)' }],
              body: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['origin', 'destination', 'tripMiles', 'totalMiles', 'rate', 'company'],
                  properties: {
                    no: { type: 'number', example: 1 },
                    origin: { type: 'string', example: 'Aurora, IL' },
                    destination: { type: 'string', example: 'Fairburn, GA' },
                    tripMiles: { type: 'number', example: 768 },
                    totalMiles: { type: 'number', example: 792 },
                    rate: { type: 'number', example: 2500 },
                    company: { type: 'string', example: 'Traffix' },
                    phone: { type: 'string', example: '(312) 815-8364' },
                    email: { type: 'string', example: 'syali@traffix.com' },
                    truck: { type: 'string', example: 'Van w/Team' },
                    commodity: { type: 'string', example: 'General Freight' },
                    referenceId: { type: 'string', example: 'REF-1234' },
                    mcNumber: { type: 'string', example: '211991' },
                    dhO: { type: 'string', example: '24' },
                    dhD: { type: 'string', example: 'N/A' },
                  },
                },
              },
            },
            example: `${baseUrl}/import/json?dispatcherId={uuid}`,
          },
        ],
        offer: [
          {
            method: 'POST',
            path: '/offer/send',
            description: 'Create and send an offer to a broker',
            parameters: {
              query: [{ name: 'dispatcherId', type: 'string', required: true, description: 'Dispatcher UUID' }],
              body: {
                type: 'object',
                required: ['brokerPostId', 'initialPrice'],
                properties: {
                  brokerPostId: { type: 'string', example: 'uuid' },
                  initialPrice: { type: 'number', example: 2400 },
                },
              },
            },
            example: `${baseUrl}/offer/send?dispatcherId={uuid}`,
          },
          {
            method: 'POST',
            path: '/offer/approve/:id',
            description: 'Approve a pending offer',
            parameters: {
              path: [{ name: 'id', type: 'string', required: true, description: 'Offer UUID' }],
            },
            example: `${baseUrl}/offer/approve/{uuid}`,
          },
          {
            method: 'PUT',
            path: '/offer/reject/:id',
            description: 'Reject an offer',
            parameters: {
              path: [{ name: 'id', type: 'string', required: true, description: 'Offer UUID' }],
            },
            example: `${baseUrl}/offer/reject/{uuid}`,
          },
          {
            method: 'GET',
            path: '/offer',
            description: 'Get offers for a dispatcher',
            parameters: {
              query: [
                { name: 'dispatcherId', type: 'string', required: true, description: 'Dispatcher UUID' },
                { name: 'status', type: 'string', required: false, description: 'Filter by status', enum: ['pending_approval', 'sent', 'rejected', 'accepted'] },
              ],
            },
            example: `${baseUrl}/offer?dispatcherId={uuid}&status=sent`,
          },
        ],
        negotiation: [
          {
            method: 'POST',
            path: '/negotiation/start',
            description: 'Start a new negotiation session',
            parameters: {
              query: [{ name: 'dispatcherId', type: 'string', required: true, description: 'Dispatcher UUID' }],
              body: {
                type: 'object',
                required: ['offerId'],
                properties: {
                  offerId: { type: 'string', example: 'uuid' },
                },
              },
            },
            example: `${baseUrl}/negotiation/start?dispatcherId={uuid}`,
          },
          {
            method: 'POST',
            path: '/negotiation/process/:sessionId',
            description: 'Process broker response in negotiation',
            parameters: {
              path: [{ name: 'sessionId', type: 'string', required: true, description: 'Negotiation session UUID' }],
              body: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'We can do $2300, that\'s our best offer.' },
                },
              },
            },
            example: `${baseUrl}/negotiation/process/{sessionId}`,
          },
          {
            method: 'GET',
            path: '/negotiation/status/:sessionId',
            description: 'Get negotiation session status',
            parameters: {
              path: [{ name: 'sessionId', type: 'string', required: true, description: 'Negotiation session UUID' }],
            },
            example: `${baseUrl}/negotiation/status/{sessionId}`,
          },
          {
            method: 'POST',
            path: '/negotiation/end/:sessionId',
            description: 'End a negotiation session',
            parameters: {
              path: [{ name: 'sessionId', type: 'string', required: true, description: 'Negotiation session UUID' }],
            },
            example: `${baseUrl}/negotiation/end/{sessionId}`,
          },
        ],
        decision: [
          {
            method: 'GET',
            path: '/decision/evaluate/:sessionId',
            description: 'Evaluate negotiation and get recommendation',
            parameters: {
              path: [{ name: 'sessionId', type: 'string', required: true, description: 'Negotiation session UUID' }],
            },
            example: `${baseUrl}/decision/evaluate/{sessionId}`,
          },
          {
            method: 'POST',
            path: '/decision/reject/:sessionId',
            description: 'Handle broker rejection',
            parameters: {
              path: [{ name: 'sessionId', type: 'string', required: true, description: 'Negotiation session UUID' }],
              body: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: 'Price too low' },
                },
              },
            },
            example: `${baseUrl}/decision/reject/{sessionId}`,
          },
          {
            method: 'POST',
            path: '/decision/human-call/:sessionId',
            description: 'Request human call for negotiation',
            parameters: {
              path: [{ name: 'sessionId', type: 'string', required: true, description: 'Negotiation session UUID' }],
            },
            example: `${baseUrl}/decision/human-call/{sessionId}`,
          },
        ],
        notification: [
          {
            method: 'POST',
            path: '/notify/dispatcher/:id',
            description: 'Trigger notification for dispatcher',
            parameters: {
              path: [{ name: 'id', type: 'string', required: true, description: 'Dispatcher UUID' }],
            },
            example: `${baseUrl}/notify/dispatcher/{uuid}`,
          },
        ],
      },
      websocket: {
        namespace: '/negotiation',
        events: {
          'start-negotiation': {
            description: 'Start a negotiation session',
            payload: {
              dispatcherId: 'string',
              offerId: 'string',
            },
          },
          'broker-message': {
            description: 'Send broker message',
            payload: {
              sessionId: 'string',
              message: 'string',
            },
          },
          'message': {
            description: 'Receive negotiation message',
            payload: {
              source: { type: 'string', enum: ['agent', 'broker'] },
              content: 'string',
              timestamp: 'string',
            },
          },
        },
      },
    };
  }
}

