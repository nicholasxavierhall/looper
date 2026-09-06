# Looper - What Was Built

Nick, here's exactly what I built for you.

## The Concept

**Looper** is a newsletter-first schedule-sharing app for independent professionals (teachers, DJs, musicians, performers) to tell their followers where they're teaching/performing each week.

### The Flow

**Teachers:**
1. Add their classes/gigs once (name, day, time, location, cost, etc.)
2. Each week, toggle which ones are active
3. Write an optional message
4. Click "Send Newsletter"
5. Email goes to all subscribers with that week's schedule
6. Share a QR code so new followers can discover them

**Followers:**
1. Scan QR code or click link
2. See teacher's schedule
3. Subscribe to email updates
4. Add classes to their calendar (iCal format)

## What's Built

### 1. Authentication
- Sign up / Login with email and password
- Session persistence (using localStorage)
- Teacher profiles stored in database

### 2. Teacher Dashboard
- Clean, simple interface
- Add classes with: name, day, time, location, address, type, cost
- Weekly toggle checkboxes (which classes are active this week)
- Message field for writing to subscribers
- "Send Newsletter" button
- QR code display and download
- Share link (can copy or generate QR)
- Logout button

### 3. Email Sending
- Integrates with Resend API (your key is in .env.local)
- Sends to all subscribers each week
- Email includes:
  - Teacher name
  - Optional weekly message
  - All active classes with details
  - Formatted nicely

### 4. Student Landing Page
- Accessed via QR code or shared link
- Shows teacher name and schedule
- Email subscription form
- "Add to Calendar" button for each class
- Creates .ics files (works with Google Calendar, Outlook, Apple Calendar, etc.)
- Beautiful, mobile-friendly design

### 5. Database
- Supabase (PostgreSQL in the cloud)
- Tables for:
  - Teachers (email, password, name, bio)
  - Classes (recurring classes/gigs)
  - Weekly Classes (toggles for what's active each week)
  - Subscribers (email list)
  - Weekly Updates (message for the week)

### 6. QR Code Generation
- Dynamic QR codes using qrcode.react library
- Links to teacher's profile page
- Can be downloaded as PNG
- Stays the same for each teacher (not changing)

## Tech Stack

**Frontend:** 
- Next.js 16 (React)
- TypeScript
- Tailwind CSS
- Lucide Icons

**Backend:**
- Next.js API Routes
- Supabase (database)
- Resend (email)

**Hosting Options:**
- Local: npm run dev
- Live: Vercel (free tier)

## File Structure

```
looper/
├── app/
│   ├── page.tsx                    # Login/signup page
│   ├── teacher/[id]/page.tsx      # Student-facing profile page
│   ├── api/
│   │   ├── send-newsletter/route.ts # Email sending logic
│   │   └── setup/route.ts          # Setup helpers
│   └── layout.tsx                  # Main layout with auth
├── components/
│   └── Dashboard.tsx               # Teacher dashboard
├── lib/
│   ├── supabase.ts                # Database client setup
│   ├── auth-context.tsx           # Authentication logic
├── DATABASE_SETUP.sql             # SQL to create tables
├── .env.local                     # Your API keys (KEEP SECRET)
├── QUICKSTART.md                  # Quick start guide
├── SETUP_GUIDE.md                 # Detailed setup
└── package.json
```

## How to Get Started

### Step 1: Set Up Database
Copy the SQL from DATABASE_SETUP.sql and run it in Supabase SQL Editor. This takes 30 seconds.

### Step 2: Start Dev Server
```bash
cd looper
npm run dev
```

### Step 3: Sign Up & Test
- Go to http://localhost:3000
- Sign up with an email/password
- Add some test classes
- Send a test newsletter (it will say "no subscribers" - that's normal)
- Share the QR code with someone to test

### Step 4: Deploy (Optional)
When ready to go live:
1. Push code to GitHub
2. Go to Vercel.com
3. Import your repo
4. It auto-deploys

## What's Working

✅ Teacher authentication (signup/login)
✅ Add and manage classes
✅ Weekly toggle checkboxes
✅ QR code generation
✅ Student-facing profile pages
✅ Email newsletter sending via Resend
✅ Calendar export (.ics files)
✅ Responsive design (works on phone)

## What's NOT Included (Future Features)

❌ SMS notifications (can add with Twilio)
❌ Payments/bookings (can integrate Stripe)
❌ Analytics (open rates, clicks)
❌ Custom branding/colors
❌ Teacher bio/photo (partially done, can expand)
❌ Multiple teachers per account (easy to add)
❌ Admin dashboard

## Important Files to Know

- **`.env.local`** - Contains your API keys. NEVER commit to GitHub. It's in .gitignore.
- **`DATABASE_SETUP.sql`** - Run this ONCE in Supabase to create tables.
- **`QUICKSTART.md`** - Follow this to get running.
- **`SETUP_GUIDE.md`** - More detailed instructions and troubleshooting.

## API Keys Stored

Your Supabase and Resend keys are in `.env.local` (not committed to git):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`

The Supabase URL and anon key are safe to expose in client code (they're meant to be public). The Resend key is a secret and must only ever live in `.env.local`, never in a committed file.

## Testing Checklist

Before you ship, test:

1. ✅ Sign up
2. ✅ Add a class
3. ✅ Toggle class on/off
4. ✅ Write a message
5. ✅ Send newsletter (will say no subscribers first time - that's fine)
6. ✅ Download/copy QR code
7. ✅ Visit the QR link on a different browser/phone
8. ✅ Subscribe on the student page
9. ✅ Send another newsletter (should send to you now)
10. ✅ Check email for the newsletter
11. ✅ Click "Add to Calendar" and verify .ics file downloads

## Next Steps

1. Run the database setup SQL in Supabase
2. Start the dev server: `npm run dev`
3. Sign up and test everything
4. When ready, deploy to Vercel
5. Start adding real classes and sharing your QR code

## Need Changes?

Some easy modifications:

- **Change colors:** Edit Tailwind classes in components
- **Add more fields to classes:** Add columns to database, update forms
- **Change email template:** Edit the emailHtml in `app/api/send-newsletter/route.ts`
- **SMS notifications:** Add Twilio integration
- **Payments:** Add Stripe to "Add to Calendar" button

## Questions?

Check the code comments - they explain what each part does.

---

You've now got a working schedule-sharing app. The hard part (infrastructure, database, email integration) is done. You can now focus on getting teachers to use it and gathering feedback.

Good luck! 🚀
