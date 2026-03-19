# Information Architecture
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0

---

## 1. Overview

This document defines how information is organised, labelled, navigated, and displayed across the DualSub web application. It covers site structure, page hierarchy, navigation model, content inventory, and data taxonomy.

---

## 2. Site Map

```
dualsub.app/
│
├── /                        ← Home (Import + Watch)
│   ├── URL Input Panel
│   ├── Video Player Section
│   │   ├── YouTube IFrame
│   │   └── Subtitle Overlay (DE + EN)
│   └── Player Controls Bar
│
├── /watch?v={videoId}       ← Direct video link (shareable, V2)
│
├── /privacy                 ← Privacy Policy (required pre-launch)
├── /terms                   ← Terms of Use (required pre-launch)
└── /about                   ← About DualSub (optional)
```

---

## 3. Page Inventory

### 3.1 Home Page `/`

The single-page application shell. All primary user interactions occur here.

**Sections:**

| Section | Purpose | Content |
|---|---|---|
| Header | App identity + settings access | Logo, app name "DualSub", Settings icon |
| URL Import Panel | Video import entry point | Text input field, Import button, status messages |
| Video Player Section | Core viewing experience | YouTube IFrame player, subtitle overlay |
| Player Controls Bar | Playback & display controls | Play/Pause, Font size toggle, DE/EN subtitle toggles |
| Error Banner | Feedback on failed actions | Inline error message, dismiss button |
| Footer | Legal links | Privacy Policy, Terms of Use, version number |

**State-based layout variants:**

```
State: EMPTY (no video loaded)
┌──────────────────────────────────────┐
│  🎬 DualSub                    ⚙️   │
├──────────────────────────────────────┤
│  [URL Input............] [Import ▶]  │
├──────────────────────────────────────┤
│         [Empty State Illustration]   │
│   "Paste a YouTube link to begin"    │
└──────────────────────────────────────┘

State: LOADING (import in progress)
┌──────────────────────────────────────┐
│  🎬 DualSub                    ⚙️   │
├──────────────────────────────────────┤
│  [URL Input............] [Loading ⏳]│
├──────────────────────────────────────┤
│         ⠿ Fetching subtitles...      │
│         [Progress indicator]         │
└──────────────────────────────────────┘

State: LOADED (video + subtitles ready)
┌──────────────────────────────────────┐
│  🎬 DualSub                    ⚙️   │
├──────────────────────────────────────┤
│  [URL Input............] [Import ▶]  │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │     YouTube IFrame Player      │  │
│  │  🇩🇪 German subtitle line      │  │
│  │  🇬🇧 English subtitle line     │  │
│  └────────────────────────────────┘  │
│  [▶] [⏸]   [S][M][L]  [🇩🇪✓][🇬🇧✓]  │
└──────────────────────────────────────┘

State: ERROR
┌──────────────────────────────────────┐
│  🎬 DualSub                    ⚙️   │
├──────────────────────────────────────┤
│  [URL Input............] [Import ▶]  │
│  ⚠️ This video has no subtitle track │
└──────────────────────────────────────┘
```

---

### 3.2 Settings Panel (Modal Overlay)

Accessed via the ⚙️ icon in the header. A modal dialog overlaying the home page.

**Content:**

| Setting | Type | Options |
|---|---|---|
| Subtitle Font Size | Button group | S / M / L |
| German Subtitle | Toggle | ON / OFF |
| English Subtitle | Toggle | ON / OFF |
| Show Language Flags | Toggle | ON / OFF |
| Auto-translate badge | Toggle | Show / Hide |
| Background opacity | Slider | 0% – 80% |

---

### 3.3 Privacy Policy `/privacy`

Static page. Required before public launch.

**Content sections:** Data collection (none), cookies (none), third-party services (YouTube IFrame, DeepL), contact information.

---

### 3.4 Terms of Use `/terms`

Static page. Required before public launch.

**Content sections:** Service description, acceptable use, disclaimer of affiliation with YouTube/Google, limitation of liability.

---

## 4. Navigation Model

DualSub uses a **single-page application (SPA)** pattern. There is no traditional multi-page navigation. Navigation is minimal by design.

```
Primary navigation:
  Header logo → Resets to empty state (clears video)
  Settings icon → Opens Settings modal

Secondary navigation (footer):
  Privacy Policy → /privacy (new tab)
  Terms of Use → /terms (new tab)
  About → /about (new tab)

No sidebar, no top nav menu, no breadcrumbs.
```

