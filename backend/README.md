# CodeGuard — Backend

FastAPI backend for the LLM-Powered Code Vulnerability Scanner.

---

## Quick Start

### 1. Clone & setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and GITHUB_TOKEN
```

### 3. Run the server
```bash
python main.py
# or
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scan/repo` | Scan a GitHub repository |
| `POST` | `/api/scan/file` | Scan a single file (text) |
| `POST` | `/api/scan/upload` | Scan uploaded file(s) |
| `POST` | `/api/ask` | Ask Gemini about a vulnerability |
| `GET`  | `/api/benchmark` | Run LLM vs Bandit vs Semgrep benchmark |
| `GET`  | `/api/repo-info` | Get GitHub repo metadata |
| `GET`  | `/api/health` | Health check |

---

## CLI Tool

```bash
# Scan a GitHub repo
python cli.py --repo https://github.com/pallets/flask

# Scan a local file
python cli.py --file app.py

# Save results to JSON
python cli.py --file app.py --output results.json

# Skip LLM (faster, no API cost)
python cli.py --repo https://github.com/owner/repo --no-llm

# CI/CD mode (exits with code 1 if CRITICAL/HIGH found)
python cli.py --file app.py --json-only
```

---

## Project Structure

```
backend/
├── main.py              # FastAPI app + all routes
├── models.py            # Pydantic schemas
├── config.py            # Settings from .env
├── cli.py               # Command-line interface
├── requirements.txt
├── .env.example
└── core/
    ├── github_fetcher.py   # GitHub API integration
    ├── llm_scanner.py      # Gemini API scanner
    ├── static_analyzer.py  # Bandit + Semgrep
    └── benchmark.py        # Evaluation engine
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Gemini API key |
| `GITHUB_TOKEN` | Recommended | GitHub PAT (higher rate limits) |
| `CLAUDE_MODEL` | No | Default: `gemini-1.5-flash` |
| `MAX_FILES_PER_SCAN` | No | Default: 20 |
| `DEBUG` | No | Default: false |

---

## Deployment (Render / Railway)

1. Push to GitHub
2. Connect repo on render.com or railway.app
3. Set environment variables in the dashboard
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
