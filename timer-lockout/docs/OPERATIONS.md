# Operations Guide

This document provides comprehensive information for operating the Timer Lockout Application in production environments.

---

## 🚀 Starting the Application

### Development Mode

Start the development server:

```bash
# From the timer-lockout directory
npm run dev
```

**What Happens**:
1. Vite development server starts on port 5173
2. TypeScript files are compiled on-the-fly
3. Tailwind CSS is processed
4. Browser opens automatically to `http://localhost:5173`
5. Hot Module Replacement (HMR) is enabled

**Stopping**: Press `Ctrl + C` in the terminal

---

### Production Mode

Build and serve the production version:

```bash
# Build for production
npm run build

# Serve production build
npm run preview
```

**What Happens**:
1. Production build is generated in `dist/`
2. Vite preview server starts
3. Application is served from `dist/`
4. Production-optimized assets are loaded

**Note**: `npm run preview` is for local testing only. For production, use a proper web server (Nginx, Apache, etc.).

---

## 🛑 Stopping the Application

### Development Server

Press `Ctrl + C` in the terminal where the development server is running.

### Production Server

The method depends on how the application is deployed:

| Deployment Method | Stop Command |
|-------------------|--------------|
| Nginx | `sudo systemctl stop nginx` or `sudo nginx -s stop` |
| Apache | `sudo systemctl stop apache2` or `sudo apachectl stop` |
| Node.js server | `Ctrl + C` or `kill <PID>` |
| Docker | `docker stop <container-id>` |
| Vercel | Automatic (serverless) |
| Netlify | Automatic (serverless) |
| GitHub Pages | Automatic (serverless) |

---

## 🔄 Restarting the Application

### Development Server

1. Stop the server: `Ctrl + C`
2. Start again: `npm run dev`

### Production Server

The method depends on the deployment:

| Deployment Method | Restart Command |
|-------------------|-----------------|
| Nginx | `sudo systemctl restart nginx` |
| Apache | `sudo systemctl restart apache2` |
| Node.js server | Stop and start again |
| Docker | `docker restart <container-id>` |
| Docker Compose | `docker-compose restart` |

---

## 📊 Monitoring

### Development Monitoring

**Built-in Monitoring**:
- Console output: Build status, errors, warnings
- Browser console: Runtime errors, warnings
- Vite overlay: Compilation errors in browser

**View Logs**:
```bash
# View terminal output
# (Development server logs are shown in terminal)
```

### Production Monitoring

The monitoring approach depends on the deployment method:

#### Static Hosting (Vercel, Netlify, GitHub Pages)

**Monitoring Options**:
- Provider dashboard (Vercel, Netlify)
- GitHub Actions logs (GitHub Pages)
- Browser console for client-side errors

**View Vercel Logs**:
```bash
# Install Vercel CLI
npm install -g vercel

# View logs
vercel logs
```

**View Netlify Logs**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# View logs
netlify logs
```

#### Docker Deployment

**View Container Logs**:
```bash
# View logs for running container
docker logs <container-id>

# View logs with follow
docker logs -f <container-id>

# View logs with timestamps
docker logs -t <container-id>

# View last N lines
docker logs --tail=100 <container-id>
```

**Docker Compose**:
```bash
# View logs for service
docker-compose logs

# View logs with follow
docker-compose logs -f

# View logs for specific service
docker-compose logs timer-lockout
```

#### Nginx Deployment

**View Nginx Logs**:
```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log

