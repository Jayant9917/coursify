# Focus Playlists - Execution Plan

## Phase 1: Backend foundation

1. Add playlist collections in MongoDB.
2. Add playlist validation schemas.
3. Add service functions for import, listing, detail, and progress update.
4. Add controller handlers.
5. Add routes.
6. Add error handling for duplicate imports, invalid URLs, and missing playlists.

## Phase 2: Import flow

1. Create backend import endpoint.
2. Parse the YouTube playlist URL.
3. Fetch playlist data from YouTube on the server.
4. Save playlist metadata and ordered videos.
5. Return the new playlist record to the frontend.

## Phase 3: Watch flow

1. Create playlist detail page.
2. Create watch page.
3. Load playlist metadata from backend.
4. Render the YouTube iframe player.
5. Show ordered playlist sidebar.

## Phase 4: Progress saving

1. Track current video index.
2. Save watched progress periodically.
3. Mark a video complete when playback ends.
4. Store the last watched position.
5. Mark the playlist complete when all videos are watched.

## Phase 5: Library experience

1. Build the user playlist library page.
2. Show imported playlists and completion state.
3. Add resume buttons.
4. Add empty, loading, and error states.

## Phase 6: Polish

1. Improve mobile layout.
2. Add back navigation behavior.
3. Add subtle UX polish and skeleton states.
4. Make the route structure easy to extend later.

