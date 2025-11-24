"""
Chat Service - Business logic for chat management and AI interactions.

Educational Note: This service handles chat conversations, message history,
and integration with Claude API. Each project can have multiple chats.
"""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any
import anthropic

from config import Config


class ChatService:
    """
    Service class for managing chats and AI conversations.

    Educational Note: This service manages chat data storage and handles
    communication with Claude API for generating responses.
    """

    def __init__(self):
        """Initialize the chat service."""
        self.projects_dir = Config.PROJECTS_DIR
        self.prompts_dir = Config.DATA_DIR / "prompts"

        # Ensure prompts directory exists
        self.prompts_dir.mkdir(exist_ok=True, parents=True)

        # Initialize Anthropic client (will be set when needed)
        self.anthropic_client = None

    def _get_anthropic_client(self) -> anthropic.Anthropic:
        """
        Get or create Anthropic client.

        Educational Note: We lazily initialize the client to avoid errors
        if API key is not set yet.
        """
        if self.anthropic_client is None:
            import os
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not found in environment")
            self.anthropic_client = anthropic.Anthropic(api_key=api_key)
        return self.anthropic_client

    def _get_project_chats_dir(self, project_id: str) -> Path:
        """Get the chats directory for a specific project."""
        chats_dir = self.projects_dir / project_id / "chats"
        chats_dir.mkdir(exist_ok=True, parents=True)
        return chats_dir

    def _get_chats_index_file(self, project_id: str) -> Path:
        """Get the path to the chats index file for a project."""
        return self._get_project_chats_dir(project_id) / "chats_index.json"

    def _initialize_chats_index(self, project_id: str):
        """
        Initialize the chats index file if it doesn't exist.

        Educational Note: Each project has its own chats index to track
        all conversations within that project.
        """
        index_file = self._get_chats_index_file(project_id)
        if not index_file.exists():
            initial_index = {
                "project_id": project_id,
                "chats": [],
                "last_updated": datetime.now().isoformat()
            }
            self._save_chats_index(project_id, initial_index)

    def _load_chats_index(self, project_id: str) -> Dict[str, Any]:
        """Load the chats index for a project."""
        index_file = self._get_chats_index_file(project_id)

        if not index_file.exists():
            self._initialize_chats_index(project_id)

        try:
            with open(index_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # If file is corrupted, reinitialize
            self._initialize_chats_index(project_id)
            with open(index_file, 'r') as f:
                return json.load(f)

    def _save_chats_index(self, project_id: str, index_data: Dict[str, Any]):
        """Save the chats index to file."""
        index_data["last_updated"] = datetime.now().isoformat()
        index_file = self._get_chats_index_file(project_id)
        with open(index_file, 'w') as f:
            json.dump(index_data, f, indent=2)

    def get_default_prompt(self) -> str:
        """
        Load the default system prompt.

        Educational Note: This prompt is used across all projects unless
        a custom prompt is specified.
        """
        default_prompt_file = self.prompts_dir / "default_prompt.json"

        try:
            with open(default_prompt_file, 'r') as f:
                prompt_data = json.load(f)
                return prompt_data.get("prompt", "")
        except (FileNotFoundError, json.JSONDecodeError):
            # Fallback prompt if file is missing
            return "You are LocalMind AI, a helpful assistant for students and learners."

    def get_project_prompt(self, project_id: str) -> str:
        """
        Get the prompt for a specific project (custom or default).

        Educational Note: Projects can override the default prompt with
        their own custom prompt for specialized use cases.
        """
        # Load project data
        project_file = self.projects_dir / f"{project_id}.json"

        try:
            with open(project_file, 'r') as f:
                project_data = json.load(f)
                custom_prompt = project_data.get("settings", {}).get("custom_prompt")

                if custom_prompt:
                    return custom_prompt
        except (FileNotFoundError, json.JSONDecodeError):
            pass

        # Return default prompt if no custom prompt
        return self.get_default_prompt()

    def list_project_chats(self, project_id: str) -> List[Dict[str, Any]]:
        """
        List all chats for a specific project.

        Args:
            project_id: The project UUID

        Returns:
            List of chat metadata
        """
        index = self._load_chats_index(project_id)
        # Sort by updated_at, most recent first
        chats = sorted(
            index["chats"],
            key=lambda c: c.get("updated_at", c["created_at"]),
            reverse=True
        )
        return chats

    def create_chat(self, project_id: str, title: str = "New Chat") -> Dict[str, Any]:
        """
        Create a new chat in a project.

        Args:
            project_id: The project UUID
            title: Chat title (default: "New Chat")

        Returns:
            Created chat metadata
        """
        # Generate unique chat ID
        chat_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        # Create chat metadata
        chat_metadata = {
            "id": chat_id,
            "title": title,
            "created_at": timestamp,
            "updated_at": timestamp,
            "message_count": 0
        }

        # Create chat data structure
        chat_data = {
            "id": chat_id,
            "project_id": project_id,
            "title": title,
            "created_at": timestamp,
            "updated_at": timestamp,
            "messages": [],
            "metadata": {
                "source_references": [],
                "sub_agents": []
            }
        }

        # Save chat file
        chats_dir = self._get_project_chats_dir(project_id)
        chat_file = chats_dir / f"{chat_id}.json"
        with open(chat_file, 'w') as f:
            json.dump(chat_data, f, indent=2)

        # Update index
        index = self._load_chats_index(project_id)
        index["chats"].append(chat_metadata)
        self._save_chats_index(project_id, index)

        print(f"✅ Created chat: {title} (ID: {chat_id})")

        return chat_metadata

    def get_chat(self, project_id: str, chat_id: str) -> Optional[Dict[str, Any]]:
        """
        Get full chat data by ID.

        Args:
            project_id: The project UUID
            chat_id: The chat UUID

        Returns:
            Full chat data or None if not found
        """
        chats_dir = self._get_project_chats_dir(project_id)
        chat_file = chats_dir / f"{chat_id}.json"

        if not chat_file.exists():
            return None

        try:
            with open(chat_file, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"⚠️ Corrupted chat file: {chat_id}")
            return None

    def send_message(self, project_id: str, chat_id: str, user_message: str) -> Dict[str, Any]:
        """
        Send a message and get AI response.

        Args:
            project_id: The project UUID
            chat_id: The chat UUID
            user_message: The user's message

        Returns:
            Dict with user message and AI response

        Educational Note: This method:
        1. Loads chat history
        2. Adds user message
        3. Calls Claude API with full context
        4. Adds AI response
        5. Saves updated chat
        """
        # Load chat data
        chat_data = self.get_chat(project_id, chat_id)
        if not chat_data:
            raise ValueError(f"Chat {chat_id} not found")

        # Get project prompt
        system_prompt = self.get_project_prompt(project_id)

        # Create user message
        user_msg_id = str(uuid.uuid4())
        user_msg = {
            "id": user_msg_id,
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        }

        # Add user message to chat
        chat_data["messages"].append(user_msg)

        # Prepare messages for Claude API
        # Educational Note: We send the full conversation history to maintain context
        api_messages = [
            {
                "role": msg["role"],
                "content": msg["content"]
            }
            for msg in chat_data["messages"]
        ]

        # Call Claude API
        try:
            client = self._get_anthropic_client()

            response = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=4096,
                system=system_prompt,
                messages=api_messages
            )

            # Extract response text
            assistant_content = response.content[0].text

            # Create assistant message
            assistant_msg_id = str(uuid.uuid4())
            assistant_msg = {
                "id": assistant_msg_id,
                "role": "assistant",
                "content": assistant_content,
                "timestamp": datetime.now().isoformat(),
                "model": "claude-sonnet-4-5",
                "tokens": {
                    "input": response.usage.input_tokens,
                    "output": response.usage.output_tokens
                }
            }

            # Add assistant message to chat
            chat_data["messages"].append(assistant_msg)

        except Exception as e:
            print(f"❌ Error calling Claude API: {e}")
            # Add error message
            assistant_msg = {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": f"Sorry, I encountered an error: {str(e)}",
                "timestamp": datetime.now().isoformat(),
                "model": "claude-sonnet-4-5",
                "error": True
            }
            chat_data["messages"].append(assistant_msg)

        # Update chat metadata
        chat_data["updated_at"] = datetime.now().isoformat()
        chat_data["message_count"] = len(chat_data["messages"])

        # Save updated chat
        self._save_chat_data(project_id, chat_id, chat_data)

        # Update chat index
        self._update_chat_index_entry(project_id, chat_id, chat_data)

        return {
            "user_message": user_msg,
            "assistant_message": assistant_msg
        }

    def delete_chat(self, project_id: str, chat_id: str) -> bool:
        """
        Delete a chat.

        Args:
            project_id: The project UUID
            chat_id: The chat UUID

        Returns:
            True if deleted, False if not found
        """
        chats_dir = self._get_project_chats_dir(project_id)
        chat_file = chats_dir / f"{chat_id}.json"

        if not chat_file.exists():
            return False

        # Delete the chat file
        chat_file.unlink()

        # Remove from index
        index = self._load_chats_index(project_id)
        index["chats"] = [c for c in index["chats"] if c["id"] != chat_id]
        self._save_chats_index(project_id, index)

        print(f"🗑️ Deleted chat: {chat_id}")
        return True

    def update_chat_title(self, project_id: str, chat_id: str, new_title: str) -> Optional[Dict[str, Any]]:
        """
        Update a chat's title.

        Args:
            project_id: The project UUID
            chat_id: The chat UUID
            new_title: New title for the chat

        Returns:
            Updated chat metadata or None if not found
        """
        chat_data = self.get_chat(project_id, chat_id)
        if not chat_data:
            return None

        chat_data["title"] = new_title
        chat_data["updated_at"] = datetime.now().isoformat()

        # Save updated chat
        self._save_chat_data(project_id, chat_id, chat_data)

        # Update index
        self._update_chat_index_entry(project_id, chat_id, chat_data)

        return {
            "id": chat_data["id"],
            "title": chat_data["title"],
            "created_at": chat_data["created_at"],
            "updated_at": chat_data["updated_at"],
            "message_count": len(chat_data["messages"])
        }

    def _save_chat_data(self, project_id: str, chat_id: str, data: Dict[str, Any]):
        """Helper method to save chat data to file."""
        chats_dir = self._get_project_chats_dir(project_id)
        chat_file = chats_dir / f"{chat_id}.json"
        with open(chat_file, 'w') as f:
            json.dump(data, f, indent=2)

    def _update_chat_index_entry(self, project_id: str, chat_id: str, chat_data: Dict[str, Any]):
        """Helper method to update a chat entry in the index."""
        index = self._load_chats_index(project_id)

        # Find and update the chat in index
        for i, chat in enumerate(index["chats"]):
            if chat["id"] == chat_id:
                index["chats"][i] = {
                    "id": chat_data["id"],
                    "title": chat_data["title"],
                    "created_at": chat_data["created_at"],
                    "updated_at": chat_data["updated_at"],
                    "message_count": len(chat_data["messages"])
                }
                break

        self._save_chats_index(project_id, index)
