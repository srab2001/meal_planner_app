# FITNESS APP - LOW-FIDELITY WIREFRAMES

**Prepared By:** UX/UI Designer  
**Date:** December 21, 2025  
**Status:** ✅ WIREFRAME SPECIFICATIONS  
**Format:** Screen-by-screen layout descriptions for JPEG export  
**Tool Recommendation:** Figma, Sketch, or Adobe XD

---

## 📐 WIREFRAME GUIDELINES

### Grid System
- **Desktop:** 12-column grid, 20px gutters
- **Mobile:** 4-column grid, 16px gutters
- **Tablet:** 8-column grid, 16px gutters

### Color Palette (Low-Fi)
- **Background:** White (#FFFFFF)
- **Primary Elements:** Light Gray (#F5F5F5)
- **Text:** Dark Gray (#333333)
- **Borders:** Medium Gray (#CCCCCC)
- **Accents:** Blue (#0066CC) for interactive elements

### Typography (Low-Fi)
- **Headings:** Sans-serif, Bold, 18-24px
- **Subheadings:** Sans-serif, Bold, 14-16px
- **Body Text:** Sans-serif, Regular, 12-14px
- **Labels:** Sans-serif, Regular, 12px

### Interactive Elements
- Buttons: 44px minimum height
- Input fields: 44px minimum height
- Touch targets: 44x44px minimum

---

---

## WIREFRAME 1: WORKOUT LOG SCREEN

### Screen Name
**"Log Workout" - Main Entry Screen**

### Device
Mobile (375px width) - can scale to tablet/desktop

### Viewport
Full screen, notch-friendly safe area

---

### HEADER (Top, 60px)
```
┌─────────────────────────────────────────┐
│ ← Back          Log Workout             │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Back arrow icon (top-left, 24x24px)
- Screen title "Log Workout" (center, bold)
- Close button alternative (top-right, optional)

**Spacing:**
- 16px left padding
- 16px right padding
- 12px vertical padding

---

### SECTION 1: WORKOUT BASICS (120px, Light Gray #F5F5F5 background)
```
┌─────────────────────────────────────────┐
│  Workout Date & Name                    │
│  ┌──────────────────────────────────┐   │
│  │ Today (Dec 21, 2025)        [v]  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ Workout Name (e.g. Leg Day)  [✎] │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Label: "Workout Date & Name" (12px, gray)
- Date picker field with dropdown icon (44px height)
- Text input field for workout name (44px height)
- Edit icon (small, 16x16px)

**Spacing:**
- 16px padding all sides
- 12px gap between fields
- 8px label-to-field spacing

---

### SECTION 2: EXERCISES LIST (Variable height, scrollable)
```
┌─────────────────────────────────────────┐
│  Exercises                      [+ Add] │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  1. Barbell Squat         [···] │   │
│  │     Sets: 3 | Reps: 20 | Weight │   │
│  │     ┌────────────────────────┐   │   │
│  │     │ Set 1: 8 reps × 225 lbs│   │   │
│  │     │ Set 2: 7 reps × 225 lbs│   │   │
│  │     │ Set 3: 5 reps × 225 lbs│   │   │
│  │     └────────────────────────┘   │   │
│  │     [Edit] [Delete]            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  2. Incline DB Press      [···] │   │
│  │     Sets: 4 | Reps: 29 | Weight │   │
│  │     ┌────────────────────────┐   │   │
│  │     │ Set 1: 10 reps × 70 lbs│   │   │
│  │     │ Set 2: 8 reps × 70 lbs │   │   │
│  │     │ Set 3: 6 reps × 70 lbs │   │   │
│  │     │ Set 4: 5 reps × 65 lbs │   │   │
│  │     └────────────────────────┘   │   │
│  │     [Edit] [Delete]            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Add Another Exercise]               │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Section heading "Exercises" (14px bold)
- "+ Add Exercise" button (blue, top-right)
- Exercise card (repeated, collapsed/expanded states)
  - Exercise number and name
  - Set/reps/weight summary
  - Expandable sets list
  - Edit/Delete buttons (small, 12px text)
- "+ Add Another Exercise" button (full-width, blue text)

**Exercise Card Details:**
- 12px border-radius
- 1px solid border (#CCCCCC)
- 12px padding
- 8px gap between sets
- Hover state: light background change

**Spacing:**
- 16px padding all sides
- 12px gap between exercises
- 20px gap before "+ Add" button

---

### SECTION 3: NOTES (Variable height)
```
┌─────────────────────────────────────────┐
│  Notes (Optional)                       │
│  ┌──────────────────────────────────┐   │
│  │ Great session, feeling strong... │   │
│  │                                  │   │
│  │ [98/500 characters]              │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Label "Notes (Optional)" (12px, gray)
- Text area (expandable, multi-line)
- Character counter (12px, gray, right-aligned)

**Spacing:**
- 16px padding all sides
- 8px label-to-field
- 8px gap between field and counter

---

### FOOTER: ACTIONS (60px, Sticky bottom)
```
┌─────────────────────────────────────────┐
│  [Cancel]               [Save Workout]  │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- "Cancel" button (white background, dark border, 44px height)
- "Save Workout" button (blue background, white text, 44px height)

**Spacing:**
- 16px padding all sides
- 12px gap between buttons
- Fixed at bottom, above safe area

---

### STATES TO SHOW

**State 1: Empty Workout (New)**
- Date picker shows "Today"
- Workout name field empty
- No exercises yet
- "+ Add Exercise" button prominent

**State 2: Partially Filled**
- Date selected
- Workout name entered
- 1-2 exercises with sets added
- "+ Add Another Exercise" visible

**State 3: Complete**
- All fields filled
- Multiple exercises with full set data
- Notes populated
- Save button enabled (darker blue)

**State 4: Error**
- Validation error at top (red banner, 3px border-left)
- Message: "Add at least one exercise"
- Problematic fields highlighted with red border

---

### ANNOTATIONS FOR DEVELOPER

```
HEIGHTS:
- Header: 60px (safe area + content)
- Section 1: 120px
- Exercise cards: 80-150px each (variable)
- Notes section: 100px
- Footer: 60px (sticky)

SCROLLABLE:
- Main content between header and footer (scrollable)
- Exercise sets within cards (scrollable if > 4 sets)

INTERACTIONS:
- Tap date field → Date picker modal
- Tap workout name → Inline keyboard
- Tap "+ Add Exercise" → Exercise selector modal
- Tap exercise card → Toggle expand/collapse
- Tap edit icon on exercise → Edit modal
- Tap delete → Confirmation dialog

VALIDATION:
- workout_date: No future dates
- workout_name: Required, max 255 chars
- exercises: At least 1 required
- sets: All numeric fields required

COLOR CODING:
- Disabled elements: #CCCCCC text
- Error text: #CC0000
- Success: #00CC00
```

---

---

## WIREFRAME 2: EXERCISE ENTRY MODAL

### Screen Name
**"Add Exercise" - Modal Dialog**

### Device
Mobile (375px width) - Modal overlay

### Viewport
Full screen with semi-transparent overlay (opacity 0.5)

---

### MODAL CONTAINER (300-500px height)
```
┌─────────────────────────────────────────┐
│                                         │
│ ─────────────────────────────────────── │ (Dim background)
│                                         │
│  ╔═════════════════════════════════╗   │
│  ║ Add Exercise              [×]   ║   │
│  ╠═════════════════════════════════╣   │
│  ║                                 ║   │
│  ║  Search Exercises               ║   │
│  ║  ┌──────────────────────────┐   ║   │
│  ║  │ 🔍 Search (e.g. squat)   │   ║   │
│  ║  └──────────────────────────┘   ║   │
│  ║                                 ║   │
│  ║  ┌──────────────────────────┐   ║   │
│  ║  │ Categories               │   ║   │
│  ║  │ ⊡ Chest  ⊡ Back  ⊡ Legs ║   ║   │
│  ║  │ ⊡ Shoulders ⊡ Arms  ⊡ Core ║   ║   │
│  ║  └──────────────────────────┘   ║   │
│  ║                                 ║   │
│  ║  Popular Exercises              ║   │
│  ║  ┌──────────────────────────┐   ║   │
│  ║  │ ► Barbell Squat         │   ║   │
│  ║  │ ► Bench Press           │   ║   │
│  ║  │ ► Barbell Rows          │   ║   │
│  ║  │ ► Deadlift              │   ║   │
│  ║  │ ► Pull-ups              │   ║   │
│  ║  │ ► [See all 45 exercises]│   ║   │
│  ║  └──────────────────────────┘   ║   │
│  ║                                 ║   │
│  ║  [Cancel]        [Select]       ║   │
│  ║                                 ║   │
│  ╚═════════════════════════════════╝   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Modal header with title and close button (×)
- Divider line below header
- Search input field (44px height)
- Category filter buttons (16x16px checkboxes)
- "Popular Exercises" heading
- Exercise list (scrollable)
  - Exercise name with arrow indicator
  - Each item 44px height
  - Hover state: light background
- "See all exercises" link
- Cancel and Select buttons (footer sticky to modal)

**Modal Styling:**
- 12px border-radius
- White background
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Max height: 80vh

**Spacing:**
- 16px padding left/right
- 12px padding top/bottom
- 8px gap between elements
- 12px between header and content
- 12px between content and footer

---

### MODAL STATES

**State 1: Initial Load**
- Search field empty
- All categories unchecked
- Popular exercises list shown (5-6 items)
- "See all exercises" link visible

**State 2: Search Active**
```
┌─────────────────────────────────────────┐
│ Search Results for "squat"              │
│ ┌──────────────────────────────────┐   │
│ │ ► Barbell Squat                 │   │
│ │ ► Leg Press                     │   │
│ │ ► Smith Machine Squat           │   │
│ │ ► Bulgarian Split Squat         │   │
│ │ [4 results found]               │   │
│ └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```
- Search field shows typed text
- Results filtered to matching exercises
- Count shown at bottom: "4 results found"

**State 3: Category Filtered**
```
┌─────────────────────────────────────────┐
│ Leg Exercises                           │
│ ┌──────────────────────────────────┐   │
│ │ ► Barbell Squat                 │   │
│ │ ► Leg Press                     │   │
│ │ ► Leg Curl                      │   │
│ │ ► Leg Extension                 │   │
│ │ ► Calf Raise                    │   │
│ └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```
- Category button checked (darker background)
- Exercises filtered to selected category
- Heading shows "Leg Exercises" or similar

**State 4: Exercise Selected**
```
┌─────────────────────────────────────────┐
│                                         │
│ ► Barbell Squat (HIGHLIGHTED)          │
│   Equipment: Barbell                   │
│   Primary: Quads | Secondary: Glutes   │
│                                         │
│ [Cancel]              [Select]         │
│ (Select button is now blue/enabled)    │
│                                         │
└─────────────────────────────────────────┘
```
- Selected exercise highlighted (light blue background)
- Exercise details shown below name
- Select button enabled (darker blue)
- Cancel button still white/disabled

---

### ANNOTATIONS FOR DEVELOPER

```
MODAL DIMENSIONS:
- Width: 90vw (max 400px)
- Height: Auto (content-based, max 80vh)
- Position: Centered on screen
- Z-index: Above main content

INTERACTIONS:
- Tap search field → Mobile keyboard appears
- Type in search → Real-time filtering
- Tap category button → Toggle selection
- Tap exercise → Select and highlight
- Tap "See all exercises" → Expand full list
- Tap [×] or Cancel → Close modal
- Tap Select → Pass selection to parent

KEYBOARD:
- Search field auto-focuses when modal opens
- Enter/Return key can select highlighted item
- Escape key closes modal

ACCESSIBILITY:
- ARIA: role="dialog"
- Focus management: Trap focus within modal
- Screen reader: Announce exercise count
- Category buttons: aria-pressed="true/false"

ANIMATION:
- Modal slide-up from bottom (300ms)
- Overlay fade-in (300ms)
- Exercise selection highlight (200ms)
```

---

---

## WIREFRAME 3: WEEKLY SUMMARY SCREEN

### Screen Name
**"Weekly Summary" - Analytics & Overview**

### Device
Mobile (375px width) - can scale to tablet

### Viewport
Full screen, scrollable content

---

### HEADER (60px)
```
┌─────────────────────────────────────────┐
│ ← Back           Weekly Summary         │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Back arrow icon (top-left, 24x24px)
- Screen title "Weekly Summary" (center, bold)

**Spacing:**
- 16px left/right padding
- 12px vertical padding

---

### WEEK SELECTOR (50px)
```
┌─────────────────────────────────────────┐
│         ← Dec 16-22, 2025 →             │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Left arrow (←) (24x24px icon, left)
- Week range text: "Dec 16-22, 2025" (bold, center)
- Right arrow (→) (24x24px icon, right)
- Center text is tappable for date picker

**Spacing:**
- 16px padding all sides
- Centered layout with arrows on both sides

---

### SUMMARY CARDS (120px total, 3 columns)
```
┌─────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐        │
│ │   4 of 5    │ │  3h 45min   │        │
│ │ Workouts    │ │  Duration   │        │
│ └─────────────┘ └─────────────┘        │
│                                         │
│ ┌─────────────┐ ┌─────────────┐        │
│ │  12,450 lbs │ │   6.5 / 10  │        │
│ │   Volume    │ │ Intensity   │        │
│ └─────────────┘ └─────────────┘        │
│                                         │
│ ┌─────────────┐ ┌─────────────┐        │
│ │  2 sessions │ │  15.6 miles │        │
│ │   Cardio    │ │   Distance  │        │
│ └─────────────┘ └─────────────┘        │
│                                         │
└─────────────────────────────────────────┘
```

**Card Elements:**
- 6 stat cards in 2 columns (or 3 columns on tablet)
- Each card: 60px height, 12px border-radius
- Background: Light gray (#F5F5F5)
- Number: Large, bold (20px)
- Label: Small, gray (12px)
- Border: 1px solid (#CCCCCC)

**Spacing:**
- 16px padding around entire section
- 8px gap between cards horizontally
- 8px gap between cards vertically

---

### TABS (40px)
```
┌─────────────────────────────────────────┐
│ [Overview] [Exercises] [Intensity]      │
│ [Cardio]   [Progress]                   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- 5 tab buttons (scrollable if needed)
- Active tab: Blue text, underline (2px)
- Inactive tabs: Gray text
- Tab height: 40px
- Text: 14px, center-aligned

**Spacing:**
- 16px padding left/right
- 8px gap between tabs
- 2px underline thickness
- Underline color: Blue (#0066CC)

---

### TAB CONTENT: OVERVIEW (Active tab)
```
┌─────────────────────────────────────────┐
│                                         │
│  Workouts This Week                     │
│  ┌──────────────────────────────────┐   │
│  │ Mon (Dec 16) - Back & Biceps   ► │   │
│  │ 2 exercises • 45 min • 950 lbs   │   │
│  │                                  │   │
│  │ Tue (Dec 17) - Leg Day         ► │   │
│  │ 4 exercises • 60 min • 2,150 lbs │   │
│  │                                  │   │
│  │ Wed (Dec 18) - Cardio          ► │   │
│  │ 5K Run • 28 min • 3.1 miles     │   │
│  │                                  │   │
│  │ Thu (Dec 19) - Rest Day          │   │
│  │ No workout logged                │   │
│  │                                  │   │
│  │ Fri (Dec 20) - Upper Push      ► │   │
│  │ 3 exercises • 50 min • 1,200 lbs │   │
│  │                                  │   │
│  │ Sat (Dec 21) - Cardio          ► │   │
│  │ Cycling • 45 min • 12.5 miles   │   │
│  │                                  │   │
│  │ Sun (Dec 22) - Off               │   │
│  │ Rest day                         │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Heading: "Workouts This Week" (14px bold)
- Day blocks (one per day)
- Day/date: Bold (14px)
- Workout name: Regular (12px)
- Details: Gray text (12px)
- Right arrow: Indicates tappable
- Background: White (#FFFFFF)
- Border: 1px solid (#CCCCCC)
- Height: 60px per day block
- Padding: 12px

**Spacing:**
- 16px padding all sides
- 8px gap between day blocks
- 4px gap between detail lines within block

---

### TAB CONTENT: EXERCISES (Hidden by default)
```
┌─────────────────────────────────────────┐
│                                         │
│  Top Exercises This Week                │
│  ┌──────────────────────────────────┐   │
│  │ Barbell Squat             3x     │   │
│  │ 675 lbs total • ↑ 25 lbs from avg│   │
│  │                                  │   │
│  │ Bench Press               3x     │   │
│  │ 450 lbs total • ↑ 10 lbs         │   │
│  │                                  │   │
│  │ Barbell Rows              2x     │   │
│  │ 490 lbs total • Same as last week│   │
│  │                                  │   │
│  │ Barbell Deadlift          2x     │   │
│  │ 510 lbs total • ↓ 5 lbs          │   │
│  │                                  │   │
│  │ Incline DB Press          2x     │   │
│  │ 275 lbs total • ↑ 15 lbs         │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Heading: "Top Exercises This Week"
- Exercise name: Bold (14px)
- Frequency: Right-aligned (12px)
- Details: Gray (11px)
- Trend indicator: ↑ (green), ↓ (red), → (gray)
- Cards: 60px height, 1px border

---

### TAB CONTENT: INTENSITY (Hidden by default)
```
┌─────────────────────────────────────────┐
│                                         │
│  Intensity Distribution                 │
│  ┌──────────────────────────────────┐   │
│  │ Low (1-4):        ████░░░░░░░░ 8%│   │
│  │ Moderate (5-7):   ███████░░░░░ 70%│  │
│  │ High (8-10):      ██████░░░░░░ 22%│  │
│  └──────────────────────────────────┘   │
│                                         │
│  Average Intensity: 6.5 / 10            │
│                                         │
│  Recommendation:                        │
│  Consider increasing intensity next     │
│  week for greater strength gains.       │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Heading: "Intensity Distribution"
- Chart: Horizontal bar chart
  - Labels: Left-aligned (12px)
  - Bars: Colored (blue gradient)
  - Percentages: Right-aligned (12px)
- Average metric: Bold (14px)
- Recommendation text: Gray (12px italic)

---

### FOOTER: ACTIONS (60px, Sticky)
```
┌─────────────────────────────────────────┐
│ [Export PDF]            [Share Report]  │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- "Export PDF" button (white background, dark border, 44px height)
- "Share Report" button (blue background, white text, 44px height)

**Spacing:**
- 16px padding all sides
- 12px gap between buttons

---

### ANNOTATIONS FOR DEVELOPER

```
TABS INTERACTION:
- Swipe left/right between tabs
- Tap tab to switch
- Active tab underline animates (300ms)
- Content transitions smoothly (200ms)

SCROLLABLE SECTIONS:
- Main content scrolls
- Summary cards don't scroll
- Week selector sticky at top
- Footer buttons sticky at bottom

STATES:
- Empty week: Show "No workouts this week"
- Loading: Show skeleton screens
- Error: Show retry button

CHART RENDERING:
- Bar chart: Use simple CSS or Canvas
- Responsive: Adapt to screen width
- Accessibility: Include data labels

TAPPABLE ELEMENTS:
- Day blocks → Navigate to workout detail
- Exercise items → Show exercise details
- Trend arrows → Show trending graph

DATA SOURCE:
- Fetch from /progress/weekly-summary endpoint
- Cache results for offline access
- Refresh on pull-to-refresh
```

---

---

## WIREFRAME 4: HISTORY LIST SCREEN

### Screen Name
**"Workout History" - Filterable List View**

### Device
Mobile (375px width) - can scale to tablet

### Viewport
Full screen, scrollable list

---

### HEADER (60px)
```
┌─────────────────────────────────────────┐
│ ← Back           Workout History        │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Back arrow icon (top-left, 24x24px)
- Screen title "Workout History" (center, bold)

---

### FILTER BAR (50px)
```
┌─────────────────────────────────────────┐
│ [Type ▼] [Sort ▼] [Date ▼]             │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- 3 dropdown buttons in a row
  - "Type ▼" (default: All)
  - "Sort ▼" (default: Newest First)
  - "Date ▼" (default: Last 30 Days)
- Each button: 44px height, 1px border
- Chevron icon: 12px
- Text: 12px, gray

**Spacing:**
- 16px padding left/right
- 8px gap between buttons
- Buttons flex to fill available width

---

### DROPDOWN MENU EXAMPLES

**Type Dropdown:**
```
┌──────────────┐
│ ✓ All        │
│   Strength   │
│   Cardio     │
│   Flexibility│
└──────────────┘
```

**Sort Dropdown:**
```
┌─────────────────────┐
│ ✓ Newest First      │
│   Oldest First      │
│   Longest Duration  │
│   Most Volume       │
└─────────────────────┘
```

**Date Range Dropdown:**
```
┌─────────────────────┐
│ ✓ Last 30 Days      │
│   Last 7 Days       │
│   Last 90 Days      │
│   All Time          │
│   Custom Range      │
└─────────────────────┘
```

---

### LIST VIEW (Variable height, scrollable)
```
┌─────────────────────────────────────────┐
│ Showing 4 workouts (Last 30 days)       │
│                                         │
│ ┌──────────────────────────────────┐    │
│ │ Dec 21, 2025  Mon                │    │
│ │ Back & Biceps Monday         [···]│   │
│ │ 2 exercises • 45 min • 950 lbs   │    │
│ └──────────────────────────────────┘    │
│                                         │
│ ┌──────────────────────────────────┐    │
│ │ Dec 19, 2025  Sat                │    │
│ │ Leg Day Friday               [···]│   │
│ │ 4 exercises • 60 min • 2,150 lbs │    │
│ └──────────────────────────────────┘    │
│                                         │
│ ┌──────────────────────────────────┐    │
│ │ Dec 17, 2025  Wed                │    │
│ │ Upper Body Pull              [···]│   │
│ │ 3 exercises • 50 min • 1,200 lbs │    │
│ └──────────────────────────────────┘    │
│                                         │
│ ┌──────────────────────────────────┐    │
│ │ Dec 15, 2025  Mon                │    │
│ │ Strength Training            [···]│   │
│ │ 5 exercises • 75 min • 2,400 lbs │    │
│ └──────────────────────────────────┘    │
│                                         │
│ [Load More Results]                     │
│                                         │
└─────────────────────────────────────────┘
```

**List Header:**
- "Showing X workouts (Filter applied)" (12px gray)
- Appears above list, sticky

**Workout Card:**
- Date: Large, bold (16px)
- Day of week: Gray (12px, right of date)
- Workout name: Bold (14px)
- More menu: ⋯ icon (top-right, tappable)
- Details: Gray (12px)
  - Exercises count
  - Duration
  - Total volume
- Height: 80px
- Background: White (#FFFFFF)
- Border: 1px solid (#CCCCCC)
- Border-radius: 8px
- Padding: 12px

**Spacing:**
- 16px padding left/right
- 12px gap between cards
- 20px gap before "Load More" button

**More Menu:**
```
Tap [···] to reveal:
├─ View Details →
├─ Edit (if within 24h)
├─ Delete (if within 24h)
└─ Share
```

---

### LIST STATES

**State 1: Full List (Results found)**
```
Showing 45 workouts (Last 90 days)
[Workout cards listed...]
[Load More Results]
```

**State 2: Filtered (Fewer results)**
```
Showing 8 cardio workouts (Last 30 days)
[Cardio workout cards...]
Showing strength filter → only cardio shown
```

**State 3: Empty State (No results)**
```
┌─────────────────────────────────────────┐
│                                         │
│         No Workouts Found               │
│                                         │
│     Try adjusting filters or date       │
│     range to find your workouts.        │
│                                         │
│         [Clear Filters]                 │
│         [Log New Workout]               │
│                                         │
└─────────────────────────────────────────┘
```

**State 4: Loading**
```
┌──────────────────────────────────────┐
│ ┌────────────────────────────────┐   │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │ (Skeleton)
│ │                                │   │
│ │ ░░░░ ░░░░░░░░ ░░░░░░░░ ░░░░  │   │
│ └────────────────────────────────┘   │
│                                       │
│ ┌────────────────────────────────┐   │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│ │                                │   │
│ │ ░░░░ ░░░░░░░░ ░░░░░░░░ ░░░░  │   │
│ └────────────────────────────────┘   │
│                                       │
└──────────────────────────────────────┘
```
- Show 3-4 skeleton cards while loading
- Animate pulse effect on skeletons

---

### DETAIL VIEW (Modal Overlay)
When tapping a workout card:

```
┌─────────────────────────────────────────┐
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│  ╔═════════════════════════════════╗   │
│  ║ Back & Biceps Monday      [×]   ║   │
│  ║ Mon, Dec 21, 2025         [···] ║   │
│  ╠═════════════════════════════════╣   │
│  ║                                 ║   │
│  ║ Duration: 45 minutes            ║   │
│  ║ Total Volume: 950 lbs           ║   │
│  ║ Total Reps: 15                  ║   │
│  ║ Notes: Great session...         ║   │
│  ║                                 ║   │
│  ║ Exercises:                      ║   │
│  ║ ┌─────────────────────────────┐ ║   │
│  ║ │ 1. Barbell Squat        [►] │ ║   │
│  ║ │    3 sets, 20 reps      [e] │ ║   │
│  ║ │                             │ ║   │
│  ║ │    Set 1: 8 × 225 lbs  RPE7 │ ║   │
│  ║ │    Set 2: 7 × 225 lbs  RPE8 │ ║   │
│  ║ │    Set 3: 5 × 225 lbs  RPE9 │ ║   │
│  ║ │                             │ ║   │
│  ║ │ 2. Incline DB Press     [►] │ ║   │
│  ║ │    4 sets, 29 reps      [e] │ ║   │
│  ║ │                             │ ║   │
│  ║ │    Set 1: 10 × 70 lbs  RPE6 │ ║   │
│  ║ │    Set 2: 8 × 70 lbs   RPE7 │ ║   │
│  ║ │    Set 3: 6 × 70 lbs   RPE8 │ ║   │
│  ║ │    Set 4: 5 × 65 lbs   RPE9 │ ║   │
│  ║ └─────────────────────────────┘ ║   │
│  ║                                 ║   │
│  ║ [Edit]  [Delete]  [Share]       ║   │
│  ║                                 ║   │
│  ╚═════════════════════════════════╝   │
│                                         │
└─────────────────────────────────────────┘
```

**Modal Elements:**
- Header with title, date, more menu (×)
- Summary section (duration, volume, reps)
- Notes section
- Expandable exercises with sets
- Action buttons: Edit | Delete | Share

**Styling:**
- Modal 90vw width, max 400px
- 12px border-radius
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Z-index: Above overlay

---

### ANNOTATIONS FOR DEVELOPER

```
FILTER LOGIC:
- Type: Filter by strength/cardio/all
- Sort: Re-order by date/duration/volume
- Date: Pre-defined ranges or custom picker
- Filters apply immediately
- Update URL query params: ?type=strength&sort=-date

PAGINATION:
- Initial load: 20 items
- "Load More" button: Load 20 more
- Or: Infinite scroll (load on scroll-to-bottom)

INTERACTIONS:
- Tap card → Show detail modal
- Tap [···] on card → Show action menu
- Swipe left on card → Quick actions
- Tap Edit → Navigate to edit screen
- Tap Delete → Confirmation dialog
- Tap Share → Share sheet (copy link, email)

ANIMATIONS:
- Card tap → Scale up slightly (100ms)
- Modal slide up from bottom (300ms)
- List refresh → Fade and re-render (200ms)

EMPTY STATES:
- No filters applied → "Log a workout to get started"
- Filters applied, no results → "No workouts match filters"

DATA SOURCE:
- Fetch from /workouts endpoint
- Include query params from filters
- Cache results for offline
- Refresh on pull-to-refresh (drag down 100px)

ACCESSIBILITY:
- Announce filter changes
- Focus management for modals
- Keyboard: Tab through cards, Enter opens detail
```

---

---

## EXPORT SPECIFICATIONS

### For JPEG/PNG Export (4 separate files)

**File 1: Workout Log Screen**
- Filename: `wireframe-01-workout-log-screen.jpg`
- Dimensions: 375 × 800px (mobile portrait)
- Export: 96 DPI, RGB color
- Format: JPEG at 90% quality

**File 2: Exercise Entry Modal**
- Filename: `wireframe-02-exercise-entry-modal.jpg`
- Dimensions: 375 × 600px (mobile, modal centered)
- Export: 96 DPI, RGB color, include overlay
- Format: JPEG at 90% quality

**File 3: Weekly Summary Screen**
- Filename: `wireframe-03-weekly-summary-screen.jpg`
- Dimensions: 375 × 900px (mobile portrait, scrollable)
- Export: 96 DPI, RGB color
- Format: JPEG at 90% quality

**File 4: History List Screen**
- Filename: `wireframe-04-history-list-screen.jpg`
- Dimensions: 375 × 800px (mobile portrait, with detail modal overlay)
- Export: 96 DPI, RGB color
- Format: JPEG at 90% quality

---

### For Figma Export

1. Create 4 frames in Figma:
   - Frame 1: 375 × 812 (iPhone 12 frame)
   - Frame 2: 375 × 812
   - Frame 3: 375 × 812
   - Frame 4: 375 × 812

2. Draw wireframes using:
   - Rectangles for containers
   - Text for labels
   - Lines for dividers
   - Component library for buttons/inputs

3. Use color palette:
   - #FFFFFF (white)
   - #F5F5F5 (light gray)
   - #CCCCCC (borders)
   - #333333 (text)
   - #0066CC (accents)

4. Export each frame as:
   - "Export as" → Select JPEG
   - Scale: 2x (retina)
   - Suffix: Name (e.g., "workout-log-screen")

---

### For Adobe XD Export

1. Create 4 artboards: 375 × 812 each
2. Design with:
   - Master components for reusable elements
   - Responsive grids enabled
   - Prototyping interactions (optional)

3. Export:
   - File → Export → Batch export
   - Format: JPEG
   - Quality: High
   - Artboards: All

---

## ALTERNATIVE FORMATS

### For PDF Documentation
- Combine all 4 wireframes into 1 PDF
- Add annotations and specifications
- Include interaction notes
- Size: Letter (8.5" × 11")

### For Presentation
- Export each wireframe as PNG (transparent background)
- Create PowerPoint with wireframe + description
- Add callout boxes for key features
- Include user flow diagrams between screens

---

## NEXT STEPS FOR DESIGNER

1. ✅ Review wireframe descriptions
2. ✅ Create high-fidelity mockups in design tool
3. ✅ Add visual hierarchy (colors, typography)
4. ✅ Create interactive prototype
5. ✅ User test prototypes
6. ✅ Iterate based on feedback
7. ✅ Hand off to development team

---

**Wireframe specifications are COMPLETE and READY FOR DESIGN TOOL IMPORT.**

Status: ✅ Detailed layout descriptions provided  
Next: Create mockups in Figma/Sketch/XD and export as JPEG
