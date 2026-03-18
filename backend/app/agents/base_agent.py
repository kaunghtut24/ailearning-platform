class BaseAgent:
    """Spec §6 — all agents must implement this interface."""

    async def run(self, input_data: dict) -> dict:
        raise NotImplementedError

