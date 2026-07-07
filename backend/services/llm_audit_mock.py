"""Mock LLM service for dev/demo - returns sentence-based, decomposed audit
output without calling Gemini. Mirrors the flattened shape produced by
llm_audit._flatten_audit_response so crud/router code is identical either way.

The heuristics here are deliberately simple but content-aware: they read the
post/comment text for evidence markers vs. pseudo-scientific / absolutist
markers and produce a calibrated, prose assessment rather than raw stats.
"""
import json
import re

# Common words to ignore when comparing a comment against the post's topic.
_STOPWORDS = {
    "this", "that", "with", "from", "have", "into", "your", "their", "about",
    "which", "would", "there", "these", "those", "actually", "really", "being",
    "because", "should", "could", "other", "than", "then", "them", "they",
    "what", "when", "where", "will", "just", "like", "also", "more", "some",
}

# Words that signal grounded, checkable reasoning.
_EVIDENCE_MARKERS = [
    "study", "studies", "data", "dataset", "evidence", "peer-review",
    "peer reviewed", "journal", "doi", "citation", "source", "research",
    "experiment", "measured", "sample", "controlled", "%", "percent",
]

# Words that signal unfalsifiable, absolutist, or hyperbolic claims.
_PSEUDO_MARKERS = [
    "conclusive proof", "proof that", "obviously", "clearly proves",
    "undeniable", "everyone knows", "it's a fact that", "seamlessly",
    "broke the internet", "only ", "cannot be explained", "hyper-dimensional",
    "4th-dimensional", "tesseract", "they don't want you to know",
]

_ABSOLUTES = ["always", "never", "everyone", "no one", "impossible", "guaranteed", "100%"]


def _count_markers(text, markers):
    return sum(1 for m in markers if m in text)


def _band(score):
    if score <= 20:
        return "very low"
    if score <= 40:
        return "low"
    if score <= 60:
        return "mixed"
    if score <= 80:
        return "solid"
    return "strong"


def analyze_audit_collection_mock(collected_data: dict) -> dict:
    """Mock audit for a blog post or a single comment. Returns the flat shape
    consumed by crud_blog.sync_* and the router."""
    is_comment_analysis = (
        "comment_chain" in collected_data and "target_comment" in collected_data
    )
    if is_comment_analysis:
        return analyze_comment_mock(collected_data)
    return _analyze_post_mock(collected_data)


def analyze_post_thread_mock(collected_data: dict, params: dict) -> dict:
    """Mock for the opt-in thread analysis: deterministic shape that exercises
    the two-dials contract and echoes the requester's parameters so tests can
    assert they reached the prompt layer."""
    blog = collected_data.get("blog", {})
    title = blog.get("strTitle", "this post")
    focus = params.get("focus", "fact_check")
    depth = params.get("depth", "quick")
    text = f"{blog.get('strContent', '')} {blog.get('strSummary', '')}".lower()
    claim_bearing = any(m in text for m in ("study", "shows", "proves", "evidence", "%", "research", "found"))
    assessment = "supported" if claim_bearing and "evidence" in text else ("mixed" if claim_bearing else "not_applicable")
    response_text = (
        f"Reading \"{title}\" with a {focus.replace('_', ' ')} lens ({depth} take): the strongest part is its "
        f"clearly stated core idea. "
        + ("The central claim is checkable, and the cited reasoning holds together; it would be stronger "
           "still with a primary source readers can follow."
           if claim_bearing else
           "There is no falsifiable claim here to check - this reads as a musing, and it works as one. "
           "Nothing needs a citation to be worth discussing.")
    )
    return {
        "classification": {"claim_bearing": claim_bearing, "register": "earnest"},
        "response_text": response_text,
        "assessment": assessment,
        "suggested_sources": [],
    }


def analyze_comment_batch_mock(batch_data: dict) -> dict:
    """Mock batch comment audit: same strict judgment as analyze_comment_mock,
    applied to every comment in one pass, no per-comment Gemini round-trip."""
    blog = batch_data.get("blog", {})
    results = []
    for c in batch_data.get("comments", []):
        single = analyze_comment_mock({
            "blog": blog,
            "comment_chain": c.get("parent_chain", []),
            "target_comment": {"id": c.get("id"), "strContent": c.get("strContent", "")},
        })
        results.append({"comment_id": c.get("id"), **single})
    return {"results": results}


def _topic_keywords(blog: dict) -> set:
    """Significant (non-stopword) terms from the post's title + summary that a
    genuinely on-topic comment would be expected to touch."""
    text = f"{blog.get('strTitle', '')} {blog.get('strSummary', '')}".lower()
    return {w for w in re.findall(r"[a-z]{4,}", text) if w not in _STOPWORDS}


