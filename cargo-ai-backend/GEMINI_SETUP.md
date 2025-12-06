# 🤖 Google Gemini Integration

## ✅ Changes Made

1. **Replaced OpenAI with Google Gemini** in negotiation agent
2. **API Key configured** in environment
3. **Fake data generator** created for testing

## 🔑 API Key

The Gemini API key is already configured:
```
GEMINI_API_KEY=AIzaSyAjV65pRiQjl_BlnKwRoqrg5jYEWGGToM4
```

## 📝 Environment Setup

Make sure your `.env` file has:
```env
GEMINI_API_KEY=AIzaSyAjV65pRiQjl_BlnKwRoqrg5jYEWGGToM4
```

## 🎲 Fake Data Generator

### Generate 100 Fake Posts

**Endpoint:**
```
POST /fake-data/generate?dispatcherId={dispatcherId}&count=100
```

**Example:**
```bash
curl -X POST "http://localhost:3000/fake-data/generate?dispatcherId=your-dispatcher-uuid&count=100"
```

**Via Swagger UI:**
1. Go to http://localhost:3000/api
2. Find `POST /fake-data/generate`
3. Add `dispatcherId` query parameter
4. Optionally set `count` (default: 100)
5. Click "Execute"

### What It Generates

- **100 broker posts** with realistic data:
  - Random origin/destination cities (20 major US cities)
  - Realistic distances (calculated using Haversine formula)
  - Price per mile: $1.50 - $3.50
  - Weight: 10,000 - 45,000 lbs
  - Various cargo types (reefer, dry_van, flatbed, etc.)
  - Random broker names and ratings
  - Pickup/delivery dates (1-7 days out)
  - Contact information

- **Automatically processes** each post through:
  - Filter Agent (scoring and filtering)
  - Notification Agent (if score is green/yellow)

## 🔄 How It Works

1. **Fake Data Generator** creates realistic broker posts
2. **Saves to database** (`broker_posts` table)
3. **Filter Agent** processes each post
4. **Scores and filters** based on dispatcher config
5. **Notifications sent** for good matches

## 📊 Generated Data Details

- **Cities:** 20 major US cities (LA, NY, Chicago, Houston, etc.)
- **Brokers:** 15 different broker names
- **Commodities:** 10 different types
- **Cargo Types:** All types (reefer, dry_van, flatbed, step_deck, hotshot, other)
- **Ratings:** 3.5 - 5.0 (realistic range)
- **Distances:** Calculated using real coordinates

## 🚀 Usage

### Quick Start

1. **Create a dispatcher** (manually or via API)
2. **Set dispatcher config** (via `PUT /dispatcher/:id/config`)
3. **Generate fake posts:**
   ```bash
   POST /fake-data/generate?dispatcherId={id}&count=100
   ```
4. **Check filtered results:**
   ```bash
   GET /loads/top?dispatcherId={id}&limit=10
   ```

### Example Flow

```bash
# 1. Generate 100 fake posts
curl -X POST "http://localhost:3000/fake-data/generate?dispatcherId=abc-123&count=100"

# 2. Get top 10 filtered loads
curl "http://localhost:3000/loads/top?dispatcherId=abc-123&limit=10"

# 3. Get all green scored loads
curl "http://localhost:3000/loads/filtered?dispatcherId=abc-123&score=green"
```

## 🎯 Benefits

- **No external APIs needed** - Generate test data instantly
- **Realistic data** - Based on real cities and routes
- **Full pipeline testing** - Tests filtering, scoring, notifications
- **Scalable** - Generate any number of posts

## 📝 Notes

- Posts are generated sequentially with small delays
- Each post is automatically filtered and scored
- Notifications are sent for green/yellow scores (if configured)
- All data is saved to database for persistence

