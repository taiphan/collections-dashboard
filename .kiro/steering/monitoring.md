---
inclusion: fileMatch
fileMatchPattern: "**/metrics*,**/logger*,**/tracing*,**/monitoring/**,**/health*"
---

# Monitoring & Observability

## Three Pillars

| Pillar | Tool | Purpose |
|--------|------|---------|
| Logs | Pino (structured JSON) | What happened |
| Metrics | Prometheus + Grafana | How the system behaves |
| Traces | OpenTelemetry + Jaeger | Why something is slow |

## Logging Rules

- Always structured JSON (never `console.log` in production)
- Mandatory fields: level, timestamp, service, version, environment, requestId, event
- Never log: passwords, tokens, PII, credit cards

## Log Levels

| Level | When |
|-------|------|
| error | Unexpected failure requiring attention |
| warn | Unexpected but recoverable |
| info | Normal significant events |
| debug | Detailed debugging (dev only) |

## Metrics Naming

```
{namespace}_{subsystem}_{name}_{unit}
# Example: http_request_duration_seconds
```

## RED Method (every service dashboard)

- **R**ate: requests per second
- **E**rrors: error rate (%)
- **D**uration: P50, P95, P99 latency

## Alerting Severity

| Level | Response | Example |
|-------|----------|---------|
| critical | Immediate | Service down |
| warning | 30min | High error rate |
| info | Business hours | Unusual patterns |
