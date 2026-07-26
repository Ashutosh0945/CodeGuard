# 🛡️ CodeGuard — LLM-Powered Code Vulnerability Scanner

**B.E. Final Year Project | AI & Data Science | VCET 2027**

An AI-assisted static analysis tool that detects security vulnerabilities in GitHub repositories and generates human-readable fix suggestions — powered by Gemini AI + Semgrep + Bandit.

---

## 🏗️ Project Structure

```
codeguard/
├── backend/          ← FastAPI + Gemini API + Semgrep + Bandit
│   ├── main.py       ← All API endpoints
│   ├── cli.py        ← Command-line tool
│   ├── config.py     ← Environment settings
│   ├── models.py     ← Pydantic schemas
│   ├── core/
│   │   ├── llm_scanner.py      ← Gemini API scanner
│   │   ├── static_analyzer.py  ← Bandit + Semgrep
│   │   ├── github_fetcher.py   ← GitHub API integration
│   │   └── benchmark.py        ← Evaluation engine
│   └── requirements.txt
│
└── frontend/         ← React + Vite + Tailwind CSS
    ├── src/
    │   ├── App.jsx
    │   ├── api/client.js       ← All backend API calls
    │   ├── components/         ← Reusable UI components
    │   └── pages/              ← Scanner, Benchmark, History
    └── package.json
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env → add GEMINI_API_KEY and GITHUB_TOKEN

python main.py
# → API running at http://localhost:8000
# → Swagger UI at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local     # No changes needed for local dev
npm run dev
# → App running at http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (.env)
| Variable | Required | Get it from |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | https://aistudio.google.com/app/apikey |
| `GITHUB_TOKEN` | Recommended | https://github.com/settings/tokens |

### Frontend (.env.local)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `` (empty) | Backend URL (leave empty for local dev) |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scan/repo` | Scan a GitHub repository |
| `POST` | `/api/scan/file` | Scan a single file |
| `POST` | `/api/scan/upload` | Upload & scan files |
| `POST` | `/api/ask` | Ask Gemini about a vulnerability |
| `GET`  | `/api/benchmark` | LLM vs Bandit vs Semgrep evaluation |
| `GET`  | `/api/health` | Health check |

---

## ⌨️ CLI Tool

```bash
cd backend

# Scan a GitHub repo
python cli.py --repo https://github.com/pallets/flask

# Scan a local file
python cli.py --file app.py

# Save results to JSON
python cli.py --file app.py --output results.json

# CI/CD mode (exits 1 if CRITICAL/HIGH found)
python cli.py --file app.py --json-only
```

---

## 🚢 Deployment

### Backend → Render / Railway
1. Push `backend/` to GitHub
2. Create new Web Service on Render
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in the dashboard

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import on Vercel
3. Set `VITE_API_URL` = your Render backend URL
4. Deploy

---

## 📚 References

1. Zhang et al., "Vulnerability Detection by Learning From Syntax-Based Execution Paths of Code," *IEEE TSE*, 2023.
2. Chakraborty et al., "Deep Learning based Vulnerability Detection: Are We There Yet?," *IEEE TSE*, 2022.
3. Li et al., "SySeVR: A Framework for Using Deep Learning to Detect Software Vulnerabilities," *IEEE TDSC*, 2022.

---

## 👥 Team

- Ashutosh Bhoopendrapratap Singh
- Varun Dhanak
- Owais Dhukka

*B.E. AI & Data Science — VCET, Vasai Road, Mumbai — 2027*
