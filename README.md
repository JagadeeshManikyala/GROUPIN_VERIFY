# Groupin Account Checker — Enterprise Verification Dashboard

A production-ready bulk mobile number verification platform for Groupin accounts. Built with **FastAPI**, **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

---

## Architecture Overview

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                      REACT + VITE UI                        │
 │  - 4-Step Visual Workflow  - Manual Single Checker          │
 │  - Excel Drag & Drop       - Polling Live Progress Bar      │
 │  - Real-time Job Summary   - Paginated / Filtered Results   │
 └──────────────────────────────┬──────────────────────────────┘
                                │ REST API (Upload, Jobs, Manual Check, Export)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     FASTAPI BACKEND                         │
 │  - Strict Input / File Validation & Normalization (+91)     │
 │  - Job Orchestrator & State Manager (PENDING -> COMPLETED)   │
 │  - Asynchronous Excel Ingestion (openpyxl / pandas)         │
 └──────────────┬──────────────────────────────┬───────────────┘
                │                              │
                ▼                              ▼
 ┌─────────────────────────────┐ ┌─────────────────────────────┐
 │     DATABASE & STORAGE      │ │   ASYNC WORKER / QUEUE      │
 │ - PostgreSQL / SQLite       │ │ - Configurable batch chunks │
 │   • jobs table              │ │ - Rate limiting & backoff   │
 │   • account_check_results   │ └─────────────┬───────────────┘
 │ - File system / S3:         │               │
 │   • uploads/ & results/     │               ▼
 └─────────────────────────────┘ ┌─────────────────────────────┐
                                 │   GROUPIN SERVICE ADAPTER   │
                                 │ - Mock Service (Active)     │
                                 │ - Production API (Swappable)│
                                 │ - Exponential backoff (429) │
                                 └─────────────┬───────────────┘
                                               │ Secure HTTPS
                                               ▼
                                 ┌─────────────────────────────┐
                                 │      GROUPIN API SERVER     │
                                 └─────────────────────────────┘
```

---

## Key Features

1. **Manual Single Number Checker**:
   - Immediate verification of single phone numbers (`+91 9876543210` or `9876543210`).
   - Retrieves User ID, full name, and account status with instant badge indicators.
2. **Bulk Spreadsheet Ingestion**:
   - Supports `.xlsx`, `.xls`, and `.csv` files.
   - Automatically detects the mobile number column.
   - Normalizes Indian mobile numbers into canonical E.164 format (`+91XXXXXXXXXX`).
   - Deduplicates records and surfaces invalid rows (bad length, non-numeric) without silently discarding them.
3. **High-Volume Asynchronous Batch Engine**:
   - Generates unique Job IDs (e.g. `GRP-20261005-001`).
   - Dispatches background workers chunked by configurable batch size (`GROUPIN_BATCH_SIZE=50`).
   - Auto-throttles requests with configurable delay (`GROUPIN_REQUEST_DELAY_MS=150`) and backoff on HTTP 429.
4. **Live Polling Dashboard**:
   - 4-Step visual pipeline: Upload → Validate & Process → Check with API → Get Results.
   - Real-time animated progress bar, processed / remaining count, and estimated time remaining.
   - Sticky audit summary with total, valid, invalid, duplicate, and outcome counts.
5. **Interactive Results Table**:
   - Server-side pagination (`GET /api/groupin/jobs/{id}/results?page=1&page_size=25`).
   - Search across phone number, name, and user ID.
   - Filter tabs: All, Groupin Account (YES), Not Registered (NO), Failed.
6. **Excel Report Export**:
   - Generates styled `.xlsx` reports with metadata headers and color-coded status badges upon completion.
7. **Jobs History & Audit Log**:
   - Persistent archive of all past batch jobs with direct download links.

---

## Local Development & Running

### 1. Backend (FastAPI)

```bash
cd backend

# Configure environment variables
cp .env.example .env

# Run FastAPI with uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend URL: `http://localhost:8000`
Interactive API Docs (Swagger): `http://localhost:8000/docs`

### 2. Frontend (React + Vite + Tailwind)

```bash
cd frontend

# Install dependencies (already completed)
npm install

# Start development server
npm run dev
```

Frontend URL: `http://localhost:5173`

---

## Environment Variables (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `GROUPIN_API_URL` | `https://api.groupin.com/v1` | Endpoint URL of the Groupin API |
| `GROUPIN_API_KEY` | `development_secret_key` | Secret API bearer token (never exposed to client) |
| `GROUPIN_BATCH_SIZE` | `50` | Batch size per bulk API request |
| `GROUPIN_MAX_RETRIES` | `3` | Max retries for timeouts or transient 5xx errors |
| `GROUPIN_REQUEST_DELAY_MS` | `150` | Artificial throttle delay between batches to respect rate limits |
| `GROUPIN_REQUEST_TIMEOUT` | `30` | Request timeout in seconds |
| `USE_MOCK_GROUPIN` | `true` | When `true`, uses the high-fidelity mock adapter |
| `DATABASE_URL` | `sqlite:///./groupin.db` | PostgreSQL URL or local SQLite fallback |
| `MAX_UPLOAD_SIZE_MB` | `100` | Max file upload limit in megabytes |

---

---

## Groups SaaS Bot API Integration

The platform includes a dedicated **Group Messenger** interface powered by the Groupin SaaS MessageBot API:

### Supported Endpoints:
1. `GET /groups/list` — Lists groups where user has send permissions, including affiliation badges (`owner`, `admin`, `member`) and allowed media matrix.
2. `POST /groups/send-message` — Broadcasts text, single media (image, video, document, audio), or multi-item gallery attachments.
3. `POST /groups/add-members` — Adds mobile numbers to groups (restricted to owners, with 1-click import from verification job results).

### Configuration (`backend/.env`):
| Variable | Default | Description |
|---|---|---|
| `GROUPS_API_URL` | `your_groups_api_url_here` | SaaS MessageBot Base URL (configured in backend/.env) |
| `GROUPS_API_KEY` | `your_groups_api_key_here` | SaaS API Key passed via `x-api-key` header (never committed) |

---

## Switching to Production Groupin API

Once the Groupin engineering team delivers the official API specifications:
1. Update `GROUPIN_API_URL` and `GROUPIN_API_KEY` in `backend/.env`.
2. Set `USE_MOCK_GROUPIN=false`.
3. Check [groupin_service.py](file:///e:/All%20Projects/GROUPIN_VERIFY/backend/app/services/groupin_service.py#L90-L160) to confirm if payload field names (e.g. `mobile_number` vs `phone_number`) match the official spec.
4. Restart the backend. Zero frontend changes are required!

