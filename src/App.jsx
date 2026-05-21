import React, { useState, useEffect, useMemo } from "react";
import "./theme.css";
import "./app.css";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

/* ============================================================
   SOFT ADULTING
   A budget tracker for young adults that feels like a friend.
   Self-contained: state persists to localStorage.
   ============================================================ */

const STORAGE_KEY = "softAdulting.v1";

const DEFAULT_DATA = {
  onboarded: false,
  name: "",
  payFrequency: "",
  monthlyIncome: 0,
  vibe: "", // money personality from onboarding
  buckets: { needs: 50, wants: 30, savings: 20 },
  goals: [],
  debts: [],
  transactions: [],
  xp: 0,
  streak: 0,
  lastSundayCheck: null,
  badges: [],
  theme: "light",
};

/* ---------- helpers ---------- */
const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
};
const money = (n) =>
  "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const isSunday = () => new Date().getDay() === 0;

/* ---------- gamification ---------- */
const LEVELS = [
  "Sprout",
  "Seedling",
  "Bloomer",
  "Steady",
  "Rooted",
  "Flourishing",
];
const levelFor = (xp) => Math.min(LEVELS.length - 1, Math.floor(xp / 100));
const BADGES = [
  {
    id: "first-step",
    name: "First Step",
    need: (d) => d.transactions.length >= 1,
    emoji: "🌱",
  },
  {
    id: "goal-setter",
    name: "Goal Setter",
    need: (d) => d.goals.length >= 1,
    emoji: "🎯",
  },
  {
    id: "saver",
    name: "Saver",
    need: (d) => d.goals.some((g) => g.saved > 0),
    emoji: "🐷",
  },
  {
    id: "streak-3",
    name: "3 Sundays",
    need: (d) => d.streak >= 3,
    emoji: "🔥",
  },
  {
    id: "debt-slayer",
    name: "Debt Slayer",
    need: (d) => d.debts.some((x) => x.balance === 0),
    emoji: "⚔️",
  },
];

/* ============================================================
   TIPS — pulled from your reference images
   ============================================================ */
const TIPS = [
  {
    title: "The 5 accounts you should have by 25",
    tag: "Accounts",
    body: [
      "Checking",
      "Emergency savings",
      "Investment account",
      "Retirement account",
      "Travel / fun savings",
    ],
  },
  {
    title: "Split your paycheck across 3 savings accounts",
    tag: "Saving",
    body: [
      "Emergency Fund — 50% (3–6 months of essentials)",
      "Goals Fund — 30% (travel, big purchases)",
      "Freedom Fund — 20% (investing, retirement)",
    ],
  },
  {
    title: "The 50/30/20 rule",
    tag: "Budgeting",
    body: [
      "50% Needs — rent, bills, groceries",
      "30% Wants — fun, dining, hobbies",
      "20% Savings & Debt — emergency, investing, payoff",
    ],
  },
  {
    title: "High-Yield Savings 101",
    tag: "Investing",
    body: [
      "Interest 10–12x a normal savings account",
      "FDIC insured, compounds daily",
      "Often no minimum or monthly fees",
    ],
  },
  {
    title: "The 4 stages of wealth",
    tag: "Mindset",
    body: [
      "Stability — no debt, bills paid, savings funded",
      "Strategy — investing, money works for you",
      "Security — enjoy your money",
      "Freedom — money is not an issue",
    ],
  },
  {
    title: "Truths about wealth",
    tag: "Mindset",
    body: [
      "You won't get rich from salary alone",
      "Inflation steals wealth, so invest",
      "Buy assets, not liabilities",
      "Pay yourself first, always",
    ],
  },
  {
    title: "Reset your finances every Sunday",
    tag: "Habit",
    body: [
      "Review the week's spending (5 min)",
      "Check what's left per category (5 min)",
      "Move a fixed amount to savings (3 min)",
      "Update one goal (4 min)",
    ],
  },
  {
    title: "Financial goals to aim for",
    tag: "Goals",
    body: [
      "750 credit score",
      "$0 credit card debt",
      "Open a HYSA + Roth IRA",
      "Save your first $1k, then 6 months expenses",
    ],
  },
];

