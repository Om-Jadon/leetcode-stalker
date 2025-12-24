# LeetCode Stalker

Track your friends' LeetCode progress in real-time.

**Live:** [leetcode-stalker.vercel.app](https://leetcode-stalker.vercel.app/)

---

## Features

- Track total problems solved (Easy/Medium/Hard)
- View longest solving streak
- Toggle between last 24 hours or today's activity
- See recent submissions across all friends
- Daily LeetCode challenge tracker
- Auto-refresh every 10 minutes
- Optional Google Sign-In for cross-device sync
- Works offline with localStorage

---

## Tech Stack

React 19 • Vite 6 • Tailwind CSS 4 • Firebase • Vercel

---

## Quick Start

```bash
git clone https://github.com/Om-Jadon/leetcode-stalker.git
cd leetcode-stalker
npm install
npm run dev
```

---

## Firebase Setup (Optional)

The app works without Firebase using localStorage. For cross-device sync:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Authentication and create Firestore Database
3. Copy `.env.example` to `.env` and add your Firebase config
4. Apply security rules from `firestore.rules` in Firebase Console

---

## Deploy to Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Add Firebase environment variables in Vercel settings
4. Add your Vercel domain to Firebase authorized domains
5. Deploy