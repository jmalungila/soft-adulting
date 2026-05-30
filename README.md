# 🌿 Soft Adulting

A budget tracker for young adults that feels like a friend — not a spreadsheet.

## What's inside ?

- **Step-by-step onboarding** — personalizes from day one (name, pay frequency, income, money "vibe"). No walls of text.
- **Budget tracking** with the 50/30/20 rule (Needs / Wants / Savings) and live progress bars.
- **Savings goals** — sinking-fund style, with circular progress rings and quick-add buttons.
- **Debt payoff calculator** — tells you exactly when you'll be debt-free and how much interest you'll pay.
- **Monthly charts** — spending breakdown, monthly trend, and goal progress (Recharts).
- **Gamification** — XP, levels (Sprout → Flourishing), streaks, and unlockable badges.
- **Sunday Reset** — a friendly reminder that pops every Sunday and walks you through a 7-step weekly check-in.
- **Dark mode** — toggle in the top-right.
- **Learn tab** — bite-sized money tips (50/30/20, HYSA, paycheck splitting, stages of wealth, and more).

Everything saves to your browser via `localStorage`, so your data persists between visits.

## 🎨 Colors

| Name          | Hex       |
| ------------- | --------- |
| Old Copper    | `#775537` |
| Butter Yellow | `#FBE29D` |
| Nebula        | `#C0DDDA` |
| Seashell      | `#F1F1F1` |

## 🚀 Run it (Mac + VS Code)

```bash
# from the project folder
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## 🛠 Tech

Node.js · Vite · React · JavaScript · CSS · Recharts

## 📁 Structure

```
soft-adulting/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx      # entry point
    ├── App.jsx       # all app logic + components
    ├── theme.css     # design tokens + dark mode + palette
    └── app.css       # component styles
```

## 💡 Next ideas

- Real push/email reminders (right now the Sunday nudge fires when you open the app on a Sunday).
- User accounts + cloud sync (replace localStorage with a backend).
- CSV import from your bank.

Made with 🫶 for soft adulting.
# budget-web
