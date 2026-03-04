# 🌐 Complete Deployment Guide - Campus Network Monitor v3.0

## Table of Contents
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Security Hardening](#security-hardening)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🏠 Local Development

### Prerequisites
```bash
# Check versions
python --version  # Should be 3.8+
node --version    # Should be 16+
npm --version
```

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/yourusername/campus-network-monitor.git
cd campus-network-monitor

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python init_db.py
python app.py

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# 4. Access at http://localhost:3000
```

---

## 🏭 Production Deployment

### Option 1: Traditional Server (Ubuntu/CentOS)

#### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.8+
sudo apt install python3.8 python3-pip python3-venv -y

# Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs -y

# Install Nginx
sudo apt install nginx -y

# Install Supervisor (process manager)
sudo apt install supervisor -y

# Install certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

#### Step 2: Deploy Application
```bash
# Create application directory
sudo mkdir -p /var/www/campus-network-monitor
cd /var/www/campus-network-monitor

# Clone repository
sudo git clone https://github.com/yourusername/campus-network-monitor.git .

# Set permissions
sudo chown -R www-data:www-data /var/www/campus-network-monitor

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn  # Production WSGI server

# Create production .env
sudo nano /var/www/campus-network-monitor/backend/.env
```

**Production `.env` example:**
```env
JWT_SECRET_KEY=generate-random-64-character-string-here
DATABASE_NAME=/var/www/campus-network-monitor/backend/network_monitor.db
DEBUG=False
LOG_LEVEL=WARNING

# Add your production credentials
SENDGRID_API_KEY=your-production-key
SLACK_WEBHOOK_URL=your-production-webhook
```
```bash
# Initialize database
python init_db.py

# Frontend setup
cd /var/www/campus-network-monitor/frontend
npm install
npm run build  # Creates production build

# Build output will be in frontend/dist/
```

#### Step 3: Configure Gunicorn (Backend)

Create `/etc/supervisor/conf.d/campus-monitor-backend.conf`:
```ini
[program:campus-monitor-backend]
directory=/var/www/campus-network-monitor/backend
command=/var/www/campus-network-monitor/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/campus-monitor/backend.err.log
stdout_logfile=/var/log/campus-monitor/backend.out.log
environment=PYTHONPATH="/var/www/campus-network-monitor/backend"
```

Create log directory:
```bash
sudo mkdir -p /var/log/campus-monitor
sudo chown www-data:www-data /var/log/campus-monitor
```

Start backend:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start campus-monitor-backend
```

#### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/campus-monitor`:
```nginx
# Backend API
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name your-domain.com;  # Change this

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend (React build)
    root /var/www/campus-network-monitor/frontend/dist;
    index index.html;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/campus-monitor-access.log;
    error_log /var/log/nginx/campus-monitor-error.log;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/campus-monitor /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

#### Step 5: Setup SSL (HTTPS)
```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

After SSL setup, update Nginx config to force HTTPS (uncomment the redirect line).

#### Step 6: Setup Monitoring Service

Create `/etc/systemd/system/campus-monitor-monitoring.service`:
```ini
[Unit]
Description=Campus Network Monitoring Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/campus-network-monitor/backend
Environment="PYTHONPATH=/var/www/campus-network-monitor/backend"
ExecStart=/var/www/campus-network-monitor/backend/venv/bin/python monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable campus-monitor-monitoring
sudo systemctl start campus-monitor-monitoring
sudo systemctl status campus-monitor-monitoring
```

---

## 🐳 Docker Deployment

### Create `Dockerfile` (Backend)

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy application
COPY . .

# Create database directory
RUN mkdir -p /data

# Expose port
EXPOSE 5000

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV DATABASE_NAME=/data/network_monitor.db

# Initialize database and start application
CMD ["sh", "-c", "python init_db.py && gunicorn -w 4 -b 0.0.0.0:5000 app:app"]
```

### Create `Dockerfile` (Frontend)

Create `frontend/Dockerfile`:
```dockerfile
# Build stage
FROM node:16-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to backend
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Create `docker-compose.yml` (Project Root):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: campus-monitor-backend
    ports:
      - "5000:5000"
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DATABASE_NAME=/data/network_monitor.db
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
    volumes:
      - ./data:/data
      - ./backend/.env:/app/.env
    restart: unless-stopped
    networks:
      - campus-network

  frontend:
    build: ./frontend
    container_name: campus-monitor-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - campus-network

  monitoring:
    build: ./backend
    container_name: campus-monitor-monitoring
    command: python monitor.py
    environment:
      - DATABASE_NAME=/data/network_monitor.db
    volumes:
      - ./data:/data
      - ./backend/.env:/app/.env
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - campus-network

networks:
  campus-network:
    driver: bridge

volumes:
  data:
```

### Deploy with Docker:
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

---

## ☁️ Cloud Deployment

### AWS Deployment (EC2 + RDS)

#### Step 1: Launch EC2 Instance
```bash
# Launch Ubuntu 20.04 LTS instance
# Instance type: t2.medium (minimum)
# Security group:
#   - Port 22 (SSH)
#   - Port 80 (HTTP)
#   - Port 443 (HTTPS)
#   - Port 5000 (Backend - internal only)
```

#### Step 2: Setup EC2
```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow "Traditional Server" deployment steps above
```

#### Step 3: Use RDS for Database (Optional)

Replace SQLite with PostgreSQL:
```bash
# Install PostgreSQL adapter
pip install psycopg2-binary

# Update .env
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/campus_monitor
```

### Heroku Deployment

#### Create `Procfile` (Backend):
```
web: gunicorn app:app
monitor: python monitor.py
```

#### Create `runtime.txt`:
```
python-3.9.16
```

#### Deploy to Heroku:
```bash
# Install Heroku CLI
# Create Heroku app
heroku create campus-network-monitor

# Set environment variables
heroku config:set JWT_SECRET_KEY=your-secret-key
heroku config:set SENDGRID_API_KEY=your-key

# Deploy
git push heroku main

# Scale services
heroku ps:scale web=1 monitor=1

# View logs
heroku logs --tail
```

### DigitalOcean App Platform

#### Create `app.yaml`:
```yaml
name: campus-network-monitor
services:
  - name: backend
    github:
      repo: yourusername/campus-network-monitor
      branch: main
      deploy_on_push: true
    source_dir: /backend
    run_command: gunicorn -w 4 -b 0.0.0.0:5000 app:app
    envs:
      - key: JWT_SECRET_KEY
        value: ${JWT_SECRET_KEY}
      - key: DATABASE_NAME
        value: /data/network_monitor.db
    
  - name: frontend
    github:
      repo: yourusername/campus-network-monitor
      branch: main
    source_dir: /frontend
    build_command: npm install && npm run build
    output_dir: dist
    routes:
      - path: /
```

---

## 🔒 Security Hardening

### 1. Backend Security

#### Update `backend/app.py`:

Add security middleware:
```python
from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

app = Flask(__name__)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Security headers (production only)
if not app.debug:
    Talisman(app, 
        force_https=True,
        strict_transport_security=True,
        session_cookie_secure=True,
        content_security_policy={
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline'",
            'style-src': "'self' 'unsafe-inline'"
        }
    )

# Apply rate limiting to sensitive endpoints
@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # ... existing code
```

Install dependencies:
```bash
pip install flask-limiter flask-talisman
```

### 2. Database Security
```bash
# Restrict database file permissions
chmod 600 network_monitor.db
chown www-data:www-data network_monitor.db

# Backup database regularly
sudo crontab -e
# Add: 0 2 * * * cp /var/www/campus-network-monitor/backend/network_monitor.db /backups/db-$(date +\%Y\%m\%d).db
```

### 3. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Fail2ban (brute force protection)
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Environment Variables Security
```bash
# Never commit .env to git
# Use secrets management in production

# AWS Secrets Manager example
aws secretsmanager create-secret \
    --name campus-monitor/prod/jwt-secret \
    --secret-string "your-secret-key"

# Update app to fetch from secrets manager
```

### 5. SSL/TLS Configuration

Update Nginx for A+ SSL rating:
```nginx
# Add to nginx config
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

---

## 📊 Monitoring & Maintenance

### 1. Application Monitoring

#### Install Prometheus + Grafana:

Create `docker-compose.monitoring.yml`:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus-data:
  grafana-data:
```

### 2. Log Management

#### Configure Logrotate:

Create `/etc/logrotate.d/campus-monitor`:
```
/var/log/campus-monitor/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        supervisorctl restart campus-monitor-backend
    endscript
}
```

### 3. Backup Strategy

Create `backup.sh`:
```bash
#!/bin/bash

