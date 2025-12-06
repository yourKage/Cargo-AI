# 📚 Swagger/OpenAPI Documentation

## Access Swagger UI

Once your application is running, access the Swagger UI at:

```
http://localhost:3000/api
```

## Features

The Swagger UI provides:

- **Interactive API Documentation** - Browse all endpoints organized by tags
- **Try It Out** - Test endpoints directly from the browser
- **Request/Response Schemas** - See exact data structures
- **Example Values** - Pre-filled examples for testing
- **Error Responses** - See all possible error codes

## API Tags

Endpoints are organized into the following tags:

1. **dispatcher** - Dispatcher management and configuration
2. **broker-post** - Broker post submission and filtering
3. **loads** - Load retrieval and filtering
4. **notification** - Notification management
5. **offer** - Offer management
6. **negotiation** - Negotiation sessions
7. **decision** - Decision evaluation

## Using Swagger UI

### Testing an Endpoint

1. Find the endpoint you want to test
2. Click on it to expand
3. Click "Try it out"
4. Fill in the required parameters
5. Click "Execute"
6. See the response below

### Example: Submit a Broker Post

1. Go to `POST /broker-post`
2. Click "Try it out"
3. Add `dispatcherId` as a query parameter
4. Fill in the request body with example data:
   ```json
   {
     "brokerId": "broker-123",
     "origin": {
       "city": "Los Angeles",
       "state": "CA"
     },
     "destination": {
       "city": "New York",
       "state": "NY"
     },
     "offeredPrice": 2500,
     "distance": 2800,
     "cargoType": "dry_van"
   }
   ```
5. Click "Execute"
6. See the filtered result

## Export OpenAPI Spec

You can export the OpenAPI specification JSON at:

```
http://localhost:3000/api-json
```

This can be imported into:
- Postman
- Insomnia
- Other API testing tools
- API documentation generators

## Customization

Swagger configuration is in `src/main.ts`. You can customize:

- Title and description
- API version
- Server URLs
- Tags and grouping
- UI styling

## Notes

- All endpoints require proper authentication (if implemented)
- Some endpoints require existing data (e.g., dispatcher must exist)
- UUIDs must be valid UUID v4 format
- Check the response schemas for exact data structures

