# Pillar 2 - Notes Marketplace

## Product Goal

Any logged-in user can upload handwritten PDF notes, price them, and sell them inside Coursify.
The marketplace keeps a 70/30 revenue split:

- Seller keeps 70%
- Platform keeps 30%

The buyer and seller can be the same type of user.
There is no special seller account. If a user can log in, they can participate.

## Seller Flow

### 1. Start selling

The seller opens `/notes/sell` and sees:

- PDF file picker
- Title
- Description
- Subject
- Price
- Optional link to a Coursify course

### 2. Upload the PDF

The PDF goes directly to S3 using a presigned URL.
This follows the same pattern as the video upload flow from Pillar 1.

### 3. Automatic processing

After upload, a backend Lambda or worker runs automatically.
It should:

- Validate the file is a PDF
- Extract page count
- Generate a 2-page preview PDF with watermark
- Extract the cover page and upload it to Cloudinary
- Update the listing metadata in MongoDB

### 4. Submit for review

The seller fills the metadata form and submits it.
The listing is treated as ready once validation and processing are complete.
There is no per-note admin approval step in this flow.
If moderation is needed later, it should be handled as a separate policy layer, not as a required publish gate for every note.

## Buyer Flow

### 1. Browse listings

The buyer opens `/notes` and can filter by:

- Subject
- Price range
- Rating
- Linked course

### 2. Open a note listing

The listing page shows:

- Title
- Seller name
- Subject
- Price
- Page count
- Star rating
- Reviews
- 2-page watermarked preview

### 3. Buy the notes

The buyer clicks `Buy Now` and goes to Lemon Squeezy checkout.
After payment confirmation, the webhook should:

- Create a `NotesPurchase` record
- Credit the seller wallet with 70%
- Make the purchased notes available in `/notes/my-purchases`

### 4. Download the notes

The buyer can download a buyer-specific watermarked PDF.
The backend should:

- Verify the buyer actually purchased the notes
- Generate a watermark containing buyer identity and order details
- Store the generated PDF in S3
- Return a signed CloudFront URL

Each purchase is limited to 5 downloads.
The system should track `downloadCount`.

## Seller Wallet and Payouts

Seller wallet lives at `/seller/wallet`.
It should show:

- Current balance
- Total earned
- Payout history

If payout setup is not complete, withdrawal must be blocked.
If balance is below the minimum threshold, withdrawal must be blocked.
The exact money-out flow should be aligned with Lemon Squeezy's available payout model.

## Database Models

The doc introduces 4 new collections:

- `NotesList` - the marketplace listing
- `NotesPurchase` - each sale transaction
- `SellerWallet` - seller earnings and payout state
- `NotesReview` - verified buyer reviews

## Service Layer Rules

The spec is explicit that business logic belongs in services, not controllers.

### `notesService.create(actor, payload)`

- Validates the actor is authenticated
- Creates a draft listing
- Saves `sellerId = actor.id`
- Returns the new notes ID

### `notesService.submit(actor, notesId)`

- Checks ownership
- Validates required metadata
- Marks the note as ready for marketplace availability once processing is complete
- Does not create a per-note admin approval task

### `notesService.listPublic(query)`

- Only returns marketplace-ready listings
- Supports subject, price, course, rating, and text search filters
- Returns paginated results

### `notesService.purchase(actor, notesId)`

- Verifies the listing is active
- Verifies the buyer has not already purchased it
- Starts a Lemon Squeezy checkout flow
- Returns checkout details needed by the frontend

### `notesService.confirmPurchase(lemonSqueezyEventId)`

- Used by Lemon Squeezy webhook
- Reads metadata from the payment event
- Creates the purchase record
- Credits the seller wallet
- Increments listing sales count
- Sends notifications

### `notesService.download(actor, notesId)`

- Verifies purchase ownership
- Enforces download limit
- Generates a buyer-specific watermarked PDF if needed
- Returns a signed CloudFront URL

### `walletService.credit(userId, amount)`

- Creates or updates the seller wallet
- Increments balance and total earned

### `walletService.withdraw(actor)`

- Verifies wallet exists
- Verifies payout is enabled
- Verifies minimum balance
- Calls the configured payout flow for the payment provider
- Updates balance and withdrawal totals

### `notesService.createReview(actor, notesId, payload)`

- Verifies a real purchase exists
- Lets only verified buyers review
- Upserts a single review per buyer per listing
- Recalculates average rating and rating count

## Frontend Pages

The spec expects these screens:

- `/notes`
- `/notes/sell`
- `/notes/:id`
- `/notes/my-purchases`
- `/seller/wallet`

The frontend should use TanStack Query hooks such as `useNotes.js` and `useWallet.js`.

## PDF Processing Worker

The document describes a background processor triggered by S3 upload events.
Its steps are:

1. Validate the upload is a PDF
2. Load the file with `pdf-lib`
3. Read page count
4. Build a 2-page preview with watermark
5. Create a thumbnail from page 1
6. Upload the thumbnail to Cloudinary
7. Mark the listing as ready for review

## Security Rules

- Original PDFs stay private
- Preview PDFs stay private
- Buyer downloads require purchase verification
- No per-note admin approval is required before public visibility
- Lemon Squeezy webhook signatures must be verified
- Sellers cannot directly set payout-only fields

## Environment Variables Mentioned

- `NOTES_RAW_BUCKET`
- `NOTES_PREVIEW_BUCKET`
- `CLOUDFRONT_NOTES_DOMAIN`
- `LEMONSQUEEZY_WEBHOOK_SECRET` or the equivalent secret for your final payment setup

## Dependencies Mentioned

- `pdf-lib`
- `pdf2pic`
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `file-type`
- `pdfjs-dist` for the frontend preview

## Suggested Next Build Order

1. Create the Notes models
2. Add validators
3. Add the notes and wallet services
4. Add controllers and routes
5. Add upload and processing flow
6. Add frontend pages and hooks
7. Add Lemon Squeezy webhook handling
8. Add review and payout flows
