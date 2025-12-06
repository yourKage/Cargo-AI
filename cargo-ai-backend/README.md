# CargoAI Backend - Smart Cargo Filtering & Negotiation Agent

A comprehensive AI-powered logistics system that filters broker cargo posts, automates negotiations, and manages dispatcher-broker communications.

## 🚀 Features

- **Filter Agent**: Intelligent filtering of broker cargo posts based on dispatcher preferences
- **Notification Agent**: Real-time and scheduled notifications via Email and Telegram
- **Offer Agent**: Automated offer sending with approval workflows
- **Voice Negotiation Agent**: AI-powered real-time negotiation with brokers (Google Gemini)
- **Fake Data Generator**: Generate realistic test data for development
- **Decision Agent**: Price evaluation and human fallback handling
- **REST API**: Complete API-first architecture
- **WebSocket Gateway**: Real-time negotiation sessions

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- Redis (optional, for job queues)
- OpenAI API key (for negotiation agent)
- Telegram Bot Token (for notifications)
- Email SMTP credentials (for email notifications)

## 🛠️ Installation

> **📖 New to the project?** Check out the [QUICKSTART.md](./QUICKSTART.md) guide for detailed step-by-step instructions!

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Windows
   Copy-Item env.example .env
   
   # Mac/Linux
   cp env.example .env
   ```
   Edit `.env` with your configuration (see [QUICKSTART.md](./QUICKSTART.md) for details)

3. **Set up PostgreSQL database** (REQUIRED)
   ```bash
   # Create database
   createdb cargo_ai
   
   # Or use Docker
   docker run --name cargo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cargo_ai -p 5432:5432 -d postgres:15
   ```
   The app will auto-sync schema in development mode.

4. **Run the application**
   ```bash
   # Development (with hot reload)
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

5. **Access Dashboard & Swagger UI**
   Once the app is running, visit:
   ```
   🎨 Dashboard: http://localhost:3000/index.html
   📚 Swagger UI: http://localhost:3000/api
   ```
   - **Dashboard**: Beautiful HTML UI to test all APIs with one-click data seeding
   - **Swagger UI**: Interactive API documentation

### ⚡ Quick Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `cargo_ai` created
- [ ] `.env` file configured with database credentials
- [ ] (Optional) OpenAI API key for AI negotiation
- [ ] (Optional) Telegram bot token for notifications
- [ ] (Optional) Email SMTP for email notifications

**Minimum to start:** Just PostgreSQL! Everything else is optional.

## 📚 API Documentation

### Dispatcher Configuration

#### Get Dispatcher Config
```
GET /dispatcher/:id/config
```

#### Update Dispatcher Config
```
PUT /dispatcher/:id/config
Body: {
  minPricePerMile?: number;
  startingAskingPrice?: number;
  minAcceptableThreshold?: number;
  pickupRadius?: number;
  preferredStates?: string[];
  cargoTypePreferences?: string[];
  notificationFrequency?: 'real-time' | 'daily' | 'weekly';
  notificationChannels?: ('email' | 'telegram')[];
  negotiationAggressiveness?: 'aggressive' | 'normal' | 'soft';
  offerMode?: 'auto-send' | 'approval-required';
  // ... other config options
}
```

### Broker Posts & Filtering

#### Submit Broker Post
```
POST /broker-post?dispatcherId=:id
Body: {
  brokerId: string;
  origin: { city: string; state: string; latitude?: number; longitude?: number };
  destination: { city: string; state: string; latitude?: number; longitude?: number };
  offeredPrice: number;
  distance: number;
  cargoType: 'reefer' | 'dry_van' | 'flatbed' | 'step_deck' | 'hotshot' | 'other';
  weight?: number;
  commodity?: string;
  pickupDate?: string;
  // ... other fields
}
```

#### Get Top Loads
```
GET /loads/top?dispatcherId=:id&limit=5
```

#### Get Filtered Loads
```
GET /loads/filtered?dispatcherId=:id&score=green
```

### Notifications

#### Trigger Notification
```
POST /notify/dispatcher/:id
```

### Offers

