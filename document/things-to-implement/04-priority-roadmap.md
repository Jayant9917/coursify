# Priority Roadmap

If you want a clean order to work in, follow this sequence.

## Priority 1: Fix backend contract issues

- [x] Fix coupon discount calculation.
- [x] Increment coupon redemption count.
- [x] Add `isFeatured` filtering.
- [x] Make refresh token storage persistent.

## Priority 2: Secure the app

- [x] Add rate limiting.
- [x] Add security headers.
- [x] Remove mass assignment risks.
- [x] Review all HTML rendering paths.

## Priority 3: Make checkout reliable

- [ ] Make coupon validation and discount display consistent.
- [ ] Confirm where auto-enrollment should happen.
- [ ] Make order and enrollment flows match on both sides.

## Priority 4: Add file upload support

- [ ] Add image upload support.
- [ ] Add video and PDF upload support.
- [ ] Store only URLs in MongoDB.

## Priority 5: Add streaming and delivery

- [ ] Transcode videos to HLS.
- [ ] Put CloudFront in front of delivery.
- [ ] Add signed playback URLs.

## Priority 6: Prepare for scale

- [ ] Add caching.
- [ ] Add a queue for heavy background work.
- [ ] Move refresh tokens to a shared store.
- [ ] Add read-replica planning.

## Priority 7: Finish polish items

- [ ] Improve admin CRUD screens.
- [ ] Split very large frontend bundles.
- [ ] Clean console/debug output.
- [ ] Review loading and empty states.
