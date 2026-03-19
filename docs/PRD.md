# Product Requirements Document (PRD)
# DualSub — German + English Dual Subtitle YouTube Player

**Version:** 1.0 (MVP)
**Author:** Project Owner
**Status:** Draft

---

## 1. Problem Statement

German learners and bilingual households want to watch German YouTube cartoons (e.g., Peppa Wutz, Die Biene Maja, Feuerwehrmann Sam) but face a core problem:

- German cartoons on YouTube have **only German subtitles**
- There is **no easy way** to display German and English subtitles simultaneously
- YouTube's built-in player does not support **dual subtitle tracks**
- Children learning German benefit from seeing both languages at the same time

**Result:** Learners must pause, look up words, or switch apps — breaking immersion and reducing learning effectiveness.

---

## 2. Goal

Build a web application where users can:
1. Paste any German YouTube video link
2. Import it into the app with one click
3. Watch the video with **German subtitles on top** and **English subtitles below**
4. Enjoy a clean, distraction-free viewing experience

---

## 3. Target Users

| User Persona | Description |
|---|---|
| **German language learner** | Adult or teen learning German, uses cartoons as study material |
| **Bilingual parent** | Wants children to hear German audio with English text support |
| **Language teacher** | Uses German media in classroom with English scaffolding |
| **Child learner** | 4–10 years old, watches cartoons, benefits from visual reinforcement |

---

## 4. User Stories

### Core (MVP)

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | User | Paste a YouTube link and click "Import" | The video loads in my browser |
| US-02 | User | See German subtitles while the video plays | I can read along in German |
| US-03 | User | See English subtitles below the German ones | I can understand what is being said |
| US-04 | User | Have subtitles update automatically as the video plays | I don't have to do anything manually |
| US-05 | User | Play and pause the video | I can control playback normally |
| US-06 | User | Adjust subtitle font size | I can make text easier to read |

### Nice to Have (Post-MVP)

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-07 | User | Save imported videos to a list | I can come back to them later |
| US-08 | User | Toggle German or English subtitles on/off | I can test my comprehension |
| US-09 | User | Click a subtitle word | I see a translation popup |
| US-10 | User | Upload my own SRT file | I can use custom subtitles |
| US-11 | Teacher | Share a video link with subtitles pre-loaded | Students open the link ready to watch |

---

## 5. Functional Requirements

### 5.1 Video Import

- **FR-01:** The app SHALL accept a standard YouTube URL (youtube.com/watch?v=... or youtu.be/...)
- **FR-02:** The app SHALL validate the URL format before sending to backend
- **FR-03:** The app SHALL display an error if the URL is not a valid YouTube link
- **FR-04:** The app SHALL show a loading indicator while the video is being imported
- **FR-05:** The app SHALL display the video title after successful import

### 5.2 Video Playback

- **FR-06:** The app SHALL embed the YouTube video using the YouTube IFrame Player API
- **FR-07:** The app SHALL support Play, Pause, and Seek controls
- **FR-08:** The app SHALL NOT re-host or download the video (stream from YouTube only)

### 5.3 Subtitle Display

- **FR-09:** The app SHALL display German subtitle text synchronized with video playback
- **FR-10:** The app SHALL display English subtitle text below the German line
- **FR-11:** The app SHALL update both subtitle lines every 250ms based on video timestamp
- **FR-12:** The app SHALL show no subtitle text during silent/non-spoken sections
- **FR-13:** The subtitle overlay SHALL be visible on all screen sizes (min 1024px width for MVP)

### 5.4 Subtitle Fetching

- **FR-14:** The backend SHALL fetch available subtitle tracks from YouTube using yt-dlp
- **FR-15:** The backend SHALL prefer manually uploaded subtitle tracks over auto-generated ones
- **FR-16:** If no English track exists, the app SHALL automatically translate German cues to English
- **FR-17:** Translated subtitles SHALL be cached so re-import does not re-translate

### 5.5 Settings

- **FR-18:** The user SHALL be able to increase/decrease subtitle font size (3 preset sizes: S / M / L)
- **FR-19:** The user SHALL be able to toggle the English subtitle line on/off

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Subtitle fetch + translation SHALL complete within 30 seconds |
| **Accuracy** | Subtitle timing SHALL be within ±0.5 seconds of audio |
| **Availability** | App SHALL work on Chrome 110+ and Firefox 110+ |
| **Accessibility** | Subtitle text SHALL have minimum 4.5:1 contrast ratio |
| **Privacy** | No user data or watch history SHALL be stored server-side |
| **Cost** | MVP infrastructure SHALL cost less than €10/month |

---

## 7. User Interface

### Main Screen Layout

```
┌────────────────────────────────────────────────────────┐
│  🎬 DualSub                              [Settings ⚙️]  │
├────────────────────────────────────────────────────────┤
│  [ Paste YouTube URL here...          ] [Import ▶]     │
├────────────────────────────────────────────────────────┤
│                                                        │
│         ┌─────────────────────────────┐               │
│         │                             │               │
│         │    YouTube Video Player     │               │
│         │                             │               │
│         │  🇩🇪 Hallo! Ich bin Peppa.  │               │
│         │  🇬🇧 Hello! I am Peppa.     │               │
│         └─────────────────────────────┘               │
│                                                        │
│   [▶ Play]  [⏸ Pause]     Font: [S] [M] [L]           │
│   [✅ German ON]  [✅ English ON]                       │
└────────────────────────────────────────────────────────┘
```

### Subtitle Overlay Design

- **German line:** White text, bold, dark semi-transparent background pill
- **English line:** Yellow/cream text, regular weight, same background
- Both lines centered horizontally, positioned at bottom of video frame
- Flag emoji prefix optional (configurable in Settings)

---

## 8. Error States

| Error | User Message |
|---|---|
| Invalid URL | "Please enter a valid YouTube URL." |
| No subtitle track found | "This video has no subtitle track. Try another video." |
| Translation failed | "Could not translate subtitles. Try again later." |
| Video unavailable | "This video is private or unavailable." |
| Network error | "Connection failed. Please check your internet." |

---

## 9. Out of Scope (MVP)

- Mobile app (iOS/Android)
- More than 2 subtitle languages
- User login or saved history
- Subtitle file upload from device
- Playlist / queue
- Offline mode
- AI-powered word explanations

---

## 10. Success Metrics

| Metric | MVP Target |
|---|---|
| Import success rate | > 80% of valid YouTube URLs |
| Subtitle sync accuracy | ±0.5s for 95% of cues |
| End-to-end import time | < 30 seconds |
| User task completion | User can import + watch in < 2 minutes |

---

## 11. Timeline

| Phase | Milestone | Target |
|---|---|---|
| Week 1 | Backend subtitle fetch + VTT parsing working | ✅ |
| Week 2 | Frontend player + overlay rendering | ✅ |
| Week 3 | Translation fallback + caching | ✅ |
| Week 4 | UI polish + error handling + deploy | ✅ |
