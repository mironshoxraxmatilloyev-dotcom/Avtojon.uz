# 1️⃣1️⃣ TECHNOLOGY & SECURITY

## 🛠️ TECH STACK

### Frontend
```
React 18          - UI framework
Vite              - Build tool
TailwindCSS       - Styling
Zustand           - State management
React Router      - Routing
Recharts          - Charts
Lucide React      - Icons
Capacitor         - Mobile (Android/iOS)
```

### Backend
```
Node.js 20        - Runtime
Express           - Web framework
MongoDB           - Database
Redis             - Caching, sessions
Socket.io         - Real-time
JWT               - Authentication
Multer            - File uploads
```

### AI/ML
```
Groq              - AI inference
Whisper Large v3  - Speech-to-text
Llama 3.3 70B     - NLU/parsing
```

### Infrastructure
```
Hetzner VPS       - Server
Nginx             - Reverse proxy
PM2               - Process manager
Let's Encrypt     - SSL
GitHub            - Version control
GitHub Actions    - CI/CD
```

---

## 🔄 DEVELOPMENT WORKFLOW

### Git Flow

```
main (production)
  │
  └── develop
        │
        ├── feature/voice-input
        ├── feature/fleet-module
        ├── bugfix/login-issue
        └── hotfix/critical-fix
```

### Branch Naming
- `feature/` - Yangi funksiya
- `bugfix/` - Bug tuzatish
- `hotfix/` - Shoshilinch tuzatish
- `refactor/` - Kod yaxshilash

### Commit Convention
```
type(scope): description

feat(voice): add oil change voice input
fix(auth): resolve token refresh issue
docs(readme): update installation guide
refactor(api): optimize database queries
```

### Code Review Checklist
- [ ] Kod ishlaydi va testlar o'tadi
- [ ] Xavfsizlik tekshirildi
- [ ] Performance yaxshi
- [ ] Error handling mavjud
- [ ] Documentation yangilandi

### Deployment Process
```
1. PR to develop → Code review → Merge
2. develop → staging (auto-deploy)
3. Testing on staging
4. PR to main → Merge
5. main → production (auto-deploy)
```

---

## 🔒 SECURITY POLICIES

### Authentication
- JWT tokens (access + refresh)
- Token rotation
- Secure cookie storage
- Rate limiting on auth endpoints

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API key for external access

### Data Security
```
┌─────────────────────────────────────────┐
│           SECURITY LAYERS               │
├─────────────────────────────────────────┤
│  HTTPS (TLS 1.3)                        │
│  ├── API Rate Limiting                  │
│  ├── Input Validation                   │
│  ├── SQL/NoSQL Injection Prevention     │
│  ├── XSS Prevention                     │
│  └── CSRF Protection                    │
├─────────────────────────────────────────┤
│  Database Encryption (at rest)          │
│  Password Hashing (bcrypt)              │
│  Sensitive Data Encryption (AES-256)    │
└─────────────────────────────────────────┘
```

### Security Checklist
- [x] HTTPS everywhere
- [x] Password hashing (bcrypt)
- [x] JWT with expiration
- [x] Rate limiting
- [x] Input validation
- [x] CORS configuration
- [ ] Security headers (Helmet)
- [ ] Penetration testing
- [ ] Security audit

### Vulnerability Response
1. **Detect** - Monitoring, reports
2. **Assess** - Severity, impact
3. **Fix** - Patch, deploy
4. **Notify** - Users (if needed)
5. **Review** - Post-mortem

---

## 💾 BACKUP & RECOVERY

### Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| MongoDB | Daily | 30 days | Remote |
| Redis | Hourly | 7 days | Local |
| Files | Daily | 30 days | Remote |
| Logs | Daily | 90 days | Remote |

### Backup Process
```bash
# MongoDB backup (daily at 3:00 AM)
mongodump --uri="$MONGO_URI" --out=/backup/$(date +%Y%m%d)

# Upload to remote storage
rclone sync /backup remote:avtojon-backup
```

### Recovery Procedures

**Database Recovery:**
```bash
# Restore from backup
mongorestore --uri="$MONGO_URI" /backup/20241225
```

**Disaster Recovery:**
1. Spin up new server
2. Restore from backup
3. Update DNS
4. Verify functionality

### RTO/RPO
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 24 hours

---

## 📈 SCALABILITY PLAN

### Current Architecture (Single Server)
```
Users → Nginx → Node.js → MongoDB
                    ↓
                  Redis
```

### Phase 2: Horizontal Scaling
```
Users → Load Balancer
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
  Node.js Node.js Node.js
    │       │       │
    └───────┼───────┘
            ▼
    MongoDB Replica Set
            │
          Redis Cluster
```

### Phase 3: Microservices
```
API Gateway
    │
    ├── Auth Service
    ├── Flight Service
    ├── Fleet Service
    ├── Voice Service
    └── Notification Service
```

### Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU | >70% | Add server |
| Memory | >80% | Add RAM |
| Response time | >500ms | Optimize/scale |
| Users | >10K | Horizontal scale |

---

## 📊 MONITORING

### Metrics to Track

**Application:**
- Response time
- Error rate
- Request rate
- Active users

**Infrastructure:**
- CPU usage
- Memory usage
- Disk usage
- Network I/O

**Business:**
- Signups
- Active users
- Revenue
- Churn

### Alerting Rules

| Alert | Condition | Action |
|-------|-----------|--------|
| Server down | No response 1 min | Page on-call |
| High error rate | >5% errors | Slack alert |
| High latency | >1s response | Slack alert |
| Disk full | >90% usage | Email alert |

### Tools
- **Uptime:** UptimeRobot
- **Logs:** PM2 logs
- **Metrics:** Custom dashboard
- **Alerts:** Telegram bot
