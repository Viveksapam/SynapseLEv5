import json
import time
import logging
import google.generativeai as genai
from core.config import settings
from services.llm_audit_mock import (
    analyze_audit_collection_mock,
    analyze_comment_mock,
    analyze_comment_batch_mock,
)

# Logs to the uvicorn console (and Render's log viewer). Every audit request
# prints which path ran (MOCK vs real Gemini), the model, latency, and a short
# fingerprint of the result - so "is this mock or real?" is never a guess again.
logger = logging.getLogger("uvicorn.error")


def _log_audit_result(kind: str, started: float, result: dict):
    logger.info(
        "[LLM AUDIT] path=%s elapsed=%.2fs",
        kind, time.monotonic() - started,
    )

# Flash-Lite, not Flash: measured on real requests, gemini-flash-latest
# (which resolves to gemini-3.5-flash) burns hundreds-to-thousands of hidden
# "thinking" tokens per call that gemini-flash-lite-latest simply doesn't -
# ~26x cheaper for text-classification-shaped tasks like these, with no
# measurable quality difference on either post audits or comment scoring.
# "-latest" alias so Google's periodic model deprecations don't silently break
# analysis - this always resolves to a currently served model.
_MODEL_NAME = "gemini-flash-lite-latest"

# The platform's AI reviewer identity. It has a real user account (see
# scripts/create_synapse_ai.py) so its approvals are attributable like any
# other moderator. This display name is what gets stamped on sources it acts on.
SYNAPSE_AI_USERNAME = "synapse_ai"
APPROVER_DISPLAY_NAME = "Synapse AI"


class LlmAuditError(Exception):
    """Raised when the audit LLM call can't be completed or parsed."""


def _require_api_key():
    if not settings.GEMINI_API_KEY:
        raise LlmAuditError(
            "GEMINI_API_KEY is not set. Add it to the backend's environment "
            "(see .env.example) to enable AI-driven source review."
        )


def analyze_audit_collection(collected_data: dict) -> dict:
    """
    Sends a blog's collected contexts/sources to an LLM and asks it to audit
    the post's claim and recommend which pending sources look legitimate
    enough to auto-approve.

    If USE_MOCK_LLM is True (default in dev), returns mock data. Otherwise
    sends to Gemini. Returns a dict shaped like:
    {
      "summary": str,
      "ai_context_guardrail": str,
      "analysis_detail": {...},
      "approved_source_ids": [int, ...],
      "rejected_source_ids": [int, ...],
    }
    """
    started = time.monotonic()

    # Use mock LLM in development
    if settings.USE_MOCK_LLM:
        logger.info("[LLM AUDIT] USE_MOCK_LLM=True -> returning MOCK data (no Gemini call)")
        result = analyze_audit_collection_mock(collected_data)
        _log_audit_result("MOCK", started, result)
        return result

    # Use real Gemini in production
    logger.info("[LLM AUDIT] USE_MOCK_LLM=False -> calling Gemini model=%s", _MODEL_NAME)
    _require_api_key()
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(_MODEL_NAME)

    prompt = _POST_AUDIT_PROMPT + f"\n\nDATA:\n{json.dumps(collected_data)}"

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
            # Hard ceiling so a slow/hung Gemini call fails fast with a clear
            # error instead of leaving the request (and the frontend's loading
            # overlay) hanging indefinitely.
            request_options={"timeout": 45},
        )
    except Exception as e:
        logger.error("[LLM AUDIT] Gemini call FAILED after %.2fs: %s", time.monotonic() - started, e)
        raise LlmAuditError(f"Gemini API call failed: {e}") from e

    try:
        raw = _parse_json_response(response.text)
    except (ValueError, AttributeError) as e:
        logger.error(
            "[LLM AUDIT] Gemini returned unparseable JSON after %.2fs: %s | raw (first 500 chars): %r",
            time.monotonic() - started, e, response.text[:500] if hasattr(response, "text") else None,
        )
        raise LlmAuditError(f"Gemini returned a non-JSON response: {e}") from e

    result = _flatten_audit_response(raw)
    _log_audit_result(f"GEMINI:{_MODEL_NAME}", started, result)
    return result


