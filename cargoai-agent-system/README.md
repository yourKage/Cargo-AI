<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CargoAI Agent System - Frontend

This is the frontend application for the CargoAI Agent System, a smart cargo filtering and negotiation platform for logistics dispatchers.

## Features

- **Top 5 Loads**: View the top 5 recommended loads for your dispatcher
- **All Loads**: Browse all filtered loads with match scores
- **Real-time Stats**: Dashboard showing total loads, approved loads, and average rates
- **Voice Negotiation**: AI-powered voice agent for negotiating with brokers
- **Dispatcher Configuration**: Customize filtering and negotiation settings

## Prerequisites

- Node.js (v18 or higher)
- Backend API running (see [Backend Setup](#backend-setup))

## Backend Setup

The frontend requires the CargoAI backend to be running. The backend is located at:
```
D:\Victus\Projects\Frontend\cargo-ai-backend
```

1. Navigate to the backend directory
2. Install dependencies: `npm install`
3. Set up the database (see backend README)
4. Start the backend: `npm run start:dev`
5. The backend should be running on `http://localhost:3000`

## Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file (copy from `.env.example` if available):
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Configure Dispatcher ID:
   - The app uses a default dispatcher ID stored in localStorage
   - You can set it in the browser console: `localStorage.setItem('dispatcherId', 'your-dispatcher-uuid')`
   - Or modify the `DEFAULT_DISPATCHER_ID` in `App.tsx`

4. Run the app:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5173`

## API Integration

The frontend integrates with the following backend endpoints:

- `GET /loads/top?dispatcherId={id}&limit=5` - Get top 5 loads
- `GET /loads/filtered?dispatcherId={id}` - Get all filtered loads
- `GET /dispatcher/{id}/config` - Get dispatcher configuration

See the backend API documentation for more details.

## Project Structure

```
├── components/          # React components
│   ├── LoadCard.tsx    # Load card display
│   ├── NegotiationModal.tsx  # Voice negotiation modal
│   └── VoiceVisualizer.tsx   # Voice visualization
├── services/           # Service modules
│   ├── apiService.ts   # Backend API integration
│   └── geminiLiveService.ts  # Gemini Live API service
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main application component
```

## Development

- Frontend runs on port 5173 (Vite dev server)
- Backend should run on port 3000 (NestJS)
- The frontend will automatically connect to the backend at `http://localhost:3000`

View your app in AI Studio: https://ai.studio/apps/drive/1aywUx5NUvc2FlW7f5DDgubf06-3yxScm
