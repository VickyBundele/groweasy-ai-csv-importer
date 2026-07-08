# GrowEasy AI CSV Importer

AI-powered CSV importer that previews arbitrary CSV files and intelligently maps messy lead data into the GrowEasy CRM schema.

## Features

- Drag-and-drop or file-picker CSV upload
- Client-side CSV preview before AI processing
- Responsive scrollable tables with sticky headers
- Explicit Confirm Import step
- Express API with CSV validation and parsing
- GEMINI-powered intelligent CRM field mapping
- Batch processing with progress polling
- Retry with exponential backoff for failed AI batches
- Strict CRM status/data-source validation
- Skips records with neither email nor mobile
- Imported/skipped summary and skipped-row reasons
- Dark mode
- TypeScript
- Backend unit tests
- Docker setup
- Sample messy CSV files

## Architecture

`frontend/` - Next.js + TypeScript  
`backend/` - Node.js + Express + TypeScript  
`samples/` - CSVs with intentionally different headers

Flow:

1. User selects a CSV.
2. Browser parses it only for preview.
3. No AI call happens until Confirm Import.
4. Frontend uploads the CSV to `POST /api/imports`.
5. Backend creates an in-memory job and parses the CSV.
6. Records are processed in AI batches with retries.
7. Frontend polls `GET /api/imports/:jobId`.
8. Valid CRM records and skipped rows are displayed.

## Local setup

### Prerequisites

- Node.js 20+
- npm
- GEMINI API key

### 1. Install

From the project root:

```bash
npm install
npm run install:all
```

### 2. Backend environment

Copy:

```bash
cd backend
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Open `backend/.env` and set:

```env
GEMINI_API_KEY=your_real_key
```

### 3. Frontend environment

Copy:

```bash
cd frontend
copy .env.example .env.local
```

On macOS/Linux use `cp .env.example .env.local`.

### 4. Run

From project root:

```bash
npm run dev
```

Open `http://localhost:3000`.

Backend health check: `http://localhost:4000/health`.

## Tests

```bash
npm test --prefix backend
```

## API

### POST `/api/imports`

Multipart form-data field: `file`

Returns:

```json
{
  "jobId": "uuid",
  "status": "queued"
}
```

### GET `/api/imports/:jobId`

Returns job progress and, when complete, imported/skipped records.

## AI extraction rules

The prompt enforces:

- CRM statuses: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`
- Data sources: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`
- JavaScript-compatible `created_at`
- First email/mobile becomes the primary value
- Extra emails/mobile numbers go to `crm_note`
- Unknown fields are preserved in notes/description where useful
- Records with neither email nor mobile are skipped

The server also validates AI output instead of trusting the model blindly.

## Docker

Set `GEMINI_API_KEY` in your shell or in a root `.env` file, then run:

```bash
docker compose up --build
```

Open `http://localhost:3000`.

## Deployment

### Backend - Railway or Render

Deploy the `backend` directory.

Environment variables:

- `GEMINI_API_KEY`
- `FRONTEND_URL` = your deployed frontend URL
- `PORT` is normally provided by the host

Use:

Build command: `npm install && npm run build`  
Start command: `npm start`

### Frontend - Vercel

Deploy the `frontend` directory.

Set:

`NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL`

Redeploy after adding the environment variable.

## Production notes

This assignment version stores job state in memory to keep the system stateless and simple. For horizontal scaling, replace the in-memory job map with Redis and use a durable queue such as BullMQ. Add authentication, persistent import history, rate limits, and object storage for production.

## Submission

Position: Software Developer Intern

Before emailing:

- verify the hosted app
- make the GitHub repository public
- replace placeholder URLs in `SUBMISSION_EMAIL.md`
- never commit `.env` files or API keys
