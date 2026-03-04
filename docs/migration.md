# Migration Guide from v3.x to v4.0

This guide helps you upgrade the Campus Network Monitor (CNM) application from version 3.x to the upcoming 4.0 release.

## 1. Backup

1. Stop the current CNM service.
2. Backup the SQLite database file (`network_monitor.db`) and any configuration files.

```bash
cp network_monitor.db network_monitor.db.bak
cp .env .env.bak
```

## 2. Upgrade Codebase

- Pull the latest v4.0 branch containing new features and Kubernetes manifests.
- Review `Dockerfile`, `helm/`, and `k8s/` directories for deployment changes.

```bash
git checkout v4.0
```

## 3. Install New Dependencies

Backend requires new Python packages (`prometheus_client`, etc.). Run:

```bash
cd backend
pip install -r requirements.txt
```

Frontend dependencies are unchanged, but you may run a fresh install:

```bash
cd frontend
npm ci
```

## 4. Database Schema Changes

The new version adds `anomalies` and `predictions` tables to the database. These are created automatically by the updated `init_db.py` if you re-run it, but **do not** re-run on a production database unless you're willing to re-populate devices and history.

To migrate an existing database without re-initializing, run:

```bash
sqlite3 network_monitor.db < deploy/migrations/2026_03_add_anomalies_predictions.sql
```

(See `deploy/migrations/` for SQL scripts.)

## 5. Configure New Environmental Variables

Add the following additional vars to your `.env` or secrets manager:

- `PROMETHEUS_ENABLED=true`
- `PAGERDUTY_ROUTING_KEY` (if using PagerDuty)
- `JWT_SECRET_KEY` (if upgrading from unauthenticated version)

## 6. Deploy

Follow the Docker or Kubernetes deployment instructions in this repository:

- `docker-compose.yml` for local development
- `helm/` and `k8s/` for production clusters

## 7. Verify

- Access `/metrics` to ensure Prometheus metrics are being exported.
- Trigger an anomaly by artificially increasing latency and check `/api/analytics/anomalies`.
- Run `GET /api/analytics/predictions` to see predicted values.

## 8. Rollback

If something goes wrong, stop services, restore the database backup, and redeploy the previous version:

```bash
cp network_monitor.db.bak network_monitor.db
git checkout v3.x
```

## 9. Post-upgrade Notes

- Update documentation and notify users about new features (analytics, export, mobile app).
- Monitor logs for errors and increase logging verbosity if needed.