# Backup script for Campus Network Monitor
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/campus-monitor"
APP_DIR="/var/www/campus-network-monitor"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $APP_DIR/backend/network_monitor.db $BACKUP_DIR/db_$DATE.db

# Backup .env file
cp $APP_DIR/backend/.env $BACKUP_DIR/env_$DATE.backup

# Compress old backups
find $BACKUP_DIR -name "*.db" -mtime +7 -exec gzip {} \;

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:
```bash
chmod +x backup.sh
sudo crontab -e
# Add: 0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### 4. Health Checks

Create `healthcheck.sh`:
```bash
#!/bin/bash

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)

if [ $BACKEND_STATUS -ne 200 ]; then
    echo "Backend is down! Status: $BACKEND_STATUS"
    # Send alert
    curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"🚨 Backend is down!"}'
    # Restart service
    sudo systemctl restart campus-monitor-backend
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is high: $DISK_USAGE%"
    # Send alert
fi
```

Schedule health checks:
```bash
*/5 * * * * /path/to/healthcheck.sh
```

### 5. Performance Optimization

#### Backend Optimization:
```python
# Add caching
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/summary')
@cache.cached(timeout=30)  # Cache for 30 seconds
def get_summary():
    # ... existing code
```

#### Database Optimization:
```sql
-- Add indexes for faster queries
CREATE INDEX idx_device_status_timestamp ON device_status(timestamp);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
```

---

## 🔄 Updates & Rollbacks

### Update Application:
```bash
# Pull latest code
cd /var/www/campus-network-monitor
sudo git pull origin main

