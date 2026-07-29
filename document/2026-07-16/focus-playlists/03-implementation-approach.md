# Focus Playlists - Implementation Approach

## Backend design

The backend should own all playlist ingestion and progress logic.

### New data models

We need these collections:

- `ImportedPlaylist`
- `ImportedPlaylistVideo`

### Suggested `ImportedPlaylist` fields

- `userId`
- `youtubePlaylistId`
- `title`
- `description`
- `thumbnailUrl`
- `videoCount`
- `totalDuration`
- `lastWatchedVideoId`
- `lastWatchedIndex`
- `progressPercent`
- `status`
- `createdAt`
- `updatedAt`

### Suggested `ImportedPlaylistVideo` fields

- `playlistId`
- `youtubeVideoId`
- `title`
- `description`
- `thumbnailUrl`
- `durationSeconds`
- `position`
- `watched`
- `lastPositionSeconds`
- `isAvailable`

## API design

We should add a dedicated playlist route group.

### Public or authenticated endpoints

- `POST /api/playlists/import`
- `GET /api/playlists/me`
- `GET /api/playlists/:id`
- `GET /api/playlists/:id/watch`
- `PATCH /api/playlists/:id/progress`
- `POST /api/playlists/:id/refresh`

### Business logic placement

Keep the logic in services, not controllers.

The service layer should:

- parse the playlist URL
- call YouTube from the server
- normalize durations
- create or update the playlist records
- calculate completion state
- update progress safely

## Frontend design

The frontend should add these screens:

- `/playlists`
- `/playlists/import`
- `/playlists/:id`
- `/playlists/:id/watch`

### UI behavior

- Use a simple import form for the playlist URL.
- Use a playlist detail page with a clear `Start Watching` action.
- Use a focused watch layout without extra distractions.
- Save progress in the background while the video is playing.
- Resume from the last saved point.

## Flow summary

1. User pastes a YouTube playlist URL.
2. Frontend sends it to the backend.
3. Backend fetches playlist metadata.
4. Backend stores playlist and video rows.
5. Frontend opens playlist detail or watch page.
6. Player loads the selected video.
7. App saves progress periodically.
8. User returns later and resumes from the last saved point.

## Implementation principle

The biggest rule is simple:

- YouTube stays the media source
- Coursify stores metadata and progress
- The app controls the learning experience

