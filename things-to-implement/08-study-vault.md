# Skillnest Study Vault

This document describes the current Study Vault / notes marketplace implementation in Skillnest. It is the reference for the interface, user flows, backend contract, storage rules, and future work.

## Purpose

Study Vault is a PDF resource marketplace inside Skillnest. Instructors and administrators can publish focused study packs. Students can browse published resources, save free resources to their vault, and open protected PDF downloads.

The current product language uses **Study Vault**, **study packs**, **notes**, and **PDF-first resources**. It is intentionally separate from the course catalog and lesson curriculum.

## Routes

### Student/public-facing routes

| Route | Authentication | Purpose |
|---|---|---|
| `/notes` | Required | Browse the Study Vault marketplace. Unauthenticated visitors are redirected to login. |
| `/student/vault` | Student required | View saved note purchases and open PDFs. |

The `/notes` page is protected by `ProtectedRoute` in `Frontend/src/routes/index.jsx`. Login receives the original route through navigation state, so a student can return to `/notes` after signing in.

### Instructor/admin route

| Route | Role | Purpose |
|---|---|---|
| `/instructor/notes` | Instructor or admin | Upload PDF notes, create note metadata, publish/unpublish notes, and delete notes. |

The instructor sidebar labels this area **Study Vault**.

## Marketplace Interface

Implementation: `Frontend/src/pages/public/NotesMarketplace.jsx`

### Page shell

- Uses the shared `page-shell` layout.
- Vertical spacing is `py-10` on smaller screens and `py-14` on larger screens.
- Supports light and dark themes.
- Uses rounded cards, thin neutral borders, spacious typography, and the existing Skillnest lime/neutral visual language.

### Hero section

The top hero is a two-column rounded panel on large screens and a stacked panel on smaller screens.

#### Left side

- Eyebrow: `Study Vault`
- Main heading: `Useful notes for the next thing you want to understand.`
- Supporting text: `Browse focused PDF study packs from instructors and add free resources to your personal vault.`
- Feature pills:
  - `PDF-first resources` with a file icon
  - `Protected downloads` with a shield icon

#### Right side

- Dark neutral background
- Sparkles icon in the lime accent color
- Heading: `Collect the ideas worth coming back to.`
- Supporting text: `Buyers get controlled access. Creators can publish practical material without clutter.`

### Browse section

- Eyebrow: `Browse resources`
- Heading: `Find your next study pack.`
- Instructors and admins see a `Publish a note` action area.
- Students see the marketplace and vault controls.

### Search and subject filtering

The browse controls contain:

- Search input with placeholder `Search notes, subjects, or topics...`
- Subject input with placeholder `Filter by subject`

The inputs update the TanStack Query key:

```text
["notes", { search, subject }]
```

The backend searches the note title and description case-insensitively and filters by subject.

## Marketplace Note Cards

Implementation: `NoteCard` inside `Frontend/src/pages/public/NotesMarketplace.jsx`.

Cards are displayed in:

- One column on small screens
- Two columns on medium screens
- Three columns on extra-large screens

Each card is a shared `Card` component with a full-height flex layout. This keeps the action row aligned even when descriptions have different lengths.

### Card anatomy

1. **Visual header**
   - Fixed height of `h-36`.
   - Lime, emerald, and teal gradient background.
   - File icon positioned near the bottom-left.

2. **Metadata row**
   - Subject badge on the left.
   - Price on the right.
   - Free notes show `Free`.
   - Paid notes show an INR-formatted price.

3. **Title**
   - Large semibold heading.
   - Uses the note title.

4. **Description**
   - Muted text.
   - Limited to three lines with `line-clamp-3`.

5. **Instructor and learner metadata**
   - Shows `By {instructor name}`.
   - Shows the note purchase count as `{count} learners`.

6. **Action row**
   - Pushed to the bottom with `mt-auto`.
   - Free note: `Add to vault` button.
   - Paid note: `Purchase` button.
   - Download/open button with a download icon.

### Card interaction behavior

