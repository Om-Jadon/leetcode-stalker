# ⚔️ LeetCode Stalker

> **Stalk them up. Bring them down.**  
A brutally simple web app to track your friends' LeetCode progress — whether to admire or humiliate them is up to you.

🕸️ **Live here** → [leetcode-stalker-dd91f.web.app](https://leetcode-stalker-dd91f.web.app/)

---ker

> **Stalk them up. Bring them down.**  
A brutally simple web app to track your friends' LeetCode progress — whether to admire or humiliate them is up to you.

🕸️ **Live here** → [leetcode-stalker-dd91f.web.app](https://leetcode-stalker-dd91f.web.app/)de Stalker

> **Stalk them up. Bring them down.**  
A brutally simple web app to track your friends' LeetCode progress — whether to admire or humiliate them is up to you.

🕸️ **Live here** → [leetcode-stalker-dd91f.web.app](https://leetcode-stalker-dd91f.web.app/)eetCode Stalker

> **Stalk them up. Bring them down.**  
A brutally simple web app to track your friends’ LeetCode progress — whether to admire or humiliate them is up to you.

🕸️ **Live here** → [leetcode-stalker.vercel.app](https://leetcode-stalker.vercel.app/)

---

## 🚀 Features

- 📈 Tracks total solved (Easy / Medium / Hard)
- 🕒 Shows problems solved in the last 24 hours or today
- 🧠 Lists recent problems
- 🔄 Auto-refreshes stats every 10 minutes
- 🗑 Remove friends when they stop grinding
- 🌟 Displays the LeetCode Problem of the Day and who solved it
- 📝 Shows latest solves by your friends
- 🔐 **NEW**: Google/Anonymous authentication for cross-device sync
- ☁️ **NEW**: Friends list synced across all your devices
- 👤 **NEW**: Store your own LeetCode ID for easy sharing

---

## ⚙️ Tech Stack

- React + Vite  
- Tailwind CSS  
- LeetCode GraphQL API
- Firebase (Authentication, Firestore, Functions & Hosting)
- Automatic deployment via GitHub Actions

---

## 🏗️ Architecture

- **Frontend**: React + Vite app hosted on Firebase Hosting
- **Backend**: Firebase Functions (serverless) for LeetCode API proxy
- **Database**: Firestore for user data and friends lists
- **Authentication**: Firebase Auth (Google/Anonymous)
- **CI/CD**: GitHub Actions for automatic deployment

### API Proxy

The app uses a Firebase Function to proxy requests to LeetCode's GraphQL API to avoid CORS issues:

- **Function**: `https://us-central1-leetcode-stalker-dd91f.cloudfunctions.net/graphql`
- **Source**: `/functions/index.js`

---

## 📈 Migration from Vercel

This app was migrated from Vercel to Firebase for better scalability:

- **Function Limits**: 2M/month vs Vercel's 100K/month
- **Better Integration**: Unified platform for hosting, functions, and database
- **Cost Efficiency**: Generous free tier with pay-as-you-go scaling

---

## 🛠 Run Locally

```bash
git clone https://github.com/Om-Jadon/leetcode-stalker.git
cd leetcode-stalker
npm install

# Set up Firebase configuration
cp .env.example .env
# Edit .env with your Firebase config (see FIREBASE_SETUP.md)

npm run dev
```

## 🚀 Deployment

This app is deployed on Firebase and automatically deploys via GitHub Actions when you push to the main branch.

### Firebase Setup & Deployment

For detailed Firebase setup, configuration, and deployment instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

### Local Firebase Development

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and select project
firebase login
firebase use --add

# Run locally with Firebase emulators
npm run dev
firebase emulators:start
```
