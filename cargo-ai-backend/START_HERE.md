# 🎯 START HERE - Quick Setup Guide

## ✅ Step 1: Dependencies Installed
**Done!** All npm packages are installed.

## 🔌 Step 2: What You Need to Connect

### ⚠️ REQUIRED (App won't start without this):

1. **PostgreSQL Database**
   - **Why:** Stores all data (dispatchers, loads, negotiations, etc.)
   - **How to set up:**
     ```bash
     # Option 1: Docker (Easiest)
     docker run --name cargo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cargo_ai -p 5432:5432 -d postgres:15
     
     # Option 2: Local PostgreSQL
     # Install from https://www.postgresql.org/download/
     # Then create database:
     psql -U postgres
     CREATE DATABASE cargo_ai;
     \q
     ```
   - **Update `.env`:**
     ```env
     DB_HOST=localhost
     DB_PORT=5432
     DB_USERNAME=postgres
     DB_PASSWORD=postgres
     DB_NAME=cargo_ai
     ```

### ⚠️ OPTIONAL (App will run, but features won't work):

2. **OpenAI API Key** (For AI Negotiation)
   - **Why:** Powers the intelligent negotiation agent
   - **Get it:** https://platform.openai.com/api-keys
   - **Add to `.env`:**
     ```env
     OPENAI_API_KEY=sk-your-key-here
     ```
   - **Without it:** Negotiation uses rule-based fallback (still works!)

3. **Telegram Bot Token** (For Telegram Notifications)
   - **Why:** Sends notifications via Telegram
   - **Get it:** Message [@BotFather](https://t.me/botfather) → `/newbot`
   - **Add to `.env`:**
     ```env
     TELEGRAM_BOT_TOKEN=your_token_here
     ```
   - **Without it:** Telegram notifications won't work (Email still works)

4. **Email SMTP** (For Email Notifications)
   - **Why:** Sends notifications via email
   - **For Gmail:** Use App Password (https://myaccount.google.com/apppasswords)
   - **Add to `.env`:**
     ```env
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=your-app-password
     EMAIL_FROM=noreply@cargoai.com
     ```
   - **Without it:** Email notifications won't work (Telegram still works)

## 🚀 Step 3: Create `.env` File

```bash
# Windows
Copy-Item env.example .env

# Mac/Linux
cp env.example .env
```

Then edit `.env` and add at minimum:
```env
# Database (REQUIRED)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=cargo_ai

# Everything else can be empty for testing
```

## 🎬 Step 4: Start the Application

```bash
npm run start:dev
```

You should see:
```
🚀 CargoAI Backend running on http://localhost:3000
```

## ✅ Step 5: Verify It's Working

**Access Swagger UI (Interactive API Documentation):**
```
http://localhost:3000/api
```

This gives you a beautiful UI to:
- Browse all API endpoints
- See request/response schemas
- Test endpoints directly in the browser
- View example requests

Or test with curl:
```bash
curl http://localhost:3000
```

## 📊 What Works With Minimal Setup

| Feature | Status |
|---------|--------|
| Database Connection | ✅ Required |
| Filter Agent | ✅ Works |
| Offer Agent | ✅ Works |
| Negotiation (Rule-based) | ✅ Works |
| Negotiation (AI-powered) | ⚠️ Needs OpenAI key |
| Email Notifications | ❌ Needs SMTP |
| Telegram Notifications | ❌ Needs Bot Token |
| WebSocket Gateway | ✅ Works |

## 🐛 Troubleshooting

### "Cannot connect to database"
- Make sure PostgreSQL is running
- Check `.env` credentials
- Verify database exists: `psql -U postgres -l`

### "Port 3000 already in use"
- Change `PORT=3001` in `.env`
- Or kill the process using port 3000

### "OpenAI API error"
- This is normal if you don't have a key
- Negotiation will use fallback responses
- Add `OPENAI_API_KEY` to enable AI features

## 📚 Next Steps

1. **Read [QUICKSTART.md](./QUICKSTART.md)** for detailed setup
2. **Read [API.md](./API.md)** for API documentation
3. **Read [README.md](./README.md)** for full documentation

---

**Ready to start?** Just set up PostgreSQL and create your `.env` file! 🚀

