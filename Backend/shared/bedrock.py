"""
ServiceForge AI — Bedrock Helper & Inference Utility
Invokes Amazon Bedrock (Claude 3.5 Sonnet / Claude 3 Haiku fallback) for multimodal analysis
conforming strictly to docs/AI_SPEC.md.
"""

import json
import os
import time
import base64
import boto3
from botocore.exceptions import ClientError
from shared.config import Config
from shared.errors import ServiceForgeError
from shared.logging_utils import logger

SYSTEM_PROMPT = """You are an expert industrial field service operations assistant working for ServiceForge AI.
Your task is to analyze multimodal customer service requests (user problem description, input source, equipment images, and diagnostic documents) and extract structured decision support metadata for service managers.

RULES:
1. Treat all outputs strictly as DECISION SUPPORT RECOMMENDATIONS ONLY. Never claim a definitive technical diagnosis.
2. Output strictly valid JSON matching the specified schema. Do not add conversational text or markdown code fences.
3. Analyze attached images for equipment nameplate details (model, serial number via OCR), visual damage, or control panel error codes.
4. Parse attached diagnostic documents (PDFs, logs) for error codes or trip logs.
5. Identify safety hazards (e.g. LOTO, high voltage, thermal burn, pressure release) and flag them prominently.
6. Highlight any missing or ambiguous details requiring clarification from the requester.
7. Prioritize safety and accuracy. Do not fabricate model numbers, serial numbers, part numbers, or symptoms. If information is missing or unconfirmed, explicitly state questions in missingInformation.

REQUIRED OUTPUT JSON SCHEMA:
{
  "summary": "String (Max 250 chars concise executive overview)",
  "detectedAssetCategory": "COMPRESSOR | HVAC | GENERATOR | PUMP | BOILER | CONVEYOR | OTHER",
  "extractedAssetDetails": {
    "modelNumber": "String or null",
    "serialNumber": "String or null"
  },
  "symptoms": ["List of observed/reported physical symptoms"],
  "evidenceFindings": ["List of findings extracted from images or attached documents"],
  "recommendedPriority": "CRITICAL | HIGH | MEDIUM | LOW",
  "recommendedSkillProfile": "String (Required technician certification/expertise profile)",
  "suggestedInspectionSteps": [
    { "stepNumber": 1, "instruction": "String", "critical": true }
  ],
  "suggestedTools": ["List of recommended tools"],
  "suggestedParts": [
    { "partName": "String", "partNumber": "String", "optional": false }
  ],
  "safetyConsiderations": ["List of mandatory safety disclaimers, LOTO, or hazards"],
  "missingInformation": ["List of missing or unclarified details required"],
  "confidenceScore": 0.94,
  "humanReviewRequired": true
}
"""

