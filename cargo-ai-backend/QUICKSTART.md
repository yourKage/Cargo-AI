# 🚀 Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file from the example:

```bash
# On Windows (PowerShell)
Copy-Item env.example .env

# On Mac/Linux
cp env.example .env
```

### 3. Required Services (Must Have)

#### ✅ PostgreSQL Database (REQUIRED)

**Option A: Local PostgreSQL**
1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create database:
   ```bash
   # Windows (PowerShell as Administrator)
   psql -U postgres
   CREATE DATABASE cargo_ai;
   \q
   
   # Mac/Linux
   sudo -u postgres createdb cargo_ai
   ```

**Option B: Docker (Easiest)**
```bash
docker run --name cargo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cargo_ai -p 5432:5432 -d postgres:15
```

**Update `.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=cargo_ai
```

### 4. Optional Services (Can Skip for Testing)

#### ⚠️ OpenAI API Key (Required for Negotiation Agent)

1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
   **Note:** Without this, negotiation will use fallback rule-based responses.

#### ⚠️ Telegram Bot (Required for Telegram Notifications)

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Add to `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```
   **Note:** Without this, Telegram notifications won't work (Email will still work).

#### ⚠️ Email SMTP (Required for Email Notifications)

**For Gmail:**
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@cargoai.com
   ```
   **Note:** Without this, Email notifications won't work (Telegram will still work).

#### ⚠️ Redis (Optional - Not Used Yet)

Redis is in dependencies but not actively used. You can skip it for now.

### 5. Minimum Setup to Start (Testing Mode)

**Minimum `.env` file to get started:**

```env
# Server
PORT=3000
NODE_ENV=development

# Database (REQUIRED)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=cargo_ai

# OpenAI (Optional - negotiation will use fallback without it)
OPENAI_API_KEY=

# Telegram (Optional - skip Telegram notifications)
TELEGRAM_BOT_TOKEN=

# Email (Optional - skip Email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@cargoai.com
```

### 6. Start the Application

```bash
# Development mode (with hot reload)
npm run start:dev
```

You should see:
```
🚀 CargoAI Backend running on http://localhost:3000
```

### 7. Verify It's Working

Open your browser or use curl:

```bash
# Test health (if you add a health endpoint)
curl http://localhost:3000

# The app should be running!
```

## 🎯 What Works Without External Services

| Feature | Works Without Config? | Notes |
|---------|----------------------|-------|
| **Database** | ❌ NO | **REQUIRED** - App won't start |
| **Filter Agent** | ✅ YES | Works fully |
| **Offer Agent** | ✅ YES | Works fully |
| **Negotiation Agent** | ⚠️ PARTIAL | Uses rule-based fallback without OpenAI |
| **Email Notifications** | ❌ NO | Needs SMTP config |
| **Telegram Notifications** | ❌ NO | Needs bot token |
| **WebSocket Gateway** | ✅ YES | Works fully |

## 🔧 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Make sure PostgreSQL is running
- Check credentials in `.env`
- Verify database exists: `psql -U postgres -l` (should see `cargo_ai`)

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Change `PORT=3001` in `.env`
- Or kill the process using port 3000

### OpenAI API Errors

If you see OpenAI errors but don't have an API key:
- This is normal - negotiation will use fallback responses
- Add `OPENAI_API_KEY` to `.env` to enable AI negotiation

## 📝 Next Steps After Starting

1. **Create a Dispatcher** (manually in database or via API)
2. **Set Dispatcher Config** via `PUT /dispatcher/:id/config`
3. **Submit a Broker Post** via `POST /broker-post?dispatcherId=:id`
4. **Check Filtered Results** via `GET /loads/top?dispatcherId=:id`

## 🐳 Docker Compose (All-in-One Setup)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cargo_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Then run:
```bash
docker-compose up -d
```

This starts PostgreSQL and Redis automatically!

## ✅ Checklist

- [ ] Node.js installed (v18+)
- [ ] `npm install` completed
- [ ] `.env` file created
- [ ] PostgreSQL running and database created
- [ ] Database credentials in `.env`
- [ ] (Optional) OpenAI API key added
- [ ] (Optional) Telegram bot token added
- [ ] (Optional) Email SMTP configured
- [ ] `npm run start:dev` runs successfully
- [ ] Server responds on http://localhost:3000

---

**Need help?** Check the main [README.md](./README.md) for detailed API documentation.

