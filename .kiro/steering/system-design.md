---
inclusion: manual
---

# System Design Principles

## CAP Theorem

- CP systems (sacrifice availability): PostgreSQL, ZooKeeper — when data correctness is critical
- AP systems (sacrifice consistency): Cassandra, DynamoDB — for high availability

## Design for Failure

- Every external call CAN fail — design for it
- Circuit breakers to prevent cascade failures
- Bulkhead pattern to isolate failures
- Graceful degradation (serve cached/partial data)

## Scalability Patterns

| Traffic | Database | Cache | Architecture |
|---------|----------|-------|--------------|
| < 10K DAU | Single PG | Optional | Monolith |
| 10K-100K | PG + Replica | Required | Modular monolith |
| 100K-1M | Sharding | Cluster | Selective microservices |
| > 1M | Distributed | Multi-layer | Full microservices |

## Caching Strategies

| Strategy | Use Case |
|----------|----------|
| Cache-Aside | Read-heavy, content changes frequently |
| Write-Through | Write-heavy, data must be consistent |
| Write-Behind | High write throughput, some lag acceptable |

## Async Patterns

- Message queues for deferred processing (BullMQ default, RabbitMQ for microservices)
- Event-driven architecture for decoupling
- Saga pattern for distributed transactions

## API Design

- Rate limiting: Token Bucket for burst traffic
- Idempotency keys for payment/critical POST operations
- Cursor-based pagination for large datasets

## Reliability

- Circuit breaker: CLOSED → OPEN (after N failures) → HALF-OPEN → CLOSED
- Retry: exponential backoff with jitter
- Health checks: `/health` (liveness), `/health/ready` (readiness)

## Architecture Decision Records (ADR)

Every significant decision requires documentation:
- Context, options considered, decision, consequences, risks
- Store in `docs/architecture/adr/`
