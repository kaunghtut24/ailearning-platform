import logging
import re

logger = logging.getLogger(__name__)

# ── Keyword lists ──────────────────────────────────────────────────────────────
# Each list uses whole-word patterns to avoid false positives (e.g. "class" ≠ "ass").
# Extend these lists as the platform grows.

_UNSAFE_PATTERNS: list[re.Pattern] = [
    re.compile(r"\b(porn|pornography|nude|nudity|naked|xxx|hentai|explicit|nsfw)\b", re.I),
    re.compile(r"\bsex(ual|ually|ting)?\b", re.I),
    re.compile(r"\b(rape|molest|abuse|assault)\b", re.I),
    re.compile(r"\b(kill|murder|suicide|self.harm|hurt (myself|yourself))\b", re.I),
    re.compile(r"\b(drug|meth|cocaine|heroin|weed|marijuana)\b", re.I),
    re.compile(r"\b(hack|ddos|malware|exploit|phishing)\b", re.I),
]

_OFF_TOPIC_PATTERNS: list[re.Pattern] = [
    re.compile(r"\b(fortnite|minecraft|roblox|valorant|genshin|among us|call of duty|cod|pubg|lol|league of legends|tiktok|instagram|snapchat|youtube)\b", re.I),
    re.compile(r"\b(play (a )?(game|video|movie)|watch (tv|movie|anime|netflix))\b", re.I),
    re.compile(r"\b(tell me a joke|entertain me|i('m| am) bored)\b", re.I),
]

# ── Redirection responses ──────────────────────────────────────────────────────
# Warm, educational, never blunt.

_UNSAFE_RESPONSES: list[str] = [
    (
        "That's a topic that's usually covered carefully in health or biology classes, "
        "depending on your age.\n\n"
        "Would you like me to explain the relevant science — like human biology or "
        "psychology — in a clear, educational way? 📚"
    ),
    (
        "I want to keep our learning space safe and positive!\n\n"
        "I can help you explore science, history, literature, or any subject you're "
        "curious about. What would you like to learn today? 😊"
    ),
    (
        "That's outside what I can help with here, but there's plenty of fascinating "
        "stuff we *can* explore together.\n\n"
        "Want to dive into a topic — maybe biology, psychology, or something you're "
        "studying right now?"
    ),
]

_OFF_TOPIC_RESPONSES: list[str] = [
    (
        "That sounds like fun! 🎮 But let's keep the momentum going on your learning.\n\n"
        "How about a quick quiz on what we've been covering, or shall we explore "
        "a new topic together?"
    ),
    (
        "I'm built for learning, so games and entertainment are a bit outside my lane 😄\n\n"
        "What subject are you working on? I'd love to help you make progress!"
    ),
    (
        "Nice idea, but learning is where I shine! ✨\n\n"
        "Want to tackle something interesting — a quiz, a concept explained, or "
        "a topic you've been struggling with?"
    ),
]


class ModerationAgent:
    """
    Lightweight content moderation layer.

    Runs BEFORE the InstructorAgent to classify user messages into:
      - "safe"      → pass through to instructor
      - "unsafe"    → return a warm educational redirect
      - "off_topic" → return a gentle refocus prompt

    Design principles:
      ✅ Never bluntly reject — always redirect or offer an alternative
      ✅ Keep responses warm and encouraging
      ✅ Err on the side of caution but avoid over-blocking
    """

    def classify(self, message: str) -> str:
        """
        Classify a message as 'safe', 'unsafe', or 'off_topic'.
        Pattern matching is case-insensitive and whole-word to minimise false positives.
        """
        text = message.strip()

        for pattern in _UNSAFE_PATTERNS:
            if pattern.search(text):
                logger.info("[ModerationAgent] classified=unsafe message=%r", text[:60])
                return "unsafe"

        for pattern in _OFF_TOPIC_PATTERNS:
            if pattern.search(text):
                logger.info("[ModerationAgent] classified=off_topic message=%r", text[:60])
                return "off_topic"

        return "safe"

    def redirect_response(self, classification: str, message: str = "") -> dict:
        """
        Return a structured redirect response (same shape as InstructorAgent output).
        Rotates through multiple response variants so it doesn't feel repetitive.
        """
        import hashlib
        # Use a hash of the message to pick a variant deterministically but variably
        idx = int(hashlib.md5(message.encode()).hexdigest(), 16)

        if classification == "unsafe":
            answer = _UNSAFE_RESPONSES[idx % len(_UNSAFE_RESPONSES)]
        else:  # off_topic
            answer = _OFF_TOPIC_RESPONSES[idx % len(_OFF_TOPIC_RESPONSES)]

        return {
            "answer": answer,
            "moderated": True,
            "classification": classification,
        }
