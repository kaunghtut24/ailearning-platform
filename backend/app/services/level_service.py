import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Vocabulary signals
# ---------------------------------------------------------------------------

# Words that strongly suggest secondary-level thinking
_SECONDARY_KEYWORDS: frozenset[str] = frozenset({
    "analyze", "analyse", "evaluate", "hypothesis", "mechanism", "theory",
    "implications", "differentiate", "integrate", "gradient", "algorithm",
    "architecture", "synthesis", "critique", "empirical", "thermodynamics",
    "quantum", "relativity", "calculus", "trigonometry", "derivative",
    "polynomial", "stoichiometry", "electrochemistry", "jurisprudence",
    "macroeconomics", "philosophical", "epistemology", "methodology",
})

# Words that suggest middle-level engagement
_MIDDLE_KEYWORDS: frozenset[str] = frozenset({
    "explain", "describe", "compare", "difference", "equation", "formula",
    "function", "process", "experiment", "calculate", "solve", "relationship",
    "causes", "effect", "energy", "force", "chemical", "biological", "historical",
})

# Word-count thresholds
_PRIMARY_MAX_WORDS = 8
_SECONDARY_MIN_WORDS = 20


def detect_level(message: str) -> str:
    """
    Infer student level from message length and vocabulary.

    Heuristic (no ML):
      - secondary keywords present  OR  > 20 words  → "secondary"
      - middle keywords present      OR  9–20 words  → "middle"
      - everything else (≤ 8 words, simple vocab)    → "primary"

    Returns one of: "primary", "middle", "secondary"
    """
    words = message.lower().split()
    word_count = len(words)
    word_set = set(words)

    if word_set & _SECONDARY_KEYWORDS or word_count > _SECONDARY_MIN_WORDS:
        level = "secondary"
    elif word_set & _MIDDLE_KEYWORDS or word_count > _PRIMARY_MAX_WORDS:
        level = "middle"
    else:
        level = "primary"

    logger.info(
        "[level_service] detect_level — words=%d level=%s message=%r",
        word_count,
        level,
        message,
    )
    return level