---

## 5. Content Taxonomy

### 5.1 Video Object

The core content entity in DualSub.

```
Video
├── videoId            (string, 11 chars, YouTube ID)
├── title              (string, display name)
├── duration           (number, total seconds)
├── thumbnailUrl       (string, YouTube thumbnail CDN URL)
├── importedAt         (ISO 8601 datetime)
├── hasDe              (boolean)
├── hasEn              (boolean)
├── translationSource  (enum: "youtube" | "deepl" | "libretranslate" | null)
└── SubtitleTracks[]
    ├── lang           (enum: "de" | "en")
    ├── source         (enum: "youtube_manual" | "youtube_auto" | "translated")
    └── Cues[]
        ├── start      (float, seconds)
        ├── end        (float, seconds)
        └── text       (string)
```

### 5.2 Cue Object

The atomic unit of subtitle display.

```
Cue
├── start   → When the subtitle appears (seconds from video start)
├── end     → When the subtitle disappears
└── text    → The subtitle string to display
```

### 5.3 App Settings Object

User preferences stored in browser `sessionStorage` (MVP) or `localStorage` (V2).

```
Settings
├── fontSize       (enum: "S" | "M" | "L", default "M")
├── showDe         (boolean, default true)
├── showEn         (boolean, default true)
├── showFlags      (boolean, default true)
├── overlayOpacity (number 0–0.8, default 0.6)
└── showTransBadge (boolean, default true)
```

---

## 6. User Flow Diagram

### Primary Flow: Import and Watch

```
[Landing Page]
      │
      │  User pastes YouTube URL
      ▼
[URL Validated by Frontend?]
      │
   No │                    Yes
      ▼                     │
[Show inline error]          ▼
[Stay on landing]    [POST /api/import]
                            │
                   Response received?
                       │         │
                     Error       OK
                       │         │
                       ▼         ▼
                  [Show error] [Load player]
                               [Load DE cues]
                               [Load EN cues]
                                    │
                             User clicks Play
                                    │
                             [Video plays]
                             [Subtitle sync
                              engine starts]
                                    │
                             [DE + EN overlay
                              updates every 250ms]
```

### Secondary Flow: Change Subtitle Settings

```
[Video playing]
      │
      │  User clicks ⚙️
      ▼
[Settings modal opens]
      │
      │  User changes font size to "L"
      ▼
[Settings state updates]
      │
      │  Overlay re-renders with new font
      ▼
[User closes modal]
      │
[Video continues playing, new font size active]
```

---

## 7. URL Structure

### MVP

All interaction happens on `/`. No URL parameters.

### V2 (Planned)

| URL | Purpose |
|---|---|
| `/watch?v={videoId}` | Direct link to a pre-loaded video |
| `/watch?v={videoId}&de=1&en=1` | Pre-loaded with subtitle preferences |

---

## 8. Error & Empty States

| State | Location | Content |
|---|---|---|
| No video loaded | Main content area | Illustration + "Paste a YouTube link to begin" |
| Import loading | Below URL input | Spinner + "Fetching subtitles…" |
| Invalid URL | Below URL input | Red text "Please enter a valid YouTube URL." |
| No subtitle track | Below URL input | Amber text + suggestion to try another video |
| Translation failed | Below URL input | Amber text + "English subtitles unavailable" |
| Video unavailable | Below URL input | Red text "This video is private or unavailable." |
| Network error | Below URL input | Red text "Connection failed. Check your internet." |
| German subtitles only | Subtitle overlay | English line replaced with "(no English track)" |

---

## 9. Labelling Conventions

| Element | Label Style | Example |
|---|---|---|
| Import button | Action verb | "Import" |
| Play button | Action verb | "Play" |
| Language toggles | Language + state | "German ON" / "German OFF" |
| Font size controls | Single letter | "S" "M" "L" |
| Settings icon | Icon only | ⚙️ (with aria-label="Settings") |
| Subtitle lines | Flag + text | "🇩🇪 Hallo" / "🇬🇧 Hello" |
| Error messages | Plain English | "Please enter a valid YouTube URL." |
| Status messages | Progressive | "Fetching subtitles…" → "Translating…" → "Ready" |