def analyze_comment_mock(collected_data: dict) -> dict:
    """Judgment here is STRICT: does the comment materially help VERIFY OR
    REFUTE the post's claim - not how agreeable, friendly, or well-written it
    is. Opinion, praise, and anecdote get called out as such; only on-topic,
    evidence-bearing engagement is credited as contributing. Internally still
    scores the same signals as before for a calibrated judgment, but the
    output is pure prose - no exposed numeric/categorical fields."""
    comment = collected_data.get("target_comment", {})
    raw_content = comment.get("strContent") or ""
    content = raw_content.lower()
    chain_len = len(collected_data.get("comment_chain", []))
    blog = collected_data.get("blog", {})

    topic_words = _topic_keywords(blog)
    comment_words = {w for w in re.findall(r"[a-z]{4,}", content) if w not in _STOPWORDS}
    on_topic = len(topic_words & comment_words)

    evidence = _count_markers(content, _EVIDENCE_MARKERS)
    pseudo = _count_markers(content, _PSEUDO_MARKERS)
    # A comment that cites more evidence than it name-drops pseudo terms is
    # almost certainly critiquing them, not asserting them - don't penalize it.
    effective_pseudo = pseudo if evidence < pseudo else 0
    is_pure_agreement = (
        evidence == 0
        and any(w in content for w in ["great", "love", "fantastic", "me too", "thanks", "awesome", "+1", "so true", "this!"])
    )
    if any(w in content for w in ["disagree", "wrong", "incorrect", "however", "but ", "actually"]):
        tone = "critical" if evidence == 0 else "constructive"
    elif any(w in content for w in ["great", "agree", "confirm", "fantastic", "solved", "love"]):
        tone = "supportive"
    else:
        tone = "neutral"

    if evidence and on_topic and not effective_pseudo:
        summary = (
            f"This {tone} comment engages the specific claim directly and cites "
            f"checkable specifics ({evidence} evidence marker(s)), so it "
            "materially helps verify or refute it."
        )
    elif effective_pseudo:
        summary = (
            f"This {tone} comment leans on assertion or absolutist phrasing rather "
            "than evidence, so despite its confident tone it does little to "
            "actually verify the claim."
        )
    elif is_pure_agreement:
        summary = (
            "This is agreement or praise, not verification - it offers no "
            "evidence and doesn't test the claim either way."
        )
    elif on_topic == 0:
        summary = (
            f"This {tone} comment doesn't engage the post's actual claim - it "
            "doesn't share any terminology with it, so it contributes little "
            "to verification."
        )
    elif chain_len > 2:
        summary = (
            f"A {tone} reply, on-topic but anecdotal - it references the "
            "subject within the thread but cites no evidence, so it adds "
            "context without strengthening or weakening the claim."
        )
    else:
        summary = (
            f"A {tone}, on-topic but anecdotal comment - it references the "
            "subject but cites no evidence, so it adds context without "
            "strengthening or weakening the claim."
        )

    return {"ai_summary": summary}