def analyze_comment_audit(collected_data: dict) -> dict:
    """Audits a SINGLE comment. Uses a lightweight, purpose-built prompt (not
    the heavy post-audit rubric) - a comment doesn't need sub-scores, fallacy
    quotes, a steelman, or recommended sources, and forcing that schema onto
    one sentence both wastes tokens and produces worse output. Returns a flat
    {"ai_summary": str} dict - free prose, no numeric/categorical fields."""
    started = time.monotonic()

    if settings.USE_MOCK_LLM:
        logger.info("[LLM AUDIT] (comment) USE_MOCK_LLM=True -> MOCK")
        result = analyze_comment_mock(collected_data)
        logger.info("[LLM AUDIT] path=MOCK:comment elapsed=%.2fs", time.monotonic() - started)
        return result

    logger.info("[LLM AUDIT] (comment) calling Gemini model=%s", _MODEL_NAME)
    _require_api_key()
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(_MODEL_NAME)
    prompt = _COMMENT_AUDIT_PROMPT + f"\n\nDATA:\n{json.dumps(collected_data)}"

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
            request_options={"timeout": 30},
        )
    except Exception as e:
        logger.error("[LLM AUDIT] (comment) Gemini call FAILED after %.2fs: %s", time.monotonic() - started, e)
        raise LlmAuditError(f"Gemini API call failed: {e}") from e

    try:
        raw = _parse_json_response(response.text)
    except (ValueError, AttributeError) as e:
        logger.error("[LLM AUDIT] (comment) unparseable JSON after %.2fs: %s", time.monotonic() - started, e)
        raise LlmAuditError(f"Gemini returned a non-JSON response: {e}") from e

    logger.info("[LLM AUDIT] path=GEMINI:comment:%s elapsed=%.2fs", _MODEL_NAME, time.monotonic() - started)
    return raw


def analyze_comment_batch(batch_data: dict) -> dict:
    """Audits ALL of a post's not-yet-analyzed comments in ONE Gemini call
    instead of one call per comment. This is the main cost/latency lever:
    with N comments, a per-comment loop pays N times the fixed prompt
    overhead and makes N sequential round-trips; this pays it once.
    Returns {"results": [{comment_id, ai_summary}, ...]} - free prose per
    comment, no numeric/categorical fields.
    """
    started = time.monotonic()
    n = len(batch_data.get("comments", []))

    if settings.USE_MOCK_LLM:
        result = analyze_comment_batch_mock(batch_data)
        logger.info("[LLM AUDIT] path=MOCK:comment_batch elapsed=%.2fs n_comments=%d n_results=%d",
                    time.monotonic() - started, n, len(result.get("results", [])))
        return result

    logger.info("[LLM AUDIT] (batch) calling Gemini model=%s n_comments=%d", _MODEL_NAME, n)
    _require_api_key()
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(_MODEL_NAME)
    prompt = _COMMENT_BATCH_PROMPT + f"\n\nDATA:\n{json.dumps(batch_data)}"

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
            request_options={"timeout": 45},
        )
    except Exception as e:
        logger.error("[LLM AUDIT] (batch) Gemini call FAILED after %.2fs: %s", time.monotonic() - started, e)
        raise LlmAuditError(f"Gemini batch call failed: {e}") from e

    try:
        raw = _parse_json_response(response.text)
    except (ValueError, AttributeError) as e:
        logger.error("[LLM AUDIT] (batch) unparseable JSON after %.2fs: %s", time.monotonic() - started, e)
        raise LlmAuditError(f"Gemini returned a non-JSON response: {e}") from e

    logger.info("[LLM AUDIT] path=GEMINI:comment_batch:%s elapsed=%.2fs n_comments=%d n_results=%d",
                _MODEL_NAME, time.monotonic() - started, n, len(raw.get("results", [])))
    return raw