- The card gains a subtle shadow on hover.
- The download button requests a protected signed URL.
- Free-note access does not require a purchase record, but the user must be authenticated.
- Paid-note access requires a completed `NotePurchase` record.
- API errors are shown through readable Sonner toast messages.

## Your Vault Area on `/notes`

Authenticated users see a `Your vault` panel below the search controls.

It contains:

- Eyebrow: `Your vault`
- Heading: `Saved study packs`
- Saved-note count
- Small saved-note rows/cards
- Note title
- Subject
- `Open` button

If there are no saved notes, the message is:

```text
Free notes you add to your vault will appear here.
```

The vault uses `GET /api/notes/purchases/me` and refreshes after a note is added.

## Dedicated Student Vault Page

Implementation: `Frontend/src/pages/student/MyVault.jsx`.

Route: `/student/vault`

The student sidebar includes a `Study Vault` item with a file icon.

The page contains:

- Eyebrow: `Study Vault`
- Heading: `Your saved notes.`
- Description explaining that saved marketplace study packs can be opened here.
- Saved note cards with subject and `Open PDF` action.

Empty state:

```text
Your vault is empty
Add a free note from the Study Vault to see it here.
```

The page handles loading and API error states with the shared loading and error components.

## Instructor Notes Interface

Implementation: `Frontend/src/pages/instructor/NotesManagement.jsx`.

Route: `/instructor/notes`

### Publish form

The form includes:

- Title
- Subject
- Price in INR
- PDF file picker
- Description
- Publish immediately checkbox
- Publish note button

Only PDF files are accepted in the browser. The workflow is:

1. Request an S3 presigned upload URL for the `notes` folder.
2. Upload the selected PDF directly to S3.
3. Send note metadata and the returned `fileKey` to the backend.
4. Refresh the instructor note list.
5. Show a success toast.

### Instructor note cards

Each management card shows:

- Title
- Subject
- Price in INR
- Published or Draft badge
- Short description
- Publish/unpublish button
- Delete button

Deleting requires browser confirmation. Publishing changes are handled through the notes update endpoint.

## Backend Data Model

Implementation: `Backend/models/index.js`

### `Note`

| Field | Type | Purpose |
|---|---|---|
| `sellerId` | ObjectId ref-style user ID | Instructor/admin who owns the note |
| `title` | String | Display title, required, maximum 160 characters |
| `slug` | String | Unique public identifier |
| `description` | String | Study-pack description, required, maximum 2,000 characters |
| `subject` | String | Subject/category label, required, maximum 80 characters |
| `price` | Number | INR price, minimum 0 |
| `currency` | String enum | Currently only `INR` |
| `fileKey` | String | S3 object key, required |
| `fileName` | String | Original PDF filename |
| `contentType` | String enum | Currently `application/pdf` |
| `fileSize` | Number | PDF size in bytes |
| `thumbnailUrl` | String | Optional thumbnail URL |
| `isPublished` | Boolean | Controls marketplace visibility |
| `purchaseCount` | Number | Number of completed purchases/saves |
| `downloadCount` | Number | Number of successful download URL requests |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Indexes:

- `{ isPublished: 1, createdAt: -1 }`
- `{ subject: 1, isPublished: 1, createdAt: -1 }`
- Unique index on `slug`

### `NotePurchase`

| Field | Type | Purpose |
|---|---|---|
| `noteId` | ObjectId | Purchased note |
| `userId` | ObjectId | Student who received access |
| `amount` | Number | Amount recorded in INR |
| `currency` | String enum | Currently only `INR` |
| `status` | Enum | `completed` or `refunded` |
| `purchasedAt` | Date | Access/purchase timestamp |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Unique index:

```text
{ userId: 1, noteId: 1 }
```

This prevents duplicate access records for the same student and note.

## Backend API Routes

Mounted in `Backend/index.js` as:

