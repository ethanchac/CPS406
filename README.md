# CPS406

CPS406 Project — React + Flask + Supabase

## Project Structure

```
CPS406/
├── frontend/          # React app (Vite)
├── backend/           # Flask API server
│   ├── app.py         # Entry point
│   ├── .env           # Supabase credentials (gitignored)
│   └── requirements.txt
├── .gitignore
└── README.md
```

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The React dev server runs at `http://localhost:5173`. API requests to `/api/*` are proxied to the Flask backend.

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env` and fill in your Supabase credentials:

```
SUPABASE_URL=your-supabase-url-here
SUPABASE_KEY=your-supabase-anon-key-here
```

Then start the server:

```bash
python app.py
```

Flask runs at `http://localhost:5000`.

## Verification

1. Start the backend: `cd backend && source venv/bin/activate && python app.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Visit `http://localhost:5173` — React app loads
4. Visit `http://localhost:5173/api/health` — returns JSON health check (proxied to Flask)
