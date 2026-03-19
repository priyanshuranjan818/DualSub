# User Stories & Acceptance Criteria
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0
**Format:** Gherkin-style BDD acceptance criteria per story

---

## Story Map Overview

```
GOAL: Watch German YouTube cartoons with dual subtitles

├── IMPORT VIDEO
│   ├── US-01  Paste YouTube URL and import
│   └── US-02  Handle invalid or unsupported URLs

├── WATCH WITH SUBTITLES
│   ├── US-03  See German subtitles synced to video
│   ├── US-04  See English subtitles below German
│   └── US-05  Subtitles update automatically during playback

├── CONTROL PLAYBACK
│   ├── US-06  Play and pause the video
│   └── US-07  Seek to different positions

├── CUSTOMISE DISPLAY
│   ├── US-08  Change subtitle font size
│   └── US-09  Toggle individual subtitle languages on/off

└── POST-MVP
    ├── US-10  Save video to personal list
    ├── US-11  Click word for translation popup
    ├── US-12  Upload custom SRT/VTT file
    └── US-13  Share pre-loaded video link
```

---

## Sprint 1 — Core Import & Playback

---

### US-01: Import a YouTube Video

**As a** language learner,
**I want to** paste a YouTube link and click Import,
**So that** the video loads in my browser ready to watch.

**Priority:** P0 (Launch Blocker)
**Estimate:** 3 story points

#### Acceptance Criteria

```gherkin
Scenario: Successful import of a YouTube video with German subtitles
  Given I am on the DualSub home page
  When I paste "https://www.youtube.com/watch?v=dQw4w9WgXcQ" into the URL input
  And I click the "Import" button
  Then I see a loading spinner
  And within 30 seconds the video player appears
  And the video title is displayed above the player
  And the Import button is replaced by the video controls

Scenario: Import from shortened YouTube URL
  Given I am on the DualSub home page
  When I paste "https://youtu.be/dQw4w9WgXcQ" into the URL input
  And I click the "Import" button
  Then the video loads successfully (same as full URL)

Scenario: Re-importing a previously imported video loads instantly
  Given the video "dQw4w9WgXcQ" has been imported before (cached)
  When I paste its URL and click Import
  Then the video loads within 2 seconds (no yt-dlp re-run)
```

---

### US-02: Handle Invalid URLs

**As a** user,
**I want to** see a clear error when my URL is wrong,
**So that** I understand what to fix.

**Priority:** P0
**Estimate:** 1 story point

#### Acceptance Criteria

```gherkin
Scenario: Empty input field
  Given the URL input is empty
  When I click "Import"
  Then the button does nothing and the input is highlighted in red
  And I see the message "Please enter a YouTube URL."

Scenario: Non-YouTube URL entered
  Given I type "https://vimeo.com/12345" into the URL input
  When I click "Import"
  Then I see the error "Please enter a valid YouTube URL."
  And no API call is made to the backend

Scenario: YouTube URL for a video with no subtitle track
  Given I paste a YouTube URL for a video with no subtitle tracks
  When I click "Import"
  Then I see the error "This video has no subtitle track. Try another video."

Scenario: YouTube URL for a private or deleted video
  Given I paste a URL for a private or deleted video
  When I click "Import"
  Then I see the error "This video is private or unavailable."
```

---

## Sprint 2 — Subtitle Display

---

### US-03: See German Subtitles

**As a** German language learner,
**I want to** see German subtitle text while the video plays,
**So that** I can read along and learn the language.

**Priority:** P0
**Estimate:** 3 story points

#### Acceptance Criteria

```gherkin
Scenario: German subtitle appears at the correct time
  Given a video has been imported with a German subtitle track
  And the video is playing
  When the video reaches a cue at timestamp 4.8 seconds
  Then the German subtitle line shows "Das ist mein Bruder Georg."
  And it appeared within 500ms of timestamp 4.8s

Scenario: German subtitle disappears between spoken segments
  Given the video is playing
  When the video is between two subtitle cues (no active cue)
  Then the German subtitle line is blank (empty, not hidden)

Scenario: German subtitle text styling
  Given a German subtitle is displayed
  Then it uses white (#FFFFFF) text
  And it has a semi-transparent dark background pill
  And it is centered horizontally at the bottom of the video frame
```

---

### US-04: See English Subtitles Below German

**As a** language learner,
**I want to** see an English translation directly below the German subtitle,
**So that** I can understand the meaning without switching apps.

**Priority:** P0
**Estimate:** 3 story points

#### Acceptance Criteria

```gherkin
Scenario: English subtitle appears below German at same timestamp
  Given a video is playing with dual subtitles loaded
  When the video reaches timestamp 4.8 seconds
  Then the German line shows "Das ist mein Bruder Georg."
  And directly below it the English line shows "That is my brother George."
  And both lines are visible simultaneously

Scenario: English subtitle sourced from YouTube's EN track
  Given the YouTube video has a native English subtitle track
  When subtitles are loaded
  Then the English line uses the native EN track (not machine translation)

Scenario: English subtitle auto-translated when no EN track exists
  Given the YouTube video has no English subtitle track
  When the video is imported
  Then all German cues are automatically translated to English via DeepL
  And the English lines are displayed with a "Auto-translated" badge visible
  And the badge disappears after 5 seconds

Scenario: English subtitle text styling
  Given an English subtitle is displayed
  Then it uses cream/yellow (#FFE680) text
  And it has the same background pill as the German line
  And it is visually smaller or equal to the German line font size
```

---

### US-05: Subtitles Auto-Update During Playback

**As a** user,
**I want** the subtitles to change automatically as the video plays,
**So that** I never have to manually advance them.

