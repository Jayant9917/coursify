# S3 Resume Note

Use this file when AWS bucket permission becomes available again.

## Goal

Finish the private lesson media pipeline for Coursify without making the bucket public.

## Current direction

- Keep the S3 bucket private
- Use presigned `PUT` URLs for upload
- Use presigned `GET` URLs for playback or download
- Store the permanent S3 object key in MongoDB
- Do not store temporary signed URLs in the database

## Current code shape

Already present in the codebase:

- `Backend/utils/s3.js`
- `Backend/services/upload.js`
- `Backend/routes/uploads.js`
- `Backend/validators/index.js`
- `Backend/models/index.js`
- `Backend/services/index.js`
- `Backend/routes/courses.js`
- `Frontend/src/services/api.js`
- `Frontend/src/pages/instructor/CourseEditor.jsx`
- `Frontend/src/pages/student/LessonPlayer.jsx`

## What to do when permission is available

1. Confirm AWS bucket creation and private bucket policy.
2. Verify the upload presigned URL flow with a real bucket.
3. Verify the playback signed URL flow with a real bucket.
4. Make sure the lesson record stores the S3 object key only.
5. Make sure the student access endpoint returns a temporary GET URL.
6. Test both video and PDF lessons end to end.

## What to check first

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`

## Important reminder

Do not make the bucket public just to make the code easier.
The correct pattern for this app is private bucket plus presigned access.