# Combined
sudo tail -f /var/log/nginx/*.log
```

**Nginx Status**:
```bash
# Check if running
sudo systemctl status nginx

# Check active connections
sudo nginx -t
```

---

## 🏥 Health Checks

### Development Health Check

The application is healthy if:
- Development server starts without errors
- Browser loads the application
- No console errors
- Timer functionality works

### Production Health Check

#### Built-in Health Check

The application includes a health check endpoint:

```
GET /health
```

**Response**:
```
HTTP 200 OK
Content-Type: text/plain

OK
```

**Configure in Nginx**:
```nginx
location /health {
    access_log off;
    return 200 "OK\n";
    add_header Content-Type text/plain;
}
```

#### Manual Health Check

1. **HTTP Request**:
   ```bash
   curl -I http://yourdomain.com/
   ```
   Should return HTTP 200

2. **Load Application**: Open in browser, should load without errors

3. **Test Functionality**:
   - Timer starts
   - Countdown works
   - Lockout activates
   - Reset works

4. **Check Assets**:
   ```bash
   curl -I http://yourdomain.com/assets/index-*.js
   curl -I http://yourdomain.com/assets/index-*.css
   ```
   Should return HTTP 200

---

## 📝 Logging

### Development Logging

**Console Output**:
- Vite build information
- Compilation errors
- Warnings
- Development server status

**Browser Console**:
- React warnings
- Runtime errors
- Debug output

### Production Logging

Logging depends on the deployment method:

#### Static Hosting

**Client-Side Logging**:
- Errors are logged to browser console
- Can be captured by error tracking services

**Add Error Tracking**:
```typescript
// In main.tsx or similar
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_DSN',
  release: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.PROD ? 'production' : 'development',
});
```

#### Docker Logging

**Container Logs**:
```bash
# View logs
docker logs <container-id>

# View with follow
docker logs -f <container-id>

# View with timestamps
docker logs -t <container-id>
```

**Log Rotation**:
```bash
# Configure log rotation in Docker
docker run \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  timer-lockout
```

#### Nginx Logging

**Access Log**:
```bash
# View access log
sudo tail -f /var/log/nginx/access.log

# Filter by date
grep "2024-01-01" /var/log/nginx/access.log

# Count requests by status
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c
```

**Error Log**:
```bash
# View error log
sudo tail -f /var/log/nginx/error.log

# Filter by error level
grep "error" /var/log/nginx/error.log
```

**Log Rotation**:
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/nginx
```

---

## 🔧 Maintenance Procedures

### Regular Maintenance Tasks

| Task | Frequency | Purpose |
|------|-----------|---------|
| **Check logs** | Daily | Identify issues |
| **Test functionality** | Weekly | Ensure working |
| **Update dependencies** | Monthly | Security and features |
| **Review performance** | Monthly | Identify bottlenecks |
| **Backup configuration** | Monthly | Disaster recovery |
| **Security audit** | Quarterly | Identify vulnerabilities |

### Dependency Updates

**Check for Updates**:
```bash
npm outdated
```

**Update Dependencies**:
```bash
# Update all dependencies
npm update

# Update specific package
npm update package-name

# Update to latest versions (major)
npm install package-name@latest
```

**After Updating**:
1. Run tests: `npm run test`
2. Run linting: `npm run lint`
3. Run type checking: `npm run type-check`
4. Test application manually
5. Commit changes

---

### Configuration Backup

**Backup Important Files**:
```bash
# Backup configuration files
tar -czvf backup-config.tar.gz \
  .env \
  vite.config.ts \
  tailwind.config.js \
  nginx.conf \
  Dockerfile
```

**Restore from Backup**:
```bash
tar -xzvf backup-config.tar.gz
```

---

## 🛠️ Common Operational Tasks

### Scale Application

The Timer Lockout Application is a **static application**, so scaling is handled by the hosting provider:

| Provider | Scaling | Notes |
|----------|---------|-------|
| Vercel | Automatic | Scales with demand |
| Netlify | Automatic | Scales with demand |
| GitHub Pages | Automatic | Limited scaling |
| AWS S3 + CloudFront | Automatic | Scales with CloudFront |
| Docker | Manual | Scale containers as needed |

### Monitor Performance

**Lighthouse Audit**:
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Run audit
4. Review scores

**WebPageTest**:
1. Go to [https://www.webpagetest.org/](https://www.webpagetest.org/)
2. Enter URL
3. Run test
4. Review results

**Google PageSpeed Insights**:
1. Go to [https://pagespeed.web.dev/](https://pagespeed.web.dev/)
2. Enter URL
3. Run test
4. Review suggestions

### Update Application

**Deployment Update Process**:

1. **Make Changes**:
   - Update code
   - Update tests
   - Update documentation

2. **Test Changes**:
   ```bash
   npm run check
   ```

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push Changes**:
   ```bash
   git push origin main
   ```

5. **Deploy**:
   - Automatic (if CI/CD configured)
   - Manual (if not)

---

## 🚨 Emergency Procedures

### Application Not Loading

**Steps**:
1. Check server status
2. Verify files are deployed
3. Check browser console for errors
4. Test with different browser
5. Check network connectivity

**Rollback**: Deploy previous version

### Performance Degradation

**Steps**:
1. Run Lighthouse audit
2. Check for large assets
3. Check for console errors
4. Review recent changes
5. Check server load

**Mitigation**: Rollback to previous version

### Security Incident

**Steps**:
1. Identify the vulnerability
2. Assess the impact
3. Contain the issue (take down if necessary)
4. Fix the vulnerability
5. Deploy fix
6. Monitor for further issues

**Example**: If a vulnerability is found in a dependency:
```bash
# Check for vulnerability
npm audit

# Update vulnerable package
npm update vulnerable-package

# Rebuild and redeploy
npm run build
# Deploy new version
```

---

## 📊 Operational Metrics

### Key Metrics to Monitor

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | > 99.9% | Monitoring service |
| **Response Time** | < 500ms | Browser timing |
| **Error Rate** | < 0.1% | Error tracking |
| **Page Load Time** | < 2s | Lighthouse |
| **Bundle Size** | < 200 KB | Build output |
| **Time to Interactive** | < 1s | Lighthouse |

### Monitoring Tools

| Tool | Purpose | Setup |
|------|---------|-------|
| **Lighthouse** | Performance audit | Built into Chrome |
| **WebPageTest** | Performance testing | webpagetest.org |
| **Google Analytics** | User analytics | Add tracking code |
| **Sentry** | Error tracking | Add SDK |
| **LogRocket** | Session replay | Add SDK |

---

## 🔗 Related Documentation

- [SETUP.md](./SETUP.md) - Setup instructions
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration options
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Troubleshooting guide
- [SECURITY.md](./SECURITY.md) - Security considerations