**Priority:** P0
**Estimate:** 2 story points

#### Acceptance Criteria

```gherkin
Scenario: Subtitles track video time continuously
  Given a video is playing
  Then the subtitle overlay polls the video timestamp every 250ms
  And the displayed cue always matches the current timestamp

Scenario: Subtitles update correctly after user seeks
  Given a video is playing and showing a subtitle
  When the user drags the seek bar to a different position
  Then the subtitle overlay updates to the correct cue within 500ms
  And no stale subtitle remains visible

Scenario: Subtitles stop updating when video is paused
  Given a video is paused at a subtitle cue
  Then the subtitle text remains frozen at the paused timestamp
  And no flickering or blank flash occurs
```

---

## Sprint 3 — Playback Controls

---

### US-06: Play and Pause the Video

**As a** user,
**I want to** play and pause the video,
**So that** I can control my viewing pace.

**Priority:** P0
**Estimate:** 1 story point

#### Acceptance Criteria

```gherkin
Scenario: Play button starts video
  Given a video has been imported and the player is paused
  When I click the "Play" button
  Then the video begins playing
  And the button label changes to "Pause"

Scenario: Pause button stops video
  Given a video is playing
  When I click the "Pause" button
  Then the video stops
  And the current frame is held
  And the subtitle at that timestamp remains displayed
```

---

### US-07: Seek to Different Position

**As a** user,
**I want to** jump to any part of the video,
**So that** I can rewatch a specific scene.

**Priority:** P0
**Estimate:** 1 story point

#### Acceptance Criteria

```gherkin
Scenario: User seeks using YouTube player seek bar
  Given a video is playing
  When the user clicks a different position on the progress bar
  Then the video jumps to that position
  And subtitles immediately update to match the new timestamp
```

---

## Sprint 4 — Customisation

---

### US-08: Change Subtitle Font Size

**As a** parent or teacher,
**I want to** make subtitles larger,
**So that** children can read them from a distance.

**Priority:** P1
**Estimate:** 1 story point

#### Acceptance Criteria

```gherkin
Scenario: Default font size is Medium
  Given a video is loaded
  Then the subtitle font size is set to "M" by default

Scenario: User increases font size to Large
  Given subtitles are displayed at Medium size
  When I click the "L" button in the font size control
  Then both subtitle lines increase to the Large font size immediately
  And the setting persists for the session

Scenario: Font size options
  Given the font size toggle
  Then it offers exactly three options: S (0.9rem), M (1.2rem), L (1.6rem)
```

---

### US-09: Toggle Subtitle Languages On/Off

**As a** language learner,
**I want to** hide the English subtitles temporarily,
**So that** I can test my German comprehension.

**Priority:** P1
**Estimate:** 1 story point

#### Acceptance Criteria

```gherkin
Scenario: Toggle English subtitles off
  Given both DE and EN subtitles are visible
  When I click the "English ON" toggle
  Then the English subtitle line disappears
  And the German subtitle line moves to fill its position
  And the toggle label changes to "English OFF"

Scenario: Toggle German subtitles off
  Given both DE and EN subtitles are visible
  When I click the "German ON" toggle
  Then the German subtitle line disappears
  And the English line remains visible

Scenario: Cannot turn off both subtitle lines at once
  Given both subtitles are visible
  When I toggle both DE and EN off
  Then at least one subtitle line remains visible
  Or a message appears: "Enable at least one subtitle language."
```

---

## Post-MVP Stories (V2)

---

### US-10: Save Video to Personal List

**As a** regular user,
**I want to** save imported videos to a list,
**So that** I can come back to them without re-pasting the URL.

**Priority:** P2
**Estimate:** 5 story points (requires localStorage or user account)

#### Acceptance Criteria

```gherkin
Scenario: Save a video after import
  Given a video has been imported successfully
  When I click "Save to My List"
  Then the video appears in a sidebar or list panel
  And it shows the video title and thumbnail

Scenario: Reload saved video from list
  Given I have a saved video in my list
  When I click on it
  Then the player loads that video immediately without re-pasting the URL
```

---

### US-11: Word Translation Popup

**As a** learner,
**I want to** click on a German subtitle word,
**So that** I see its English translation in a popup.

**Priority:** P2
**Estimate:** 8 story points

#### Acceptance Criteria

```gherkin
Scenario: Click word in German subtitle
  Given a German subtitle is visible
  When I click the word "Bruder"
  Then a tooltip appears showing "Bruder = brother"
  And it disappears after 3 seconds or when I click elsewhere
```

---

### US-12: Upload Custom SRT/VTT File

**As a** teacher,
**I want to** upload my own subtitle file,
**So that** I can use corrected or custom translations.

**Priority:** P2
**Estimate:** 5 story points

#### Acceptance Criteria

```gherkin
Scenario: Upload custom DE subtitle file
  Given a video is loaded with auto-generated subtitles
  When I click "Upload Custom Subtitles" and select a .srt or .vtt file
  Then the custom subtitles replace the auto-generated ones
  And playback continues without interruption
```

---

### US-13: Share Pre-Loaded Video Link

**As a** teacher,
**I want to** share a link that pre-loads a specific YouTube video with subtitles,
**So that** students can open it ready to watch.

**Priority:** P2
**Estimate:** 3 story points

#### Acceptance Criteria

```gherkin
Scenario: Generate shareable link
  Given a video is loaded
  When I click "Copy Share Link"
  Then a URL like "https://dualsub.app/watch?v=VIDEO_ID" is copied to clipboard

Scenario: Open shared link
  Given someone opens "https://dualsub.app/watch?v=VIDEO_ID"
  Then the video is automatically imported and loaded on page open
  And both subtitle lines are ready without any user action
```
