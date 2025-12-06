# 📥 Broker Post Sources

## Current Implementation

Broker posts are currently received via **REST API**:

### Endpoint
```
POST /broker-post?dispatcherId={dispatcherId}
```

### How It Works

1. **External Source** (broker, load board, etc.) sends POST request
2. **Filter Agent** processes and scores the post
3. **Notification Agent** sends alerts if score is green/yellow
4. Post is stored in database

## Data Flow

```
External Source → POST /broker-post → FilterAgentService → Database
                                      ↓
                                 NotificationAgent (if good match)
```

## Sources (Per Technical Specification)

According to the TZ, posts can come from:

### ✅ 1. REST API (Currently Im`plemented)
- **Endpoint:** `POST /broker-post`
- **Usage:** External systems call this endpoint
- **Example:** Load board APIs, broker systems, webhooks

### ⏳ 2. Load Board APIs (To Be Implemented)
- **Status:** Not yet implemented
- **How:** Create a service that polls/fetches from load boards
- **Examples:** DAT, Truckstop.com, 123Loadboard APIs

### ⏳ 3. Email Parser (To Be Implemented)
- **Status:** Not yet implemented
- **How:** Parse incoming emails and extract load information
- **Use Case:** Brokers email load details

### ⏳ 4. Manual Add (To Be Implemented)
- **Status:** Not yet implemented
- **How:** Dispatcher manually adds posts via UI/API
- **Use Case:** Direct broker communication

## Current API Usage

### Example: Submit a Broker Post

```bash
curl -X POST "http://localhost:3000/broker-post?dispatcherId=your-dispatcher-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "broker-123",
    "brokerName": "ABC Logistics",
    "brokerRating": 4.5,
    "origin": {
      "city": "Los Angeles",
      "state": "CA",
      "latitude": 34.0522,
      "longitude": -118.2437
    },
    "destination": {
      "city": "New York",
      "state": "NY",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "offeredPrice": 2500,
    "distance": 2800,
    "cargoType": "dry_van",
    "weight": 40000,
    "commodity": "General Freight",
    "pickupDate": "2024-01-15",
    "deliveryDate": "2024-01-18",
    "contactEmail": "broker@example.com",
    "contactPhone": "+1987654321"
  }'
```

### Response

```json
{
  "id": "filtered-result-uuid",
  "dispatcherId": "dispatcher-uuid",
  "brokerPostId": "broker-post-uuid",
  "score": "green",
  "matchScore": 85.5,
  "rejectionReason": null,
  "filterDetails": {
    "pricePerMile": { "actual": 0.89, "passed": true },
    "cargoType": { "actual": "dry_van", "passed": true },
    ...
  },
  "isNotified": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Integration Examples

### 1. Load Board Webhook Integration

If a load board supports webhooks, configure it to call your endpoint:

```
Webhook URL: https://your-domain.com/broker-post?dispatcherId={id}
Method: POST
```

### 2. Scheduled Polling Service (To Implement)

Create a service that periodically fetches from load board APIs:

```typescript
// src/services/load-board-integration.service.ts
@Injectable()
export class LoadBoardIntegrationService {
  @Cron('*/5 * * * *') // Every 5 minutes
  async fetchFromLoadBoards() {
    // Fetch from DAT, Truckstop, etc.
    // Transform to CreateBrokerPostDto
    // Call FilterAgentService.processBrokerPost()
  }
}
```

### 3. Email Parser (To Implement)

Set up email parsing to extract load information:

```typescript
// src/services/email-parser.service.ts
@Injectable()
export class EmailParserService {
  async parseEmail(email: Email): Promise<CreateBrokerPostDto> {
    // Extract load details from email
    // Return CreateBrokerPostDto
  }
}
```

## Database Storage

All broker posts are stored in the `broker_posts` table:

- **Table:** `broker_posts`
- **Entity:** `BrokerPost`
- **Location:** `src/entities/broker-post.entity.ts`

Posts are linked to filtered results via `filtered_results` table.

## Next Steps to Add More Sources

1. **Load Board Integration:**
   - Create `LoadBoardIntegrationService`
   - Add scheduled jobs to fetch posts
   - Transform load board format to `CreateBrokerPostDto`

2. **Email Parser:**
   - Set up email receiving (IMAP/POP3)
   - Create `EmailParserService`
   - Extract load data from email body/subject

3. **Manual Add:**
   - Add UI endpoint for dispatcher to manually submit
   - Or enhance existing API with dispatcher authentication

## Testing

You can test the current implementation using:

1. **Swagger UI:** http://localhost:3000/api
2. **Postman/Insomnia:** Import OpenAPI spec from `/api-json`
3. **cURL:** Use examples above
4. **Your Frontend:** Call the REST API endpoint

## Questions?

- Check `src/controllers/broker-post.controller.ts` for endpoint details
- Check `src/services/filter-agent.service.ts` for processing logic
- Check `src/dto/broker-post.dto.ts` for required fields

