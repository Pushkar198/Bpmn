import os
import re
import asyncio
import json
from dotenv import load_dotenv
from autogen_agentchat.agents import AssistantAgent, UserProxyAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.ui import Console
from autogen_agentchat.conditions import TextMentionTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient

# === Load environment variables ===
load_dotenv()

# === Azure OpenAI Client Setup ===
# model_client = OpenAIChatCompletionClient(
#     base_url=os.getenv('AZURE_OPENAI_BASE_URL'),
#     model=os.getenv('AZURE_OPENAI_MODEL_NAME'),
#     model_info={
#         "json_output": False,
#         "function_calling": True,
#         "vision": False,
#         "structured_output": False,
#         "family": "gpt-4",
#     },
#     api_key=os.getenv('AZURE_OPENAI_API_KEY'),
# )

# # === Agents ===

# user_proxy = UserProxyAgent(
#     name="User_proxy",
#     description="Starts the process and stops once valid JSON is generated."
# )

# json_generator = AssistantAgent(
#     name="JsonGeneratorAgent",
#     model_client=model_client,
#     description="""
# This agent extracts a structured JSON representation of a process from a meeting transcript. 
# """,
#     system_message="""
# You are a process analyst. Based on the meeting transcript, generate a structured JSON that reflects the key tasks and responsibilities discussed.

# Example fields include:
# - department
# - task
# - organization
# - time_taken
# - parent_process
# - child_process

# If a value is not present, use "NA". If additional fields are clearly needed based on the conversation, include them.

# Output only a valid JSON array. Do not include any explanation or other text.
# """
# )

# json_validator = AssistantAgent(
#     name="JsonValidatorAgent",
#     model_client=model_client,
#     description="""
# This agent validates the structure and logic of the JSON output by JsonGeneratorAgent. 
# It confirms whether the JSON is consistent with the transcript. If valid, reply with 'TERMINATE'. 
# Otherwise, provide brief feedback for corrections and return it to JsonGeneratorAgent.
# """,
#     system_message="""
# You validate the structured JSON generated from the transcript. Check whether:
# - Each entry is relevant to the transcript
# - Fields are populated meaningfully or marked as "NA" if absent
# - JSON syntax is valid

# If the JSON is correct and consistent with the transcript, respond with "Valid JSON. TERMINATE".

# If it's not valid, respond with what is wrong (e.g., missing fields, misinterpreted task, etc.), and return it to JsonGeneratorAgent.

# Do not generate or modify the JSON yourself.
# """
# )

# # === Selector Group Chat Setup ===

# selector_prompt = """Choose the next agent to continue the task:

# {roles}

# Conversation so far:
# {history}

# Select one agent from {participants} to proceed.
# """

# team = SelectorGroupChat(
#     [user_proxy, json_generator, json_validator],
#     model_client=model_client,
#     termination_condition=TextMentionTermination("TERMINATE"),
#     selector_prompt=selector_prompt,
#     allow_repeated_speaker=True,
# )

# # === Transcript to Trigger Generation ===

# transcript1 = """
# Meeting Transcript:
# HR: After hiring is confirmed, I initiate the onboarding process by sending a welcome email and scheduling the orientation session. I also upload the employee details to the HRMS system.

# HR: If the employee is a remote hire, I notify IT to ship the laptop and accessories to their address. Otherwise, I request IT to prepare the workstation in the office.

# IT: Once I receive the notification, I create system credentials, assign email, and configure access rights. In parallel, I prepare the required hardware.

# Compliance: I verify whether the employee has completed all mandatory background checks. If not, I flag it to HR for follow-up. If everything is cleared, I upload the verification status to the HRMS.

# HR: I cross-check the compliance report. If any check is pending after 3 days, I escalate the issue to the compliance head.

# Manager: Once IT and compliance tasks are completed, I receive a system alert. Then, I assign a team buddy, add the employee to the department communication groups, and share the 30-60-90 day goals.

# Learning & Development (L&D): After the orientation date is confirmed, I enroll the employee in the mandatory training modules and assign a learning path based on their role.

# HR: After the first week, I trigger a feedback form to the new employee and their manager to ensure onboarding satisfaction.

# ---

# Extract structured process information from the transcript and represent it as a valid JSON.

# The fields used can vary depending on the transcript, but typically include:
# - department
# - task
# - organization
# - time_taken
# - parent_process
# - child_process

# Use "NA" if a value is not mentioned. If other fields seem required based on the conversation, include them.
# """

# # === Launch the Conversation ===

# # async def generate_json_main(transcript):
# #     Response = await Console(team.run_stream(task=transcript))
# #     second_last_message = Response.messages[-2].content
# #     # json_match = re.search(r'```json\s*(.*?)\s*```', second_last_message, re.DOTALL)
# #     json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', second_last_message, re.DOTALL)

