# Looper - Getting Started Guide

Welcome to Looper! This guide will walk you through setting up the app so you can start sharing your schedule with your followers.

## What You Just Created

Looper is a web app that lets you (teachers, DJs, performers) share your weekly schedule with followers through email newsletters and QR codes. Students/fans can subscribe to your newsletter, add classes to their calendar, and discover you via QR code.

## Step 1: Set Up Your Database (One-time setup)

You've already created a Supabase account and have your credentials. Now you need to create the database tables.

### Go to your Supabase Dashboard:
1. Visit [supabase.com](https://supabase.com) and sign in
2. Click on your "Looper" project
3. On the left sidebar, click **SQL Editor**
4. Click **+ New Query**
5. Copy and paste the entire SQL from `DATABASE_SETUP.sql` (in this repo)
6. Click **Run** (or cmd+enter)

This creates all the tables your app needs. You only do this once.

## Step 2: Run the App Locally

### Open a terminal in the looper folder:

```bash
cd looper
npm run dev
```

The app will start at `http://localhost:3000`

## Step 3: Create Your Account

1. Go to http://localhost:3000
2. Click **Sign up**
3. Enter your email, password, and name
4. You're in!

## Step 4: Add Your Classes

1. In the dashboard, click **Add Class**
2. Fill in:
   - Class name (e.g., "Yoga Flow", "Hip Hop Set")
   - Day of week
   - Time
   - Location/Studio name
   - Address (optional)
   - Class type (optional)
   - Cost (optional)
3. Click **Add Class**

Repeat for all your classes.

## Step 5: Send Your First Newsletter

1. Toggle which classes you're teaching this week (checkboxes next to each class)
2. Optionally write a message to your subscribers
3. Click **Send Newsletter**
   - If you have no subscribers yet, it will tell you
   - Share your QR code so people can find you

## Step 6: Share Your QR Code

The QR code in the sidebar:
- Can be downloaded as an image
- Can be shared via text, email, printed, etc.
- Anyone who scans it sees your schedule and can subscribe

## How It Works

### For You (Teacher/DJ/Performer):
- Add your recurring classes/gigs once
- Each week, toggle which ones are active
- Add a message (optional)
- Click "Send Newsletter"
- Email goes to all subscribers with this week's schedule
- QR code is always available to share

### For Your Followers:
- Scan your QR code
- See your schedule
- Subscribe to email updates
- Add classes to their calendar (iCal format)

## Deploying to the Internet

When you're ready to go live (not needed for testing), follow these steps:

### Deploy to Vercel (Free Hosting)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **Add New** → **Project**
4. Import this Git repo (or upload the folder)
5. Vercel will auto-detect it's a Next.js app
6. Click **Deploy**

Your app will be live at a URL like `https://looper-xyz.vercel.app`

### Update Your QR Code
Once deployed, the QR code will automatically point to your live domain instead of localhost.

## Troubleshooting

### "Teacher not found" error
- Make sure you created an account first
- Sign up at localhost:3000

### Newsletter not sending
- Check that you have subscribers (share your QR code first)
- Make sure Resend API key is correct in `.env.local`

### Classes not showing up
- Make sure the database is set up (run the SQL in Supabase)
- Refresh the page

### Database tables won't create
- Log into Supabase
- Make sure you're in the right project (check the URL)
- Try running the SQL in smaller chunks if it fails

## Features to Add Later

- SMS notifications (opt-in)
- Analytics (who opened emails, clicked calendar, etc.)
- Custom branding (colors, logo)
- Teacher bio/photo
- Multiple teachers per account
- Booking/payments integration
- Mobile app versions

## Support

- Check `.env.local` has all three keys
- Verify database tables exist in Supabase
- Make sure Node.js is installed (`node --version`)

## File Structure

```
looper/
├── app/
│   ├── page.tsx              # Login/signup page
│   ├── teacher/[id]/page.tsx # Student-facing profile page
│   ├── api/
│   │   ├── send-newsletter/  # Email sending
│   │   └── setup/            # Database setup helpers
│   └── layout.tsx            # Main layout with auth
├── components/
│   └── Dashboard.tsx         # Teacher dashboard
├── lib/
│   ├── supabase.ts          # Database client
│   └── auth-context.tsx     # Authentication
├── DATABASE_SETUP.sql       # SQL to create tables
└── .env.local              # Your API keys
```

## That's It!

You're ready to go. Start adding classes, send your first newsletter, and share your QR code!

Questions? Check the code comments or reach out.