# Lightweight prompt for a single comment. Pure prose output - no sentiment
# enum, no relevance float. Those numeric fields cost tokens to name and
# constrain without adding real value; a sentence or two of honest judgment
# does the same job for less.
_COMMENT_AUDIT_PROMPT = (
    "You are auditing a single comment in a discussion thread on a fact-checking "
    "platform, to judge how much it materially helps VERIFY OR REFUTE the post's "
    "claim - not how agreeable or well-written it is. Be STRICT: praise, opinion, "
    "and off-topic remarks contribute little regardless of tone. Only on-topic, "
    "evidence-bearing engagement matters.\n\n"
    "You are given the full parent-comment tree (if this is a reply), the "
    "post's actual text, its community sources, and its context guardrail - "
    "use all of it to judge whether this comment is actually on-topic and "
    "whether it engages with what the sources/guardrail already establish.\n\n"
    "Respond in a sentence or two of plain prose - no scores, no categories, "
    "no JSON-within-the-string. Say plainly whether the comment helps verify "
    "or refute the claim, and why (or why not, if it's just agreement/opinion "
    "with nothing to check).\n\n"
    "Return ONLY this JSON, no markdown fences:\n"
    '{\n  "ai_summary": "<one or two sentences of honest prose - your full judgment>"\n}'
)

# Same approach, applied to every comment in one call. The DATA payload is
# {"blog": {...full context incl. sources + guardrail...}, "comments": [{"id",
# "strAuthor", "strContent", "parent_chain": [...]}, ...]}.
_COMMENT_BATCH_PROMPT = (
    "You are auditing ALL comments in a discussion thread on a fact-checking "
    "platform, to judge how much EACH one materially helps VERIFY OR REFUTE "
    "the post's claim - not how agreeable or well-written it is. Be STRICT: "
    "praise, opinion, and off-topic remarks contribute little regardless of "
    "tone. Only on-topic, evidence-bearing engagement matters.\n\n"
    "DATA.blog gives you the post's actual text, its community sources, and "
    "its context guardrail - use all of it. For a reply, DATA.comments[i]."
    "parent_chain gives the full ancestor thread (root first) so you can "
    "judge it in context, but score/discuss only the comment itself, not its "
    "ancestors.\n\n"
    "For each comment, respond with a sentence or two of plain prose - no "
    "scores, no categories, no JSON-within-the-string. Say plainly whether it "
    "helps verify or refute the claim, and why (or why not, if it's just "
    "agreement/opinion with nothing to check).\n\n"
    "Return ONLY this JSON, no markdown fences, with EXACTLY one result per "
    "comment id you were given (same count, no omissions, no invented ids):\n"
    "{\n"
    '  "results": [\n'
    '    {"comment_id": <int, must match an id from DATA.comments>, '
    '"ai_summary": "<one or two sentences of honest prose>"}\n'
    "  ]\n"
    "}"
)


