# Looper - Quick Start

Your app is ready! Here's exactly what to do next.

## 1. Set Up Your Database (MUST DO THIS FIRST)

Go to your Supabase Dashboard:
- URL: https://supabase.com/dashboard
- Select your "Looper" project
- Click **SQL Editor** (left sidebar)
- Click **+ New Query**
- Copy and paste everything from the file `DATABASE_SETUP.sql` in your looper folder
- Click **Run** 

This takes 30 seconds and only needs to be done once.

## 2. Start the App

Open Terminal and run:

```bash
cd /path/to/looper
npm run dev
```

You'll see:
```
✓ Ready in XXXms
- Local:         http://localhost:3000
```

## 3. Open http://localhost:3000

You're now running Looper locally!

## 4. Sign Up

- Click "Sign up"
- Enter your email, password, and name
- Click the "Sign up" button
- You're in the dashboard!

## 5. Add Your Classes

- Click "Add Class"
- Fill in the form (name, day, time, location, etc.)
- Click "Add Class"
- Repeat for all your classes

## 6. Send Your First Newsletter

- Toggle which classes you're teaching this week
- (Optional) Write a message
- Click "Send Newsletter"
  - If you have no subscribers, it will say so
  - Share your QR code to get subscribers!

## 7. Test the QR Code

- Click "Download QR" or "Copy Link"
- Share it with someone
- When they scan/click it, they see your schedule

## What's Working

✓ Teacher sign up and login
✓ Add/manage classes
✓ Weekly toggle (which classes this week)
✓ QR code generation and sharing
✓ Student landing page (accessible via QR)
✓ Email newsletter sending
✓ Calendar export (students can add to iCal)

## What's Next (Optional, not needed to test)

- Deploy to Vercel (makes it live on the internet)
- SMS notifications
- Analytics
- Custom branding

## If Something Breaks

**App won't start?**
- Make sure you're in the looper folder: `cd looper`
- Make sure Node is installed: `node --version`
- Try: `npm install` then `npm run dev`

**"Teacher not found" error?**
- You need to sign up first
- Refresh page and try again

**Can't send email?**
- Make sure database is set up (run the SQL in Supabase)
- If you have no subscribers, it says "No subscribers yet"
- Share your QR code to get your first subscriber

**Database won't work?**
- Log into https://supabase.com
- Select "Looper" project
- Check that your Project URL matches what's in `.env.local`
- Try running the SQL again

## Need Help?

Check the SETUP_GUIDE.md file for more detailed instructions.

## That's It!

You've built Looper. Start testing and let me know if anything doesn't work.