/* the friendly Sunday checklist from your image */
const SUNDAY_TASKS = [
  { k: "Spending", action: "Review every transaction from the week", min: 5 },
  { k: "Budget", action: "Check how much is left in each category", min: 5 },
  {
    k: "Savings",
    action: "Move a fixed amount to savings — even small",
    min: 3,
  },
  { k: "Bills", action: "Check what's due in the next 7 days", min: 3 },
  { k: "Goals", action: "Update progress on one financial goal", min: 4 },
  { k: "Subscriptions", action: "Scan for charges you forgot about", min: 3 },
  {
    k: "Next Week",
    action: "Plan one intentional purchase + one to avoid",
    min: 5,
  },
];

/* spend categories (from 50/30/20 subcategory image) */
const CATEGORIES = {
  needs: [
    "Rent / Mortgage",
    "Utilities",
    "Groceries",
    "Transport",
    "Insurance",
    "Phone / Internet",
  ],
  wants: [
    "Dining out",
    "Coffee",
    "Subscriptions",
    "Shopping",
    "Hobbies",
    "Travel",
  ],
  savings: ["Emergency Fund", "Investments", "Goal Savings", "Debt Payoff"],
};

const VIBES = [
  {
    id: "dreamer",
    label: "The Dreamer",
    sub: "I save for experiences & big goals",
    emoji: "✨",
  },
  {
    id: "builder",
    label: "The Builder",
    sub: "I want stability and to kill debt",
    emoji: "🧱",
  },
  {
    id: "explorer",
    label: "The Explorer",
    sub: "Travel & freedom are my priority",
    emoji: "🌍",
  },
  {
    id: "grower",
    label: "The Grower",
    sub: "I'm here to invest & build wealth",
    emoji: "🌿",
  },
];

/* ============================================================
   ROOT
   ============================================================ */
