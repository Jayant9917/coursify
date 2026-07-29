# Coursify Lazy Loading Plan

## Purpose

This document defines where lazy loading should be used in Coursify before any implementation begins. The goal is to reduce the initial JavaScript bundle, avoid downloading media that the learner has not requested, and keep the first screen fast and stable.

This is a planning document only. No lazy-loading code is implemented by this plan.

## Current Application Areas

The main frontend routes are defined in `Frontend/src/routes/index.jsx`. The application contains public pages, student pages, instructor tools, admin tools, course media, notes, and focus playlists.

## Planned Lazy Loading

### 1. Route-Level Code Splitting

Use `React.lazy` for pages that are not required for the initial homepage render.

| Area | Routes / components | Priority | Reason |
| --- | --- | --- | --- |
| Public secondary pages | `/courses`, `/courses/:slug`, `/notes`, `/checkout` | High | Visitors should not download every marketplace page on `/`. |
| Authentication | `/login`, `/register`, `/forgot-password`, `/reset-password` | Medium | These pages are only needed when a visitor chooses authentication. |
| Student workspace | `/student/*`, especially lesson player and dashboards | High | Learning tools are not needed by anonymous visitors. |
| Instructor workspace | `/instructor/*`, especially `CourseEditor` | High | Editor code includes forms and upload behavior and can be large. |
| Admin workspace | `/admin/*` | High | Admin functionality should never be part of the public bundle. |
| Playlist pages | Playlist marketplace, import, detail, and watch pages | Medium | Load playlist-specific code only when the user opens that feature. |

Add one shared `Suspense` fallback that preserves the page shell and prevents layout jumps.

### 2. Image Loading

Use native image lazy loading for images below the first viewport.

Apply it to:

- Course card thumbnails in `CourseCard`.
- Additional course images on the courses page.
- Related courses on course detail pages.
- Wishlist and student course thumbnails.
- Notes marketplace covers.
- Playlist and YouTube video thumbnails.
- Below-the-fold homepage sections.

Keep the following eager-loaded:

- Logo and navbar icons.
- The hero image, if one is added later.
- The first visible course thumbnail when it is part of the initial viewport.

Every lazy image should have stable dimensions, an appropriate `alt`, and a fallback artwork to prevent layout shifting.

### 3. Video and PDF Loading

The lesson player in `Frontend/src/pages/student/LessonPlayer.jsx` should load only the selected lesson's media.

Planned behavior:

- Do not mount video players for every lesson in advance.
- Use `preload="metadata"` instead of downloading the full video immediately.
- Start the media request when the learner selects a lesson.
- Provide a poster image before playback begins.
- Load the PDF iframe only when the selected lesson is a PDF lesson.
- Unmount or replace the previous media element when the learner changes lessons.

This is especially important when lesson videos are stored in S3 because it prevents unnecessary bandwidth and reduces storage delivery costs.

### 4. API Data Loading

Use query-level lazy loading for secondary data rather than requesting everything when a page mounts.

Planned examples:

- Load course reviews after the main course information.
- Load related courses when the section approaches the viewport.
- Load lesson progress when the learner opens the course player.
- Load notes metadata before downloading a protected note file.
- Load playlist videos when the playlist detail page is opened.

API lazy loading should not hide essential page content. The title, primary description, price, and main call to action should load immediately.

### 5. Pagination and List Expansion

Pagination is different from JavaScript lazy loading, but it provides the same performance benefit for large data sets.

Use it for:

- Course listings.
- Notes marketplace results.
- Instructor course tables.
- Admin users, courses, orders, and categories.
- Playlist videos and search results.

The first request should remain limited, for example `page=1&limit=12`. Additional records should load through pagination or a deliberate “Load more” interaction.

## Areas That Should Stay Eager-Loaded

Do not lazy-load these elements because they are required for immediate usability:

- Announcement banner.
- Navbar, logo, search control, and mobile menu button.
- Hero heading and primary CTA.
- Theme provider and theme toggle.
- Authentication state and route protection.
- Initial homepage data required to render the first viewport.
- Global error and loading states.

## Recommended Implementation Order

1. Add route-level lazy loading and a shared `Suspense` fallback.
2. Audit all images and add `loading="lazy"` below the fold.
3. Update the lesson player to mount only the active video or PDF.
4. Add pagination or “Load more” behavior to large lists.
5. Add viewport-triggered loading for secondary homepage sections.
6. Measure the result with the browser Network panel and Lighthouse.
7. Optimize S3 video delivery separately with multipart uploads, CloudFront, and streaming formats.

## Success Criteria

After implementation:

- The homepage does not download instructor, admin, checkout, or lesson-player code initially.
- Below-the-fold images are not requested until needed.
- Only the active lesson media is downloaded.
- Large lists do not request every record at once.
- Loading states do not cause visible layout jumps.
- Direct navigation to every lazy route still works on refresh.
- Protected routes remain protected while their page code is loading.

## Risks to Avoid

- Lazy-loading the navbar or hero and causing a blank first screen.
- Rendering lazy images without fixed width and height.
- Starting all video downloads when the lesson player opens.
- Replacing route content without a stable loading fallback.
- Treating lazy loading as a replacement for backend pagination.
- Hiding errors behind indefinite spinners.

## Measurement Plan

Before and after implementation, compare:

- Initial JavaScript transfer size.
- Number of network requests on `/`.
- Time to first meaningful content.
- Homepage Largest Contentful Paint.
- Bytes downloaded before opening a course.
- Bytes downloaded before selecting a lesson video.

