# Security Guide

This document outlines best practices for securing Campus Network Monitor.

## Secret Management

- **Environment variables**: Store keys and tokens in environment variables or a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
- **Avoid `.env` in version control**: The `.env` file is for local development only. Use a template `.env.example` that does not contain real secrets.
- **Use encrypted secrets**: If using GitHub Actions, place sensitive values in encrypted repository secrets.

## JWT and Authentication

- Change `JWT_SECRET_KEY` to a strong random value in production.
- Set token expiration appropriately and consider rotating keys.
- Use HTTPS everywhere; never transmit tokens over HTTP.

## Database Security

- Restrict access to the SQLite file or migrate to a managed database (Postgres, MySQL) for production.
- Enable file permissions to prevent unauthorized read/write.

## Docker and Containers

- Do not build images with secret values baked in. Pass them as environment vars at runtime or use Docker secrets.
- Scan images for vulnerabilities using tools like `trivy` or `clair`.

## Kubernetes

- Use `Secrets` objects to store credentials; mount them as environment variables or volumes.
- Enable RBAC and limit service account permissions.
- Use network policies to restrict traffic between pods.

## Logging and Monitoring

- Sanitize logs to avoid logging sensitive information.
- Configure log rotation and retention policies.

## Additional Recommendations

- Implement rate limiting to protect APIs.
- Consider using a Web Application Firewall (WAF) in front of the service.
- Regularly update dependencies and apply security patches.
- Perform periodic penetration testing and code reviews.

## Incident Response

- Define procedures for responding to security incidents.
- Maintain contact information for key personnel.
- Keep backups and ensure you can restore quickly.
