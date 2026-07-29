# Video Upload Evolution Roadmap

## Purpose

This document defines how the application will evolve from a local course prototype into a production-ready video learning platform.

The goal is to validate the course experience with a small number of users first, then introduce infrastructure only when the measured workload requires it.

## Core principle

The backend should manage authentication, courses, permissions, upload sessions, progress, and processing status. It should not permanently proxy large video files or stream every video byte through the Node API.

## Stage 1 - Local development

### Target

- Developer testing
- Approximately 10 users
- Video files up to 100-200 MB

### Current architecture

```text
React frontend
    |
Node/Express backend
    |
Local resumable upload service
    |
Backend/uploads/videos
```

### Implemented behavior

- 5 MB upload chunks
- Maximum local video size of 200 MB
- Upload progress percentage
- Retry failed chunks
- Resume an interrupted upload by selecting the same file again
- Temporary chunk files stored separately from completed videos
- Completed local videos served from the backend
- Upload audit events for start, completion, and cancellation

### Limitations

- Local files are stored on one machine
- Video delivery is not CDN-backed
- Original MP4 files are served directly
- No adaptive bitrate streaming
- No distributed processing
- Not suitable for production hosting

## Stage 2 - Hosted prototype

### Target

- Approximately 100-1,000 registered users
- Small numbers of concurrent instructors and students
- Real-world upload and playback testing

### Architecture

```text
Browser
    | direct resumable upload
Object storage such as R2
    | processing job
Video worker
    |
Encoded video + thumbnails
    |
CDN or object-storage delivery
```

### Required changes

- Move video files from local disk to object storage
- Keep the browser-to-storage upload flow direct
- Add provider configuration instead of hardcoded storage behavior
- Store only the provider, object key, size, duration, and status in MongoDB
- Add upload expiration and abandoned-upload cleanup
- Add protected signed playback URLs
- Add video processing status:

```text
pending -> uploading -> uploaded -> processing -> ready
                                      |
                                    failed
```

- Add a background worker for video processing
- Add monitoring for upload failures and processing failures

## Stage 3 - Production video processing

### Target

- Thousands of registered users
- Hundreds of concurrent learners
- Reliable playback on mobile and slow connections

### Processing pipeline

```text
Original upload
    |
Queue job
    |
FFmpeg worker
    |
360p / 480p / 720p / 1080p variants
    |
HLS master playlist and segments
    |
Object storage + CDN
```

### Performance improvements

- Adaptive bitrate streaming
- HLS segment caching
- CDN delivery instead of Node streaming
- Signed playback URLs
- Thumbnail generation
- Video duration and metadata extraction
- Retryable processing jobs
- Separate original and encoded-video storage

The original upload should be retained as a backup, while students should normally receive encoded HLS content.

## Stage 4 - Production scale

### Target

- Up to 10,000 registered users
- Measured concurrent traffic rather than only total account count
- Horizontal API scaling

### Architecture

```text
Users
  |
CDN ----------------> HLS video segments
  |
Load balancer
  |
Stateless API replicas
  |- Managed MongoDB replica set
  |- Redis cache and job queue
  |- Upload-session service
  `- Video-processing workers
```

### Required production infrastructure

- Managed MongoDB or a properly operated replica set
- Redis/BullMQ for processing jobs
- Object storage for originals and encoded media
- CDN for video reads
- Stateless API containers
- HTTPS and secure headers
- Rate limiting
- Centralized logs and metrics
- Automated backups
- Health checks and alerts
- Upload and processing cleanup jobs

## Making writes faster

- Upload directly from the browser to storage
- Use resumable chunks
- Use 5-16 MB chunks depending on network testing
- Upload 3-6 chunks in parallel after validating storage behavior
- Retry only failed chunks
- Avoid Base64 video data
- Avoid writing every chunk to MongoDB
- Save upload metadata only at session start, status changes, and completion
- Use SSD-backed temporary processing storage
- Keep video storage separate from application metadata storage

## Making reads faster

- Serve video through a CDN
- Use HLS segments instead of one large MP4
- Enable HTTP range requests where MP4 playback is still used
- Add cache headers for immutable encoded files
- Use signed URLs for private lessons
- Cache public course catalog responses
- Add MongoDB indexes for course, lesson, enrollment, and progress queries
- Paginate courses, sections, lessons, and admin tables
- Keep API responses free of large media payloads

## Performance targets

### API

- p95 response time below 300 ms for normal API requests
- p99 response time below 1 second
- Error rate below 1%

### Uploads

Measure:

- Total upload duration
- Upload throughput
- Resume success rate
- Failed chunk retry rate
- Concurrent upload count
- CPU, memory, disk, and network usage

### Video playback

Measure:

- Time to first frame
- Time to playable
- Rebuffering percentage
- Seek response time
- Processing completion time
- CDN cache-hit ratio

## Load-testing progression

Test gradually:

```text
10 concurrent users
50 concurrent users
100 concurrent users
500 concurrent users
1,000 concurrent users
10,000 registered users with realistic concurrency
```

API load tests should use small payloads and realistic request patterns. Video upload tests should separately measure upload bandwidth, chunk retries, storage write speed, and concurrent uploads.

## Migration checkpoints

Move from local storage to hosted object storage when any of these occur:

- The prototype needs to be accessed by external testers
- More than one machine needs to access uploaded videos
- Local disk usage becomes difficult to manage
- Uploads need to continue after server restarts
- Video delivery affects API performance

Add HLS processing when:

- Students report slow playback or buffering
- Videos need multiple resolutions
- Mobile playback becomes important
- Concurrent video reads increase significantly

Add horizontal API scaling when:

- API p95 latency increases under load
- One API process reaches CPU or memory limits
- Background video work affects course APIs
- Multiple API instances are required for availability

## Current status

The application is currently at **Stage 1 - Local development**.

The next planned milestone is **Stage 2 - Hosted prototype**, after the course workflow and local upload behavior have been tested end to end.