#### Send Offer
```
POST /offer/send?dispatcherId=:id
Body: {
  brokerPostId: string;
  initialPrice: number;
}
```

#### Approve Offer
```
POST /offer/approve/:id
```

#### Get Offers
```
GET /offer?dispatcherId=:id&status=sent
```

### Negotiation

#### Start Negotiation
```
POST /negotiation/start?dispatcherId=:id
Body: {
  offerId: string;
}
```

#### Process Broker Response
```
POST /negotiation/process/:sessionId
Body: {
  message: string;
}
```

#### Get Negotiation Status
```
GET /negotiation/status/:sessionId
```

#### End Negotiation
```
POST /negotiation/end/:sessionId
```

### Decision

#### Evaluate Negotiation
```
GET /decision/evaluate/:sessionId
```

#### Handle Broker Rejection
```
POST /decision/reject/:sessionId
Body: {
  reason?: string;
}
```

#### Request Human Call
```
POST /decision/human-call/:sessionId
```

## 🔌 WebSocket API

Connect to `/negotiation` namespace for real-time negotiation:

```javascript
const socket = io('http://localhost:3000/negotiation');

// Start negotiation
socket.emit('start-negotiation', {
  dispatcherId: 'uuid',
  offerId: 'uuid'
});

// Listen for messages
socket.on('message', (data) => {
  console.log(data.source, data.content);
});

// Send broker message
socket.emit('broker-message', {
  sessionId: 'uuid',
  message: 'Broker response text'
});

// End negotiation
socket.emit('end-negotiation', { sessionId: 'uuid' });
```

## 🏗️ Architecture

### System Components

1. **Filter Agent** (`src/services/filter-agent.service.ts`)
   - Filters loads based on dispatcher configuration
   - Scores loads (Green/Yellow/Red)
   - Calculates match scores

2. **Notification Agent** (`src/services/notification-agent.service.ts`)
   - Sends daily/weekly/real-time notifications
   - Supports Email and Telegram channels
   - Scheduled via cron jobs

3. **Offer Agent** (`src/services/offer-agent.service.ts`)
   - Creates and sends offers to brokers
   - Supports auto-send and approval-required modes
   - Tracks offer status

4. **Negotiation Agent** (`src/services/negotiation-agent.service.ts`)
   - AI-powered negotiation using OpenAI
   - Real-time conversation handling
   - Price tracking and history

5. **Decision Agent** (`src/services/decision-agent.service.ts`)
   - Evaluates negotiation outcomes
   - Calculates price improvements
   - Handles human fallback requests

### Database Schema

- `dispatchers` - Dispatcher accounts
- `dispatcher_config` - Dispatcher preferences and settings
- `broker_posts` - Incoming cargo posts from brokers
- `filtered_results` - Filtered and scored loads
- `notification_log` - Notification history
- `offer_logs` - Offer tracking
- `negotiation_sessions` - Active negotiation sessions
- `negotiation_messages` - Message history
- `broker_contacts` - Broker contact information

## 🔧 Configuration

### Dispatcher Filter Settings

- Minimum price per mile/km
- Starting asking price
- Minimum acceptable threshold
- Pickup radius
- Preferred states/regions
- Cargo type preferences
- Max weight
- Deadhead range
- Broker rating filter
- Auto-reject broker list

### Notification Settings

- Frequency: Real-time, Daily, Weekly
- Channels: Email, Telegram

### Negotiation Settings

- Aggressiveness: Aggressive, Normal, Soft
- Max negotiation attempts
- Forbidden phrases
- Extra info to request

## 📝 Development

### Project Structure

```
src/
├── entities/          # TypeORM entities
├── dto/              # Data transfer objects
├── services/         # Business logic services
├── controllers/      # REST API controllers
├── gateways/         # WebSocket gateways
├── modules/          # Feature modules
├── schedulers/       # Cron job schedulers
├── database/         # Database configuration
└── config/           # Configuration files
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Deployment

1. Set `NODE_ENV=production` in `.env`
2. Disable database synchronization (set `synchronize: false`)
3. Run migrations manually
4. Build the application: `npm run build`
5. Start: `npm run start:prod`

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📞 Support

For questions and support, please open an issue in the repository.
