# Campus Life Planner

ALU Summative - Campus Life Planner web app

🌐 **Live site:** https://mucyo-7.github.io/campus-life-planner

## Theme
Campus Life Planner

## Features
- Add, edit, delete tasks with title, due date, duration, and tag
- Live regex search with match highlighting
- Sort by date, title, or duration
- Stats dashboard with 7-day trend chart
- Weekly duration target with progress bar
- localStorage persistence
- JSON import/export with validation
- Unit conversion (minutes ↔ hours)
- Custom tags management
- Mobile-first responsive design (360px, 768px, 1024px)
- Full keyboard navigation and ARIA live regions

## Regex Catalog
| Pattern | Purpose | Example |
|---|---|---|
| `/^\S(?:.*\S)?$/` | No leading/trailing spaces in title | `"Study exam"` ✅ `" exam"` ❌ |
| `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Valid duration | `"90"` ✅ `"1.5"` ✅ `"abc"` ❌ |
| `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Date YYYY-MM-DD | `"2025-10-15"` ✅ |
| `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Tag format | `"Self-Study"` ✅ `"Tag1"` ❌ |
| `/\b(\w+)\s+\1\b/i` | Duplicate word detection (advanced) | `"the the exam"` ❌ |

## Keyboard Map
| Key | Action |
|---|---|
| Tab | Move between elements |
| Enter / Space | Activate buttons |
| Tab to nav links | Navigate pages |
| Escape | Cancel form |

## A11y Notes
- Semantic landmarks: header, nav, main, section, footer
- All inputs have visible labels
- Skip-to-content link at top
- Errors via aria-live="assertive"
- Status via aria-live="polite"
- Visible focus styles on all elements
- WCAG AA color contrast

## How to Run Tests
Open `tests.html` in a local server (e.g. Live Server in VS Code)

## Data Model
Each record contains:
- id: unique string e.g. rec_0001
- title: string
- dueDate: YYYY-MM-DD
- duration: number (minutes)
- tag: string (Study, Assignment, Event, Personal, Meeting, Other)
- createdAt: ISO timestamp
- updatedAt: ISO timestamp

Stored in localStorage as JSON array under key "campus:records"