def _analyze_post_mock(collected_data: dict) -> dict:
    blog = collected_data.get("blog", {})
    title = blog.get("strTitle") or "this topic"
    content = (blog.get("strContent") or "").lower()
    summary_text = (blog.get("strSummary") or "").lower()
    haystack = f"{title.lower()} {content} {summary_text}"

    # Post-level payload sends a count, not full comment text (dead weight -
    # the audit prompt never reasons about individual comments).
    comment_count = collected_data.get("comment_count", 0)
    sources = collected_data.get("sources", [])

    evidence = _count_markers(haystack, _EVIDENCE_MARKERS)
    pseudo = _count_markers(haystack, _PSEUDO_MARKERS)
    absolutes = _count_markers(haystack, _ABSOLUTES)

    # Decomposed sub-scores (0-100), each justified.
    clarity = max(5, 70 - pseudo * 25)
    premise = max(5, 30 + evidence * 15 - pseudo * 15)
    inference = max(5, 65 - pseudo * 20 - absolutes * 5)
    src_reliability = 25 + min(50, len(sources) * 20)
    fallacy_freedom = max(5, 80 - pseudo * 20 - absolutes * 10)

    detected_fallacies = []
    if pseudo:
        detected_fallacies.append({
            "name": "Unfalsifiability / non-scientific premise",
            "quote": _first_marker_span(blog, _PSEUDO_MARKERS),
            "explanation": (
                "The central claim is framed so that no observation could disprove "
                "it, placing it outside the domain of empirical verification."
            ),
        })
    if "broke the internet" in haystack or "only " in haystack:
        detected_fallacies.append({
            "name": "Non sequitur",
            "quote": _first_marker_span(blog, ["broke the internet", "only "]),
            "explanation": (
                "Popularity or virality is offered as if it entailed the "
                "conclusion; the inference does not follow from the premise."
            ),
        })
    if absolutes:
        detected_fallacies.append({
            "name": "Overgeneralization",
            "quote": _first_marker_span(blog, _ABSOLUTES),
            "explanation": (
                "Absolutist language asserts universality that the evidence "
                "presented does not support."
            ),
        })

    sub_scores = {
        "clarity_falsifiability": {
            "score": clarity,
            "rationale": (
                "Claim is unfalsifiable as stated." if pseudo
                else "Claim is stated clearly enough to test."
            ),
        },
        "premise_support": {
            "score": premise,
            "rationale": (
                f"{evidence} evidence marker(s); premises rest largely on assertion."
                if evidence else "Premises rest on assertion, not cited evidence."
            ),
        },
        "inferential_validity": {
            "score": inference,
            "rationale": (
                "Conclusion outruns the premises." if pseudo or absolutes
                else "Conclusion broadly follows from the premises."
            ),
        },
        "source_reliability": {
            "score": src_reliability,
            "rationale": (
                f"{len(sources)} source(s) attached; relevance to the exact claim "
                "must still be checked." if sources
                else "No community sources bear directly on the claim."
            ),
        },
        "fallacy_bias_freedom": {
            "score": fallacy_freedom,
            "rationale": (
                f"{len(detected_fallacies)} fallacy pattern(s) detected."
                if detected_fallacies else "No overt fallacies detected."
            ),
        },
    }

    steelman = (
        f'The strongest charitable reading of "{title}" is that the author has '
        "noticed a genuine pattern and is reaching for an explanatory framework; "
        "the observation may be real even if the proposed mechanism is not "
        "established."
    )

    if pseudo:
        summary = (
            f'This post advances an empirical-sounding claim ("{title}") that is, '
            f"on inspection, unfalsifiable — it scores {_band(clarity)} on clarity "
            f"and falsifiability. Its premises rest on assertion rather than the "
            f"peer-reviewed evidence the claim would require, and {len(detected_fallacies)} "
            "fallacy pattern(s) were detected in the reasoning. Reader engagement "
            "and reactions carry no evidentiary weight and were disregarded. Overall, "
            "this is a claim that is confidently stated but not currently supportable."
        )
    else:
        summary = (
            f'This post makes a checkable claim ("{title}") supported by '
            f"{evidence} evidence marker(s) and {len(sources)} community source(s). "
            f"It scores {_band(premise)} on premise support and {_band(inference)} "
            "on inferential validity. The reasoning is broadly coherent, though the "
            "sources should still be checked for relevance to the exact claim rather "
            "than the general topic."
        )

    verification_pathway = (
        "This claim would be confirmed or falsified by locating peer-reviewed "
        f'measurements directly addressing "{title}", ideally a controlled study '
        "or dataset reported in a primary source, and checking whether independent "
        "replications reach the same result."
    )

    context_guardrail = {
        "breadcrumb": ["Claim Review", "Evidence Check", "Fallacy Scan" if pseudo else "Source Fit"],
        "in_scope": (
            "Whether the mechanism has falsifiable, primary evidence"
            if pseudo else
            "Whether cited sources actually measure this exact claim"
        ),
    }

    return {
        "summary": summary,
        "ai_context_guardrail": json.dumps(context_guardrail),
        "analysis_detail": {
            "sub_scores": sub_scores,
            "detected_fallacies": detected_fallacies,
            "steelman": steelman,
            "verification_pathway": verification_pathway,
        },
        "approved_source_ids": [],
        "rejected_source_ids": [],
    }


def _first_marker_span(blog: dict, markers) -> str:
    """Return the original-cased sentence fragment around the first marker hit,
    so 'detected_fallacies' quotes real text rather than a lowercased token."""
    original = (blog.get("strContent") or blog.get("strSummary") or blog.get("strTitle") or "")
    low = original.lower()
    for m in markers:
        idx = low.find(m)
        if idx != -1:
            start = max(0, idx - 20)
            end = min(len(original), idx + len(m) + 30)
            span = original[start:end].strip()
            return f"...{span}..." if span else m
    return markers[0] if markers else ""
