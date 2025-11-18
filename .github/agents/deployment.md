# Deployment Guide

## Overview

This guide covers deploying the Card Masters game to production environments. The system has two components:

1. **Frontend**: Expo app deployed via Expo Application Services (EAS) or web hosting
2. **Backend**: PartyKit server deployed to PartyKit Cloud

## PartyKit Server Deployment

### Prerequisites

- PartyKit CLI installed: `npm install -g partykit`
- PartyKit account: https://www.partykit.io/

### Initial Setup

```bash
# Navigate to server directory
cd partykit

# Login to PartyKit (first time only)
npx partykit login

# This opens browser for authentication
```

### Deploy Server

```bash
cd partykit

# Deploy to production
yarn deploy

# Or with npm
npm run deploy

# Or directly
npx partykit deploy
```

**Output:**
```
✓ Deploying card-masters-server
✓ Deployed to https://card-masters-server.your-username.partykit.dev
```

### Custom Domain (Optional)

Configure custom domain in PartyKit dashboard:

1. Go to https://partykit.io/dashboard
2. Select your project
3. Navigate to "Domains"
4. Add custom domain (e.g., `game.yourdomain.com`)
5. Update DNS records as instructed
6. Update app environment variable

### Environment Variables

Update your deployed server URL in the app:

**Development** (`app/.env`):
```bash
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
```

**Production** (`app/.env.production`):
```bash
EXPO_PUBLIC_PARTYKIT_HOST=card-masters-server.your-username.partykit.dev
```

### Server Configuration

`partykit/partykit.json`:
```json
{
  "name": "card-masters-server",
  "main": "src/server.ts",
  "compatibilityDate": "2024-01-01"
}
```

### Monitoring

View server logs and metrics:

```bash
# View recent logs
npx partykit logs

# View logs in real-time
npx partykit logs --follow

# View specific room logs
npx partykit logs --room ABC123
```

PartyKit Dashboard: https://partykit.io/dashboard
- Active connections
- Room count
- Request metrics
- Error logs

## Expo App Deployment

### Web Deployment

#### Option 1: Expo Export + Static Hosting

```bash
cd app

# Install dependencies
yarn install

# Build for web
npx expo export --platform web

# Output directory: app/dist/

# Deploy to static host (Vercel, Netlify, etc.)
```

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd app
vercel --prod
```

**Netlify Deployment:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npx expo export --platform web

# Deploy
netlify deploy --prod --dir=dist
```

#### Option 2: Expo Web Hosting

```bash
cd app

# Build and publish
npx expo export --platform web

# Upload dist/ to any static host
```

### Mobile App Deployment

#### iOS App Store

**Prerequisites:**
- Apple Developer account ($99/year)
- EAS CLI: `npm install -g eas-cli`

```bash
cd app

# Login to Expo
npx eas login

# Configure project
npx eas build:configure

# Build for iOS
npx eas build --platform ios

# Submit to App Store
npx eas submit --platform ios
```

#### Android Play Store

**Prerequisites:**
- Google Play Developer account ($25 one-time)
- EAS CLI: `npm install -g eas-cli`

```bash
cd app

# Build for Android
npx eas build --platform android

# Submit to Play Store
npx eas submit --platform android
```

### Over-The-Air (OTA) Updates

Expo allows OTA updates without app store approval:

```bash
cd app

# Publish update
npx expo publish

# Or with EAS Update
npx eas update --branch production
```

**Configure automatic updates** in `app/app.json`:
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    }
  }
}
```

## Environment Setup

### Environment Files

Create separate environment files for each stage:

**Development** (`app/.env`):
```bash
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
EXPO_PUBLIC_ENV=development
```

**Staging** (`app/.env.staging`):
```bash
EXPO_PUBLIC_PARTYKIT_HOST=staging.your-project.partykit.dev
EXPO_PUBLIC_ENV=staging
```

**Production** (`app/.env.production`):
```bash
EXPO_PUBLIC_PARTYKIT_HOST=your-project.partykit.dev
EXPO_PUBLIC_ENV=production
```

### Loading Environment Variables

In code:
```typescript
const host = process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'localhost:1999'
const env = process.env.EXPO_PUBLIC_ENV || 'development'

