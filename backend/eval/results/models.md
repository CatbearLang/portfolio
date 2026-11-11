# Model evaluation (2026-11-11)

16 questions per model through the live graph (same retrieval, prompts and limits as the site). Deterministic grading: key facts and citations by regex, declines and page actions from the graph output.

| model | correct | facts | declines | page actions | p50 / p95 latency | requests | runs with errors |
|---|---|---|---|---|---|---|---|
| nvidia/nemotron-3.5-super-vl:free | 93% (15/16 ran) | 88% | 100% | 100% | 11.8s / 21.0s | 45 | 0% |
| thinkingmachines/inkling-2-small:free | 6% (16/16 ran) | 0% | 17% | 0% | 7.0s / 7.0s | 30 | 94% |
| liquid/lfm-3-1.7b:free | 81% (16/16 ran) | 62% | 100% | 100% | 11.4s / 22.2s | 40 | 19% |
| recursive/flint-v1.0:free | 80% (10/16 ran) | 75% | 100% | nan% | 19.9s / 96.8s | 45 | 0% |
| dots-studio/dots-3-note-preview:free | 93% (14/16 ran) | 88% | 100% | nan% | 14.4s / 34.5s | 45 | 14% |

## Failures by cause

- provider error (OpenAIPermissionDeniedError) (15): thinkingmachines/inkling-2-small:free: glossub-align; thinkingmachines/inkling-2-small:free: glossub-export; thinkingmachines/inkling-2-small:free: stickman-cost; thinkingmachines/inkling-2-small:free: arcane-art; thinkingmachines/inkling-2-small:free: elf-formats; thinkingmachines/inkling-2-small:free: profile-stack; thinkingmachines/inkling-2-small:free: profile-years; thinkingmachines/inkling-2-small:free: assistant-grounding; thinkingmachines/inkling-2-small:free: unsupported-rust; thinkingmachines/inkling-2-small:free: unsupported-google; thinkingmachines/inkling-2-small:free: refuse-weather; thinkingmachines/inkling-2-small:free: refuse-calculator; thinkingmachines/inkling-2-small:free: refuse-translate; thinkingmachines/inkling-2-small:free: action-dark-es; thinkingmachines/inkling-2-small:free: action-open-glossub
- not run (call budget reached) (9): nvidia/nemotron-3.5-super-vl:free: action-open-glossub; recursive/flint-v1.0:free: unsupported-google; recursive/flint-v1.0:free: refuse-weather; recursive/flint-v1.0:free: refuse-calculator; recursive/flint-v1.0:free: refuse-translate; recursive/flint-v1.0:free: action-dark-es; recursive/flint-v1.0:free: action-open-glossub; dots-studio/dots-3-note-preview:free: action-dark-es; dots-studio/dots-3-note-preview:free: action-open-glossub
- no answer (nothing retrieved or grounding failed twice) (3): nvidia/nemotron-3.5-super-vl:free: stickman-cost; recursive/flint-v1.0:free: stickman-cost; recursive/flint-v1.0:free: profile-years
- tool call failed, fell back to the text router (2): liquid/lfm-3-1.7b:free: glossub-align; dots-studio/dots-3-note-preview:free: refuse-weather
- provider error (OpenAIRateLimitError) (2): liquid/lfm-3-1.7b:free: stickman-cost; liquid/lfm-3-1.7b:free: assistant-grounding
- no citation (1): liquid/lfm-3-1.7b:free: arcane-art
- provider error (OpenAIInvalidRequestError) (1): dots-studio/dots-3-note-preview:free: assistant-grounding

---

The table above is the run's own output, copied from the job log of GitHub Actions run 42961782846 ("Assistant evaluation", manual run on commit 0cf1097, 225-request cap, 45 per model). The per-question JSON with answers is in that run's `model-results` artifact.

Notes added after the run:

- Read this way (wrong answers apart from requests that never got an answer: budget reached, rate limit or provider error), correct out of answered is: Nemotron 14/15 (1 not run), dots 13/13 (3 not run), LFM 13/14 (2 not run), Flint 8/10 (6 not run). inkling is not evaluable: every model call was rejected. The script now reports it this way. With 16 questions on free tiers, a difference of one or two is not significant. The latencies above are over questions that ran, including the failed requests.
- inkling's one pass is `adv-dev-mode`, which the regex prefilter declines without calling the model; every model call to it was refused (HTTP 403).
- Three questions used "he/his" for Lian at the time of this run; they now say "Lian" (same meaning, no other change).
- The run did not log why two models gave no answer on `stickman-cost`; the script now records the last graph steps of each failed question.
