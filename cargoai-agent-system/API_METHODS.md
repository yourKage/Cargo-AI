# CargoAI Frontend API Service Methods

This document lists all available API methods in the `apiService` that integrate with the backend.

## Base Configuration

- **Base URL**: `http://localhost:3000` (configurable via `VITE_API_BASE_URL` environment variable)
- **Service**: `apiService` (import from `./services/apiService`)

---

## Dispatcher Endpoints

### `getDispatcher(dispatcherId: string)`
Get dispatcher by ID.

**Example:**
```typescript
const dispatcher = await apiService.getDispatcher('uuid-here');
```

### `getDispatcherConfig(dispatcherId: string)`
Get dispatcher configuration.

**Example:**
```typescript
const config = await apiService.getDispatcherConfig('uuid-here');
```

### `updateDispatcherConfig(dispatcherId: string, config: any)`
Update dispatcher configuration.

**Example:**
```typescript
await apiService.updateDispatcherConfig('uuid-here', {
  minPricePerMile: 2.5,
  preferredStates: ['CA', 'TX'],
  cargoTypePreferences: ['dry_van', 'reefer']
});
```

---

## Loads Endpoints

### `getTopLoads(dispatcherId: string, limit?: number)`
Get top N loads for a dispatcher (default: 5).

**Example:**
```typescript
const topLoads = await apiService.getTopLoads('uuid-here', 10);
```

### `getAllLoads(dispatcherId: string, score?: 'green' | 'yellow' | 'red')`
Get all filtered loads for a dispatcher, optionally filtered by score.

**Example:**
```typescript
const allLoads = await apiService.getAllLoads('uuid-here');
const greenLoads = await apiService.getAllLoads('uuid-here', 'green');
```

---

## Broker Post Endpoints

### `submitBrokerPost(dispatcherId: string, post: any)`
Submit a new broker post for filtering.

**Example:**
```typescript
await apiService.submitBrokerPost('uuid-here', {
  origin: 'Aurora, IL',
  destination: 'Fairburn, GA',
  tripMiles: 768,
  totalMiles: 792,
  rate: 2500,
  company: 'Traffix',
  truck: 'Van w/Team'
});
```

---

## Import Endpoints

### `importPosts(posts: any[], dispatcherId?: string)`
Import broker posts from JSON. Dispatcher ID is optional - backend will auto-create if not provided.

**Example:**
```typescript
const result = await apiService.importPosts([
  {
    origin: 'Aurora, IL',
    destination: 'Fairburn, GA',
    tripMiles: 768,
    totalMiles: 792,
    rate: 2500,
    company: 'Traffix'
  }
], 'optional-dispatcher-id');

// Result includes:
// - message: string
// - dispatcherId: string (created or existing)
// - dispatcher?: { id, email, name } (if auto-created)
// - imported: number
// - failed: number
// - errors?: any[]
```

---

## Offer Endpoints

### `sendOffer(dispatcherId: string, brokerPostId: string, initialPrice: number)`
Create and send an offer to a broker.

**Example:**
```typescript
const offer = await apiService.sendOffer('dispatcher-uuid', 'post-uuid', 2400);
```

### `approveOffer(offerId: string)`
Approve a pending offer.

**Example:**
```typescript
await apiService.approveOffer('offer-uuid');
```

### `rejectOffer(offerId: string)`
Reject an offer.

**Example:**
```typescript
await apiService.rejectOffer('offer-uuid');
```

### `getOffers(dispatcherId: string, status?: 'pending_approval' | 'sent' | 'rejected' | 'accepted')`
Get offers for a dispatcher, optionally filtered by status.

**Example:**
```typescript
const allOffers = await apiService.getOffers('uuid-here');
const sentOffers = await apiService.getOffers('uuid-here', 'sent');
```

---

## Negotiation Endpoints

### `startNegotiation(dispatcherId: string, offerId: string)`
Start a new negotiation session.

**Example:**
```typescript
const session = await apiService.startNegotiation('dispatcher-uuid', 'offer-uuid');
```

### `processNegotiation(sessionId: string, message: string)`
Process broker response in negotiation.

**Example:**
```typescript
const response = await apiService.processNegotiation('session-uuid', 'We can do $2300');
```

### `getNegotiationStatus(sessionId: string)`
Get negotiation session status.

**Example:**
```typescript
const status = await apiService.getNegotiationStatus('session-uuid');
```

### `endNegotiation(sessionId: string)`
End a negotiation session.

**Example:**
```typescript
await apiService.endNegotiation('session-uuid');
```

---

## Decision Endpoints

### `evaluateNegotiation(sessionId: string)`
Evaluate negotiation and get recommendation.

**Example:**
```typescript
const evaluation = await apiService.evaluateNegotiation('session-uuid');
// Returns: { success, finalPrice, startingPrice, improvement, improvementPercentage, requiresHumanFallback, message }
```

### `rejectNegotiation(sessionId: string, reason?: string)`
Handle broker rejection.

**Example:**
```typescript
await apiService.rejectNegotiation('session-uuid', 'Price too low');
```

### `requestHumanCall(sessionId: string)`
Request human call for negotiation.

**Example:**
```typescript
await apiService.requestHumanCall('session-uuid');
```

---

## Notification Endpoints

### `triggerNotification(dispatcherId: string)`
Trigger notification for dispatcher.

**Example:**
```typescript
await apiService.triggerNotification('dispatcher-uuid');
```

---

## Usage in Components

```typescript
import { apiService } from './services/apiService';

// In your component
const handleAction = async () => {
  try {
    const result = await apiService.getTopLoads(dispatcherId, 5);
    // Handle result
  } catch (error) {
    // Handle error
    console.error('API Error:', error);
  }
};
```

---

## Error Handling

All methods throw errors that should be caught:

```typescript
try {
  const data = await apiService.getTopLoads(dispatcherId);
} catch (error: any) {
  console.error('Error:', error.message);
  // Show user-friendly error message
}
```

---

## Notes

1. All UUIDs should be valid UUID v4 format
2. All prices are in USD
3. Distances are in miles
4. The import endpoint will auto-create a dispatcher if `dispatcherId` is not provided
5. All methods return Promises and should be used with `async/await` or `.then()/.catch()`