export default function App() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState("home");
  const [sundayOpen, setSundayOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.documentElement.setAttribute("data-theme", data.theme);
  }, [data]);

  // friendly nudge: pop the Sunday check once per Sunday
  useEffect(() => {
    if (data.onboarded && isSunday() && data.lastSundayCheck !== todayISO()) {
      const t = setTimeout(() => setSundayOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [data.onboarded]);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const award = (amount) =>
    setData((d) => {
      const xp = d.xp + amount;
      const earned = BADGES.filter(
        (b) => !d.badges.includes(b.id) && b.need({ ...d, xp }),
      ).map((b) => b.id);
      return { ...d, xp, badges: [...d.badges, ...earned] };
    });

  if (!data.onboarded)
    return (
      <Onboarding
        onDone={(payload) => update({ ...payload, onboarded: true })}
      />
    );

  return (
    <div className="app">
      <Sidebar
        tab={tab}
        setTab={setTab}
        data={data}
        update={update}
        openSunday={() => setSundayOpen(true)}
      />
      <main className="main">
        <TopBar data={data} update={update} />
        {tab === "home" && (
          <Home
            data={data}
            setTab={setTab}
            openSunday={() => setSundayOpen(true)}
          />
        )}
        {tab === "budget" && (
          <Budget data={data} setData={setData} award={award} />
        )}
        {tab === "goals" && (
          <Goals data={data} setData={setData} award={award} />
        )}
        {tab === "debt" && <Debt data={data} setData={setData} award={award} />}
        {tab === "charts" && <Charts data={data} />}
        {tab === "learn" && <Learn />}
      </main>
      {sundayOpen && (
        <SundayCheck
          data={data}
          onClose={() => setSundayOpen(false)}
          onComplete={() => {
            setData((d) => ({
              ...d,
              streak:
                d.lastSundayCheck === todayISO() ? d.streak : d.streak + 1,
              lastSundayCheck: todayISO(),
            }));
            award(40);
            setSundayOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   ONBOARDING — step by step, no walls of text
   ============================================================ */
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("");
  const [income, setIncome] = useState("");
  const [vibe, setVibe] = useState("");

  const steps = [
    {
      title: "Hi there 👋",
      sub: "I'm your money friend. Let's set things up together — one tiny step at a time.",
      valid: true,
      body: (
        <p className="ob-lead">
          No spreadsheets. No lectures. Just us, figuring out your money so
          adulting feels a little softer.
        </p>
      ),
    },
    {
      title: "What should I call you?",
      sub: "First names only — keep it casual.",
      valid: name.trim().length > 0,
      body: (
        <input
          className="ob-input"
          autoFocus
          placeholder="e.g. Maya"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      ),
    },
    {
      title: name
        ? `How often do you get paid, ${name}?`
        : "How often do you get paid?",
      sub: "This helps me plan your reminders.",
      valid: !!freq,
      body: (
        <div className="ob-choices">
          {["Weekly", "Every 2 weeks", "Monthly", "It varies"].map((f) => (
            <button
              key={f}
              className={"ob-chip" + (freq === f ? " on" : "")}
              onClick={() => setFreq(f)}
            >
              {f}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Roughly, what comes in each month?",
      sub: "A ballpark is perfect. You can change it anytime.",
      valid: Number(income) > 0,
      body: (
        <div className="ob-money">
          <span>$</span>
          <input
            className="ob-input"
            type="number"
            autoFocus
            placeholder="2400"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>
      ),
    },
    {
      title: "Which of these sounds most like you?",
      sub: "I'll tune your tips to match.",
      valid: !!vibe,
      body: (
        <div className="ob-vibes">
          {VIBES.map((v) => (
            <button
              key={v.id}
              className={"vibe-card" + (vibe === v.id ? " on" : "")}
              onClick={() => setVibe(v.id)}
            >
              <span className="vibe-emoji">{v.emoji}</span>
              <span className="vibe-label">{v.label}</span>
              <span className="vibe-sub">{v.sub}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: name ? `You're all set, ${name} 🌿` : "You're all set 🌿",
      sub: "Here's what I set up for you based on the 50/30/20 rule.",
      valid: true,
      body: (
        <div className="ob-summary">
          <SummaryRow
            label="Needs"
            pct={50}
            amt={Number(income) * 0.5}
            color="var(--copper)"
          />
          <SummaryRow
            label="Wants"
            pct={30}
            amt={Number(income) * 0.3}
            color="var(--butter-deep)"
          />
          <SummaryRow
            label="Savings"
            pct={20}
            amt={Number(income) * 0.2}
            color="var(--nebula-deep)"
          />
          <p className="ob-note">
            I'll check in with you every Sunday so nothing piles up. Promise
            it'll feel easy.
          </p>
        </div>
      ),
    },
  ];

  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="onboard">
      <div className="ob-card">
        <div className="ob-progress">
          {steps.map((_, i) => (
            <span key={i} className={"dot" + (i <= step ? " on" : "")} />
          ))}
        </div>
        <h1 className="display ob-title">{s.title}</h1>
        <p className="ob-sub">{s.sub}</p>
        <div className="ob-body">{s.body}</div>
        <div className="ob-actions">
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button
            className="btn primary"
            disabled={!s.valid}
            onClick={() => {
              if (last) {
                onDone({
                  name: name.trim(),
                  payFrequency: freq,
                  monthlyIncome: Number(income),
                  vibe,
                  badges: [],
                });
              } else setStep(step + 1);
            }}
          >
            {last ? "Let's go" : "Continue"}
          </button>
        </div>
      </div>
      <p className="ob-brand display">soft adulting</p>
    </div>
  );
}
function SummaryRow({ label, pct, amt, color }) {
  return (
    <div className="sum-row">
      <span className="sum-dot" style={{ background: color }} />
      <span className="sum-label">{label}</span>
      <span className="sum-pct">{pct}%</span>
      <span className="sum-amt">{money(amt)}/mo</span>
    </div>
  );
}

/* ============================================================
   SIDEBAR + TOPBAR
   ============================================================ */
function Sidebar({ tab, setTab, data, openSunday }) {
  const items = [
    ["home", "Home", "🏠"],
    ["budget", "Budget", "📊"],
    ["goals", "Goals", "🎯"],
    ["debt", "Debt", "⚔️"],
    ["charts", "Charts", "📈"],
    ["learn", "Learn", "📚"],
  ];
  const lvl = levelFor(data.xp);
  return (
    <aside className="sidebar">
      <div className="brand display">
        soft
        <br />
        adulting
      </div>
      <nav>
        {items.map(([k, label, icon]) => (
          <button
            key={k}
            className={"navitem" + (tab === k ? " on" : "")}
            onClick={() => setTab(k)}
          >
            <span className="navicon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      <button className="sunday-btn" onClick={openSunday}>
        <span>☀️ Sunday Reset</span>
        <small>{data.streak} week streak</small>
      </button>
      <div className="level-mini">
        <div className="lvl-name">{LEVELS[lvl]}</div>
        <div className="xpbar">
          <span style={{ width: `${data.xp % 100}%` }} />
        </div>
        <small>{data.xp} XP</small>
      </div>
    </aside>
  );
}

function TopBar({ data, update }) {
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="topbar">
      <div>
        <p className="greet-sub">{greet},</p>
        <h2 className="display greet">{data.name} 🌼</h2>
      </div>
      <button
        className="theme-toggle"
        onClick={() =>
          update({ theme: data.theme === "light" ? "dark" : "light" })
        }
        title="Toggle dark mode"
      >
        {data.theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

/* ============================================================
   HOME
   ============================================================ */
function Home({ data, setTab, openSunday }) {
  const spent = data.transactions.reduce((a, t) => a + t.amount, 0);
  const left = data.monthlyIncome - spent;
  const lvl = levelFor(data.xp);
  const earnedBadges = BADGES.filter((b) => data.badges.includes(b.id));

  const friendNote = useMemo(() => {
    if (data.transactions.length === 0)
      return "Add your first expense whenever you're ready — no pressure. I'll keep score so you don't have to.";
    if (left < 0)
      return "We went a little over this month. Totally normal — let's just notice it and reset together.";
    if (left / data.monthlyIncome > 0.5)
      return "You've got plenty of room left this month. Future-you is going to be so grateful.";
    return "You're tracking nicely. Small, steady moves — that's the whole game.";
  }, [data, left]);

  return (
    <div className="page">
      <div className="friend-note">
        <span className="fn-emoji">🫶</span>
        <p>{friendNote}</p>
      </div>

      <div className="stat-grid">
        <Stat
          label="Monthly income"
          value={money(data.monthlyIncome)}
          tone="calm"
        />
        <Stat label="Spent this month" value={money(spent)} tone="copper" />
        <Stat
          label="Left to spend"
          value={money(left)}
          tone={left < 0 ? "warn" : "joy"}
        />
        <Stat label="Current streak" value={`${data.streak} 🔥`} tone="calm" />
      </div>

      {isSunday() && data.lastSundayCheck !== todayISO() && (
        <button className="sunday-banner" onClick={openSunday}>
          <div>
            <strong>It's Sunday — let's reset ☀️</strong>
            <p>
              30 minutes now saves you a stressful month. I'll walk you through
              it.
            </p>
          </div>
          <span className="arrow">→</span>
        </button>
      )}

      <div className="home-cols">
        <Card title={`You're a ${LEVELS[lvl]}`}>
          <div className="xpbar big">
            <span style={{ width: `${data.xp % 100}%` }} />
          </div>
          <p className="muted">{100 - (data.xp % 100)} XP to next level</p>
          <div className="badges">
            {earnedBadges.length === 0 && (
              <p className="muted">No badges yet — they unlock as you go ✨</p>
            )}
            {earnedBadges.map((b) => (
              <span key={b.id} className="badge">
                {b.emoji} {b.name}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Quick actions">
          <div className="quick">
            <button className="btn soft" onClick={() => setTab("budget")}>
              + Log an expense
            </button>
            <button className="btn soft" onClick={() => setTab("goals")}>
              + New savings goal
            </button>
            <button className="btn soft" onClick={() => setTab("debt")}>
              Plan debt payoff
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
function Stat({ label, value, tone }) {
  return (
    <div className={"stat tone-" + tone}>
      <p className="stat-label">{label}</p>
      <p className="display stat-value">{value}</p>
    </div>
  );
}
function Card({ title, children, action }) {
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="display">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ============================================================
   BUDGET
   ============================================================ */
function Budget({ data, setData, award }) {
  const [bucket, setBucket] = useState("needs");
  const [cat, setCat] = useState(CATEGORIES.needs[0]);
  const [amt, setAmt] = useState("");

  const add = () => {
    if (!(Number(amt) > 0)) return;
    const tx = {
      id: uid(),
      bucket,
      category: cat,
      amount: Number(amt),
      date: todayISO(),
    };
    setData((d) => ({ ...d, transactions: [tx, ...d.transactions] }));
    award(10);
    setAmt("");
  };
  const remove = (id) =>
    setData((d) => ({
      ...d,
      transactions: d.transactions.filter((t) => t.id !== id),
    }));

  const byBucket = (b) =>
    data.transactions
      .filter((t) => t.bucket === b)
      .reduce((a, t) => a + t.amount, 0);
  const budgetFor = (b) => (data.monthlyIncome * data.buckets[b]) / 100;

  return (
    <div className="page">
      <Card title="Log an expense">
        <div className="form-row">
          <select
            value={bucket}
            onChange={(e) => {
              setBucket(e.target.value);
              setCat(CATEGORIES[e.target.value][0]);
            }}
          >
            <option value="needs">Needs</option>
            <option value="wants">Wants</option>
            <option value="savings">Savings</option>
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES[bucket].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="money-input">
            <span>$</span>
            <input
              type="number"
              placeholder="0"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <button className="btn primary" onClick={add}>
            Add
          </button>
        </div>
      </Card>

      <div className="bucket-grid">
        {["needs", "wants", "savings"].map((b) => {
          const used = byBucket(b);
          const total = budgetFor(b);
          const pct = total ? Math.min(100, (used / total) * 100) : 0;
          const over = used > total;
          return (
            <div key={b} className="bucket-card">
              <div className="bucket-top">
                <span className="display bucket-name">{b}</span>
                <span className="bucket-pct">{data.buckets[b]}%</span>
              </div>
              <p className="bucket-fig">
                {money(used)} <span className="muted">/ {money(total)}</span>
              </p>
              <div className={"track" + (over ? " over" : "")}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <p className={"bucket-left" + (over ? " warn" : "")}>
                {over
                  ? `${money(used - total)} over`
                  : `${money(total - used)} left`}
              </p>
            </div>
          );
        })}
      </div>

      <Card title="Recent activity">
        {data.transactions.length === 0 && (
          <p className="muted">
            Nothing logged yet. Add your first one above 🌱
          </p>
        )}
        <ul className="tx-list">
          {data.transactions.slice(0, 12).map((t) => (
            <li key={t.id} className="tx">
              <span className={"tx-tag tag-" + t.bucket}>{t.bucket}</span>
              <span className="tx-cat">{t.category}</span>
              <span className="tx-date muted">{t.date.slice(5)}</span>
              <span className="tx-amt">{money(t.amount)}</span>
              <button className="tx-x" onClick={() => remove(t.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ============================================================
   GOALS  (sinking funds / savings goals)
   ============================================================ */
function Goals({ data, setData, award }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("✈️");
  const emojis = ["✈️", "🏠", "🚗", "💍", "🎓", "🐶", "🛟", "💻", "🎁"];

  const create = () => {
    if (!name.trim() || !(Number(target) > 0)) return;
    setData((d) => ({
      ...d,
      goals: [
        ...d.goals,
        {
          id: uid(),
          name: name.trim(),
          target: Number(target),
          saved: 0,
          emoji,
        },
      ],
    }));
    award(15);
    setName("");
    setTarget("");
  };
  const addFunds = (id, val) => {
    setData((d) => ({
      ...d,
      goals: d.goals.map((g) =>
        g.id === id ? { ...g, saved: Math.min(g.target, g.saved + val) } : g,
      ),
    }));
    award(10);
  };
  const del = (id) =>
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));

  return (
    <div className="page">
      <Card title="New savings goal">
        <div className="form-row">
          <select
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="emoji-select"
          >
            {emojis.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <input
            placeholder="What are you saving for?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="money-input">
            <span>$</span>
            <input
              type="number"
              placeholder="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={create}>
            Create
          </button>
        </div>
      </Card>

      <div className="goal-grid">
        {data.goals.length === 0 && (
          <p className="muted pad">
            Dream a little — add your first goal above ✨
          </p>
        )}
        {data.goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          const done = g.saved >= g.target;
          return (
            <div key={g.id} className={"goal-card" + (done ? " done" : "")}>
              <div className="goal-head">
                <span className="goal-emoji">{g.emoji}</span>
                <div>
                  <p className="goal-name">{g.name}</p>
                  <p className="muted">
                    {money(g.saved)} of {money(g.target)}
                  </p>
                </div>
                <button className="tx-x" onClick={() => del(g.id)}>
                  ×
                </button>
              </div>
              <div className="ring-wrap">
                <Ring pct={pct} />
              </div>
              {done ? (
                <p className="goal-done">Goal reached! 🎉</p>
              ) : (
                <div className="goal-add">
                  {[25, 50, 100].map((v) => (
                    <button
                      key={v}
                      className="btn soft sm"
                      onClick={() => addFunds(g.id, v)}
                    >
                      +{money(v)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function Ring({ pct }) {
  const r = 42,
    c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="ring">
      <circle cx="50" cy="50" r={r} className="ring-bg" />
      <circle
        cx="50"
        cy="50"
        r={r}
        className="ring-fg"
        strokeDasharray={c}
        strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
      />
      <text x="50" y="55" textAnchor="middle" className="ring-text">
        {pct}%
      </text>
    </svg>
  );
}

/* ============================================================
   DEBT — payoff calculator (avalanche-ish single-debt model)
   ============================================================ */
function Debt({ data, setData, award }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [apr, setApr] = useState("");
  const [pay, setPay] = useState("");

  const add = () => {
    if (!name.trim() || !(Number(balance) > 0)) return;
    setData((d) => ({
      ...d,
      debts: [
        ...d.debts,
        {
          id: uid(),
          name: name.trim(),
          balance: Number(balance),
          apr: Number(apr) || 0,
          pay: Number(pay) || 0,
        },
      ],
    }));
    award(15);
    setName("");
    setBalance("");
    setApr("");
    setPay("");
  };
  const del = (id) =>
    setData((d) => ({ ...d, debts: d.debts.filter((x) => x.id !== id) }));

  const calc = (d) => {
    let bal = d.balance,
      months = 0,
      interest = 0;
    const monthlyRate = d.apr / 100 / 12;
    if (d.pay <= bal * monthlyRate)
      return { months: Infinity, interest: Infinity };
    while (bal > 0 && months < 1200) {
      const i = bal * monthlyRate;
      interest += i;
      bal = bal + i - d.pay;
      months++;
    }
    return { months, interest: Math.max(0, interest) };
  };

  return (
    <div className="page">
      <Card title="Debt payoff calculator">
        <div className="form-row wrap">
          <input
            placeholder="Debt name (e.g. Credit Card)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="money-input">
            <span>$</span>
            <input
              type="number"
              placeholder="balance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
          <div className="pct-input">
            <input
              type="number"
              placeholder="APR"
              value={apr}
              onChange={(e) => setApr(e.target.value)}
            />
            <span>%</span>
          </div>
          <div className="money-input">
            <span>$</span>
            <input
              type="number"
              placeholder="monthly pay"
              value={pay}
              onChange={(e) => setPay(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={add}>
            Add
          </button>
        </div>
      </Card>

      <div className="debt-list">
        {data.debts.length === 0 && (
          <p className="muted pad">
            Add a debt and I'll show you exactly when it'll be gone ⚔️
          </p>
        )}
        {data.debts.map((d) => {
          const { months, interest } = calc(d);
          const tooLow = months === Infinity;
          const yrs = Math.floor(months / 12),
            mos = months % 12;
          return (
            <div key={d.id} className="debt-card">
              <div className="debt-head">
                <span className="display debt-name">{d.name}</span>
                <button className="tx-x" onClick={() => del(d.id)}>
                  ×
                </button>
              </div>
              <div className="debt-figs">
                <div>
                  <p className="muted">Balance</p>
                  <p className="debt-num">{money(d.balance)}</p>
                </div>
                <div>
                  <p className="muted">APR</p>
                  <p className="debt-num">{d.apr}%</p>
                </div>
                <div>
                  <p className="muted">Monthly</p>
                  <p className="debt-num">{money(d.pay)}</p>
                </div>
              </div>
              {tooLow ? (
                <p className="debt-result warn">
                  Your payment is too low to beat the interest. Try paying a bit
                  more each month 💛
                </p>
              ) : (
                <p className="debt-result">
                  Debt-free in{" "}
                  <strong>
                    {yrs > 0 ? `${yrs}y ` : ""}
                    {mos}m
                  </strong>{" "}
                  · about <strong>{money(interest)}</strong> in interest
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   CHARTS
   ============================================================ */
function Charts({ data }) {
  const COLORS = { needs: "#775537", wants: "#e9c870", savings: "#9ec6c2" };
  const pieData = ["needs", "wants", "savings"]
    .map((b) => ({
      name: b,
      value: data.transactions
        .filter((t) => t.bucket === b)
        .reduce((a, t) => a + t.amount, 0),
    }))
    .filter((d) => d.value > 0);

  // monthly spend (group by month)
  const byMonth = {};
  data.transactions.forEach((t) => {
    const m = t.date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + t.amount;
  });
  const monthData = Object.entries(byMonth)
    .sort()
    .map(([m, v]) => ({ month: m.slice(5), spent: v }));

  // savings progress across goals
  const goalData = data.goals.map((g) => ({
    name: g.name.slice(0, 10),
    saved: g.saved,
    target: g.target,
  }));

  const empty = pieData.length === 0 && monthData.length === 0;

  return (
    <div className="page">
      {empty && (
        <p className="muted pad">
          Charts come to life once you log a few expenses 📈
        </p>
      )}
      <div className="chart-grid">
        {pieData.length > 0 && (
          <Card title="Where your money goes">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={COLORS[d.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend">
              {pieData.map((d) => (
                <span key={d.name}>
                  <i style={{ background: COLORS[d.name] }} />
                  {d.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {monthData.length > 0 && (
          <Card title="Monthly spending">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthData}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#775537" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#775537" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="month" stroke="var(--ink-soft)" fontSize={12} />
                <YAxis stroke="var(--ink-soft)" fontSize={12} />
                <Tooltip formatter={(v) => money(v)} />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#775537"
                  strokeWidth={2}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {goalData.length > 0 && (
          <Card title="Goal progress">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={goalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="name" stroke="var(--ink-soft)" fontSize={12} />
                <YAxis stroke="var(--ink-soft)" fontSize={12} />
                <Tooltip formatter={(v) => money(v)} />
                <Bar
                  dataKey="target"
                  fill="var(--nebula)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar dataKey="saved" fill="#9ec6c2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   LEARN — tips from your reference images
   ============================================================ */
function Learn() {
  return (
    <div className="page">
      <div className="learn-grid">
        {TIPS.map((t, i) => (
          <article key={i} className="tip-card">
            <span className="tip-tag">{t.tag}</span>
            <h3 className="display tip-title">{t.title}</h3>
            <ul>
              {t.body.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SUNDAY CHECK — the friend reminder
   ============================================================ */
function SundayCheck({ data, onClose, onComplete }) {
  const [done, setDone] = useState([]);
  const toggle = (i) =>
    setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const all = done.length === SUNDAY_TASKS.length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>
          ×
        </button>
        <span className="modal-kicker">☀️ Sunday Reset</span>
        <h2 className="display modal-title">
          Hey {data.name || "friend"}, let's take 30 minutes
        </h2>
        <p className="modal-sub">
          Small weekly checks prevent big monthly surprises. Tick them off as
          you go — I'm right here.
        </p>
        <ul className="check-list">
          {SUNDAY_TASKS.map((t, i) => (
            <li
              key={i}
              className={"check" + (done.includes(i) ? " on" : "")}
              onClick={() => toggle(i)}
            >
              <span className="check-box">{done.includes(i) ? "✓" : ""}</span>
              <div>
                <p className="check-action">{t.action}</p>
                <p className="check-meta">
                  {t.k} · {t.min} min
                </p>
              </div>
            </li>
          ))}
        </ul>
        <button
          className="btn primary full"
          disabled={!all}
          onClick={onComplete}
        >
          {all
            ? "Done — I feel better already (+40 XP)"
            : `${done.length}/${SUNDAY_TASKS.length} done`}
        </button>
      </div>
    </div>
  );
}
