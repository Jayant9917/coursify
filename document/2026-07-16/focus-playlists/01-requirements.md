# Focus Playlists - Requirements

## Product Goal

Turn a public YouTube playlist into a distraction-free learning experience inside Coursify.

The feature should let a logged-in user:

- import a public YouTube playlist
- view playlist details in the app
- watch the playlist in a focused player
- save progress per video
- resume from where they left off
- keep a personal library of imported playlists

## Core User Flow

### 1. Import

The user pastes a public YouTube playlist URL.

The system should:

- extract the playlist ID
- fetch playlist metadata on the backend
- store the imported playlist in MongoDB
- store each video in ordered form

### 2. Browse

The user opens the playlist library and sees:

- imported playlists
- title
- thumbnail
- total videos
- total duration
- completion state

### 3. Watch

The user opens a playlist watch page and sees:

- large YouTube player
- video title
- playlist progress
- ordered video list
- back navigation

### 4. Progress

The app should track:

- current video
- watched state
- last watched index
- playback position
- completed playlist state

### 5. Resume

When the user comes back, the app should:

- reopen the same playlist
- restore the last watched video
- restore the saved playback position

## Functional Requirements

- Import only public playlists
- Handle duplicate imports per user
- Keep YouTube as the video host
- Do not store video bytes in MongoDB
- Use backend-only YouTube API calls
- Use frontend-only YouTube iframe playback
- Persist playlist progress in MongoDB
- Support mobile and desktop layouts

## Non-Goals For Phase 1

- No private playlist support
- No editing imported playlist content by hand
- No social sharing feed
- No comments or ratings
- No monetization for playlists yet
- No offline downloads