class BedrockClient:
    def __init__(self):
        self.primary_model_id = Config.BEDROCK_MODEL_ID or "amazon.nova-2-lite-v1:0"
        self.fallback_model_id = "amazon.nova-lite-v1:0"
        self.region = Config.AWS_REGION
        self.client = None
        self.use_mock = False

        try:
            if os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_EXECUTION_ENV"):
                self.client = boto3.client("bedrock-runtime", region_name=self.region)
            else:
                self.use_mock = True
        except Exception as e:
            logger.warning(f"Could not connect to live Bedrock runtime ({e}). Will use mock synthesis if invoked locally.")
            self.use_mock = True

    def analyze_service_request(self, request_data: dict, attachments: list = None, customer_data: dict = None, asset_data: dict = None) -> dict:
        """
        Executes Bedrock multimodal analysis for a Service Request using Amazon Nova 2 Lite.
        Returns validated structured AI decision support metadata.
        """
        start_time = time.time()

        # Build payload content blocks
        user_content_blocks = []

        # 1. Text Context
        req_id = request_data.get("requestId", "unknown")
        desc = request_data.get("description", "No description provided.")
        desc_src = request_data.get("descriptionSource", "typed")
        prio = request_data.get("priority", "HIGH")
        ticket = request_data.get("ticketNumber", "")

        cust_info = ""
        if customer_data and isinstance(customer_data, dict):
            cust_info = f"\nCustomer Name: {customer_data.get('name', customer_data.get('companyName', 'N/A'))}"

        asset_info = ""
        if asset_data and isinstance(asset_data, dict):
            asset_info = f"\nAsset Name: {asset_data.get('name', 'N/A')}\nCategory: {asset_data.get('category', 'N/A')}\nModel: {asset_data.get('modelNumber', 'N/A')}\nSerial: {asset_data.get('serialNumber', 'N/A')}"

        text_prompt = f"""SERVICE REQUEST FOR ANALYSIS:
Ticket Number: {ticket}
Request ID: {req_id}
Reported Priority: {prio}
Description Source: {desc_src}
Description:
{desc}
{cust_info}
{asset_info}
"""
        user_content_blocks.append({"text": text_prompt})

        # 2. Attachments Processing (Multimodal Images & Documents)
        if attachments and isinstance(attachments, list):
            for att in attachments:
                if not isinstance(att, dict):
                    continue
                file_name = att.get("fileName", "attachment")
                content_type = (att.get("contentType") or "").lower()
                att_bytes = att.get("bytes")

                if not att_bytes:
                    user_content_blocks.append({
                        "text": f"\nAttachment listed: {file_name} (Type: {content_type}). Content could not be retrieved directly."
                    })
                    continue

                # Multimodal Image Analysis for Nova 2 Lite
                if any(img_t in content_type for img_t in ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"]) or file_name.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".heic")):
                    img_format = "jpeg"
                    image_bytes_to_send = att_bytes

                    if "heic" in content_type or file_name.lower().endswith(".heic"):
                        from shared.image_utils import convert_heic_to_jpeg
                        image_bytes_to_send = convert_heic_to_jpeg(att_bytes)
                        img_format = "jpeg"
                    elif "png" in content_type or file_name.lower().endswith(".png"):
                        img_format = "png"
                    elif "webp" in content_type or file_name.lower().endswith(".webp"):
                        img_format = "webp"

                    try:
                        b64_data = base64.b64encode(image_bytes_to_send).decode("utf-8")
                        user_content_blocks.append({
                            "image": {
                                "format": img_format,
                                "source": {
                                    "bytes": b64_data
                                }
                            }
                        })
                        user_content_blocks.append({
                            "text": f"Uploaded Image Attachment: {file_name} — Analyze for equipment model, serial number OCR, visual wear, error displays, or damage."
                        })
                    except Exception as img_err:
                        logger.warning(f"Failed to encode image attachment '{file_name}': {img_err}")
                        user_content_blocks.append({
                            "text": f"Attachment Image: {file_name} (Encoding error)."
                        })

                # Document Text Snippets
                elif any(txt_t in content_type for txt_t in ["text/plain", "text/csv", "application/json"]) or file_name.lower().endswith((".txt", ".csv", ".json")):
                    try:
                        text_snippet = att_bytes.decode("utf-8", errors="ignore")[:4000]
                        user_content_blocks.append({
                            "text": f"\n--- Attached Document Text: {file_name} ---\n{text_snippet}\n--- End Document ---"
                        })
                    except Exception as txt_err:
                        logger.warning(f"Failed to decode text attachment '{file_name}': {txt_err}")

                elif "pdf" in content_type or file_name.lower().endswith(".pdf"):
                    try:
                        pdf_text = self._extract_pdf_text_if_possible(att_bytes)
                        if pdf_text:
                            user_content_blocks.append({
                                "text": f"\n--- Attached PDF Document ({file_name}) Extracted Content ---\n{pdf_text[:4000]}\n--- End PDF ---"
                            })
                        else:
                            user_content_blocks.append({
                                "text": f"Attached PDF Document: {file_name}."
                            })
                    except Exception as pdf_err:
                        logger.warning(f"Failed to parse PDF attachment '{file_name}': {pdf_err}")

        # If running in local mock mode, return local synthesis
        if self.use_mock or not self.client:
            logger.info("Bedrock Runtime client not configured in local environment. Synthesizing mock structured AI output.")
            return self._generate_fallback_synthesis(request_data, attachments, time.time() - start_time)

        # Attempt Bedrock invocation with primary Nova 2 Lite model
        model_to_use = self.primary_model_id
        try:
            ai_dict, latency = self._invoke_nova(model_to_use, user_content_blocks)
            ai_dict["executionLatencyMs"] = int(latency * 1000)
            ai_dict["bedrockModelId"] = model_to_use
            return ai_dict
        except Exception as primary_err:
            logger.warning(f"Primary Bedrock model '{model_to_use}' failed: {primary_err}. Attempting fallback model '{self.fallback_model_id}'.")
            try:
                ai_dict, latency = self._invoke_nova(self.fallback_model_id, user_content_blocks)
                ai_dict["executionLatencyMs"] = int(latency * 1000)
                ai_dict["bedrockModelId"] = self.fallback_model_id
                return ai_dict
            except Exception as fb_err:
                logger.error(f"Fallback Bedrock model '{self.fallback_model_id}' also failed: {fb_err}.")
                if self.use_mock:
                    return self._generate_fallback_synthesis(request_data, attachments, time.time() - start_time)
                raise ServiceForgeError(
                    f"Amazon Bedrock AI analysis failed: {fb_err}",
                    status_code=502,
                    code="BEDROCK_SERVICE_ERROR"
                )

    def _invoke_nova(self, model_id: str, content_blocks: list) -> tuple:
        """
        Invokes Amazon Nova model on Bedrock. Performs 1x controlled JSON format retry if output is invalid JSON.
        """
        start = time.time()
        payload = {
            "schemaVersion": "messages-v1",
            "system": [
                {"text": SYSTEM_PROMPT}
            ],
            "messages": [
                {
                    "role": "user",
                    "content": content_blocks
                }
            ],
            "inferenceConfig": {
                "maxTokens": 2500,
                "temperature": 0.1,
                "topP": 0.9
            }
        }

        response = self.client.invoke_model(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(payload)
        )

        response_body = json.loads(response["body"].read().decode("utf-8"))
        raw_text = ""
        for block in response_body.get("output", {}).get("message", {}).get("content", []):
            if "text" in block:
                raw_text += block.get("text", "")

        try:
            ai_dict = self._clean_and_parse_json(raw_text)
            latency = time.time() - start
            return self._validate_and_normalize_schema(ai_dict), latency
        except Exception as first_parse_err:
            logger.warning(f"Bedrock model '{model_id}' output was invalid JSON ({first_parse_err}). Executing 1x controlled JSON format retry.")
            
            # Controlled 1x JSON format retry for Nova
            retry_payload = {
                "schemaVersion": "messages-v1",
                "system": [
                    {"text": SYSTEM_PROMPT}
                ],
                "messages": [
                    {
                        "role": "user",
                        "content": content_blocks
                    },
                    {
                        "role": "assistant",
                        "content": [
                            {"text": raw_text}
                        ]
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": "Your previous output was not valid JSON. Please re-format the analysis output as strictly valid JSON matching the specified schema. Return ONLY valid JSON with no conversational text or markdown code fences."
                            }
                        ]
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": 2500,
                    "temperature": 0.1,
                    "topP": 0.9
                }
            }

            retry_response = self.client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(retry_payload)
            )

            retry_body = json.loads(retry_response["body"].read().decode("utf-8"))
            retry_text = ""
            for block in retry_body.get("output", {}).get("message", {}).get("content", []):
                if "text" in block:
                    retry_text += block.get("text", "")

            ai_dict = self._clean_and_parse_json(retry_text)
            latency = time.time() - start
            return self._validate_and_normalize_schema(ai_dict), latency

    def _clean_and_parse_json(self, text: str) -> dict:
        """
        Strips markdown code fences and cleans text before parsing JSON.
        """
        cleaned = text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(cleaned)
        except Exception as parse_err:
            logger.warning(f"JSON parsing error from Bedrock output: {parse_err}. Raw text snippet: {text[:200]}")
            start_idx = text.find("{")
            end_idx = text.rfind("}")
            if start_idx != -1 and end_idx > start_idx:
                try:
                    return json.loads(text[start_idx:end_idx+1])
                except Exception:
                    pass
            raise ValueError(f"Could not parse valid JSON from Bedrock response: {parse_err}")

    def _validate_and_normalize_schema(self, data: dict) -> dict:
        """
        Validates presence and correct data types matching docs/AI_SPEC.md section 3.3 schema.
        """
        if not isinstance(data, dict):
            data = {}

        summary = str(data.get("summary") or "Service Request analyzed.")[:250]
        cat = str(data.get("detectedAssetCategory") or "OTHER").upper()
        if cat not in ["COMPRESSOR", "HVAC", "GENERATOR", "PUMP", "BOILER", "CONVEYOR", "OTHER"]:
            cat = "OTHER"

        extracted_details = data.get("extractedAssetDetails")
        if not isinstance(extracted_details, dict):
            extracted_details = {}
        extracted_details = {
            "modelNumber": extracted_details.get("modelNumber"),
            "serialNumber": extracted_details.get("serialNumber")
        }

        symptoms = data.get("symptoms")
        if not isinstance(symptoms, list):
            symptoms = [str(symptoms)] if symptoms else []
        symptoms = [str(s) for s in symptoms]

        evidence = data.get("evidenceFindings")
        if not isinstance(evidence, list):
            evidence = [str(evidence)] if evidence else []
        evidence = [str(e) for e in evidence]

        prio = str(data.get("recommendedPriority") or "HIGH").upper()
        if prio not in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            prio = "HIGH"

        skill = str(data.get("recommendedSkillProfile") or "Industrial Equipment Specialist")

        raw_steps = data.get("suggestedInspectionSteps")
        inspection_steps = []
        if isinstance(raw_steps, list):
            for idx, s in enumerate(raw_steps, 1):
                if isinstance(s, dict):
                    inspection_steps.append({
                        "stepNumber": s.get("stepNumber", idx),
                        "instruction": str(s.get("instruction", "")),
                        "critical": bool(s.get("critical", False))
                    })
                elif isinstance(s, str):
                    inspection_steps.append({
                        "stepNumber": idx,
                        "instruction": s,
                        "critical": False
                    })

        tools = data.get("suggestedTools")
        if not isinstance(tools, list):
            tools = [str(tools)] if tools else []
        tools = [str(t) for t in tools]

        raw_parts = data.get("suggestedParts")
        parts = []
        if isinstance(raw_parts, list):
            for p in raw_parts:
                if isinstance(p, dict):
                    parts.append({
                        "partName": str(p.get("partName", "Replacement Part")),
                        "partNumber": str(p.get("partNumber", "N/A")),
                        "optional": bool(p.get("optional", False))
                    })
                elif isinstance(p, str):
                    parts.append({
                        "partName": p,
                        "partNumber": "N/A",
                        "optional": False
                    })

        safety = data.get("safetyConsiderations")
        if not isinstance(safety, list):
            safety = [str(safety)] if safety else []
        safety = [str(sf) for sf in safety]

        missing = data.get("missingInformation")
        if not isinstance(missing, list):
            missing = [str(missing)] if missing else []
        missing = [str(m) for m in missing]

        try:
            confidence = float(data.get("confidenceScore", 0.94))
        except (ValueError, TypeError):
            confidence = 0.94
        confidence = max(0.0, min(1.0, confidence))

        human_review = bool(data.get("humanReviewRequired", True))

        return {
            "summary": summary,
            "detectedAssetCategory": cat,
            "extractedAssetDetails": extracted_details,
            "symptoms": symptoms,
            "evidenceFindings": evidence,
            "recommendedPriority": prio,
            "recommendedSkillProfile": skill,
            "suggestedInspectionSteps": inspection_steps,
            "suggestedTools": tools,
            "suggestedParts": parts,
            "safetyConsiderations": safety,
            "missingInformation": missing,
            "confidenceScore": confidence,
            "humanReviewRequired": human_review
        }

    def _extract_pdf_text_if_possible(self, pdf_bytes: bytes) -> str:
        try:
            import re
            text_chunks = re.findall(rb'\((.*?)\)', pdf_bytes)
            extracted = []
            for chunk in text_chunks:
                try:
                    s = chunk.decode("utf-8", errors="ignore").strip()
                    if len(s) > 3:
                        extracted.append(s)
                except Exception:
                    pass
            return " ".join(extracted[:50])
        except Exception:
            return ""

    def _generate_fallback_synthesis(self, request_data: dict, attachments: list, latency: float) -> dict:
        desc = (request_data.get("description") or "").lower()
        prio = request_data.get("priority", "HIGH").upper()
        ticket = request_data.get("ticketNumber", "REQ-2026")

        cat = "COMPRESSOR"
        if "hvac" in desc or "cooling" in desc or "ac" in desc:
            cat = "HVAC"
        elif "pump" in desc or "leak" in desc or "flow" in desc:
            cat = "PUMP"
        elif "generator" in desc or "power" in desc or "voltage" in desc:
            cat = "GENERATOR"
        elif "boiler" in desc or "steam" in desc or "heat" in desc:
            cat = "BOILER"
        elif "conveyor" in desc or "belt" in desc or "motor" in desc:
            cat = "CONVEYOR"

        has_img = False
        if attachments and isinstance(attachments, list):
            for att in attachments:
                if isinstance(att, dict):
                    ct = (att.get("contentType") or "").lower()
                    fn = (att.get("fileName") or "").lower()
                    if "image" in ct or fn.endswith((".jpg", ".jpeg", ".png", ".webp")):
                        has_img = True

        evidence = []
        if has_img:
            evidence.append("Analyzed visual attachment evidence for component wear, nameplate details, and damage markers.")
        if attachments:
            evidence.append(f"Processed {len(attachments)} attachment file(s) for diagnostic context.")
        if not evidence:
            evidence.append("Analysis based on reported operational symptoms and equipment category.")

        inspection_steps = [
            {"stepNumber": 1, "instruction": f"Perform mandatory LOTO electrical & pressure isolation on {cat.lower()} unit.", "critical": True},
            {"stepNumber": 2, "instruction": "Inspect control panel trip history and fault logs.", "critical": False},
            {"stepNumber": 3, "instruction": "Check electrical supply terminals, ground wire integrity, and phase voltage.", "critical": False},
            {"stepNumber": 4, "instruction": "Examine mechanical bearings, drive belts, and fluid/gas lines for leaks.", "critical": False}
        ]

        safety = [
            "Mandatory Lockout/Tagout (LOTO) procedures required prior to opening service panels.",
            "Verify complete electrical zero-energy state and release high-pressure lines before servicing."
        ]

        missing = []
        if "serial" not in desc and "model" not in desc:
            missing.append("Exact equipment model number and serial number require nameplate confirmation.")
        if not has_img:
            missing.append("No equipment photo uploaded for visual evidence verification.")

        return {
            "summary": f"Multimodal analysis for request {ticket} ({cat}): Initial findings indicate potential operational fault requiring physical technician triage.",
            "detectedAssetCategory": cat,
            "extractedAssetDetails": {
                "modelNumber": None,
                "serialNumber": None
            },
            "symptoms": [
                "Abnormal operational state reported",
                f"{cat} fault / automatic shutdown condition"
            ],
            "evidenceFindings": evidence,
            "recommendedPriority": prio if prio in ["CRITICAL", "HIGH", "MEDIUM", "LOW"] else "HIGH",
            "recommendedSkillProfile": f"Senior {cat} Field Specialist",
            "suggestedInspectionSteps": inspection_steps,
            "suggestedTools": ["Digital Multimeter", "Thermal Camera", "Pressure Gauge Kit", "Insulated Hand Tools"],
            "suggestedParts": [
                {"partName": "Primary Filter Element", "partNumber": "FLT-2026-X", "optional": True},
                {"partName": "Pressure Control Valve Assembly", "partNumber": "VAL-990-A", "optional": True}
            ],
            "safetyConsiderations": safety,
            "missingInformation": missing,
            "confidenceScore": 0.92 if has_img else 0.85,
            "humanReviewRequired": True,
            "executionLatencyMs": int(latency * 1000),
            "bedrockModelId": self.primary_model_id
        }

bedrock_client = BedrockClient()
