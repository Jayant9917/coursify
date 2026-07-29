# Focus Playlists - Complete Details

## What This Feature Does

Focus Playlists turns a public YouTube playlist into a private learning workspace inside Coursify.

The user can:

- import a public YouTube playlist
- store it inside their account
- browse their personal playlist library
- open a playlist detail page
- watch the playlist in a distraction-free player
- save progress while watching
- resume from the last saved video and position
- refresh the imported data from YouTube

This feature does not store raw video files.
It stores only playlist metadata, video metadata, and progress.

## Product Scope

### In scope

- public YouTube playlist import
- playlist metadata storage
- ordered playlist video storage
- personal playlist library
- playlist detail page
- focused watch page
- progress saving
- resume support
- playlist refresh from YouTube
- completion tracking

### Not in scope yet

- private playlists
- playlist editing by hand
- comments
- likes or reviews
- monetization
- downloads
- offline playback
- sharing or collaboration

## User Flow

### 1. Import playlist

The user opens the import page and pastes a public YouTube playlist URL.

The frontend validates:

- the value is present
- the value is not too long

The backend validates:

- the URL belongs to YouTube
- the playlist ID can be extracted
- the user is authenticated

The backend then:

- extracts the playlist ID
- calls the YouTube API
- fetches playlist metadata
- fetches video metadata and durations
- creates the playlist record
- creates the ordered video rows
- returns the created playlist

### 2. View library

The user opens `/playlists`.

The frontend loads the user’s imported playlists from the backend and shows:

- playlist cover
- title
- status
- progress percent
- total videos
- total duration
- last updated time

The page also supports:

- search
- status filter
- sort by updated time, created time, title, progress, or video count

### 3. Open detail page

The user opens `/playlists/:id`.

The detail page shows:

- playlist title
- playlist description
- playlist cover
- channel title
- total duration
- video count
- progress state
- ordered video list

The page has actions for:

- start watching
- refresh from YouTube

### 4. Watch playlist

The user opens `/playlists/:id/watch`.

The watch page is intentionally focused:

- no extra clutter
- top back bar
- large embedded YouTube player
- right-side ordered video list
- current progress display
- next-video action

### 5. Save progress

While the video is playing:

- the player reports progress every 30 seconds
- the backend stores the current video
- the backend stores the playback time
- the backend stores whether the video is watched

When the video ends:

- the current video is marked watched
- the next video can auto-open
- the playlist progress is recalculated

### 6. Resume later

When the user returns:

- the backend returns the last watched video
- the backend returns the last playback time
- the frontend restores playback from that point

### 7. Completion

When all videos are watched:

- the playlist status becomes completed
- the progress percent becomes 100
- the library card shows completion
- the detail and watch pages show completion state

## Backend Data Model

### `ImportedPlaylist`

This collection stores the playlist itself.

Fields:

- `userId`
- `youtubePlaylistId`
- `title`
- `description`
- `thumbnailUrl`
- `channelTitle`
- `videoCount`
- `totalDuration`
- `lastWatchedVideoId`
- `lastWatchedIndex`
- `lastWatchedSeconds`
- `progressPercent`
- `status`
- `isAvailable`
- timestamps

Indexes:

- unique `userId + youtubePlaylistId`
- user lookup
- status lookup
- sort by updated time

### `ImportedPlaylistVideo`

This collection stores the ordered videos for one imported playlist.

Fields:

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
- timestamps

Indexes:

- unique `playlistId + youtubeVideoId`
- playlist lookup
- position ordering

## Backend Validation

### Import validation

The import endpoint requires:

- a non-empty URL
- a YouTube playlist URL format

### Progress validation

The progress endpoint requires:

- `videoId`
- `currentTimeSeconds`
- optional `durationSeconds`
- optional `isWatched`

### List validation

The library endpoint accepts:

- `page`
- `limit`
- `search`
- `status`
- `sortBy`
- `sortOrder`

Sort fields allowed:

- `updatedAt`
- `createdAt`
- `title`
- `progressPercent`
- `videoCount`

## Backend API

### `POST /api/playlists/import`

Imports a public YouTube playlist.

Request body:

```json
{
  "url": "https://www.youtube.com/playlist?list=PL..."
}
```

### `GET /api/playlists/me`

Returns the authenticated user’s imported playlists.

Supports:

- pagination
- search
- status filtering
- sorting

### `GET /api/playlists/:id`

Returns one playlist and its ordered videos.

### `GET /api/playlists/:id/watch`

Returns the playlist watch payload:

- playlist
- ordered videos
- resume video
- resume position
- resume index

### `PATCH /api/playlists/:id/progress`

Updates progress for one video inside the playlist.

### `POST /api/playlists/:id/refresh`

Re-fetches playlist metadata from YouTube and updates:

- titles
- thumbnails
- duration
- availability state

## Service Logic

The service layer owns the business logic.

### `playlistService.import(actor, payload)`

Responsibilities:

