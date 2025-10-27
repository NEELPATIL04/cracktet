# 🚀 Vercel Deployment Guide for CrackTET

## Prerequisites

Before deploying to Vercel, ensure you have:
- ✅ GitHub/GitLab/Bitbucket account
- ✅ Vercel account (sign up free at https://vercel.com)
- ✅ Online PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)

---

## Step 1: Prepare Your Database

### Option A: Vercel Postgres (Recommended - Easy Integration)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a name: `cracktet-db`
6. Select region closest to your users
7. Click "Create"
8. Copy the connection string (looks like: `postgres://...`)

### Option B: Neon (Free PostgreSQL)

1. Go to [Neon.tech](https://neon.tech)
2. Sign up and create new project
3. Name it: `cracktet`
4. Select region
5. Copy the connection string
6. Connection string format: `postgresql://user:password@host/database?sslmode=require`

### Option C: Supabase (Free PostgreSQL)

1. Go to [Supabase.com](https://supabase.com)
2. Create new project: `cracktet`
3. Go to Settings → Database
4. Copy "Connection string" (Direct connection)
5. Replace `[YOUR-PASSWORD]` with your actual password

---

## Step 2: Initialize Git Repository

Open terminal in your project folder and run:

```bash
# Navigate to project folder
cd C:\Users\HP\Documents\cracktet

# Initialize git repository
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - CrackTET application"
```

---

## Step 3: Create GitHub Repository

### Method 1: Using GitHub Website

1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon (top right) → "New repository"
3. Repository name: `cracktet`
4. Description: "Maharashtra TET Exam Preparation Platform"
5. Choose "Public" or "Private"
6. **DON'T** initialize with README, .gitignore, or license
7. Click "Create repository"

### Method 2: Using GitHub CLI (if installed)

```bash
gh repo create cracktet --public --source=. --remote=origin
```

---

## Step 4: Push Code to GitHub

After creating the GitHub repository, run these commands:

```bash
# Add GitHub remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/cracktet.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johnsmith/cracktet.git
git branch -M main
git push -u origin main
```

---

## Step 5: Update .gitignore (Important!)

Make sure these are in your `.gitignore` file (already configured):

```
# Environment variables
.env
.env.local
.env*.local

# Database
drizzle/

# Dependencies
node_modules/
```

This prevents sensitive data from being pushed to GitHub.

---

## Step 6: Deploy to Vercel

### Option A: Vercel Website (Easiest)

1. Go to [Vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub
5. Click "Add New..." → "Project"
6. Select your `cracktet` repository
7. Click "Import"

### Configuration:

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave as is)

**Build Command:** `npm run build` (auto-filled)

**Output Directory:** `.next` (auto-filled)

**Install Command:** `npm install` (auto-filled)

---

## Step 7: Configure Environment Variables

Before deploying, add your environment variables in Vercel:

1. In the import screen, scroll to "Environment Variables"
2. Add these variables:

### Required Environment Variable:

**Name:** `DATABASE_URL`
**Value:** Your PostgreSQL connection string from Step 1

Example:
```
postgres://username:password@host.region.postgres.vercel-storage.com:5432/verceldb
```

**Important:** Click the checkbox for all three environments:
- ✅ Production
- ✅ Preview
- ✅ Development

3. Click "Add" for each variable

---

## Step 8: Deploy!

1. After adding environment variables, click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see build logs in real-time
4. When done, you'll see "Congratulations!" 🎉

---

## Step 9: Run Database Migrations

After first deployment, you need to create database tables:

### Method 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link your project:
```bash
cd C:\Users\HP\Documents\cracktet
vercel link
```

4. Pull environment variables:
```bash
vercel env pull .env.local
```

5. Run database push:
```bash
npm run db:push
```

### Method 2: Using Vercel Dashboard

1. Go to your project on Vercel
2. Click "Settings" → "Functions"
3. Add a temporary API route to run migrations (or use existing seed-admin endpoint)
4. Visit: `https://your-app.vercel.app/api/seed-admin`

This will create the database tables.

---

## Step 10: Seed Admin User

Visit your deployed site and call the seed admin endpoint:

```
https://your-app.vercel.app/api/seed-admin
```

This creates the default admin user (admin123 / admin@cracktet).

---

## Step 11: Access Your Live Site

Your app is now live at:

```
https://your-project-name.vercel.app
```

Or your custom domain if configured.

### Test Your Deployment:

1. **Home Page:** `https://your-app.vercel.app`
2. **Registration:** `https://your-app.vercel.app/register`
3. **Admin Login:** `https://your-app.vercel.app/admin/login`
4. **Admin Dashboard:** `https://your-app.vercel.app/admin`

---

## 🔧 Post-Deployment Configuration

### Custom Domain (Optional)

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain (e.g., `cracktet.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-10 minutes)

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys the new version!
```

### Environment Variables Updates

If you need to update environment variables:

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add/Edit/Delete variables
5. Redeploy to apply changes

---

## 🔒 Production Security Checklist

Before going live, ensure:

- [ ] Change default admin credentials
- [ ] Hash admin passwords (implement bcrypt)
- [ ] Use strong database password
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Review and update `.gitignore`
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Review CORS settings
- [ ] Test all features in production

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"
- **Solution:** Run `npm install` locally, commit `package-lock.json`, push again

**Error:** "Database connection failed"
- **Solution:** Check DATABASE_URL in environment variables
- Ensure database is accessible from internet
- Check if database requires SSL (`?sslmode=require`)

### Database Tables Not Created

**Solution:** Run `npm run db:push` using Vercel CLI or visit `/api/seed-admin`

### Environment Variables Not Working

**Solution:**
- Redeploy after adding/changing variables
- Ensure all three environments are checked (Production, Preview, Development)

### 404 Errors

**Solution:**
- Check if page exists in `/app` directory
- Verify Next.js routing is correct
- Clear Vercel cache and redeploy

---

## 📊 Monitoring Your App

### Vercel Analytics (Built-in)

1. Go to your project dashboard
2. Click "Analytics" tab
3. View page views, performance metrics, etc.

### Vercel Logs

1. Go to "Deployments"
2. Click on a deployment
3. Click "View Function Logs"
4. See real-time logs and errors

---

## 💡 Quick Commands Reference

```bash
# Local development
npm run dev

# Build locally (test before deploy)
npm run build
npm start

# Push database schema
npm run db:push

# View database
npm run db:studio

# Git commands
git add .
git commit -m "Your message"
git push

# Vercel CLI commands
vercel login
vercel
vercel --prod
vercel env pull
```

---

## 🎉 You're Live!

Your CrackTET application is now deployed and accessible worldwide!

**Next Steps:**
1. Share your URL with users
2. Monitor usage and performance
3. Collect feedback
4. Iterate and improve

**Your App URLs:**
- **Production:** https://your-project.vercel.app
- **Admin Login:** https://your-project.vercel.app/admin/login
- **GitHub Repo:** https://github.com/YOUR-USERNAME/cracktet

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Support:** https://vercel.com/support

---

**Created:** 2025-10-27
**Status:** ✅ Ready for Deployment