# System prompt for the post/discussion audit. The model returns a rich,
# decomposed object; _flatten_audit_response collapses it into the flat shape
# the rest of the app (crud + router) already consumes. No overall
# soundness/verifiable verdict is requested - that single number invited
# false precision; the sub-scores + summary + guardrail carry the same
# information without collapsing it into one misleadingly-authoritative digit.
_POST_AUDIT_PROMPT = (
    "You are a fact-checking and epistemics analyst auditing a discussion post "
    "(and any community-submitted sources) on a platform used by academic "
    "researchers. Your readers are educated and will reject unjustified "
    "confidence. Rigor and calibration matter more than a verdict.\n\n"
    "METHOD - work through these before scoring:\n"
    "1. Restate the post's central claim in one sentence. Classify it: "
    "empirical (falsifiable) | normative | definitional | speculative.\n"
    "2. Steelman it: state the strongest charitable version before any critique.\n"
    "3. Map the argument: premises, the inference, and hidden assumptions. For "
    "each premise assign an evidence tier: systematic-review > RCT > "
    "observational > expert-assertion > anecdote > bare-claim.\n"
    "4. Identify logical fallacies or cognitive biases. For each, QUOTE the "
    "exact span of text that triggers it. Do not report a fallacy you cannot quote.\n"
    "5. Evaluate each provided source for authority, provenance, recency, and "
    "RELEVANCE TO THE SPECIFIC CLAIM (a source on the general topic that does "
    "not bear on the exact claim is not support).\n"
    "6. State the verification pathway: the specific evidence, dataset, or "
    "experiment that would confirm or falsify the claim.\n\n"
    "SCORING - score each of these five dimensions independently, 0-100 with a "
    "one-line rationale. Do not combine them into a single overall verdict:\n"
    "clarity_falsifiability | premise_support | inferential_validity | "
    "source_reliability | fallacy_bias_freedom\n\n"
    "GUARDRAILS (hard rules):\n"
    "- No false precision: every number must be tied to a rubric band + rationale.\n"
    "- The summary must be entailed by the sub-scores; do not contradict them.\n"
    "- Popularity, reactions, and author identity are NOT evidence. Ignore them.\n"
    "- Judge the argument, not the person. No moralizing.\n"
    "- Where your knowledge is uncertain or past your cutoff, say so explicitly.\n"
    "- context_guardrail is a scannable scope-fence, not analysis prose: exactly 3 "
    "breadcrumb nodes (macro -> sub -> specific scope), each <=3 words; in_scope is "
    "a single <=8-word phrase (not a full sentence); no filler words (\"the\", "
    '"regarding", "discussions on"); do not restate the summary. State only what IS '
    "on-topic - do not enumerate what's excluded, since scope boundaries are "
    "subjective and a discussion can legitimately expand past what looked off-topic "
    "at first.\n\n"
    "Return ONLY this JSON (no prose, no markdown fences):\n"
    "{\n"
    '  "sub_scores": {\n'
    '    "clarity_falsifiability": {"score": <int>, "rationale": "<one line>"},\n'
    '    "premise_support":        {"score": <int>, "rationale": "<one line>"},\n'
    '    "inferential_validity":   {"score": <int>, "rationale": "<one line>"},\n'
    '    "source_reliability":     {"score": <int>, "rationale": "<one line>"},\n'
    '    "fallacy_bias_freedom":   {"score": <int>, "rationale": "<one line>"}\n'
    "  },\n"
    '  "detected_fallacies": [\n'
    '    {"name": "<fallacy>", "quote": "<exact trigger text>", "explanation": "<why>"}\n'
    "  ],\n"
    '  "steelman": "<strongest charitable version of the claim>",\n'
    '  "summary": "<3-5 sentence audit: claim type, key weaknesses/strengths>",\n'
    '  "context_guardrail": {\n'
    '    "breadcrumb": ["<macro category>", "<sub-category>", "<specific scope>"],\n'
    '    "in_scope": "<phrase, not a sentence, naming what stays on-topic>"\n'
    "  },\n"
    '  "verification_pathway": "<specific evidence/data/experiment that would confirm or falsify>",\n'
    '  "source_evaluation": {\n'
    '    "approved_source_ids": [<real, on-topic, claim-relevant source ids>],\n'
    '    "rejected_source_ids": [<broken, off-claim, or low-authority ids>]\n'
    "  }\n"
    "}"
)


def _parse_json_response(text: str) -> dict:
    """Extract the JSON object Gemini returned, tolerating the two ways it
    routinely violates response_mime_type='application/json':
    1. Wrapping the object in ```json ... ``` markdown fences.
    2. Appending trailing content after the closing brace (a second, malformed
       JSON blob, stray prose, etc.) - json.loads rejects the whole string in
       this case ("Extra data"), so we decode just the first valid JSON value
       and ignore anything after it.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    return json.JSONDecoder().raw_decode(cleaned)[0]


def _flatten_audit_response(raw: dict) -> dict:
    """Collapse the rich audit object the model returns into the flat shape the
    crud/router layer consumes, while preserving the decomposed detail under
    'analysis_detail' and 'ai_context_guardrail' for the UI. No overall
    soundness/verifiable field - see _POST_AUDIT_PROMPT for why.

    ai_context_guardrail is stored as a JSON string encoding
    {"breadcrumb": [...], "in_scope": "..."} - the Text column doesn't change
    shape, only its contents (see BlogModel.ai_context_guardrail). No
    out_of_scope: what's off-topic is too subjective to state as a hard rule,
    and a discussion can legitimately expand past what looked out of bounds
    at first."""
    source_eval = raw.get("source_evaluation") or {}
    return {
        "summary": raw.get("summary", ""),
        "ai_context_guardrail": json.dumps(raw.get("context_guardrail") or {}),
        "analysis_detail": {
            "sub_scores": raw.get("sub_scores", {}),
            "detected_fallacies": raw.get("detected_fallacies", []),
            "steelman": raw.get("steelman", ""),
            "verification_pathway": raw.get("verification_pathway", ""),
        },
        "approved_source_ids": source_eval.get("approved_source_ids", []),
        "rejected_source_ids": source_eval.get("rejected_source_ids", []),
    }
