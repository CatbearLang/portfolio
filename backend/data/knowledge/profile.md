# Lian Yang — Profile

Lian Yang is an Informatics Engineering candidate (thesis stage) based in Paraguay, looking for remote full-stack, backend and AI-automation roles (USA/Canada time zones first; open to other English- or Spanish-speaking teams).

## Contact

- GitHub: https://github.com/CatbearLang

## Summary

Informatics Engineering candidate (thesis stage) with 3 years of hands-on full-stack development in React and PostgreSQL. Builds end-to-end AI pipelines (LLMs, speech recognition, TTS, image generation), workflow automations with n8n, and containerized services with Docker and Kubernetes. Ships tested, documented, security-conscious software.

## Technical skills

- Frontend: React, JavaScript, HTML/CSS
- Backend & data: Python (FastAPI, Typer, Pydantic), PostgreSQL, REST APIs
- AI & automation: LLM APIs (OpenAI-compatible), structured JSON outputs, Whisper ASR, TTS, image generation, AI workflows, LangGraph, n8n
- DevOps & infrastructure (intermediate): Docker, Kubernetes, server deployment and maintenance, CI/data pipelines, load balancing, distributed systems
- Security & quality: secret scanning, input validation, path-traversal protection, pytest, headless test suites
- Other: algorithms, FFmpeg, Unity/C#, Git/GitHub

## Experience

- Freelance Full-Stack Developer & Open-Source Contributor (3 years): web projects for freelance clients with React frontends, backend services and PostgreSQL; maintenance and debugging of existing applications; open-source projects published on GitHub (github.com/CatbearLang), including Codex Stickman Pipeline.
- IT Support — Vinader Computación, Encarnación: hardware and software support, installation, configuration, troubleshooting, preventive and corrective maintenance.
- Cashier — Casa Jorge, Encarnación (5 years): customer service, cash handling and daily register balancing.

## Education

- B.Sc. Informatics Engineering — Faculty of Engineering, Universidad Nacional de Itapúa (FIUNI) — Thesis stage (in progress)
- Technical High School Diploma in Informatics — Colegio Experimental de la Universidad Católica, Encarnación (2015–2017), Distinguished Student honors 2016 and 2017
- English Intermediate 3A — EUROSUR Training Center (100 hours), 2015

## Languages

Spanish (native), English (intermediate).

## This portfolio and its AI assistant (LangGraph project)

The chat assistant on this site is Lian's LangGraph + RAG project. It is a FastAPI backend (Python) that runs a LangGraph StateGraph:

- prefilter: fast regex rules catch obvious prompt-injection attempts, requests for personal data, and requests for project source code;
- generate_query_or_respond: an LLM (built with LangChain's ChatOpenAI and bind_tools) decides whether to call the search_portfolio_docs retriever tool with an English search query, or to reply directly with a short polite refusal when the question is not about Lian (e.g. "write me a calculator"); the direct reply is sanitized (short, no code, no links). If the model's tool calling fails, a plain-text LLM router is used as a fallback;
- tools: a LangGraph ToolNode runs the retriever tool: hybrid search over Lian's project documents, combining BM25 keyword scoring (60%) with real semantic embeddings from a small static model2vec model, minishlab/potion-base-8M, in an in-memory FAISS index (40%); the whole backend uses about 200 MB of RAM;
- grade_documents: one LLM call grades the retrieved chunks and keeps only relevant ones; if none are relevant, rewrite_question reformulates the question and sends it back to the agent to search again (at most once), following the official LangGraph agentic RAG tutorial;
- answer: an LLM (NVIDIA Nemotron, free tier via OpenRouter) answers only from the retrieved sources and cites them like [1];
- check: a second LLM call verifies the answer is supported by the sources; if not, the answer is regenerated once with stricter instructions, otherwise the assistant says it doesn't have that information.

It keeps short conversation memory: the browser sends the last few turns so follow-up questions work. The frontend is React + Vite on GitHub Pages; if the free backend is asleep or unavailable, the page falls back to a simpler in-browser keyword search, clearly labeled as such. Every answer shows an "agent trace" (which nodes ran, which chunks were retrieved with their scores, whether the grounding check passed) and the exact cited snippets.

Safety and cost limits: questions are limited to 300 characters; each visitor gets 8 free questions per day with a short burst limit, plus a global daily cap; the suggested questions are answered from answers precomputed once by the real graph (zero API calls), and repeated questions are served from a cache. Prompt-injection hardening is layered: a regex prefilter declines obvious attempts ("ignore previous instructions", asking for the system prompt or keys), visitor text and documents are wrapped in delimiters that the prompts treat as data only, the model never receives any secret, and the grounding check rejects answers not supported by the sources. This reduces risk but is not "injection-proof". It is a compact demo, not a production multi-agent system: the graph has one retry loop and no external tools.

## Code availability

Public repositories: Codex Stickman Pipeline (https://github.com/CatbearLang/codex-stickman-pipeline) and this portfolio, including the assistant backend (https://github.com/CatbearLang/portfolio). GlosSub and Arcane Knockout are private projects, so their source code is not shared, but the assistant can explain how they work.