console.log(`Running in ${env} mode`)
console.log(`Connecting to: ${host}`)
```

## CI/CD Pipeline

### GitHub Actions - Complete Workflow

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # Test server
      - name: Install server dependencies
        run: |
          cd partykit
          yarn install
      
      - name: Type check server
        run: |
          cd partykit
          npx tsc --noEmit
      
      # Test app
      - name: Install app dependencies
        run: |
          cd app
          yarn install
      
      - name: Run app tests
        run: |
          cd app
          yarn test:run
      
      - name: Type check app
        run: |
          cd app
          npx tsc --noEmit

  deploy-server:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install PartyKit
        run: npm install -g partykit
      
      - name: Deploy to PartyKit
        env:
          PARTYKIT_TOKEN: ${{ secrets.PARTYKIT_TOKEN }}
        run: |
          cd partykit
          npx partykit deploy

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd app
          yarn install
      
      - name: Build for web
        env:
          EXPO_PUBLIC_PARTYKIT_HOST: ${{ secrets.PRODUCTION_PARTYKIT_HOST }}
        run: |
          cd app
          npx expo export --platform web
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./app/dist
```

### Required Secrets

Add to GitHub repository secrets:

- `PARTYKIT_TOKEN` - From PartyKit dashboard
- `PRODUCTION_PARTYKIT_HOST` - Your production server URL
- `VERCEL_TOKEN` - From Vercel dashboard
- `VERCEL_ORG_ID` - From Vercel
- `VERCEL_PROJECT_ID` - From Vercel
- `EXPO_TOKEN` - From Expo dashboard (for mobile builds)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Type checks passing (both server and client)
- [ ] Environment variables configured
- [ ] Updated version numbers
- [ ] Reviewed recent code changes
- [ ] Database/state migrations prepared (if any)

### Server Deployment

- [ ] PartyKit server deployed
- [ ] Server accessible at production URL
- [ ] Logs reviewed for errors
- [ ] Test connection from client
- [ ] Monitor active connections

### App Deployment

**Web:**
- [ ] Build completes successfully
- [ ] Environment variables set correctly
- [ ] Static assets optimized
- [ ] Test on multiple browsers
- [ ] Check responsive design

**Mobile:**
- [ ] EAS build completes
- [ ] Test on physical devices
- [ ] Push notification setup (if used)
- [ ] App Store/Play Store metadata updated
- [ ] Submit for review

### Post-Deployment

- [ ] Verify production connectivity
- [ ] Test core user flows
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Smoke test multiplayer features
- [ ] Update documentation

## Rollback Procedures

### Server Rollback

```bash
# View deployment history
npx partykit deployments

# Rollback to previous version
npx partykit rollback <deployment-id>
```

### App Rollback

**Web (Vercel):**
```bash
# List deployments
vercel list

# Promote previous deployment
vercel promote <deployment-url>
```

**Mobile (EAS):**
```bash
# Publish previous update
npx eas update --branch production --message "Rollback"
```

## Monitoring & Alerting

### Server Monitoring

**PartyKit Dashboard:**
- Active rooms
- Connection count
- Request rate
- Error rate

**Custom Logging:**
```typescript
// In server.ts
console.log('[Server] Critical event:', data)
console.error('[Server] Error:', error)
```

**External Monitoring:**
- Set up Sentry for error tracking
- Use DataDog or New Relic for metrics
- Configure alerts for error thresholds

### App Monitoring

**Expo Dashboard:**
- Crash reports
- User analytics
- Update adoption

**Custom Analytics:**
```typescript
// Track game events
analytics.track('game_started', {
  playerCount: players.length,
  lobbyCode: code,
})
```

## Performance Optimization

### Server Optimization

1. **Minimize State Size**
   - Remove unnecessary data from GameState
   - Clean up finished games

2. **Efficient Broadcasting**
   - Use exclude parameter to avoid redundant sends
   - Batch updates when possible

