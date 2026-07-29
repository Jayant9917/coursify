# Production Scaling Runbook

This runbook describes the infrastructure enabled by the current implementation.

## Redis

Set `REDIS_URL` in every API replica. Redis is used for:

- Distributed rate limiting.
- Public catalog cache helpers.
- BullMQ job coordination when `QUEUE_ENABLED=true`.

When `REDIS_URL` is absent, the API falls back to process-local rate limiting and maintenance cleanup for local development only.

## Background jobs

Set `QUEUE_ENABLED=true` only after Redis is reachable. The queue worker currently runs coupon-reservation cleanup. Add workers for email delivery, webhook retry, media verification, and orphaned-object cleanup before production scale.

Run only one queue worker group per deployment environment. API replicas may be scaled independently from workers.

## Metrics and alerts

Prometheus metrics are available at `/metrics`. If `METRICS_TOKEN` is configured, send it in the `x-metrics-token` header.

Recommended alerts:

- API 5xx rate above 1% for five minutes.
- p95 request latency above 750 ms.
- Readiness failures.
- Redis operation failures.
- Queue job failures or growing queue depth.
- Payment webhook failures or processing age above five minutes.
- S3 upload completion failures.
- MongoDB connection pool saturation.

The existing Pino logger emits structured request, response, payment, Redis, queue, and maintenance events. Ship stdout to the deployment log aggregator; do not write secrets to local files.

## Horizontal deployment

Each API process must be stateless. Configure:

- Load balancer health checks against `/health/live`.
- Traffic readiness checks against `/health/ready`.
- `TRUST_PROXY=true` only when the load balancer is the trusted first proxy.
- Explicit `CORS_ORIGINS` in production.
- Shared Redis for rate limits and cache.
- Shared MongoDB with connection-pool limits.
- CDN delivery for images, PDFs, and transcoded video.

## Load-testing scenarios

Before raising limits, test these separately:

1. Public course and notes catalog browsing.
2. Login and token refresh bursts.
3. Signed lesson access URL generation.
4. Progress updates while many learners watch lessons.
5. Checkout creation and duplicate webhook delivery.
6. Multipart upload completion and retry behavior.

Record throughput, p50/p95/p99 latency, error rate, MongoDB load, Redis latency, and provider quota usage.

The repository includes a safe health-endpoint smoke load test:

```powershell
$env:LOAD_TEST_URL = "https://staging-api.example.com/health/live"
$env:LOAD_TEST_DURATION = "30"
$env:LOAD_TEST_CONNECTIONS = "100"
npm run backend:load
```

Run it only against staging or an explicitly approved local target. Do not run it against production without a capacity-test window.
