## Data Model
Each record contains:
- id: unique string e.g. rec_0001
- title: string
- dueDate: YYYY-MM-DD 
- duration: number (minutes)
- tag: string (Study, Assignment, Event, Personal, Meeting, Other)
- createdAt: ISO timestamp
- updatedAt: ISO timestamp

Stored in localStorage as JSON array under key "campus:data"

## Accessibility Plan
- Semantic landmarks: header, nav, main, section, footer
- All inputs have visible labels
- Keyboard navigation works on all interactive elements
- Skip-to-content link at top of page
- Errors announced via aria-live="assertive"
- Status updates via aria-live="polite"
- Visible focus styles  on all focusable elements
- Color contrast meets WCAG AA standard
