# 🎨 CargoAI Dashboard

## Access the Dashboard

Once your application is running, open your browser and go to:

```
http://localhost:3000/index.html
```

## Features

The dashboard provides a beautiful, modern UI to test all API endpoints:

### 🚀 Quick Actions

- **Seed All Data** - Create dispatcher + 100 posts with one click
- **View Top Loads** - See best filtered loads instantly
- **Check Dispatcher** - View dispatcher information
- **Generate Posts** - Add more test posts

### 📋 Available Sections

1. **🌱 Seed Data**
   - Seed complete data (dispatcher + config + 100 posts)
   - Seed initial data only (dispatcher + config)

2. **👤 Dispatcher**
   - Get dispatcher by ID
   - Get dispatcher configuration

3. **⚙️ Update Config**
   - Update minimum price per mile
   - Update starting asking price
   - Update minimum acceptable threshold

4. **➕ Generate Posts**
   - Generate any number of fake posts
   - Automatically processes through filter agent

5. **📊 View Loads**
   - Get top loads (sorted by match score)
   - Get filtered loads (filter by score: green/yellow/red)

6. **📝 Submit Broker Post**
   - Manually submit a broker post
   - Test the filtering system

7. **💼 Offers**
   - Send offers to brokers
   - View all offers

8. **🤝 Negotiation**
   - Start negotiation sessions
   - Process broker responses
   - View negotiation status

## Quick Start

1. **Start the server:**
   ```bash
   npm run start:dev
   ```

2. **Open dashboard:**
   ```
   http://localhost:3000/index.html
   ```

3. **Click "Seed All Data"** - This will:
   - Create a dispatcher
   - Set up configuration
   - Generate 100 fake broker posts
   - Auto-fill all dispatcher ID fields

4. **Start testing!** All fields are auto-filled after seeding.

## UI Features

- **Beautiful gradient design** - Modern purple/blue theme
- **Responsive layout** - Works on all screen sizes
- **Real-time API status** - Shows connection status
- **Auto-fill** - Dispatcher ID auto-filled after seeding
- **JSON results** - Pretty-printed JSON responses
- **Error handling** - Clear error messages
- **Loading states** - Visual feedback during API calls

## API Integration

The dashboard connects to all endpoints:

- `POST /seed/complete` - Seed all data
- `GET /dispatcher/:id` - Get dispatcher
- `GET /dispatcher/:id/config` - Get config
- `PUT /dispatcher/:id/config` - Update config
- `POST /fake-data/generate` - Generate posts
- `GET /loads/top` - Get top loads
- `GET /loads/filtered` - Get filtered loads
- `POST /broker-post` - Submit post
- `POST /offer/send` - Send offer
- `GET /offer` - Get offers
- `POST /negotiation/start` - Start negotiation
- `POST /negotiation/process/:id` - Process response
- `GET /negotiation/status/:id` - Get status

## Tips

- **After seeding**, all dispatcher ID fields are auto-filled
- **Check API status** in the header - it updates every 30 seconds
- **Results are JSON formatted** - Easy to read and copy
- **Quick actions** at the top for common tasks
- **All forms validate** - Required fields are checked

## Troubleshooting

### Dashboard not loading?
- Make sure server is running on port 3000
- Check browser console for errors
- Verify `public/index.html` exists

### API calls failing?
- Check API status indicator in header
- Verify server is running: `npm run start:dev`
- Check browser console for CORS errors

### No data showing?
- Click "Seed All Data" first
- Wait for generation to complete
- Refresh the page if needed

