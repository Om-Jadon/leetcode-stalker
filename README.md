# ⚔️ LeetCode Stalker

> **Stalk them up. Bring them down.**  
A brutally simple web app to track your friends' LeetCode progress — whether to admire or humiliate them is up to you.

🕸️ **Live here** → [leetcode-stalker-dd91f.web.app](https://leetcode-stalker-dd91f.web.app/)

---

## 🚀 Features

### Core Features

- 📈 **Problem Tracking**: Tracks total solved (Easy / Medium / Hard)
- 🕒 **Recent Activity**: Shows problems solved in the last 24 hours or today
- 🧠 **Problem History**: Lists recent problems with timestamps
- 🔄 **Auto-refresh**: Stats refresh every 10 minutes automatically
- 🗑 **Friend Management**: Add/remove friends when they stop grinding

### Social Features

- 🌟 **Daily Challenge**: Displays the LeetCode Problem of the Day and who solved it
- 📝 **Latest Solves**: Shows recent solves by your friends in real-time
- 🏆 **Leaderboard**: See who's grinding the hardest
- 💬 **Chat Feature**: Real-time chat with your friends to discuss problems and solutions

### Authentication & Sync

- 🔐 **Multi-Auth**: Google and Guest authentication options
- ☁️ **Cloud Sync**: Friends list synced across all your devices
- 👤 **Profile Management**: Store and share your own LeetCode ID
- 🔄 **Cross-device**: Access your data from any device

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
