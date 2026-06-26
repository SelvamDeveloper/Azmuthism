# LearnAway — Course Selling Platform

A complete end-to-end online course platform inspired by the **JobAway** UI theme (forest green + lime green accent, rounded cards, modern typography).

## Features

- **Marketing website** — Hero, stats, about, why choose us, categories, how it works, team, news, newsletter, footer
- **Course catalog** — 9 courses across 6 categories with search and filters
- **Course detail pages** — Curriculum, instructor info, pricing, enroll/cart
- **User accounts** — Register, login (localStorage)
- **Shopping cart & checkout** — Add courses, mock payment, enrollment
- **Student dashboard** — Enrolled courses, progress tracking
- **Responsive design** — Mobile, tablet, and desktop

## Course Categories

| Category | Example Courses |
|----------|----------------|
| 3D Printing | 3D Printing Masterclass |
| Business | Business Strategy, Startup Entrepreneurship |
| Development | Full-Stack Bootcamp, Python Data Science |
| Investment | Investment Fundamentals, Crypto Investing |
| Design | UI/UX Design |
| Marketing | Digital Marketing Mastery |

## Quick Start

No build tools required. Open directly in a browser:

1. Navigate to the `course-platform` folder
2. Double-click `index.html`, or run a local server:

```powershell
# Option 1: Python (if installed)
python -m http.server 8080

# Option 2: npx (if Node.js installed)
npx serve .
```

3. Open `http://localhost:8080` in your browser

## Demo Login

Use the demo account to explore the platform instantly (3 pre-enrolled courses):

| Field | Value |
|-------|-------|
| Email | `demo@learnaway.com` |
| Password | `demo123` |

**Quick access:** Click **Try Demo** on the homepage, or **Demo Login** on the login page, or visit `login.html?demo=1`.

## Demo Flow

1. Browse courses on the homepage or **Courses** page
2. Click a course → **Enroll Now** or **Add to Cart**
3. **Register** a new account (or log in)
4. Complete **Checkout** (mock payment — any card details work)
5. View enrolled courses in **Dashboard**

## Project Structure

```
course-platform/
├── index.html          # Homepage
├── courses.html        # Course catalog
├── course-detail.html  # Single course page
├── login.html          # Login
├── register.html       # Registration
├── dashboard.html      # Student dashboard
├── checkout.html       # Cart & payment
├── css/styles.css      # Full theme (JobAway colors)
├── js/
│   ├── data.js         # Courses, categories, team data
│   ├── app.js          # Shared utilities, cart, auth state
│   ├── courses.js      # Course listing & detail logic
│   └── auth.js         # Login, register, dashboard, checkout
└── README.md
```

## Color Theme (from JobAway reference)

| Token | Value | Usage |
|-------|-------|-------|
| Forest Green | `#1a3d34` | Hero, headers, dark sections |
| Lime Green | `#b4f038` | Buttons, accents, CTAs |
| White | `#ffffff` | Cards, nav bar |
| Gray tones | `#f9fafb` – `#111827` | Text, borders, backgrounds |

## Next Steps (Production)

To deploy as a production app, consider:

- **Backend**: Node.js/Express or Python/Django with PostgreSQL
- **Auth**: JWT or OAuth (Google, GitHub)
- **Payments**: Stripe or PayPal integration
- **Video hosting**: Vimeo, Mux, or AWS S3 + CloudFront
- **CMS**: Admin panel for course management

## License

MIT — free to use and modify.
