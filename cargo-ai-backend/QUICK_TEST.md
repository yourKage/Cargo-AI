# ⚡ Quick Test Guide

## 🚀 Fastest Way to Test Everything

### Step 1: Start the Server
```bash
npm run start:dev
```

### Step 2: Open Dashboard
```
http://localhost:3000/index.html
```

### Step 3: Click "Seed All Data"
This single button will:
- ✅ Create a dispatcher
- ✅ Set up configuration
- ✅ Generate 100 fake broker posts
- ✅ Auto-fill all dispatcher ID fields

### Step 4: Test Features

#### View Top Loads
- Click "View Top Loads" quick action
- Or use the "View Loads" card

#### Submit a Post
- Fill in the "Submit Broker Post" form
- Click "Submit Post"
- See the filtered result

#### Send an Offer
1. Get a broker post ID from "View Loads"
2. Fill in "Offers" form
3. Click "Send Offer"

#### Start Negotiation
1. Get an offer ID from "Get Offers"
2. Fill in "Negotiation" form
3. Click "Start Negotiation"
4. Enter broker message
5. Click "Process Response"

## 🎯 What Gets Created

When you click "Seed All Data":

### Dispatcher
- **Email:** dispatcher@cargoai.com
- **Name:** John Dispatcher
- **Phone:** +1234567890
- **Telegram:** 123456789

### Configuration
- **Min Price Per Mile:** $2.00
- **Starting Price:** $2,000
- **Min Threshold:** $1,500
- **Preferred States:** CA, TX, NY, FL
- **Cargo Types:** dry_van, reefer
- **Notification:** Daily (Email + Telegram)

### Posts
- **100 fake broker posts** with:
  - Random routes between 20 major US cities
  - Realistic prices ($1.50-$3.50/mile)
  - Various cargo types
  - Different weights and commodities
  - All automatically filtered and scored

## 📊 Testing Flow

1. **Seed Data** → Creates everything
2. **View Top Loads** → See best matches
3. **Submit Post** → Test filtering
4. **Send Offer** → Test offer system
5. **Start Negotiation** → Test AI negotiation
6. **Process Response** → See Gemini AI in action

## 🎨 Dashboard Features

- **Auto-fill** - Dispatcher ID filled automatically
- **Real-time status** - API connection indicator
- **JSON results** - Pretty-printed responses
- **Error handling** - Clear error messages
- **Quick actions** - One-click common tasks

## 🔗 Alternative: Swagger UI

If you prefer Swagger:
```
http://localhost:3000/api
```

## 💡 Tips

- **Dispatcher ID** is auto-filled after seeding
- **Check API status** in header (updates every 30s)
- **Results are formatted** JSON for easy reading
- **Quick actions** at top for common tasks
- **All forms validate** before submission

Enjoy testing! 🚀