# #     if json_match:
# #         json_str = json_match.group(1).strip()  # Clean up leading/trailing whitespace
# #         structured_data = json.loads(json_str)  # Now it's a proper Python list/dict
# #         print("response:*************************************************", type (structured_data))
# #         return(structured_data)
# #     else:
# #         return {"error": "No valid JSON found in the response."}

# async def generate_json_main(transcript):
#     Response = await Console(team.run_stream(task=transcript))

#     # Scan the last 2–3 messages in reverse, as valid output could be in any of them
#     messages = Response.messages[-3:] if len(Response.messages) >= 3 else Response.messages

#     for msg in reversed(messages):
#         content = msg.content.strip()

#         # Try extracting from a fenced block
#         json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
#         if json_match:
#             try:
#                 json_str = json_match.group(1).strip()
#                 structured_data = json.loads(json_str)
#                 print("✅ Extracted from fenced block:", structured_data)
#                 return structured_data
#             except json.JSONDecodeError as e:
#                 print("⚠️ JSON decode failed from fenced block:", e)

#         # Try parsing entire message as JSON
#         try:
#             structured_data = json.loads(content)
#             print("✅ Extracted from raw content:", structured_data)
#             return structured_data
#         except json.JSONDecodeError:
#             continue

#     return {"error": "No valid JSON found in the response."}
   

# # if __name__ == "__main__":
    
# #     print ("##################################\n",asyncio.run(generate_json_main(transcript1)))

async def generate_json_main(transcript):
    # Create model client inside the current event loop
    model_client = OpenAIChatCompletionClient(
        base_url=os.getenv('AZURE_OPENAI_BASE_URL'),
        model=os.getenv('AZURE_OPENAI_MODEL_NAME'),
        model_info={
            "json_output": False,
            "function_calling": True,
            "vision": False,
            "structured_output": False,
            "family": "gpt-4",
        },
        api_key=os.getenv('AZURE_OPENAI_API_KEY'),
    )

    user_proxy = UserProxyAgent(
        name="User_proxy",
        description="Starts the process and stops once valid JSON is generated."
    )

    json_generator = AssistantAgent(
        name="JsonGeneratorAgent",
        model_client=model_client,
        description="This agent extracts a structured JSON representation of a process from a meeting transcript.",
        system_message="""
You are a process analyst. Based on the meeting transcript, generate a structured JSON that reflects the key tasks and responsibilities discussed.

Example fields include:
- department
- task
- organization
- time_taken
- parent_process
- child_process

If a value is not present, use "NA". If additional fields are clearly needed based on the conversation, include them.

Output only a valid JSON array. Do not include any explanation or other text.
"""
    )

    json_validator = AssistantAgent(
        name="JsonValidatorAgent",
        model_client=model_client,
        description="This agent validates the structure and logic of the JSON output by JsonGeneratorAgent.",
        system_message="""
You validate the structured JSON generated from the transcript. Check whether:
- Each entry is relevant to the transcript
- Fields are populated meaningfully or marked as "NA" if absent
- JSON syntax is valid

If the JSON is correct and consistent with the transcript, respond with "Valid JSON. TERMINATE".

If it's not valid, respond with what is wrong (e.g., missing fields, misinterpreted task, etc.), and return it to JsonGeneratorAgent.

Do not generate or modify the JSON yourself.
"""
    )

    selector_prompt = """Choose the next agent to continue the task:

{roles}

Conversation so far:
{history}

Select one agent from {participants} to proceed.
"""

    team = SelectorGroupChat(
        [user_proxy, json_generator, json_validator],
        model_client=model_client,
        termination_condition=TextMentionTermination("TERMINATE"),
        selector_prompt=selector_prompt,
        allow_repeated_speaker=True,
    )

    # Run the team conversation
    Response = await Console(team.run_stream(task=transcript))

    # Try extracting JSON from last few messages
    messages = Response.messages[-3:] if len(Response.messages) >= 3 else Response.messages

    for msg in reversed(messages):
        content = msg.content.strip()

        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
        if json_match:
            try:
                json_str = json_match.group(1).strip()
                structured_data = json.loads(json_str)
                print("✅ Extracted from fenced block:", structured_data)
                return structured_data
            except json.JSONDecodeError as e:
                print("⚠️ JSON decode failed from fenced block:", e)

        try:
            structured_data = json.loads(content)
            print("✅ Extracted from raw content:", structured_data)
            return structured_data
        except json.JSONDecodeError:
            continue

    return {"error": "No valid JSON found in the response."}
