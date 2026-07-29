# Pillar 3 - YouTube Focus Mode

## Product Goal

Any logged-in user can paste a public YouTube playlist URL and turn it into a distraction-free course player.

The platform:

- Fetches metadata from YouTube Data API v3
- Stores the data in MongoDB
- Tracks watch progress
- Renders a clean player with no sidebar noise

No video bytes are hosted by Coursify.
YouTube remains the video host.

## Import Flow

### 1. User opens the import page

The user visits `/playlists/import` and sees a single field:

- `Paste YouTube playlist URL`

Accepted URL formats include:

- `https://www.youtube.com/playlist?list=PLxxxxxx`
- `https://youtube.com/playlist?list=PLxxxxxx`
- `https://www.youtube.com/watch?v=xxx&list=PLxxxxxx`

### 2. Frontend sends the URL to the backend

The frontend posts the URL to `POST /api/playlists/import`.
The backend extracts the playlist ID from the `list=` query parameter.

### 3. Backend fetches playlist metadata

The backend calls YouTube Data API v3:

- `playlistItems.list` for playlist contents
- `videos.list` for durations

It must handle pagination until all videos are fetched.

### 4. Backend stores the import

The backend creates:

- `ImportedPlaylist`
- `ImportedPlaylistVideo` records for each video

Then it returns the playlist ID to the frontend.

## Watch Flow

### 1. Playlist landing page

The user opens `/playlists/:id` and sees:

- Playlist title
- Total videos
- Total duration
- First video thumbnail
- `Start Watching` button
- Ordered video list with durations

### 2. Watch page

The user opens `/playlists/:id/watch`.
The page is designed to remove distraction:

- No navbar
- No footer
- Full viewport height
- Top back arrow
- Large embedded YouTube player
- Sidebar with ordered video list

### 3. Progress tracking

The player uses the YouTube IFrame API.
The app should:

- Mark a video as watched when it ends
- Auto-advance to the next video
- Save progress every 30 seconds while playing
- Resume from the last saved position when the user comes back

### 4. Completion state

When all videos are watched:

- Mark the playlist as completed
- Show a completion modal
- Show a completed badge in the playlist list page

## Database Models

The doc adds 2 new collections:

- `ImportedPlaylist`
- `ImportedPlaylistVideo`

## Service Layer Rules

Again, the spec says business logic belongs in services.

### `playlistService.import(actor, url)`

- Extract playlist ID from the URL
- Reject duplicate imports for the same user and playlist
- Call YouTube API for playlist items
- Call YouTube API for durations
- Parse ISO 8601 durations into seconds
- Create the playlist document
- Bulk insert the imported videos

### `playlistService.updateProgress(actor, playlistId, payload)`

- Verify ownership
- Update the matching imported video progress
- Update the playlist's last watched index
- Mark the playlist completed if all videos are watched

### `playlistService.refresh(actor, playlistId)`

- Re-fetch videos from YouTube
- Update titles and thumbnails only
- Preserve watch progress
- Mark removed videos as unavailable instead of deleting them

## Watch Page Layout

The spec gives a clear layout:

- Top bar: back arrow and playlist title
- Left column: YouTube player and video title
- Right column: scrollable video list
- Mobile: stacked layout with the sidebar collapsed into an accordion

## YouTube Embed Configuration

The player should use the IFrame API with these key settings:

- `rel: 0`
- `modestbranding: 1`
- `iv_load_policy: 3`
- `fs: 1`
- `start: resumeFrom`
- `autoplay: 0`

The important part is that recommendations and extra distractions stay minimized.

## API Rules

The backend should call YouTube only on the server.
The frontend should never call the YouTube Data API directly.

The frontend only loads the IFrame API script:

- `https://www.youtube.com/iframe_api`

## Edge Cases

The doc explicitly calls out these cases:

- Private or deleted videos
- Playlist not found or private
- Duplicate import
- Video removed from YouTube
- Quota exceeded
- Playlist refresh where a video has disappeared

## Environment Variable

The one new backend variable called out here is:

- `YOUTUBE_API_KEY`

## Suggested Next Build Order

1. Add `ImportedPlaylist` and `ImportedPlaylistVideo`
2. Add the import endpoint
3. Add progress update endpoint
4. Add refresh endpoint
5. Build the import page
6. Build the playlist landing page
7. Build the watch page
8. Add the YouTube IFrame API integration
