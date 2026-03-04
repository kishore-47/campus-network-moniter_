# Campus Network Monitor

Campus Network Monitor is a full-stack application for real-time network health monitoring, analytics, and alerting. Version 4.0 introduces containerization, Kubernetes deployment, cloud support, mobile app, AI-driven anomaly detection, predictive analytics, advanced reporting, and more.

## Features

- **Real-time monitoring** with ping-based status and latency tracking
- **Alerting** across email, SMS, Slack, Discord, Teams, and PagerDuty
- **Analytics** including trends, anomaly detection, and predictions
- **Mobile app** (React Native) for on-the-go visibility
- **Docker & Kubernetes** support with Helm charts
- **Cloud deployments** for AWS (EKS) and Azure (AKS)
- **Prometheus metrics** and centralized logging
- **CI/CD pipeline** (GitHub Actions)
- **Security & secrets** best practices included

## Quickstart

1. Initialize database: `cd backend && python init_db.py`
2. Start backend: `cd backend && python app.py`
3. Start frontend: `cd frontend && npm run dev`
4. Open http://localhost:3001

For containerized setup:

```bash
docker compose up --build
```


## Documentation

See `docs/` for detailed guides on deployment, migration, architecture, and security.

## Contact

Your organization's network team.
