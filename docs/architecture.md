# System Architecture

This document describes the architecture of the Job Importer Platform.

## High-Level Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  External APIs  │────▶│  Express Server  │────▶│  Next.js Admin  │
│  (XML Feeds)    │     │  + Cron Job      │     │  Dashboard      │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Redis Queue    │
                        │   (BullMQ)       │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  Worker Process  │
                        │  (Batch Import)  │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │    MongoDB       │
                        │  (Jobs, Logs)    │
                        └──────────────────┘
```

## Component Details

### 1. Express API Server (`index.js`)

The main API server handles:
- REST endpoints for dashboard data
- Manual import triggers
- Health checks
- Cron job scheduling

### 2. Worker Process (`worker.js`)

A separate Node.js process that:
- Consumes jobs from Redis queue
- Processes batches with configurable concurrency
- Implements retry with exponential backoff
- Updates import logs with progress

### 3. Queue System (BullMQ + Redis)

- **Queue Name**: `job-import`
- **Job Data**: Batch of jobs + import log reference
- **Features**:
  - Automatic retries (configurable)
  - Exponential backoff
  - Job prioritization
  - Failed job tracking

### 4. MongoDB Collections

#### `jobs` Collection
```javascript
{
  externalId: String,      // Unique ID from source
  sourceId: String,        // Source identifier
  title: String,
  company: String,
  location: String,
  description: String,
  jobType: String,
  category: String,
  salary: { min, max, currency },
  url: String,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ sourceId: 1, externalId: 1 }` - Unique, prevents duplicates
- `{ createdAt: -1 }` - For listing by recency
- `{ title: 'text', company: 'text' }` - Full-text search

#### `importlogs` Collection
```javascript
{
  timestamp: Date,
  fileName: String,        // Source URL
  sourceId: String,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  totalFetched: Number,
  totalImported: Number,
  newJobs: Number,
  updatedJobs: Number,
  failedJobs: [{ externalId, reason, message }],
  duration: Number,        // Milliseconds
  error: String
}
```

#### `jobsources` Collection
```javascript
{
  name: String,
  url: String,             // Feed URL
  type: 'xml' | 'json',
  sourceId: String,
  category: String,
  enabled: Boolean,
  lastFetchedAt: Date,
  lastFetchStatus: String
}
```

## Data Flow

### Import Process

1. **Trigger** (Cron or Manual)
   - Cron runs every hour (configurable)
   - Manual via `POST /api/import/trigger`

2. **Fetch Phase**
   - Iterate through enabled sources
   - HTTP GET to fetch XML feeds
   - Parse XML → JSON

3. **Queue Phase**
   - Split jobs into batches (BATCH_SIZE)
   - Create ImportLog document
   - Add batch jobs to Redis queue

4. **Process Phase** (Worker)
   - Worker picks up batch jobs
   - For each job: validate → upsert → track
   - Update ImportLog with progress

5. **Complete Phase**
   - Worker updates final statistics
   - ImportLog marked as completed/failed

### Upsert Logic

```javascript
// Atomic upsert with duplicate handling
await Job.findOneAndUpdate(
  { sourceId, externalId },  // Match criteria
  { $set: { ...jobData }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true, new: true }
);
```

## Scaling Strategy

### Horizontal Scaling

1. **Multiple Workers**
   ```bash
   # Run multiple worker instances
   npm run worker  # Worker 1
   npm run worker  # Worker 2
   npm run worker  # Worker 3
   ```
   BullMQ automatically distributes jobs across workers.

2. **Worker Concurrency**
   ```env
   QUEUE_CONCURRENCY=10  # Process 10 jobs in parallel per worker
   ```

3. **Batch Size**
   ```env
   BATCH_SIZE=500  # Larger batches, fewer queue jobs
   ```

### Database Optimization

1. **Indexes**
   - Compound index on (sourceId, externalId) for fast upserts
   - Index on createdAt for listing queries

2. **Bulk Operations**
   - Future enhancement: Use `bulkWrite` for batch inserts

3. **Connection Pooling**
   - Mongoose default pool size: 100

## Failure Handling

### Retry Strategy

```javascript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000  // 1s, 2s, 4s
  }
}
```

### Error Categories

| Category | Description | Action |
|----------|-------------|--------|
| `validation_error` | Missing required fields | Log and skip |
| `db_error` | MongoDB connection/write error | Retry |
| `duplicate` | Duplicate key (race condition) | Auto-resolve |
| `parse_error` | XML/JSON parsing failed | Log and skip |

### Graceful Shutdown

Workers listen for SIGTERM/SIGINT and finish processing current jobs before exiting.

## Monitoring

### Health Check
```
GET /health
```

### Queue Status
```
GET /api/import/queue
```
Returns: waiting, active, completed, failed counts

### Import Logs
```
GET /api/import-logs
```
Full history with statistics and error details

## Security Considerations

1. **CORS**: Restricted to frontend origin
2. **Helmet**: Security headers enabled
3. **Input Validation**: Query parameters validated
4. **Error Handling**: Production errors sanitized
