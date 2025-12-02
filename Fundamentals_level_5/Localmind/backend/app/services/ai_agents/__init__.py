"""
AI Agents - Complex AI agents with agentic loops.

Educational Note: This folder contains AI agents that use tool loops
and multiple API calls to complete complex tasks. Unlike ai_services
(single API call), these agents iterate until a termination condition.

Agents:
- web_agent_service: Extracts content from URLs using web tools
  - Uses agentic loop with MAX_ITERATIONS limit
  - Tools: web_fetch, web_search, tavily_search, return_search_result
  - Saves execution logs for debugging

- email_agent_service: Generates HTML email templates
  - Uses agentic loop with MAX_ITERATIONS limit (15)
  - Tools: plan_email_template, generate_email_image, write_email_code
  - Orchestrates planning → image generation → HTML code writing

Key patterns:
- Agent loop with iteration limit
- Tool executor for routing tool calls
- Termination tool to signal completion
- Execution logging for debugging
"""
from app.services.ai_agents.web_agent_service import web_agent_service
from app.services.ai_agents.email_agent_service import email_agent_service

__all__ = ["web_agent_service", "email_agent_service"]
