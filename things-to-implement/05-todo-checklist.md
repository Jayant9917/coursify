# Todo Checklist

Use this as the simplest working list.

## Backend

- [x] Fix coupon validation response shape.
- [x] Increment coupon redemption count after order placement.
- [x] Add `isFeatured` support to public course listing.
- [x] Move refresh tokens to a persistent store.
- [x] Add rate limiting to auth routes.
- [x] Add security headers.
- [ ] Remove `console.log` from backend production code.
- [x] Replace mass assignment updates with explicit field picks.

## Frontend

- [x] Sanitize all HTML rendering paths.
- [ ] Split large frontend bundles if needed.
- [ ] Keep auth bootstrap and token refresh working.
- [ ] Keep checkout coupon UI synced with backend behavior.
- [ ] Keep loading and empty states visible on list pages.

## Uploads and streaming

- [ ] Add image uploads.
- [ ] Add video and PDF uploads.
- [ ] Add chunked upload for large files.
- [ ] Add HLS streaming for lesson videos.
- [ ] Add signed playback URLs.

## Integration

- [ ] Keep backend response shapes aligned with frontend expectations.
- [ ] Keep auth headers and refresh token storage aligned.
- [ ] Decide where auto-enrollment should live and keep both sides consistent.

## Admin polish

- [ ] Add category delete.
- [ ] Add coupon edit and delete.
- [ ] Add order detail view.