3. **Connection Management**
   - Auto-cleanup disconnected players
   - Set reasonable timeouts

### App Optimization

1. **Bundle Size**
   ```bash
   # Analyze bundle
   npx expo export --platform web --analyze
   ```

2. **Image Optimization**
   - Use WebP format
   - Compress images
   - Lazy load non-critical assets

3. **Code Splitting**
   - Use dynamic imports for large features
   - Split by route

## Scaling Considerations

### Server Scaling

PartyKit automatically scales rooms, but consider:

- **Room Limits**: Each room = one game lobby
- **Connection Limits**: Check PartyKit plan limits
- **State Management**: Keep per-room state minimal

### Database Integration (Future)

For persistent data (user accounts, game history):

1. **Options**:
   - PartyKit Storage API
   - External database (Postgres, MongoDB)
   - Supabase/Firebase

2. **Pattern**:
```typescript
// In server.ts
export default class CardMastersServer implements Party.Server {
  async onConnect(conn: Party.Connection) {
    // Load persistent data
    const userData = await this.room.storage.get(`user:${conn.id}`)
  }
  
  async saveGameResult(winner: Player, scores: Score[]) {
    // Save to storage
    await this.room.storage.put(`game:${Date.now()}`, {
      winner,
      scores,
      timestamp: Date.now(),
    })
  }
}
```

## Security Considerations

### Server Security

1. **Input Validation**
   ```typescript
   private handleJoinLobby(conn: Party.Connection, payload: JoinLobbyPayload) {
     // Validate all inputs
     if (!payload.playerName || typeof payload.playerName !== 'string') {
       this.sendError(conn, 'Invalid player name')
       return
     }
     
     // Sanitize strings
     const sanitized = payload.playerName.trim().slice(0, 20)
   }
   ```

2. **Rate Limiting**
   ```typescript
   // Track actions per connection
   private actionCounts = new Map<string, number>()
   
   private rateLimit(connId: string): boolean {
     const count = this.actionCounts.get(connId) || 0
     if (count > 10) return false
     
     this.actionCounts.set(connId, count + 1)
     return true
   }
   ```

3. **Access Control**
   ```typescript
   // Verify permissions
   if (!player.isHost) {
     this.sendError(conn, 'Permission denied')
     return
   }
   ```

### App Security

1. **Environment Variables**
   - Never commit `.env` files
   - Use secrets for sensitive data
   - Validate server URLs

2. **Network Security**
   - Use WSS (secure WebSocket) in production
   - Validate server certificates
   - Implement reconnection logic

## Troubleshooting

### Server Issues

**Problem**: Server not accessible
```bash
# Check deployment status
npx partykit deployments

# Check logs
npx partykit logs --follow
```

**Problem**: High error rate
```bash
# Review error logs
npx partykit logs | grep ERROR

# Check server health
curl https://your-server.partykit.dev/_health
```

### App Issues

**Problem**: Cannot connect to server
```typescript
// Verify environment variable
console.log('Host:', process.env.EXPO_PUBLIC_PARTYKIT_HOST)

// Test connectivity
fetch(`https://${host}`)
  .then(() => console.log('Server reachable'))
  .catch(err => console.error('Server unreachable:', err))
```

**Problem**: Build failures
```bash
# Clear cache
npx expo start -c

# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install
```

## Cost Estimation

### PartyKit Pricing

Check current pricing: https://www.partykit.io/pricing

Typical costs:
- Free tier: 100k requests/month
- Pro tier: $20/month for higher limits

### Expo/EAS Pricing

Check current pricing: https://expo.dev/pricing

- Free tier: Limited builds
- Production: $29-$99/month per developer

### Hosting Costs

- **Vercel**: Free for hobby projects, $20/month Pro
- **Netlify**: Free for hobby projects, $19/month Pro
- **App Stores**: Apple $99/year, Google $25 one-time

## Reference

- **PartyKit Docs**: https://docs.partykit.io/
- **Expo Deployment**: https://docs.expo.dev/distribution/introduction/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
