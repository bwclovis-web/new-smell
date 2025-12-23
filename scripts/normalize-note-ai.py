#!/usr/bin/env python3
"""
CrewAI Note Normalization Script

Normalizes perfume notes to match database standards using CrewAI.
This script is called from TypeScript import scripts to standardize notes.

Usage:
    python scripts/normalize-note-ai.py temp_note.json
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from crewai import Agent, Task, Crew, Process
    from langchain_openai import ChatOpenAI
except ImportError:
    print("error", file=sys.stderr)
    sys.exit(1)

# Get project root
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class NoteNormalizationCrew:
    """CrewAI crew for normalizing perfume notes to database standards"""

    def __init__(self, model: str = "gpt-4o-mini"):
        """Initialize the crew with agents"""
        self.llm = ChatOpenAI(
            model=model,
            temperature=0.1,  # Low temperature for consistent normalization
        )

        # Perfume Expert Agent - understands perfume note terminology
        self.perfume_expert = Agent(
            role="Perfume Note Standardization Expert",
            goal="Normalize perfume notes to match database standards",
            backstory="""You are a master perfumer with 30 years of experience.
            You understand perfume note terminology and how to standardize note names
            to match existing database entries. You know that:
            - Notes should be lowercase
            - Common variations should be normalized (e.g., "vanilla bean" → "vanilla", 
              "rose petals" → "rose", "jasmine flower" → "jasmine")
            - Multi-word notes are valid when they represent distinct scents 
              (e.g., "black tea", "white birch wood", "motor oil")
            - You should match existing notes when possible rather than creating new ones
            - Standardize to the most common form used in perfumery""",
            llm=self.llm,
            verbose=False,
        )

        # Normalization Specialist Agent
        self.normalization_specialist = Agent(
            role="Note Normalization Specialist",
            goal="Match notes to existing database entries or create standardized versions",
            backstory="""You specialize in matching perfume notes to existing database entries.
            You understand that:
            - Exact matches should be preferred
            - Similar notes should be normalized to existing entries when appropriate
            - New notes should only be created when they represent truly distinct scents
            - Notes should be 1-5 words, lowercase, and follow perfumery conventions""",
            llm=self.llm,
            verbose=False,
        )

    def normalize_note(self, note: str, existing_notes: List[str]) -> str:
        """
        Normalize a note using CrewAI to match database standards
        
        Returns:
            Normalized note name (lowercase, standardized)
        """
        if not note or not note.strip():
            return ""

        note_lower = note.strip().lower()

        # First check for exact match
        if note_lower in [n.lower() for n in existing_notes]:
            # Return the existing note name (preserve original casing from DB)
            for existing in existing_notes:
                if existing.lower() == note_lower:
                    return existing.lower()

        # Task 1: Analyze and suggest normalization
        analyze_task = Task(
            description=f"""
            Analyze this perfume note: "{note}"
            
            Existing notes in database (for reference): {', '.join(existing_notes[:50])}
            
            Determine:
            1. Does this note match any existing note (exact or similar)?
            2. If yes, which existing note should it match?
            3. If no, what is the standardized version of this note?
            
            Rules:
            - Prefer matching to existing notes when appropriate
            - Standardize common variations:
              * "vanilla bean", "vanilla extract" → "vanilla"
              * "rose petals", "rose flower" → "rose"
              * "jasmine flower", "jasmine sambac" → "jasmine" (unless sambac is distinct)
              * "coconut oil", "fractionated coconut oil" → "coconut"
              * "sandalwood oil" → "sandalwood"
              * "patchouli leaf" → "patchouli"
            - Keep multi-word notes when they represent distinct scents:
              * "black tea", "white birch wood", "motor oil", "ice cream"
            - All notes should be lowercase
            - Notes should be 1-5 words
            
            Return JSON format:
            {{
                "normalized_note": "standardized note name",
                "matched_existing": true/false,
                "reasoning": "brief explanation"
            }}
            """,
            agent=self.perfume_expert,
            expected_output="JSON object with normalized_note, matched_existing, and reasoning fields",
        )

        # Task 2: Finalize normalization
        normalize_task = Task(
            description=f"""
            Based on the analysis, provide the final normalized note name for: "{note}"
            
            Return only the normalized note name (lowercase, 1-5 words).
            If it matches an existing note, use that exact name.
            If it's a new note, provide the standardized version.
            
            Examples:
            - "Vanilla Bean" → "vanilla"
            - "Rose Petals" → "rose"
            - "Black Tea" → "black tea" (if distinct from "tea")
            - "Ice Cream" → "ice cream" (multi-word is valid)
            - "Jasmine Sambac" → "jasmine sambac" (if sambac is a distinct variety)
            
            Return only the normalized note name as a string, nothing else.
            """,
            agent=self.normalization_specialist,
            expected_output="Normalized note name as a string",
        )

        # Create crew
        crew = Crew(
            agents=[self.perfume_expert, self.normalization_specialist],
            tasks=[analyze_task, normalize_task],
            process=Process.sequential,
            verbose=False,
        )

        # Execute
        try:
            result = crew.kickoff()

            # Parse result - CrewAI returns a string
            result_text = str(result).strip()

            # Try to extract JSON first
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                try:
                    result_json = json.loads(json_match.group())
                    normalized = result_json.get("normalized_note", note_lower)
                    return normalized.lower().strip()
                except json.JSONDecodeError:
                    pass

            # If no JSON, try to extract just the note name
            # Remove common prefixes/suffixes
            result_text = re.sub(r'^normalized[_\s]*note[:\s]*', '', result_text, flags=re.IGNORECASE)
            result_text = re.sub(r'^note[:\s]*', '', result_text, flags=re.IGNORECASE)
            result_text = result_text.strip().strip('"').strip("'")

            # If it looks like a valid note (letters, spaces, hyphens, apostrophes)
            if re.match(r'^[a-z\s\-\']+$', result_text, re.IGNORECASE):
                return result_text.lower().strip()

            # Fallback to lowercase trimmed version
            return note_lower

        except Exception as e:
            # On error, return normalized lowercase version
            return note_lower


def main():
    if len(sys.argv) < 2:
        print("error", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print("error", file=sys.stderr)
        sys.exit(1)

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        note = data.get("note", "")
        existing_notes = data.get("existingNotes", [])

        if not note:
            print("error", file=sys.stderr)
            sys.exit(1)

        # Initialize crew
        crew = NoteNormalizationCrew()

        # Normalize note
        normalized = crew.normalize_note(note, existing_notes)

        # Output the normalized note
        print(normalized)

    except Exception as e:
        print("error", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

