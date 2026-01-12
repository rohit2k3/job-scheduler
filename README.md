# Job Importer Platform

A production-ready job import system with queue-based background processing, capable of handling 1M+ job records.

## 🏗️ Architecture

- **Backend**: Node.js (Express) with MongoDB
- **Queue**: BullMQ with Redis
- **Frontend**: Next.js Admin Dashboard
- **Cron**: Automated hourly imports

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB and Redis connection strings
# MONGODB_URI=mongodb://localhost:27017/job-importer
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

### 2. Start Backend Services

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start worker (required for queue processing)
npm run worker
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access Dashboard

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── server/
│   ├── src/
│   │   ├── config/         # Database, Redis, environment
│   │   ├── controllers/    # API route handlers
│   │   ├── cron/           # Scheduled import job
│   │   ├── models/         # MongoDB schemas
│   │   ├── queues/         # BullMQ queue & worker
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Logger, error handler
│   ├── index.js            # API server entry
│   └── worker.js           # Worker process entry
│
├── client/
│   ├── app/                # Next.js pages
│   ├── components/         # React components
│   ├── lib/                # API client
│   └── types/              # TypeScript definitions
│
└── docs/
    └── architecture.md     # System design docs
```

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/job-importer` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |
| `BATCH_SIZE` | Jobs per batch | `100` |
| `QUEUE_CONCURRENCY` | Worker concurrency | `5` |
| `MAX_RETRIES` | Max retry attempts | `3` |
| `CRON_ENABLED` | Enable cron job | `true` |
| `CRON_SCHEDULE` | Cron schedule | `0 * * * *` (hourly) |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` |

## 📡 API Endpoints

### Import Logs
- `GET /api/import-logs` - List import history (paginated)
- `GET /api/import-logs/:id` - Get import details

### Import Actions
- `POST /api/import/trigger` - Trigger manual import
- `GET /api/import/stats` - Get import statistics
- `GET /api/import/queue` - Get queue status

### Jobs
- `GET /api/jobs` - List jobs (paginated, searchable)
- `GET /api/jobs/:id` - Get job details
- `GET /api/jobs/stats` - Get job statistics

### Sources
- `GET /api/sources` - List job sources
- `PATCH /api/sources/:id/toggle` - Toggle source

## 🔄 How It Works

1. **Cron Job** runs every hour and fetches XML from all enabled sources
2. **XML Parser** converts feeds to JSON format
3. **Queue** receives batches of jobs for processing
4. **Worker** processes batches with retry logic
5. **Upsert Logic** inserts new jobs or updates existing ones
6. **Import Logs** track statistics for each run
7. **Dashboard** displays real-time status


## 📊 Job Sources

The system comes pre-configured with these sources:

- Jobicy (All jobs, SMM, Sales, Design, Data Science, Copywriting, Business, Management)
- HigherEdJobs (Articles feed)

## 🧪 Testing

```bash
# Trigger manual import
curl -X POST http://localhost:5000/api/import/trigger

# Check queue status
curl http://localhost:5000/api/import/queue

# View import logs
curl "http://localhost:5000/api/import-logs?page=1&limit=10"
```

## 📄 License

ISC
