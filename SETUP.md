# 🚀 V3.0 Setup Instructions

## Prerequisites

- Python 3.8+
- Node.js 16+
- Git

## Quick Start

### 1. Clone Repository
```bash
git clone <your-repo>
cd campus-network-monitor
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor

# Initialize database
python init_db.py

# Start backend
python app.py
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# (important) configure backend URL for the frontend. create a .env file or
# add to your environment:
#
#   VITE_API_URL=http://localhost:5000
#
# If you omit this variable the production build will default to calling
# `/api` on the same host where the frontend is served.

# Start frontend
npm run dev
```

### 4. Access Application

Open browser: `http://localhost:3000`

**Default Login:**
- Username: `admin`
- Password: `admin123`

## Configuration

### Email Alerts (Optional)

1. Sign up at https://sendgrid.com/
2. Get your API key
3. Add to `.env`:
```env
SENDGRID_API_KEY=SG.your-key-here
FROM_EMAIL=alerts@yourdomain.com
```

### SMS Alerts (Optional)

1. Sign up at https://www.twilio.com/
2. Get credentials
3. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE=+1234567890
```

### Slack Notifications (Optional)

1. Create Slack webhook
2. Add to `.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## Features Available

### V3.0 Features
- ✅ User Authentication
- ✅ Role-Based Access Control
- ✅ Network Topology Viewer
- ✅ Threshold Configuration
- ✅ Analytics Dashboard
- ✅ Email/SMS/Webhook Alerts (when configured)

## Troubleshooting

### Frontend cannot reach backend
- Make sure `VITE_API_URL` is set in `frontend/.env` or passed to the build. For production
  builds you can also configure your reverse proxy so `/api` routes to the Flask service.
- Open browser developer tools and inspect network requests; look for the value of
  `apiPath` in the console (a warning is logged when the variable is missing).


### Backend won't start
- Check Python version: `python --version`
- Install missing modules: `pip install -r requirements.txt`

### Frontend won't start
- Check Node version: `node --version`
- Delete node_modules: `rm -rf node_modules && npm install`

### Can't login
- Default credentials: admin / admin123
- Check backend is running on port 5000

## Security Notes

⚠️ **Important:**
- Change JWT_SECRET_KEY in production
- Use strong passwords
- Enable HTTPS in production
- Keep .env file secret (never commit to git)