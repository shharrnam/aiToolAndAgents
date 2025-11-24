"""
Service for validating API keys by making test requests.

Educational Note: This service tests API keys by making minimal
requests to each service. It's separated from env_service to follow
the single responsibility principle.
"""
from typing import Tuple, Dict, Optional
import anthropic
import openai
import requests
from google import genai
from google.genai import types
from tavily import TavilyClient
from pinecone import Pinecone 
from pinecone.grpc import PineconeGRPC as Pinecone
from pinecone import ServerlessSpec
import time


class ValidationService:
    """
    Service for validating API keys.

    Educational Note: Each validation method makes the smallest possible
    request to minimize costs while verifying the key works.
    """

    def validate_anthropic_key(self, api_key: str) -> Tuple[bool, str]:
        """
        Validate an Anthropic API key by making a test request.

        Educational Note: We use claude-sonnet-4-5 as specified,
        with a simple test message.

        Args:
            api_key: The API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not api_key or api_key == '':
            return False, "API key is empty"

        try:
            # Create client with the provided key
            client = anthropic.Anthropic(api_key=api_key)

            # Make a test request with claude-sonnet-4-5 as specified
            message = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=200,
                messages=[
                    {
                        "role": "user",
                        "content": "Hello!"
                    }
                ]
            )

            # If we get here, the key is valid
            print(f"Validation successful: {message.content}")
            return True, "Valid Anthropic API key"

        except anthropic.AuthenticationError as e:
            return False, "Invalid API key - authentication failed"
        except anthropic.PermissionDeniedError as e:
            return False, "API key lacks required permissions"
        except anthropic.RateLimitError as e:
            # Rate limit actually means the key is valid but rate limited
            return True, "Valid API key (rate limited)"
        except anthropic.InsufficientFundsError as e:
            # Low balance means the key is valid but has no funds
            return True, "Valid API key (insufficient funds)"
        except Exception as e:
            # Log the actual error for debugging
            print(f"Anthropic validation error: {type(e).__name__}: {str(e)}")
            return False, f"Validation failed: {str(e)}"

    def validate_elevenlabs_key(self, api_key: str) -> Tuple[bool, str]:
        """
        Validate an ElevenLabs API key by checking user info.

        Educational Note: We use the /user endpoint which returns
        user subscription info - a lightweight way to verify the key.

        Args:
            api_key: The API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not api_key or api_key == '':
            return False, "API key is empty"

        try:
            # Check user info endpoint - lightweight validation
            response = requests.get(
                "https://api.elevenlabs.io/v1/user",
                headers={"xi-api-key": api_key},
                timeout=10
            )

            if response.status_code == 200:
                user_data = response.json()
                # Extract subscription tier for more informative message
                subscription = user_data.get('subscription', {})
                tier = subscription.get('tier', 'unknown')
                return True, f"Valid ElevenLabs API key (tier: {tier})"
            elif response.status_code == 401:
                return False, "Invalid API key - authentication failed"
            elif response.status_code == 429:
                return True, "Valid API key (rate limited)"
            else:
                return False, f"Validation failed: HTTP {response.status_code}"

        except requests.exceptions.Timeout:
            return False, "Validation timed out - try again"
        except requests.exceptions.RequestException as e:
            print(f"ElevenLabs validation error: {type(e).__name__}: {str(e)}")
            return False, f"Validation failed: {str(e)}"

    def validate_openai_key(self, api_key: str) -> Tuple[bool, str]:
        """
        Validate an OpenAI API key by making a test embeddings request.

        Educational Note: We use the embeddings endpoint since that's what
        we'll use this key for (text-embedding-3-small model for RAG).
        This is a lightweight way to verify the key works.

        Args:
            api_key: The API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not api_key or api_key == '':
            return False, "API key is empty"

        try:
            # Create client with the provided key
            client = openai.OpenAI(api_key=api_key)

            # Make a minimal embeddings request to test the key
            # Using text-embedding-3-small which is cost-effective
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input="test",
                encoding_format="float"
            )

            # If we get here with data, the key is valid
            if response.data and len(response.data) > 0:
                return True, "Valid OpenAI API key"
            else:
                return False, "API returned empty response"

        except openai.AuthenticationError as e:
            return False, "Invalid API key - authentication failed"
        except openai.PermissionDeniedError as e:
            return False, "API key lacks required permissions"
        except openai.RateLimitError as e:
            # Rate limit actually means the key is valid but rate limited
            return True, "Valid API key (rate limited)"
        except openai.InsufficientQuotaError as e:
            # Insufficient quota means the key is valid but has no credits
            return True, "Valid API key (insufficient quota)"
        except Exception as e:
            # Log the actual error for debugging
            print(f"OpenAI validation error: {type(e).__name__}: {str(e)}")
            return False, f"Validation failed: {str(e)}"

    def validate_gemini_2_5_key(self, api_key: str) -> Tuple[bool, str]:
        """
        Validate Gemini 2.5 API key by making a test text generation request.

        Educational Note: This tests if the API key is valid and enabled for
        Gemini 2.5 (text generation) model.

        Args:
            api_key: The Google API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not api_key or api_key == '':
            return False, "API key is empty"

        try:
            # Create client with the provided key
            client = genai.Client(api_key=api_key)

            # Make a minimal test request with Gemini 2.5 Flash
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents="Test"
            )

            # If we get here with a response, the key is valid
            if response.text:
                return True, "Valid Gemini 2.5 API key"
            else:
                return False, "API returned empty response"

        except Exception as e:
            error_message = str(e).lower()

            # Check for common error types
            if 'api key not valid' in error_message or 'invalid' in error_message:
                return False, "Invalid API key"
            elif 'permission' in error_message or 'enabled' in error_message:
                return False, "API not enabled for this key. Enable Gemini API in Google Cloud Console"
            elif 'quota' in error_message:
                return True, "Valid API key (quota exceeded)"
            elif 'rate' in error_message:
                return True, "Valid API key (rate limited)"
            else:
                print(f"Gemini 2.5 validation error: {type(e).__name__}: {str(e)}")
                return False, f"Validation failed: {str(e)[:100]}"

    def validate_nano_banana_key(self, api_key: str) -> Tuple[bool, str]:
        """
        Validate Nano Banana (Image Generation) API key.

        Educational Note: This tests if the API key is valid and enabled for
        Gemini 3 Pro Image Preview model. We use minimal settings for fastest test.

        Args:
            api_key: The Google API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not api_key or api_key == '':
            return False, "API key is empty"

        try:
            # Create client with the provided key
            client = genai.Client(api_key=api_key)

            model = "gemini-3-pro-image-preview"
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text="Test image")],
                ),
            ]

            # Minimal config for fastest test
            generate_content_config = types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(
                    image_size="1K",  # Smallest size for fast test
                ),
            )

            # Try to generate a single image as a test
            response = None
            for chunk in client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            ):
                if (chunk.candidates and
                    chunk.candidates[0].content and
                    chunk.candidates[0].content.parts):
                    response = chunk
                    break  # We only need one chunk to confirm it works

            if response:
                return True, "Valid Nano Banana (Image Gen) API key"
            else:
                return False, "API returned no image data"

        except Exception as e:
            error_message = str(e).lower()

            if 'api key not valid' in error_message or 'invalid' in error_message:
                return False, "Invalid API key"
            elif 'permission' in error_message or 'enabled' in error_message:
                return False, "Image generation API not enabled. Enable Gemini API in Google Cloud Console"
            elif 'quota' in error_message:
                return True, "Valid API key (quota exceeded)"
            elif 'rate' in error_message:
                return True, "Valid API key (rate limited)"
            else:
                print(f"Nano Banana validation error: {type(e).__name__}: {str(e)}")
                return False, f"Validation failed: {str(e)[:100]}"

    def validate_veo_key(self, api_key: str) -> Tuple[bool, str]:
        """
        Validate VEO (Video Generation) API key.

        Educational Note: This tests if the API key is valid and enabled for
        VEO 2.0 video generation model. We use minimal settings for fastest test.

        Args:
            api_key: The Google API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not api_key or api_key == '':
            return False, "API key is empty"

        try:
            # Create client with the provided key
            client = genai.Client(
                http_options={"api_version": "v1beta"},
                api_key=api_key
            )

            MODEL = "veo-2.0-generate-001"

            # Minimal config for fastest test
            video_config = types.GenerateVideosConfig(
                aspect_ratio="16:9",
                number_of_videos=1,
                duration_seconds=5,  # Minimum duration for fastest test
                person_generation="ALLOW_ALL",
            )

            # Start video generation (we don't wait for completion, just check if it starts)
            operation = client.models.generate_videos(
                model=MODEL,
                prompt="Test video",
                config=video_config,
            )

            # If we get an operation object, the key is valid
            if operation:
                return True, "Valid VEO (Video Gen) API key"
            else:
                return False, "API did not accept video generation request"

        except Exception as e:
            error_message = str(e).lower()

            if 'api key not valid' in error_message or 'invalid' in error_message:
                return False, "Invalid API key"
            elif 'permission' in error_message or 'enabled' in error_message:
                return False, "Video generation API not enabled. Enable VEO API in Google Cloud Console"
            elif 'quota' in error_message:
                return True, "Valid API key (quota exceeded)"
            elif 'rate' in error_message:
                return True, "Valid API key (rate limited)"
            else:
                print(f"VEO validation error: {type(e).__name__}: {str(e)}")
                return False, f"Validation failed: {str(e)[:100]}"

    def validate_tavily_key(self, api_key: str) -> Tuple[bool, str]:
        """
        Validate Tavily API key by making a test search request.

        Educational Note: Tavily is a search API optimized for LLMs and RAG.
        We make a simple search request to verify the key works.

        Args:
            api_key: The Tavily API key to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not api_key or api_key == '':
            return False, "API key is empty"

        try:
            # Create Tavily client with the provided key
            tavily_client = TavilyClient(api_key=api_key)

            # Make a simple test search
            response = tavily_client.search("test", max_results=1)

            # If we get a response, the key is valid
            if response:
                return True, "Valid Tavily API key"
            else:
                return False, "API returned empty response"

        except Exception as e:
            error_message = str(e).lower()

            # Check for common error types
            if 'invalid' in error_message or 'unauthorized' in error_message or 'api key' in error_message:
                return False, "Invalid API key"
            elif 'quota' in error_message or 'limit' in error_message:
                return True, "Valid API key (quota exceeded)"
            elif 'rate' in error_message:
                return True, "Valid API key (rate limited)"
            else:
                print(f"Tavily validation error: {type(e).__name__}: {str(e)}")
                return False, f"Validation failed: {str(e)[:100]}"

    def validate_pinecone_key(self, api_key: str) -> Tuple[bool, str, Optional[Dict[str, str]]]:
        """
        Validate Pinecone API key and auto-create/check index.

        Educational Note: This validator does more than just test the API key.
        It also ensures a "growthxlearn" index exists for the application to use.
        If the index doesn't exist, it creates it automatically.

        Args:
            api_key: The Pinecone API key to validate

        Returns:
            Tuple of (is_valid, message, index_details)
            index_details contains: {'index_name': 'growthxlearn', 'region': 'us-east-1'}
        """
        if not api_key or api_key == '':
            return False, "API key is empty", None

        # Standard index configuration for the application
        INDEX_NAME = "growthxlearn"
        REGION = "us-east-1"
        CLOUD = "aws"

        try:
            # Create Pinecone client with the provided API key
            print(f"Creating Pinecone client...")
            pc = Pinecone(api_key=api_key)

            # Check if the index already exists
            print(f"Checking if index '{INDEX_NAME}' exists...")
            if pc.has_index(INDEX_NAME):
                print(f"Index '{INDEX_NAME}' already exists, using existing index")
                # Index exists, just return success
                index_details = {
                    'index_name': INDEX_NAME,
                    'region': REGION
                }
                return True, f"Valid Pinecone API key (using existing index '{INDEX_NAME}')", index_details
            else:
                # Index doesn't exist, create it
                print(f"Index '{INDEX_NAME}' not found, creating new index...")
                pc.create_index(
                    name=INDEX_NAME,
                    vector_type="dense",
                    dimension=1536,  # Standard for OpenAI embeddings
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud=CLOUD,
                        region=REGION
                    ),
                    deletion_protection="disabled",
                    tags={
                        "environment": "development",
                        "created_by": "localmind"
                    }
                )

                # Wait for the index to be ready (with timeout)
                print(f"Waiting for index '{INDEX_NAME}' to be ready...")
                max_wait_time = 60  # seconds
                start_time = time.time()

                while time.time() - start_time < max_wait_time:
                    try:
                        # Check index status
                        index_list = pc.list_indexes()
                        for idx in index_list:
                            if idx['name'] == INDEX_NAME and idx.get('status', {}).get('ready', False):
                                print(f"Index '{INDEX_NAME}' is ready!")
                                index_details = {
                                    'index_name': INDEX_NAME,
                                    'region': REGION
                                }
                                return True, f"Valid Pinecone API key (created index '{INDEX_NAME}')", index_details

                        # Wait a bit before checking again
                        time.sleep(2)
                    except Exception as e:
                        print(f"Error checking index status: {e}")
                        time.sleep(2)

                # If we get here, index creation timed out but might still succeed
                # Return success anyway since the API key is valid
                index_details = {
                    'index_name': INDEX_NAME,
                    'region': REGION
                }
                return True, f"Valid Pinecone API key (index '{INDEX_NAME}' is being created)", index_details

        except Exception as e:
            error_message = str(e).lower()

            # Check for common error types
            if 'invalid' in error_message or 'unauthorized' in error_message or 'api key' in error_message:
                return False, "Invalid API key", None
            elif 'quota' in error_message or 'limit' in error_message:
                return False, "API key valid but quota/limit exceeded", None
            elif 'rate' in error_message:
                return True, "Valid API key (rate limited)", {'index_name': INDEX_NAME, 'region': REGION}
            else:
                print(f"Pinecone validation error: {type(e).__name__}: {str(e)}")
                return False, f"Validation failed: {str(e)[:100]}", None