# Backend update
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart campus-monitor-backend

# Frontend update
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

### Rollback:
```bash
# Revert to previous commit
git log  # Find commit hash
git checkout <commit-hash>

# Rebuild and restart
# ... follow update steps above
```

---

## 📈 Scaling

### Horizontal Scaling:

1. **Load Balancer**: Add Nginx load balancer
2. **Multiple Backend Instances**: Run on different ports
3. **Shared Database**: Use PostgreSQL instead of SQLite
4. **Redis for Caching**: Shared cache between instances
```nginx
# Load balancer config
upstream backend_cluster {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}
```

### Vertical Scaling:

- Increase EC2 instance size
- Add more RAM
- Use SSD storage
- Optimize database queries

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **502 Bad Gateway**: Backend not running
```bash
   sudo supervisorctl status
   sudo systemctl status campus-monitor-backend
```

2. **Database locked**: Check permissions
```bash
   ls -la network_monitor.db
   chmod 600 network_monitor.db
```

3. **High memory usage**: Restart services
```bash
   sudo systemctl restart campus-monitor-backend
```

### Logs Location:

- Backend: `/var/log/campus-monitor/backend.err.log`
- Nginx: `/var/log/nginx/campus-monitor-error.log`
- System: `journalctl -u campus-monitor-backend`

---

## ✅ Post-Deployment Checklist

- [ ] SSL certificate installed and working
- [ ] Firewall configured
- [ ] Fail2ban enabled
- [ ] Backups scheduled
- [ ] Health checks running
- [ ] Monitoring configured
- [ ] Logs rotation set up
- [ ] Environment variables secured
- [ ] Default passwords changed
- [ ] Documentation updated
- [ ] Team trained on access

---

## 🎉 Deployment Complete!

Your Campus Network Monitor is now production-ready and secure!

**Access your application:**
- Frontend: https://your-domain.com
- API: https://your-domain.com/api/health
- Grafana (if installed): http://your-domain.com:3001

**Next Steps:**
1. Add your network devices
2. Configure alerting channels
3. Set up custom thresholds
4. Train your team
5. Monitor and optimize

---

**Questions or issues?** Check logs and documentation above.