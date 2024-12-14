from typing import Dict, Any, List
from venv import logger
import openai
from django.conf import settings
import PyPDF2
import io
import re
import json
from .prompts import FEE_SYSTEM_PROMPT, ANALYSIS_PROMPT, FEE_CHAT_PROMPT, CHAT_CONTEXT_PROMPT

class FeeAnalyzer:
    """Fee's analysis engine for evaluating documents from a high-SES perspective."""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        openai.api_key = self.api_key

    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text content from PDF file"""
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()

    def analyze_document(self, pdf_file) -> Dict[str, Any]:
        """Main analysis method"""
        try:
            text = self.extract_text_from_pdf(pdf_file)
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            
            return self.get_analysis_from_openai(text)
        except PyPDF2.PdfReadError:
            raise ValueError("Invalid or corrupted PDF file")
        except Exception as e:
            raise ValueError(f"Error analyzing document: {str(e)}")

    def get_analysis_from_openai(self, text: str) -> Dict[str, Any]:
        """Get analysis from OpenAI"""
        # Truncate text if too long (OpenAI has token limits)
        max_length = 14000  # Approximate limit for GPT-4
        if len(text) > max_length:
            text = text[:max_length] + "..."

        messages = [
            {"role": "system", "content": FEE_SYSTEM_PROMPT},
            {"role": "user", "content": ANALYSIS_PROMPT.format(text=text)}
        ]

        response = openai.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
        )

        analysis_text = response.choices[0].message.content
        
        # Extract score and justification
        score_match = re.search(r'SCORE:\s*(\d*\.?\d+)', analysis_text)
        score = float(score_match.group(1)) if score_match else 0.5
        
        justification_match = re.search(r'JUSTIFICATION:\s*([^\n]+)', analysis_text)
        justification = justification_match.group(1) if justification_match else None
        
        # Extract access and literacy considerations
        access_match = re.search(r'ACCESS CONSIDERATIONS:\s*([^\n]+)', analysis_text)
        access_considerations = access_match.group(1) if access_match else None
        
        literacy_match = re.search(r'LITERACY REQUIREMENTS:\s*([^\n]+)', analysis_text)
        literacy_requirements = literacy_match.group(1) if literacy_match else None

        return {
            "overall_assessment": {
                "inclusivity_score": score,
                "score_justification": justification,
                "major_concerns": self._extract_concerns(analysis_text),
                "positive_aspects": self._extract_positives(analysis_text)
            },
            "fee_perspective": {
                "expectations": {
                    "technology_access": {
                        "perspective": "Expects latest devices and reliable high-speed internet",
                        "consideration": access_considerations or "Detailed access analysis not provided"
                    },
                    "technical_literacy": {
                        "perspective": "Comfortable with complex technical documentation",
                        "consideration": literacy_requirements or "Detailed literacy analysis not provided"
                    },
                    "risk_comfort": {
                        "perspective": "Highly comfortable exploring new features",
                        "consideration": self._extract_risk_considerations(analysis_text)
                    },
                    "control": {
                        "perspective": "Expects full control over technology",
                        "consideration": self._extract_control_considerations(analysis_text)
                    }
                },
                "recommendations": self._extract_fee_recommendations(analysis_text)
            },
            "facet_analysis": self._extract_all_facets(analysis_text),
            "raw_analysis": analysis_text
        }

    def get_fee_chat_response(self, user_message: str, analysis_context: Dict, conversation_history: List[Dict] = None) -> str:
        """Get Fee's response considering conversation history"""
        try:
            # Prepare the messages array
            messages = [
                {"role": "system", "content": FEE_CHAT_PROMPT},
                {"role": "user", "content": CHAT_CONTEXT_PROMPT.format(
                    analysis=json.dumps(analysis_context, indent=2),
                    message=user_message
                )}
            ]
            
            # Add conversation history if provided
            if conversation_history:
                for conv in conversation_history:
                    messages.append({
                        "role": "user" if not conv['is_fee'] else "assistant",
                        "content": conv['message']
                    })
            
            # Add current message
            messages.append({"role": "user", "content": user_message})

            # Make the API call
            response = openai.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )

            if not response.choices or len(response.choices) == 0:
                raise ValueError("No response received from OpenAI")
                
            fee_response = response.choices[0].message.content
            if not fee_response:
                raise ValueError("Empty response received from OpenAI")
                
            return fee_response

        except Exception as e:
            logger.error(f"Error getting Fee's response: {str(e)}")
            raise ValueError(f"Failed to get Fee's response: {str(e)}")

    def _extract_concerns(self, text: str) -> List[str]:
        """Extract major concerns from analysis text"""
        concerns_section = re.search(r'MAJOR CONCERNS:?(.*?)(?:\n\n|POSITIVE ASPECTS|\Z)', text, re.DOTALL)
        if concerns_section:
            concerns_text = concerns_section.group(1)
            # Extract bullet points or numbered items
            concerns = re.findall(r'(?:^|\n)\s*(?:[-•*]|\d+\.)\s*([^\n]+)', concerns_text)
            return [concern.strip() for concern in concerns if concern.strip()]
        return []

    def _extract_positives(self, text: str) -> List[str]:
        """Extract positive aspects from analysis text"""
        positives_section = re.search(r'POSITIVE ASPECTS:?(.*?)(?:\n\n|\Z)', text, re.DOTALL)
        if positives_section:
            positives_text = positives_section.group(1)
            # Extract bullet points or numbered items
            positives = re.findall(r'(?:^|\n)\s*(?:[-•*]|\d+\.)\s*([^\n]+)', positives_text)
            return [positive.strip() for positive in positives if positive.strip()]
        return []

    def _extract_risk_considerations(self, text: str) -> str:
        """Extract risk considerations from analysis"""
        risk_section = re.search(r'Risk & Exploration Requirements(.*?)(?:\n\n|\Z)', text, re.DOTALL)
        if risk_section:
            risks = re.findall(r'[-•*]\s*([^\n]+)', risk_section.group(1))
            return '; '.join(risks) if risks else "Risk analysis not provided"
        return "Risk analysis not provided"

    def _extract_control_considerations(self, text: str) -> str:
        """Extract control considerations from analysis"""
        control_section = re.search(r'Control & Authority Assumptions(.*?)(?:\n\n|\Z)', text, re.DOTALL)
        if control_section:
            controls = re.findall(r'[-•*]\s*([^\n]+)', control_section.group(1))
            return '; '.join(controls) if controls else "Control analysis not provided"
        return "Control analysis not provided"

    def _extract_fee_recommendations(self, text: str) -> List[str]:
        """Extract Fee's recommendations"""
        recommendations = []
        rec_patterns = [
            r"(?:Fee's )?recommendations?:?(.*?)(?:\n\n|\Z)",
            r"(?:Fee )?suggests?:?(.*?)(?:\n\n|\Z)",
            r"(?:Fee )?would recommend:?(.*?)(?:\n\n|\Z)"
        ]
        
        for pattern in rec_patterns:
            rec_section = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if rec_section:
                recs = re.findall(r'(?:^|\n)\s*(?:[-•*]|\d+\.)\s*([^\n]+)', rec_section.group(1))
                recommendations.extend([rec.strip() for rec in recs if rec.strip()])
        
        return recommendations

    def _extract_all_facets(self, text: str) -> Dict[str, Dict[str, Any]]:
        """Extract all facet analyses from the text"""
        facets = {
            "technology_access": "Technology Access & Reliability",
            "communication": "Technical Language & Complexity",
            "risk_assessment": "Risk & Exploration Requirements",
            "privacy_security": "Privacy & Security",
            "control_authority": "Control & Authority Assumptions",
            "education_culture": "Educational & Cultural Prerequisites"
        }
        
        result = {}
        for key, section_title in facets.items():
            section = re.search(f'{section_title}(.*?)(?=\n\n[a-zA-Z]|$)', text, re.DOTALL)
            if section:
                section_text = section.group(1)
                result[key] = {
                    "assumptions": self._extract_bullets(section_text, "assumptions"),
                    "potential_issues": self._extract_bullets(section_text, "issues|problems|barriers"),
                    "recommendations": self._extract_bullets(section_text, "recommendations|suggestions"),
                }
            else:
                result[key] = {
                    "assumptions": [],
                    "potential_issues": [],
                    "recommendations": []
                }
        
        return result

    def _extract_bullets(self, text: str, pattern: str) -> List[str]:
        """Extract bulleted or numbered items matching a pattern"""
        items = re.findall(rf'(?:^|\n)\s*(?:[-•*]|\d+\.)\s*(?:{pattern}:?\s*)?([^\n]+)', text, re.IGNORECASE)
        return [item.strip() for item in items if item.strip()]