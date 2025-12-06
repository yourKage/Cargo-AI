# CargoAI Backend API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
*Note: Authentication is not implemented in MVP. Add JWT/auth middleware as needed.*

---

## Dispatcher Endpoints

### Get Dispatcher
```http
GET /dispatcher/:id
```

**Response:**
```json
{
  "id": "uuid",
  "email": "dispatcher@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "telegramChatId": "123456789",
  "isActive": true,
  "config": { ... },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Dispatcher Configuration
```http
GET /dispatcher/:id/config
```

### Update Dispatcher Configuration
```http
PUT /dispatcher/:id/config
Content-Type: application/json

{
  "minPricePerMile": 2.50,
  "startingAskingPrice": 1500,
  "minAcceptableThreshold": 1200,
  "pickupRadius": 50,
  "preferredStates": ["CA", "TX", "FL"],
  "cargoTypePreferences": ["reefer", "dry_van"],
  "maxWeight": 45000,
  "deadheadRange": 100,
  "minBrokerRating": 4.0,
  "autoRejectBrokerIds": ["broker-123"],
  "notificationFrequency": "daily",
  "notificationChannels": ["email", "telegram"],
  "negotiationAggressiveness": "normal",
  "maxNegotiationAttempts": 3,
  "forbiddenPhrases": ["lowball", "take it or leave it"],
  "extraInfoToRequest": ["commodity", "FCFS/APPT", "dimensions"],
  "offerMode": "approval-required"
}
```

---

## Broker Post Endpoints

### Submit Broker Post
```http
POST /broker-post?dispatcherId=:id
Content-Type: application/json

{
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
  "appointmentType": "APPT",
  "dimensions": "53' x 102\" x 13'6\"",
  "specialRequirements": "No hazmat",
  "contactEmail": "broker@example.com",
  "contactPhone": "+1987654321",
  "contactTelegram": "@broker123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "dispatcherId": "uuid",
  "brokerPostId": "uuid",
  "score": "green",
  "matchScore": 85.5,
  "rejectionReason": null,
  "filterDetails": { ... },
  "isNotified": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Top Loads
```http
GET /loads/top?dispatcherId=:id&limit=5
```

**Response:**
```json
[
  {
    "id": "uuid",
    "score": "green",
    "matchScore": 90,
    "brokerPost": {
      "id": "uuid",
      "originCity": "Los Angeles",
      "originState": "CA",
      "destinationCity": "New York",
      "destinationState": "NY",
      "offeredPrice": 2500,
      "distance": 2800,
      "cargoType": "dry_van"
    }
  }
]
```

### Get Filtered Loads
```http
GET /loads/filtered?dispatcherId=:id&score=green
```

**Query Parameters:**
- `dispatcherId` (required): UUID of dispatcher
- `score` (optional): `green` | `yellow` | `red`

---

## Notification Endpoints

### Trigger Notification
```http
POST /notify/dispatcher/:id
```

**Response:**
```json
{
  "message": "Notification sent"
}
```

---

## Offer Endpoints

### Send Offer
```http
POST /offer/send?dispatcherId=:id
Content-Type: application/json

{
  "brokerPostId": "uuid",
  "initialPrice": 2400
}
```

**Response:**
```json
{
  "id": "uuid",
  "dispatcherId": "uuid",
  "brokerPostId": "uuid",
  "status": "pending-approval",
  "initialPrice": 2400,
  "message": "Hello,\n\nWe are interested...",
  "channel": "email",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Approve Offer
```http
POST /offer/approve/:id
```

### Reject Offer
```http
PUT /offer/reject/:id
```

### Get Offers
```http
GET /offer?dispatcherId=:id&status=sent
```

**Query Parameters:**
- `dispatcherId` (required): UUID of dispatcher
- `status` (optional): `pending-approval` | `sent` | `rejected` | `accepted` | `expired`

---

## Negotiation Endpoints

### Start Negotiation
```http
POST /negotiation/start?dispatcherId=:id
Content-Type: application/json

{
  "offerId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "dispatcherId": "uuid",
  "offerId": "uuid",
  "status": "in-progress",
  "startingPrice": 2400,
  "minimumThreshold": 2160,
  "attemptCount": 0,
  "priceHistory": [
    {
      "price": 2400,
      "timestamp": "2024-01-01T00:00:00.000Z",
      "source": "initial"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Process Broker Response
```http
POST /negotiation/process/:sessionId
Content-Type: application/json

{
  "message": "We can do $2300, that's our best offer."
}
```

**Response:**
```json
{
  "response": "Thank you for your offer. However, we need at least $2160 to make this work. Can we meet at $2200?",
  "shouldContinue": true
}
```

### Get Negotiation Status
```http
GET /negotiation/status/:sessionId
```

**Response:**
```json
{
  "id": "uuid",
  "status": "in-progress",
  "startingPrice": 2400,
  "minimumThreshold": 2160,
  "finalAgreedPrice": null,
  "attemptCount": 2,
  "confidenceScore": 75.5,
  "priceHistory": [ ... ],
  "messages": [
    {
      "id": "uuid",
      "source": "ai-agent",
      "content": "Hello, we're interested...",
      "mentionedPrice": 2400,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### End Negotiation
```http
POST /negotiation/end/:sessionId
```

---

## Decision Endpoints

### Evaluate Negotiation
```http
GET /decision/evaluate/:sessionId
```

**Response:**
```json
{
  "success": true,
  "finalPrice": 2300,
  "startingPrice": 2400,
  "improvement": -100,
  "improvementPercentage": -4.17,
  "requiresHumanFallback": false,
  "message": "Negotiation completed successfully. Final price: $2,300 (-4.17% from starting price)"
}
```

### Handle Broker Rejection
```http
POST /decision/reject/:sessionId
Content-Type: application/json

{
  "reason": "Price too high for our budget"
}
```

### Request Human Call
```http
POST /decision/human-call/:sessionId
```

**Response:**
```json
{
  "message": "Human call requested"
}
```

### Retry Negotiation
```http
POST /decision/retry/:sessionId
```

---

## WebSocket API

### Connection
```javascript
const socket = io('http://localhost:3000/negotiation');
```

### Events

#### Start Negotiation
```javascript
socket.emit('start-negotiation', {
  dispatcherId: 'uuid',
  offerId: 'uuid'
});

socket.on('negotiation-started', (data) => {
  console.log('Session ID:', data.sessionId);
});

socket.on('message', (data) => {
  console.log(data.source, data.content);
});
```

#### Send Broker Message
```javascript
socket.emit('broker-message', {
  sessionId: 'uuid',
  message: 'Broker response text'
});
```

#### End Negotiation
```javascript
socket.emit('end-negotiation', {
  sessionId: 'uuid'
});

socket.on('negotiation-ended', (data) => {
  console.log('Negotiation ended:', data.sessionId);
});
```

#### Get Status
```javascript
socket.emit('get-status', {
  sessionId: 'uuid'
});

socket.on('status-update', (data) => {
  console.log('Status:', data.session);
});
```

#### Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

---

## Error Responses

All endpoints may return errors in the following format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. All UUIDs should be valid UUID v4 format
2. All prices are in USD
3. Distances are in miles
4. Weights are in pounds (lbs)
5. Dates should be in ISO 8601 format (YYYY-MM-DD)
6. WebSocket connections should handle reconnection logic
7. Rate limiting may be applied in production

