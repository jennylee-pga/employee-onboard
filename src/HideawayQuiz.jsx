import { useState, useEffect, useCallback } from "react";

// ─── Supabase Config ───
const SUPABASE_URL = "https://wdmjtesbxfjbtcsviyme.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkbWp0ZXNieGZqYnRjc3ZpeW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Njc4MjgsImV4cCI6MjA5ODI0MzgyOH0.67EofspAQg4OFg7cCgP0fWPXGyGW3rLc8vQjOawzu-U";

// Lightweight Supabase client (no SDK needed)
const supabase = {
  headers(token) {
    const h = {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  },

  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async getUser(token) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: this.headers(token),
    });
    return res.json();
  },

  async query(table, { method = "GET", token, body, params = "" } = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
      method,
      headers: {
        ...this.headers(token),
        ...(method === "POST" ? { Prefer: "return=representation" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res.json();
  },
};

// ─── Quiz Data ───
const CATEGORIES = {
  "Tee Times & Walk-Up": "tee",
  "Guest & Family Policies": "guest",
  "Shop Procedures": "shop",
  "Pace of Play": "pace",
  "Caddie Program": "caddie",
  "Cart Policies": "cart",
  "Facilities & Hours": "facilities",
  "Staff & Contacts": "staff",
  "Tournaments & Events": "events",
};

const QUESTIONS = [
  // === TEE TIMES & WALK-UP ===
  { category: "tee", question: "How many days in advance can members book a tee time?", options: ["1 day", "2 days", "3 days", "7 days"], answer: 2 },
  { category: "tee", question: "What time does the advance tee time booking window open?", options: ["8:00 AM", "12:00 PM", "4:00 PM", "6:00 PM"], answer: 2 },
  { category: "tee", question: "On which days are advance tee times available on the Pete Dye Course?", options: ["Even-numbered days", "Odd-numbered days", "Weekdays only", "Every day"], answer: 1 },
  { category: "tee", question: "On which days are advance tee times available on the Clive Clark Course?", options: ["Odd-numbered days", "Even-numbered days", "Weekends only", "Every day"], answer: 1 },
  { category: "tee", question: "Where do walk-up players check in?", options: ["The Golf Shop", "The Starter Stand at the Practice Facility", "The Pro Shop front desk", "The Cart Barn"], answer: 1 },
  { category: "tee", question: "Can members change their own tee times on the day of play?", options: ["Yes, anytime", "Yes, before 8 AM", "No — staff only, and must radio the starter", "No — tee times are locked 24 hours ahead"], answer: 2 },
  { category: "tee", question: "How is the walk-up course identified on the tee sheet?", options: ["Highlighted in yellow", "Marked with an asterisk", "Listed at the bottom", "Highlighted in green"], answer: 0 },
  { category: "tee", question: "What tee time management system does the club use?", options: ["Golf Genius", "ForeTees", "Clubessential", "TeeSnap"], answer: 1 },
  { category: "tee", question: "Do rental clubs come with balls?", options: ["No, balls are purchased separately", "Yes, balls are included", "Only during off-season", "Only for guests"], answer: 1 },

  // === GUEST & FAMILY POLICIES ===
  { category: "guest", question: "How many rounds per season are guests limited to?", options: ["4 rounds", "6 rounds", "8 rounds", "Unlimited"], answer: 1 },
  { category: "guest", question: "What is the accompanied guest fee during regular season (18 holes)?", options: ["$125.00", "$200.00", "$250.00", "$300.00"], answer: 2 },
  { category: "guest", question: "During peak season (Nov 15 – May 31), what times on Fri/Sat/Sun are member-only?", options: ["7:00 AM – 10:00 AM", "8:30 AM – 11:00 AM", "9:00 AM – 12:00 PM", "All day"], answer: 1 },
  { category: "guest", question: "How is 'immediate family' defined at Hideaway?", options: ["All children regardless of age", "Unmarried children under 31", "Children and grandchildren under 25", "Spouse and children only"], answer: 1 },
  { category: "guest", question: "Can extended family members make advance tee time reservations?", options: ["Yes, up to 3 days ahead", "Yes, but only 1 day ahead", "No, they cannot", "Only during off-season"], answer: 2 },
  { category: "guest", question: "What is the off-season accompanied guest fee for 18 holes?", options: ["$60.00", "$75.00", "$125.00", "$250.00"], answer: 2 },
  { category: "guest", question: "What is the junior guest fee (17 & under)?", options: ["$25.00", "$35.00", "$55.00", "$75.00"], answer: 1 },
  { category: "guest", question: "Must all guests be accompanied by a Primary Member?", options: ["Yes, always", "No, with Director of Golf approval", "Only during peak season", "Only on weekends"], answer: 0 },

  // === SHOP PROCEDURES ===
  { category: "shop", question: "How many steps are in the daily opening procedure?", options: ["8", "10", "12", "15"], answer: 2 },
  { category: "shop", question: "Which three systems must be logged into at opening?", options: ["ForeTees, Golf Genius, QuickBooks", "Clubessential, ForeTees, Golf Genius", "Clubessential, Ship Sticks, ForeTees", "Golf Genius, FedEx, Clubessential"], answer: 1 },
  { category: "shop", question: "At closing, where do you place the chits?", options: ["In the register", "On Tracy Sylvester's desk", "In the safe", "On the starter's clipboard"], answer: 1 },
  { category: "shop", question: "What must you verify about the radio at closing?", options: ["That it's turned to the Golf Channel", "That the volume is at zero", "That it's charging and the red light is lit", "That batteries are removed"], answer: 2 },
  { category: "shop", question: "What special tasks are done only on Sundays?", options: ["Deep cleaning and floor waxing", "Ball count, glove count, and mannequin rotation", "Full inventory audit", "Staff meeting and schedule posting"], answer: 1 },
  { category: "shop", question: "If you're out of stock on balls or gloves at closing, what do you do?", options: ["Email Tracy, the Golf Shop Manager", "Note it in the log", "Call the cart barn", "Wait until morning"], answer: 0 },
  { category: "shop", question: "Where do you place a completed special order form?", options: ["In the register drawer", "On the golf shop manager's desk", "In the guest tee time book", "Email it to the Director of Golf"], answer: 1 },
  { category: "shop", question: "What should you do if a member reports a lost club?", options: ["Log it in the system and wait", "Walkie-talkie Johnny or the on-course pro immediately", "Call the Director of Golf", "Ask the member to check the cart barn"], answer: 1 },
  { category: "shop", question: "How many doors need to be locked at closing?", options: ["Two", "Three", "Four", "Five"], answer: 2 },

  // === PACE OF PLAY ===
  { category: "pace", question: "What is the target maximum round time?", options: ["3 hours 30 minutes", "4 hours", "4 hours 30 minutes", "No specific target"], answer: 1 },
  { category: "pace", question: "What does 'correct position' on the course mean?", options: ["Ahead of the group behind you", "Immediately behind the group in front of you", "Within 10 minutes of your tee time", "On the same hole as your assigned pace"], answer: 1 },
  { category: "pace", question: "What is the first step in the professional staff intervention protocol?", options: ["Act as a forecaddie for the group", "Ask the group to skip a hole", "A friendly reminder with a specific expectation to regain position", "Issue a formal warning"], answer: 2 },
  { category: "pace", question: "How many practice swings maximum are recommended?", options: ["None", "1–2", "3–4", "As many as needed"], answer: 1 },
  { category: "pace", question: "Saving 10 seconds per shot can save approximately how much time overall?", options: ["5 minutes", "10 minutes", "15 minutes", "20 minutes"], answer: 2 },
  { category: "pace", question: "What is the maximum score before you should pick up?", options: ["Double bogey", "Triple bogey", "Par + 2 + handicap strokes", "10 strokes"], answer: 2 },
  { category: "pace", question: "Is there a penalty for hitting the flagstick from the green?", options: ["Yes, 2-stroke penalty", "Yes, loss of hole in match play", "No penalty under current rules", "Only in tournament play"], answer: 2 },
  { category: "pace", question: "Who should pace of play questions be directed to?", options: ["The Golf Shop", "The starter or on-course golf professional", "The Director of Golf", "The Caddie Master"], answer: 1 },

  // === CADDIE PROGRAM ===
  { category: "caddie", question: "How many guests in a group triggers a mandatory caddie?", options: ["2 or more", "3 or more", "4 or more", "Caddies are never mandatory"], answer: 1 },
  { category: "caddie", question: "What is the forecaddie fee per bag for 18 holes?", options: ["$50", "$75", "$100", "$150"], answer: 1 },
  { category: "caddie", question: "What is the walking caddie fee per bag for 18 holes?", options: ["$100", "$150", "$200", "$250"], answer: 2 },
  { category: "caddie", question: "How are caddie fees paid?", options: ["Billed to the member's account", "Charged through the Golf Shop", "Paid directly to the caddie in cash", "Included in the guest fee"], answer: 2 },
  { category: "caddie", question: "Are caddies mandatory for Member-Guest tournaments?", options: ["Yes, always", "Only for groups of 4+", "No — by request only", "Only for walking groups"], answer: 2 },
  { category: "caddie", question: "Who is the Caddie Master?", options: ["Shane Ponchot", "Mike Mitchell", "John Stewart", "Tracy Sylvester"], answer: 2 },
  { category: "caddie", question: "How many professional caddies are on the team?", options: ["5", "8", "10", "15"], answer: 2 },

  // === CART POLICIES ===
  { category: "cart", question: "How many carts are permitted for a foursome?", options: ["1", "2", "3", "4"], answer: 1 },
  { category: "cart", question: "How close can you drive a cart to a green?", options: ["10 yards", "20 yards", "30 yards", "50 yards"], answer: 2 },
  { category: "cart", question: "What is the fee for a cart kept overnight?", options: ["$50", "$75", "$100", "$150"], answer: 2 },
  { category: "cart", question: "What is the minimum age to operate a golf cart?", options: ["14 with a permit", "16 with a license", "18", "No age requirement"], answer: 1 },
  { category: "cart", question: "Which of these is NOT an approved private cart color?", options: ["Toffee Braun", "Midnight Black", "Oyster Pearl", "Driftwood"], answer: 1 },
  { category: "cart", question: "Can members put their name/logo on a private cart?", options: ["Yes, any branding", "Only the club logo", "Only member initials on the side", "No personalization allowed"], answer: 2 },
  { category: "cart", question: "Are Golf Board single-rider devices permitted?", options: ["No", "Only during off-season", "Yes, same rules as standard carts", "Only with Director approval"], answer: 2 },

  // === FACILITIES & HOURS ===
  { category: "facilities", question: "During peak season, what are the Golf Shop hours?", options: ["6am – 6pm", "7am – 5pm", "8am – 4pm", "7am – 7pm"], answer: 1 },
  { category: "facilities", question: "During summer (Jun – Oct), what days is the Golf Shop closed?", options: ["Saturday – Sunday", "Monday – Tuesday", "Wednesday – Thursday", "Never closed"], answer: 1 },
  { category: "facilities", question: "When does the Hideaway Performance Center switch to appointment-only?", options: ["April 1", "May 10", "June 1", "September 1"], answer: 1 },
  { category: "facilities", question: "What equipment is available at the Performance Center?", options: ["Simulators and putting lab", "High-speed motion capture cameras and Flight Scope launch monitor", "TrackMan and pressure plates", "Virtual reality golf systems"], answer: 1 },
  { category: "facilities", question: "What are the club's two championship courses?", options: ["Pete Dye and Arnold Palmer", "Clive Clark and Jack Nicklaus", "Pete Dye and Clive Clark", "Desert Dunes and Mountain View"], answer: 2 },
  { category: "facilities", question: "When does the club's peak season begin?", options: ["October 1", "November 1", "November 15", "December 1"], answer: 2 },

  // === STAFF & CONTACTS ===
  { category: "staff", question: "Who is the Director of Golf?", options: ["Marty Matsuzaki", "Shane Ponchot", "Mike Mitchell", "Justin Dougherty"], answer: 1 },
  { category: "staff", question: "Who is the Head Golf Professional?", options: ["Shane Ponchot", "Justin Dougherty", "Marty Matsuzaki", "Mike Mitchell"], answer: 2 },
  { category: "staff", question: "Who is the Director of Instruction?", options: ["Shane Ponchot", "Marty Matsuzaki", "Mike Mitchell", "John Stewart"], answer: 2 },
  { category: "staff", question: "Who manages the Golf Shop and merchandise buying?", options: ["John Stewart", "Tracy Sylvester", "Justin Dougherty", "Marty Matsuzaki"], answer: 1 },
  { category: "staff", question: "What is the Member Shop direct phone number?", options: ["760.393.5220", "760.393.5222", "760.393.5223", "760.393.5234"], answer: 1 },
  { category: "staff", question: "Which club brands are available for fitting at the Performance Center?", options: ["Titleist, Cobra, Mizuno, Ping", "TaylorMade, Callaway, Cobra, Cleveland", "Titleist, TaylorMade, Callaway, Ping", "Ping, Mizuno, Srixon, Titleist"], answer: 2 },

  // === TOURNAMENTS & EVENTS ===
  { category: "events", question: "What system is used for tournament registration?", options: ["ForeTees", "Golf Genius", "Clubessential", "TournamentConnect"], answer: 1 },
  { category: "events", question: "How far in advance do events open for registration?", options: ["30 days", "60 days", "90 days", "120 days"], answer: 2 },
  { category: "events", question: "When do events close for registration before the start date?", options: ["7 days at 5pm", "10 days at noon", "14 days at 2pm", "21 days at midnight"], answer: 2 },
  { category: "events", question: "What day of the week is Ladies Day?", options: ["Monday", "Tuesday", "Wednesday", "Thursday"], answer: 1 },
  { category: "events", question: "What day of the week is Men's Day?", options: ["Tuesday", "Wednesday", "Thursday", "Friday"], answer: 1 },
  { category: "events", question: "How many ladies can participate in the Solheim Cup?", options: ["36", "48", "60", "72"], answer: 3 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CAT_LABELS = Object.entries(CATEGORIES);

// ─── Colors & Styles ───
const C = {
  green: "#2D5A27", greenLight: "#4A7C44", greenPale: "#E8F0E6",
  gold: "#C9A96E", goldLight: "#E8D5B0",
  white: "#FFFFFF", offWhite: "#F9F7F3",
  text: "#2C2C2C", textLight: "#6B6B6B",
  red: "#C0392B", redBg: "#FDEDEC",
  greenBg: "#EAFAF1", correctGreen: "#27AE60",
};

const base = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  color: C.text,
  minHeight: "100vh",
  background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.greenPale} 100%)`,
  padding: "40px 20px",
};

const card = {
  background: C.white,
  borderRadius: "12px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  padding: "32px",
  maxWidth: "680px",
  margin: "0 auto",
};

const btnPrimary = {
  background: C.green, color: C.white, border: "none", borderRadius: "8px",
  padding: "12px 32px", fontSize: "16px", fontFamily: "inherit",
  cursor: "pointer", fontWeight: "600", transition: "background 0.2s",
};
const btnSecondary = { ...btnPrimary, background: "transparent", color: C.green, border: `2px solid ${C.green}` };
const btnGold = { ...btnPrimary, background: C.gold };
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: "8px",
  border: "2px solid #E0E0E0", fontFamily: "inherit", fontSize: "15px",
  boxSizing: "border-box",
};

// ─── Auth Screen ───
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null); // { user, token }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!firstName.trim() || !lastName.trim()) {
          setError("First and last name are required.");
          setLoading(false);
          return;
        }
        const res = await supabase.signUp(email, password);
        if (res.error) { setError(res.error.message || res.error); setLoading(false); return; }

        // If email confirmation is disabled, user is immediately available
        if (res.access_token) {
          // Create profile
          await supabase.query("profiles", {
            method: "POST", token: res.access_token,
            body: { id: res.user.id, first_name: firstName.trim(), last_name: lastName.trim() },
          });
          onAuth({ user: res.user, token: res.access_token, firstName: firstName.trim(), lastName: lastName.trim() });
        } else if (res.id || res.user) {
          // Email confirmation may be required — try signing in
          const signInRes = await supabase.signIn(email, password);
          if (signInRes.access_token) {
            await supabase.query("profiles", {
              method: "POST", token: signInRes.access_token,
              body: { id: signInRes.user.id, first_name: firstName.trim(), last_name: lastName.trim() },
            });
            onAuth({ user: signInRes.user, token: signInRes.access_token, firstName: firstName.trim(), lastName: lastName.trim() });
          } else {
            setSignupSuccess(true);
          }
        }
      } else {
        const res = await supabase.signIn(email, password);
        if (res.error || res.error_description) { setError(res.error_description || res.error?.message || res.error || "Sign in failed"); setLoading(false); return; }
        // Fetch profile
        const profiles = await supabase.query("profiles", {
          token: res.access_token, params: `?id=eq.${res.user.id}&select=first_name,last_name`,
        });
        if (Array.isArray(profiles) && profiles.length > 0 && profiles[0].first_name) {
          onAuth({ user: res.user, token: res.access_token, firstName: profiles[0].first_name, lastName: profiles[0].last_name });
        } else {
          // No profile yet — prompt for name (happens after email confirmation signup)
          setPendingAuth({ user: res.user, token: res.access_token });
          setNeedsProfile(true);
        }
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  const handleProfileComplete = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) { setError("First and last name are required."); return; }
    setLoading(true);
    try {
      await supabase.query("profiles", {
        method: "POST", token: pendingAuth.token,
        body: { id: pendingAuth.user.id, first_name: firstName.trim(), last_name: lastName.trim() },
      });
      onAuth({ user: pendingAuth.user, token: pendingAuth.token, firstName: firstName.trim(), lastName: lastName.trim() });
    } catch (err) {
      setError("Could not save profile. Please try again.");
    }
    setLoading(false);
  };

  if (needsProfile) {
    return (
      <div style={base}>
        <div style={card}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>⛳</div>
            <h2 style={{ color: C.green }}>Complete Your Profile</h2>
            <p style={{ color: C.textLight }}>Enter your name to finish setting up your account.</p>
          </div>
          <form onSubmit={handleProfileComplete}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ ...inputStyle, flex: 1 }} required />
              <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={{ ...inputStyle, flex: 1 }} required />
            </div>
            {error && <p style={{ color: "#C0392B", fontSize: "14px", marginBottom: "12px" }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ ...btnPrimary, width: "100%", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div style={base}>
        <div style={card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>✉️</div>
            <h2 style={{ color: C.green }}>Check Your Email</h2>
            <p style={{ color: C.textLight, lineHeight: "1.6" }}>
              We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and sign in.
            </p>
            <button onClick={() => { setSignupSuccess(false); setMode("signin"); }} style={{ ...btnPrimary, marginTop: "20px" }}>
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={base}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>⛳</div>
          <h1 style={{ fontSize: "28px", color: C.green, margin: "0 0 4px" }}>Hideaway Golf Club</h1>
          <p style={{ fontSize: "18px", color: C.gold, margin: 0, fontStyle: "italic" }}>Staff Training Quiz</p>
        </div>

        <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderRadius: "8px", overflow: "hidden", border: `2px solid ${C.green}` }}>
          <button onClick={() => { setMode("signin"); setError(""); }}
            style={{ flex: 1, padding: "10px", border: "none", fontFamily: "inherit", fontSize: "15px", fontWeight: "600", cursor: "pointer", background: mode === "signin" ? C.green : C.white, color: mode === "signin" ? C.white : C.green }}>
            Sign In
          </button>
          <button onClick={() => { setMode("signup"); setError(""); }}
            style={{ flex: 1, padding: "10px", border: "none", borderLeft: `1px solid ${C.green}`, fontFamily: "inherit", fontSize: "15px", fontWeight: "600", cursor: "pointer", background: mode === "signup" ? C.green : C.white, color: mode === "signup" ? C.white : C.green }}>
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: C.textLight, display: "block", marginBottom: "4px" }}>First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: C.textLight, display: "block", marginBottom: "4px" }}>Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} required />
              </div>
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: C.textLight, display: "block", marginBottom: "4px" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: C.textLight, display: "block", marginBottom: "4px" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required minLength={6} />
          </div>

          {error && (
            <div style={{ background: C.redBg, color: C.red, padding: "10px 14px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...btnPrimary, width: "100%", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function HideawayQuiz() {
  const [auth, setAuth] = useState(null); // { user, token, firstName, lastName }
  const [screen, setScreen] = useState("home");
  const [selectedCats, setSelectedCats] = useState(new Set(Object.values(CATEGORIES)));
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch leaderboard on login
  const fetchLeaderboard = useCallback(async () => {
    if (!auth) return;
    try {
      const scores = await supabase.query("quiz_scores", {
        token: auth.token,
        params: "?select=score,total,percentage,categories,created_at,user_id,profiles(first_name,last_name)&order=percentage.desc,score.desc&limit=25",
      });
      if (Array.isArray(scores)) setLeaderboard(scores);
    } catch (e) { /* silent */ }
  }, [auth]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  if (!auth) return <AuthScreen onAuth={setAuth} />;

  const toggleCat = (k) => setSelectedCats((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const selectAll = () => setSelectedCats(new Set(Object.values(CATEGORIES)));
  const selectNone = () => setSelectedCats(new Set());

  const startQuiz = () => {
    const filtered = QUESTIONS.filter((q) => selectedCats.has(q.category));
    if (!filtered.length) return;
    setQuestions(shuffle(filtered));
    setCurrentQ(0); setSelected(null); setConfirmed(false);
    setScore(0); setAnswers([]); setReviewMode(false);
    setSaved(false); setScreen("quiz");
  };

  const confirmAnswer = () => {
    if (selected === null) return;
    const correct = selected === questions[currentQ].answer;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, { questionIdx: currentQ, selected, correct }]);
    setConfirmed(true);
  };

  const nextQuestion = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ((c) => c + 1); setSelected(null); setConfirmed(false);
    } else setScreen("results");
  };

  const saveScore = async () => {
    setSaving(true);
    try {
      const catNames = CAT_LABELS.filter(([, k]) => selectedCats.has(k)).map(([l]) => l).join(", ");
      await supabase.query("quiz_scores", {
        method: "POST", token: auth.token,
        body: {
          user_id: auth.user.id,
          score, total: questions.length,
          percentage: Math.round((score / questions.length) * 100),
          categories: catNames,
        },
      });
      setSaved(true);
      await fetchLeaderboard();
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  const signOut = () => { setAuth(null); setScreen("home"); };

  const wrongAnswers = answers.filter((a) => !a.correct);

  // === HOME ===
  if (screen === "home") {
    return (
      <div style={base}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "13px", color: C.textLight }}>Signed in as</div>
              <div style={{ fontWeight: "600" }}>{auth.firstName} {auth.lastName}</div>
            </div>
            <button onClick={signOut} style={{ ...btnSecondary, padding: "6px 16px", fontSize: "13px" }}>Sign Out</button>
          </div>

          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>⛳</div>
            <h1 style={{ fontSize: "28px", color: C.green, margin: "0 0 4px" }}>Hideaway Golf Club</h1>
            <p style={{ fontSize: "18px", color: C.gold, margin: 0, fontStyle: "italic" }}>Staff Training Quiz</p>
          </div>

          <p style={{ textAlign: "center", color: C.textLight, marginBottom: "24px" }}>
            Select categories to quiz yourself on, then hit Start.
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", justifyContent: "center" }}>
            <button onClick={selectAll} style={{ ...btnSecondary, padding: "6px 16px", fontSize: "13px" }}>Select All</button>
            <button onClick={selectNone} style={{ ...btnSecondary, padding: "6px 16px", fontSize: "13px" }}>Clear All</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "28px" }}>
            {CAT_LABELS.map(([label, key]) => {
              const active = selectedCats.has(key);
              const count = QUESTIONS.filter((q) => q.category === key).length;
              return (
                <button key={key} onClick={() => toggleCat(key)}
                  style={{ padding: "12px 16px", borderRadius: "8px", border: active ? `2px solid ${C.green}` : "2px solid #E0E0E0", background: active ? C.greenPale : C.white, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: active ? C.green : C.textLight }}>{label}</div>
                  <div style={{ fontSize: "12px", color: C.textLight }}>{count} questions</div>
                </button>
              );
            })}
          </div>

          <div style={{ textAlign: "center", display: "flex", gap: "12px", justifyContent: "center" }}>
            <button onClick={startQuiz} disabled={selectedCats.size === 0}
              style={{ ...btnPrimary, opacity: selectedCats.size === 0 ? 0.4 : 1, padding: "14px 48px", fontSize: "18px" }}>
              Start Quiz ({QUESTIONS.filter((q) => selectedCats.has(q.category)).length} questions)
            </button>
            <button onClick={() => { fetchLeaderboard(); setScreen("leaderboard"); }} style={{ ...btnGold, padding: "14px 24px" }}>
              Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === QUIZ ===
  if (screen === "quiz") {
    const q = questions[currentQ];
    const catLabel = CAT_LABELS.find(([, k]) => k === q.category)?.[0] || "";
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <div style={base}>
        <div style={card}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
              <span style={{ color: C.textLight }}>Question {currentQ + 1} of {questions.length}</span>
              <span style={{ color: C.green, fontWeight: "600" }}>Score: {score}/{currentQ + (confirmed ? 1 : 0)}</span>
            </div>
            <div style={{ height: "6px", background: "#E0E0E0", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.green}, ${C.greenLight})`, borderRadius: "3px", transition: "width 0.3s ease" }} />
            </div>
          </div>

          <div style={{ display: "inline-block", background: C.goldLight, color: C.text, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", marginBottom: "16px" }}>{catLabel}</div>

          <h2 style={{ fontSize: "20px", lineHeight: "1.4", marginBottom: "24px", fontWeight: "500" }}>{q.question}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
            {q.options.map((opt, i) => {
              let bg = C.white, border = "2px solid #E0E0E0", textColor = C.text;
              if (confirmed) {
                if (i === q.answer) { bg = C.greenBg; border = `2px solid ${C.correctGreen}`; textColor = C.correctGreen; }
                else if (i === selected && !answers[answers.length - 1]?.correct) { bg = C.redBg; border = `2px solid ${C.red}`; textColor = C.red; }
              } else if (i === selected) { bg = C.greenPale; border = `2px solid ${C.green}`; }
              return (
                <button key={i} onClick={() => !confirmed && setSelected(i)}
                  style={{ padding: "14px 18px", borderRadius: "8px", border, background: bg, cursor: confirmed ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", fontSize: "15px", color: textColor, transition: "all 0.15s", fontWeight: i === selected || (confirmed && i === q.answer) ? "600" : "400" }}>
                  <span style={{ marginRight: "10px", color: C.textLight, fontWeight: "400" }}>{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              );
            })}
          </div>

          <div style={{ textAlign: "center" }}>
            {!confirmed ? (
              <button onClick={confirmAnswer} disabled={selected === null} style={{ ...btnPrimary, opacity: selected === null ? 0.4 : 1, padding: "12px 40px" }}>Confirm Answer</button>
            ) : (
              <div>
                <p style={{ fontWeight: "600", fontSize: "16px", color: answers[answers.length - 1]?.correct ? C.correctGreen : C.red, marginBottom: "16px" }}>
                  {answers[answers.length - 1]?.correct ? "Correct!" : "Incorrect"}
                </p>
                <button onClick={nextQuestion} style={{ ...btnPrimary, padding: "12px 40px" }}>
                  {currentQ + 1 < questions.length ? "Next Question" : "See Results"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === RESULTS ===
  if (screen === "results") {
    const pct = Math.round((score / questions.length) * 100);
    let grade, gradeColor;
    if (pct >= 90) { grade = "Outstanding"; gradeColor = C.correctGreen; }
    else if (pct >= 75) { grade = "Great Job"; gradeColor = C.green; }
    else if (pct >= 60) { grade = "Good Effort"; gradeColor = C.gold; }
    else { grade = "Keep Studying"; gradeColor = C.red; }

    // Review wrong answers
    if (reviewMode && wrongAnswers.length > 0) {
      const wa = wrongAnswers[reviewIdx];
      const q = questions[wa.questionIdx];
      const catLabel = CAT_LABELS.find(([, k]) => k === q.category)?.[0] || "";
      return (
        <div style={base}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: C.red }}>Review: {reviewIdx + 1} of {wrongAnswers.length} missed</h3>
              <button onClick={() => setReviewMode(false)} style={{ ...btnSecondary, padding: "6px 16px", fontSize: "13px" }}>Back to Results</button>
            </div>
            <div style={{ display: "inline-block", background: C.goldLight, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", marginBottom: "16px" }}>{catLabel}</div>
            <h2 style={{ fontSize: "18px", lineHeight: "1.4", marginBottom: "20px" }}>{q.question}</h2>
            {q.options.map((opt, i) => {
              let bg = C.white, border = "2px solid #E0E0E0", textColor = C.text;
              if (i === q.answer) { bg = C.greenBg; border = `2px solid ${C.correctGreen}`; textColor = C.correctGreen; }
              else if (i === wa.selected) { bg = C.redBg; border = `2px solid ${C.red}`; textColor = C.red; }
              return (
                <div key={i} style={{ padding: "12px 16px", borderRadius: "8px", border, background: bg, marginBottom: "8px", fontSize: "14px", color: textColor, fontWeight: i === q.answer || i === wa.selected ? "600" : "400" }}>
                  <span style={{ marginRight: "8px", color: C.textLight, fontWeight: "400" }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}{i === q.answer && " ✓"}{i === wa.selected && i !== q.answer && " ✗"}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
              <button onClick={() => setReviewIdx(Math.max(0, reviewIdx - 1))} disabled={reviewIdx === 0} style={{ ...btnSecondary, opacity: reviewIdx === 0 ? 0.4 : 1 }}>Previous</button>
              <button onClick={() => reviewIdx < wrongAnswers.length - 1 ? setReviewIdx(reviewIdx + 1) : setReviewMode(false)} style={btnPrimary}>
                {reviewIdx < wrongAnswers.length - 1 ? "Next" : "Back to Results"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={base}>
        <div style={card}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>⛳</div>
            <h2 style={{ color: gradeColor, margin: "0 0 4px", fontSize: "28px" }}>{grade}!</h2>
            <p style={{ fontSize: "42px", fontWeight: "700", color: C.text, margin: "12px 0" }}>{score} / {questions.length}</p>
            <p style={{ fontSize: "18px", color: C.textLight }}>{pct}% correct</p>
          </div>

          {/* Category breakdown */}
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "16px", color: C.textLight, marginBottom: "12px" }}>By Category</h3>
            {CAT_LABELS.filter(([, k]) => selectedCats.has(k)).map(([label, key]) => {
              const catQs = answers.filter((a) => questions[a.questionIdx].category === key);
              if (!catQs.length) return null;
              const catCorrect = catQs.filter((a) => a.correct).length;
              const catPct = Math.round((catCorrect / catQs.length) * 100);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ width: "160px", fontSize: "13px", fontWeight: "500" }}>{label}</div>
                  <div style={{ flex: 1, height: "8px", background: "#E0E0E0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${catPct}%`, background: catPct >= 75 ? C.correctGreen : catPct >= 50 ? C.gold : C.red, borderRadius: "4px" }} />
                  </div>
                  <div style={{ width: "60px", fontSize: "13px", textAlign: "right", color: C.textLight }}>{catCorrect}/{catQs.length}</div>
                </div>
              );
            })}
          </div>

          {/* Save to leaderboard */}
          {!saved ? (
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button onClick={saveScore} disabled={saving} style={{ ...btnGold, opacity: saving ? 0.6 : 1, padding: "12px 40px" }}>
                {saving ? "Saving..." : "Save Score to Leaderboard"}
              </button>
            </div>
          ) : (
            <div style={{ background: C.greenBg, padding: "12px 16px", borderRadius: "8px", textAlign: "center", marginBottom: "20px", color: C.correctGreen, fontWeight: "600", fontSize: "14px" }}>
              Score saved to the leaderboard!
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {wrongAnswers.length > 0 && (
              <button onClick={() => { setReviewMode(true); setReviewIdx(0); }} style={btnSecondary}>Review Missed ({wrongAnswers.length})</button>
            )}
            <button onClick={startQuiz} style={btnSecondary}>Retry</button>
            <button onClick={() => setScreen("home")} style={btnPrimary}>New Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  // === LEADERBOARD ===
  if (screen === "leaderboard") {
    return (
      <div style={base}>
        <div style={card}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ color: C.green, margin: "0 0 4px" }}>Leaderboard</h2>
            <p style={{ color: C.textLight, fontSize: "14px" }}>Top scores from the team</p>
          </div>

          {leaderboard.length === 0 ? (
            <p style={{ textAlign: "center", color: C.textLight }}>No scores yet. Be the first!</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.green}` }}>
                    <th style={{ padding: "10px 8px", textAlign: "left", color: C.green }}>#</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", color: C.green }}>Name</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", color: C.green }}>Score</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", color: C.green }}>%</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", color: C.green }}>Categories</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", color: C.green }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => {
                    const name = entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}` : "Staff";
                    const isMe = entry.user_id === auth.user.id;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #F0F0F0", background: isMe ? C.goldLight : i < 3 ? C.greenPale : "transparent" }}>
                        <td style={{ padding: "10px 8px", fontWeight: "600" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                        <td style={{ padding: "10px 8px", fontWeight: "500" }}>{name}{isMe ? " (you)" : ""}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>{entry.score}/{entry.total}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: "600", color: entry.percentage >= 90 ? C.correctGreen : entry.percentage >= 75 ? C.green : entry.percentage >= 60 ? C.gold : C.red }}>{entry.percentage}%</td>
                        <td style={{ padding: "10px 8px", fontSize: "12px", color: C.textLight, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.categories}</td>
                        <td style={{ padding: "10px 8px", color: C.textLight }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button onClick={() => setScreen("home")} style={btnPrimary}>Take a Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
