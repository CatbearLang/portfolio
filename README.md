# Lian Yang — Developer Portfolio + AI Assistant

Bilingual (EN/ES) portfolio site with a **LangGraph** chatbot that answers recruiters' questions about Lian's projects, using only his documentation and citing sources.

![Home](screens/home.png)

| Project page | Chat (demo LLM) | Chat offline fallback |
|---|---|---|
| ![](screens/project-arcane-knockout.png) | ![](screens/chat.png) | ![](screens/chat-offline.png) |

## Architecture

```mermaid
flowchart LR
    U[Visitor browser<br/>React + Vite static site] -- POST /api/chat --> API[FastAPI]
    API --> G
    subgraph G[LangGraph StateGraph]
        S((START)) --> R[route<br/>LLM classifies ON/OFF topic]
        R -- on_topic --> RET[retrieve<br/>FAISS top-k + score threshold]
        R -- off_topic --> REF[refuse<br/>polite EN/ES message]
        RET --> ANS[answer<br/>LLM with numbered sources<br/>or 'no info' if nothing relevant]
        ANS --> E((END))
        REF --> E
    end
    KB[(data/knowledge/*.md<br/>project docs + profile)] -- chunk + fastembed --> IDX[(FAISS index<br/>in memory)]
    RET --> IDX
    ANS --> LLM[[OpenAI-compatible LLM<br/>Groq · OpenRouter · Ollama]]
```

- **Grounded answers:** the answer prompt allows only the numbered sources; if retrieval finds nothing above `MIN_SCORE`, the graph returns a fixed "I don't have that information" message without calling the LLM.
- **Off-topic refusal:** the router node classifies the question first.
- **Free embeddings:** `fastembed` (`BAAI/bge-small-en-v1.5`, ONNX, CPU, no key) + FAISS. A hashing embedder is available for tests/offline.
- **Pluggable LLM:** any OpenAI-compatible endpoint via env vars; `LLM_PROVIDER=fake` for demos/tests.
- **Safe errors:** provider errors become a generic 502; keys never reach the browser or logs.
- **Graceful degradation:** the widget checks `/api/health` (4 s timeout); if the backend is down or `VITE_API_URL` is empty, it shows an offline message with Lian's email.

## Layout

```
frontend/   React + Vite site (hash routing, EN/ES toggle, CV download, chat widget)
  src/content.js       all bilingual content
  public/cv/           CV PDFs (EN/ES, web version: email + GitHub only)
  public/img/          screenshots (resized WebP)
backend/    FastAPI + LangGraph
  app/graph.py         StateGraph: route → retrieve → answer | refuse
  app/kb.py            markdown chunking, embedders, FAISS index
  app/llm.py           OpenAI-compatible client + FakeLLM
  data/knowledge/      the documents the assistant can cite
  tests/               pytest (fake LLM + hash embedder, no network)
screens/    headless screenshots
```

## Run locally

```bash
# backend
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # set LLM_API_KEY, or LLM_PROVIDER=fake
set -a; . ./.env; set +a
uvicorn app.main:app --port 8000
pytest -q

# frontend
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
npm run build                 # → dist/
```

To update what the assistant knows, edit `backend/data/knowledge/*.md` and restart.

## Deployment plan (not deployed yet)

**Frontend (static):**
- *GitHub Pages:* repo `CatbearLang/CatbearLang.github.io` (or any repo with Pages), build with `VITE_API_URL=https://<backend-host>` and publish `frontend/dist` via a GitHub Actions Pages workflow. `base: './'` + hash routing means no server rewrites are needed.
- *Vercel:* import the repo, root `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL`.

**Backend (free tier):**
- *Render:* Web Service, root `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Free instances sleep when idle (first request ~30–60 s); the widget's offline fallback covers that.
- *Hugging Face Spaces (Docker):* same command on port 7860; doesn't sleep as aggressively.
- Env vars on the host: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `CORS_ORIGINS=<frontend URL>`.

**LLM options:** Groq free tier (`llama-3.1-8b-instant`, fast), OpenRouter free models, or Ollama for local use only.

## Author

**Lian Yang** · [GitHub](https://github.com/CatbearLang) · Catbeardarkworld@gmail.com
