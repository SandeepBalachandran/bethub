# Development Guide

## Two Database Setup

This project has separate **dev** and **production** databases in MongoDB Atlas:
- **Production**: `fifu` (live data)
- **Dev**: `fifu-dev` (testing environment)

## Quick Commands

### Switch Databases
```bash
# Switch to production (make schema changes here)
npm run use-prod

# Switch back to dev (default)
npm run use-dev
```

### Copy Production Data to Dev
```bash
# Refresh dev with latest production data
npm run copy-prod-data
```

### Database Migrations

**1. Make schema changes**
```bash
# Edit prisma/schema.prisma with your new models/fields
```

**2. Test in dev first**
```bash
npm run use-dev  # (should already be on dev)
npx prisma migrate dev --name describe_your_change
# This generates migration + applies to dev DB
```

**3. Deploy to production**
```bash
npm run use-prod
npx prisma migrate deploy
# Applies all pending migrations to production
```

**4. Refresh dev if needed**
```bash
npm run use-dev
npm run copy-prod-data
# Copies production data to dev after schema changes
```

## Important Notes

⚠️ **Always start and end on dev**
- Default is `fifu-dev` in .env
- After running production commands, switch back: `npm run use-dev`
- A backup is created when switching: `.env.backup`

⚠️ **copy-prod-data overwrites everything in dev**
- Use it to get fresh production data for testing
- Run it anytime you need latest production state

⚠️ **Test migrations in dev first**
- Never run `prisma migrate` directly on production
- Always test in dev, then deploy with `prisma migrate deploy`

## Workflow Example

```bash
# 1. Add new column to User model
# Edit: prisma/schema.prisma

# 2. Test the migration in dev
npm run use-dev
npx prisma migrate dev --name add_user_status

# 3. Test your changes locally
npm run dev

# 4. When ready, apply to production
npm run use-prod
npx prisma migrate deploy

# 5. Switch back and refresh dev with production data
npm run use-dev
npm run copy-prod-data

# ✓ Done!
```

## File Locations

- Dev database config: `.env` (DATABASE_URL with `fifu-dev`)
- Production backup: `.env.backup`
- Database switch script: `scripts/switch-db.js`
- Data copy script: `scripts/copy-prod-to-dev.js`
- Migrations: `prisma/migrations/`
- Schema: `prisma/schema.prisma`