```text
/api/notes
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/notes` | Public endpoint, page is currently protected in frontend | List published notes |
| GET | `/api/notes/instructor/me` | Instructor/admin | List owned notes, including drafts |
| GET | `/api/notes/purchases/me` | Student | List completed note access records |
| POST | `/api/notes` | Instructor/admin | Create note metadata |
| PUT | `/api/notes/:id` | Owner/admin | Update note metadata or publication state |
| DELETE | `/api/notes/:id` | Owner/admin | Delete note and its purchase records |
| POST | `/api/notes/:id/purchase` | Student | Save a free note or reserve future paid-note flow |
| GET | `/api/notes/:id/download` | Authenticated user | Return a signed S3 download URL |
| GET | `/api/notes/:slug` | Public endpoint | Get one published note by slug without exposing `fileKey` |

## Access Rules

### Free notes

- User must be logged in because the download endpoint uses `requireAuth`.
- A free published note can be downloaded without a `NotePurchase` record.
- Clicking `Add to vault` creates a completed zero-value access record so the resource appears in the student vault.

### Paid notes

- Paid notes require a completed `NotePurchase` record before downloading.
- The current note purchase service intentionally returns:

```text
Paid note checkout is not configured yet
```

- Paid-note checkout is not yet connected to Lemon Squeezy.

### Owners and administrators

- Note owners and administrators can access their own note files.
- Only instructors/admins can upload or manage note metadata.
- Instructors can manage their own notes; admins can manage all notes.

## Storage Flow

PDF files are stored in S3 rather than MongoDB.

1. Frontend requests `/api/uploads/lesson-file` with:
   - `folder: "notes"`
   - `fileName`
   - `contentType: "application/pdf"`
2. Backend validates the folder and role.
3. Backend returns a presigned PUT URL and `fileKey`.
4. Browser uploads the PDF directly to S3.
5. Backend stores only the S3 `fileKey` and file metadata in `Note`.
6. On download, backend creates a short-lived signed GET URL.

The frontend never exposes the permanent S3 object through a public file URL.

## API Client Functions

Implementation: `Frontend/src/services/api.js`, `notesApi`.

- `list(query)` -> `GET /notes`
- `getBySlug(slug)` -> `GET /notes/:slug`
- `purchase(id)` -> `POST /notes/:id/purchase`
- `download(id)` -> `GET /notes/:id/download`
- `myPurchases()` -> `GET /notes/purchases/me`
- `listMine()` -> `GET /notes/instructor/me`
- `create(payload)` -> `POST /notes`
- `update(id, payload)` -> `PUT /notes/:id`
- `remove(id)` -> `DELETE /notes/:id`

## Loading, Empty, and Error States

The marketplace and vault use shared UI states:

- Loading: `LoadingSpinner`
- API failure: `ErrorState` or `EmptyState` with retry
- No marketplace notes: `No notes found`
- Empty vault: `Your vault is empty`
- Instructor has no notes: `No notes yet`
- Upload, delete, publish, and download failures: readable Sonner toast messages

## Current Seed Data

The seed script creates three note records:

- `react-hooks-quick-reference`
- `sql-reporting-cheat-sheet`
- `api-security-checklist`

These are currently sample metadata records. They use note file keys, but real PDF objects must exist in the configured S3 bucket before downloads can succeed.

## Current Limitations

- Paid-note Lemon Squeezy checkout is not implemented.
- There is no separate multi-item notes cart.
- Free-note vault access is implemented through `NotePurchase` records rather than a separate cart table.
- The `Publish a note` button on the marketplace currently points users to the instructor Study Vault route through the instructor navigation rather than opening a modal from the marketplace.
- Seeded notes require actual PDF uploads if they are expected to open successfully.
- Note thumbnails are supported by the model but are not currently uploaded or displayed in the marketplace card; cards use a gradient file header.
- Download URLs are signed and temporary, so users should open the PDF when they need it rather than treat the URL as permanent.

## Future Implementation Order

1. Add a separate Lemon Squeezy product/variant for paid notes.
2. Add note IDs to payment metadata and order reconciliation.
3. Add paid-note order and refund handling.
4. Add a cart model only if multiple paid notes must be purchased together.
5. Upload real seeded PDFs to S3 and validate the download flow end to end.
6. Add note thumbnails and richer card previews.
7. Add automated tests for paid-note checkout, refunds, and signed URL expiry.