- validate URL
- extract playlist ID
- prevent duplicate imports
- fetch YouTube metadata
- create playlist record
- insert ordered video rows
- return normalized playlist data

### `playlistService.listMine(actor, query)`

Responsibilities:

- filter by current user
- apply search
- apply status filter
- apply sort
- paginate results

### `playlistService.getById(actor, playlistId)`

Responsibilities:

- verify ownership
- load playlist
- load ordered videos
- return combined payload

### `playlistService.watch(actor, playlistId)`

Responsibilities:

- verify ownership
- load playlist and videos
- calculate resume state
- return the watch payload

### `playlistService.updateProgress(actor, playlistId, payload)`

Responsibilities:

- verify ownership
- verify video exists in this playlist
- save playback position
- save watched state
- update playlist progress
- update last watched data

### `playlistService.refresh(actor, playlistId)`

Responsibilities:

- verify ownership
- call YouTube again
- update metadata
- mark missing videos unavailable
- preserve watch progress
- recalculate status

## Frontend Pages

### `/playlists`

The main library page.

Shows:

- hero summary
- quick action to import
- current continuation card
- search, filter, sort controls
- imported playlist cards

### `/playlists/import`

The playlist import page.

Shows:

- form input for the YouTube URL
- explanation of the feature
- clear CTA

### `/playlists/:id`

The playlist detail page.

Shows:

- cover image
- metadata
- video list
- start watching action
- refresh action

### `/playlists/:id/watch`

The watch page.

Shows:

- top back header
- large YouTube player
- progress bar
- next-video button
- ordered video list
- current video state

## Frontend Data Flow

The frontend uses React Query hooks:

- `useMyPlaylists`
- `usePlaylistDetail`
- `usePlaylistWatch`
- `useImportPlaylist`
- `useRefreshPlaylist`
- `useUpdatePlaylistProgress`

The flow is:

1. page loads
2. hook fetches data
3. UI renders playlist or empty state
4. user plays a video
5. player emits progress
6. frontend sends progress update
7. backend stores progress
8. user returns later and resumes

## Player Behavior

The player is intentionally restrained.

It uses:

- YouTube iframe API
- `rel=0`
- `modestbranding=1`
- `iv_load_policy=3`
- `fs=1`
- `playsinline=1`

The watch page also:

- advances to the next video when one ends
- keeps track of the active playlist item
- saves when the tab becomes hidden

## Security Rules

- Only authenticated users can import playlists.
- Only the playlist owner or admin can access playlist data.
- The frontend never calls YouTube Data API directly.
- The backend is the only place that talks to YouTube Data API.
- Progress updates are restricted to the playlist owner.

## Validation And Reliability

The current implementation is already validated by:

- backend syntax checks
- frontend production build

The feature is also protected by:

- backend schema validation
- ownership checks
- duplicate import prevention
- pagination and sort validation

## Files Added For This Feature

Backend:

- [Backend/utils/youtube.js](D:\Jay Rana\Assignment\coursify\Backend\utils\youtube.js)
- [Backend/models/index.js](D:\Jay Rana\Assignment\coursify\Backend\models\index.js)
- [Backend/validators/index.js](D:\Jay Rana\Assignment\coursify\Backend\validators\index.js)
- [Backend/services/playlists.js](D:\Jay Rana\Assignment\coursify\Backend\services\playlists.js)
- [Backend/controllers/playlists.js](D:\Jay Rana\Assignment\coursify\Backend\controllers\playlists.js)
- [Backend/routes/playlists.js](D:\Jay Rana\Assignment\coursify\Backend\routes\playlists.js)

Frontend:

- [Frontend/src/hooks/usePlaylists.js](D:\Jay Rana\Assignment\coursify\Frontend\src\hooks\usePlaylists.js)
- [Frontend/src/components/common/YouTubePlayer.jsx](D:\Jay Rana\Assignment\coursify\Frontend\src\components\common\YouTubePlayer.jsx)
- [Frontend/src/pages/public/FocusPlaylists.jsx](D:\Jay Rana\Assignment\coursify\Frontend\src\pages\public\FocusPlaylists.jsx)
- [Frontend/src/pages/public/PlaylistImport.jsx](D:\Jay Rana\Assignment\coursify\Frontend\src\pages\public\PlaylistImport.jsx)
- [Frontend/src/pages/public/PlaylistDetail.jsx](D:\Jay Rana\Assignment\coursify\Frontend\src\pages\public\PlaylistDetail.jsx)
- [Frontend/src/pages/public/PlaylistWatch.jsx](D:\Jay Rana\Assignment\coursify\Frontend\src\pages\public\PlaylistWatch.jsx)

## Recommended Next Enhancements

If we want to keep polishing this pillar, the next useful additions are:

- mobile-specific watch page refinement
- code splitting for the player route
- per-video completion badges in the list
- a better “continue watching” card on the home page
- playlist search on the hero page
- graceful handling for unavailable or deleted YouTube videos

