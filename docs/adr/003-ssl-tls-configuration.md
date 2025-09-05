# ADR-003: SSL/TLS Configuration Strategy

## Status
Accepted

## Context
The backend API requires HTTPS termination to secure communication with clients. We need to decide between using AWS-managed solutions (Application Load Balancer + AWS Certificate Manager) versus a cost-optimized approach using Let's Encrypt certificates.

## Decision
We will use Let's Encrypt SSL certificates with Nginx reverse proxy on EC2 instances for SSL termination, rather than AWS Certificate Manager with Application Load Balancer.

## Rationale

### Cost Optimization
- **Savings**: ~$16/month by avoiding Application Load Balancer
- **Free SSL**: Let's Encrypt provides free SSL certificates
- **EC2 Utilization**: Better resource utilization on existing EC2 instances

### Trade-offs Considered
- **Manual Management**: Requires managing SSL certificate renewal vs ACM automation
- **Operational Overhead**: Need to maintain Nginx configuration and certbot
- **Single Point of Failure**: No built-in high availability like ALB provides

## Implementation Details

### SSL Termination Architecture
- **Location**: Nginx reverse proxy on EC2 instance
- **Certificate Provider**: Let's Encrypt
- **Renewal**: Automated via certbot cron job
- **Backend Communication**: HTTP between Nginx and ECS containers (internal network)

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name be.easygenerator.omarshabaan.tech;
    
    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/be.easygenerator.omarshabaan.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/be.easygenerator.omarshabaan.tech/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Proxy Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    server_name be.easygenerator.omarshabaan.tech;
    return 301 https://$server_name$request_uri;
}
```

### Certificate Renewal Automation
```bash
# Crontab entry for automatic renewal
0 2 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Monitoring and Alerting
- **Certificate Expiry**: Monitor certificate expiration dates
- **SSL Health**: Regular SSL endpoint health checks
- **Renewal Logs**: Monitor certbot renewal success/failure

## Future Considerations
- **Migration Path**: Can migrate to ALB + ACM when traffic/revenue justifies additional cost
- **High Availability**: Consider multiple EC2 instances with load balancer for HA
- **Wildcard Certificates**: Evaluate wildcard SSL for subdomain expansion

## Consequences

### Positive
- Significant cost savings (~$192/year)
- Full control over SSL configuration
- Learning opportunity for SSL management
- Flexible proxy configuration

### Negative
- Manual certificate management overhead
- Single point of failure for SSL termination
- Additional operational complexity
- No automatic failover capabilities

## Implementation Status
- [x] Nginx configuration deployed
- [x] Let's Encrypt certificate obtained
- [x] Automatic renewal configured
- [x] Security headers implemented
- [ ] Certificate monitoring alerts
- [ ] SSL health check automation