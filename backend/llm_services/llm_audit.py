import json
import time
import logging
import google.generativeai as genai
from django.conf import settings
from llm_services.llm_audit_mock import (
    analyze_audit_collection_mock,
    analyze_comment_mock,
    analyze_comment_batch_mock,
)

logger = logging.getLogger("django")


def _log_audit_result(kind: str, started: float, result: dict):
    logger.info(
        "[LLM AUDIT] path=%s elapsed=%.2fs",
        kind, time.monotonic() - started,
    )

_MODEL_NAME = "gemini-flash-lite-latest"

APPROVER_DISPLAY_NAME = "Synapse AI"


class LlmAuditError(Exception):
    pass


def _require_api_key():
    if not settings.GEMINI_API_KEY:
        raise LlmAuditError(
            "GEMINI_API_KEY is not set. Add it to the backend's environment "
            "(see .env.example) to enable AI-driven source review."
        )


def analyze_audit_collection(collected_data: dict) -> dict:
    started = time.monotonic()

    if settings.USE_MOCK_LLM:
        logger.info("[LLM AUDIT] USE_MOCK_LLM=True -> returning MOCK data (no Gemini call)")
        result = analyze_audit_collection_mock(collected_data)
        _log_audit_result("MOCK", started, result)
        return result

    logger.info("[LLM AUDIT] USE_MOCK_LLM=False -> calling Gemini model=%s", _MODEL_NAME)
    _require_api_key()
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(_MODEL_NAME)

    prompt = _POST_AUDIT_PROMPT + f"\n\nDATA:\n{json.dumps(collected_data)}"

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},

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
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    return json.JSONDecoder().raw_decode(cleaned)[0]


def _flatten_audit_response(raw: dict) -> dict:
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
