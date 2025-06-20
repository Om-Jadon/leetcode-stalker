# ⚔️ LeetCode Stalker

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
- Firebase (Authentication & Firestore)
- Vercel Hosting

---

## 🛠 Run Locally

```bash
git clone https://github.com/Om-Jadon/leetcode-stalker.git
cd leetcode-stalker
npm install

# Optional: Set up Firebase for authentication (see FIREBASE_SETUP.md)
cp .env.example .env
# Edit .env with your Firebase config

npm run dev
```

### Firebase Setup (Optional)

For cross-device sync and authentication features, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup instructions.
