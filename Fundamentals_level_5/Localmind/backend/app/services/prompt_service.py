"""
Prompt Service - Manages system prompts for AI interactions.

Educational Note: This service handles loading, storing, and retrieving
prompts used in AI conversations. Projects can have custom prompts or
fall back to the global default.

Prompt Hierarchy:
1. Project custom prompt (if set)
2. Global default prompt (fallback)
"""
import json
from pathlib import Path
from typing import Optional

from config import Config


class PromptService:
    """
    Service class for managing system prompts.

    Educational Note: Prompts define how the AI behaves. Different projects
    might need different prompts based on their use case (research, coding,
    learning, etc.).
    """

    def __init__(self):
        """Initialize the prompt service."""
        self.prompts_dir = Config.DATA_DIR / "prompts"
        self.projects_dir = Config.PROJECTS_DIR

        # Ensure prompts directory exists
        self.prompts_dir.mkdir(exist_ok=True, parents=True)

    def get_default_prompt(self) -> str:
        """
        Load the global default system prompt.

        Educational Note: This is used when projects don't have custom prompts.
        It provides a baseline behavior for the AI assistant.

        Returns:
            The default system prompt text
        """
        default_prompt_file = self.prompts_dir / "default_prompt.json"

        try:
            with open(default_prompt_file, 'r') as f:
                prompt_data = json.load(f)
                return prompt_data.get("prompt", self._fallback_prompt())
        except (FileNotFoundError, json.JSONDecodeError):
            return self._fallback_prompt()

    def _fallback_prompt(self) -> str:
        """
        Fallback prompt if default_prompt.json is missing.

        Educational Note: Always have a hardcoded fallback to ensure
        the application works even if config files are missing.
        """
        return (
            "You are LocalMind AI, a helpful assistant for students and learners. "
            "Help users understand complex topics, answer questions clearly, "
            "and provide accurate information with helpful explanations."
        )

    def get_project_prompt(self, project_id: str) -> str:
        """
        Get the prompt for a specific project.

        Educational Note: First checks for a custom prompt in project settings,
        then falls back to the global default.

        Args:
            project_id: The project UUID

        Returns:
            The project's system prompt (custom or default)
        """
        project_file = self.projects_dir / f"{project_id}.json"

        try:
            with open(project_file, 'r') as f:
                project_data = json.load(f)
                custom_prompt = project_data.get("settings", {}).get("custom_prompt")

                if custom_prompt:
                    return custom_prompt
        except (FileNotFoundError, json.JSONDecodeError):
            pass

        # Return default if no custom prompt
        return self.get_default_prompt()

    def update_project_prompt(self, project_id: str, prompt: Optional[str]) -> bool:
        """
        Update a project's custom prompt.

        Educational Note: Setting prompt to None removes the custom prompt
        and reverts to the default.

        Args:
            project_id: The project UUID
            prompt: New custom prompt, or None to reset to default

        Returns:
            True if successful, False if project not found
        """
        project_file = self.projects_dir / f"{project_id}.json"

        if not project_file.exists():
            return False

        try:
            with open(project_file, 'r') as f:
                project_data = json.load(f)

            # Ensure settings dict exists
            if "settings" not in project_data:
                project_data["settings"] = {}

            # Update or remove custom prompt
            if prompt:
                project_data["settings"]["custom_prompt"] = prompt
            else:
                # Remove custom prompt to use default
                project_data["settings"].pop("custom_prompt", None)

            # Save updated project
            with open(project_file, 'w') as f:
                json.dump(project_data, f, indent=2)

            return True

        except (json.JSONDecodeError, IOError):
            return False

    def save_default_prompt(self, prompt: str) -> bool:
        """
        Update the global default prompt.

        Educational Note: This affects all projects that don't have
        custom prompts. Use with caution.

        Args:
            prompt: New default prompt text

        Returns:
            True if successful
        """
        default_prompt_file = self.prompts_dir / "default_prompt.json"

        try:
            prompt_data = {"prompt": prompt}
            with open(default_prompt_file, 'w') as f:
                json.dump(prompt_data, f, indent=2)
            return True
        except IOError:
            return False

    def get_agent_prompt(self, agent_name: str) -> Optional[str]:
        """
        Load a prompt for a specific agent.

        Educational Note: Agents (like web_agent, pdf_agent, etc.) have
        their own specialized prompts stored in data/prompts/{agent_name}_prompt.json

        Args:
            agent_name: Name of the agent (e.g., "web_agent")

        Returns:
            The agent's system prompt, or None if not found
        """
        prompt_file = self.prompts_dir / f"{agent_name}_prompt.json"

        try:
            with open(prompt_file, 'r') as f:
                prompt_data = json.load(f)
                # Look for system_prompt first (new format), then prompt (legacy)
                return prompt_data.get("system_prompt") or prompt_data.get("prompt")
        except (FileNotFoundError, json.JSONDecodeError):
            return None


# Singleton instance for easy import
prompt_service = PromptService()
