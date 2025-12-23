#!/usr/bin/env python3
"""
AI-Powered Note Extraction Script using CrewAI

This script handles complex phrase extraction that the rule-based JavaScript script
might miss. It uses CrewAI agents to intelligently extract notes from ambiguous phrases.

Usage:
    python scripts/clean-notes-ai.py --dry-run                    # Preview changes
    python scripts/clean-notes-ai.py --input ambiguous-notes.json  # Process specific notes
    python scripts/clean-notes-ai.py --all                         # Process all ambiguous notes
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Union
from dotenv import load_dotenv

# Set UTF-8 encoding for stdout on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
load_dotenv()

try:
    from crewai import Agent, Task, Crew, Process
    from langchain_openai import ChatOpenAI
except ImportError:
    print("❌ CrewAI not installed. Install with: pip install crewai langchain-openai")
    sys.exit(1)

# Get project root
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

class NoteExtractionCrew:
    """CrewAI crew for extracting perfume notes from complex phrases"""
    
    def __init__(self, model: str = "gpt-4o-mini"):
        """Initialize the crew with agents"""
        self.llm = ChatOpenAI(
            model=model,
            temperature=0.1,  # Low temperature for consistent extraction
        )
        
        # Perfume Expert Agent - understands perfume notes and terminology
        self.perfume_expert = Agent(
            role="Perfume Note Expert",
            goal="Extract valid perfume notes from descriptive phrases",
            backstory="""You are a master perfumer with 30 years of experience.
            You understand perfume note terminology, common note names, and how to
            distinguish between actual notes and descriptive text. You know that
            notes like 'vanilla', 'rose', 'patchouli', 'musk', 'motor oil', 'dirt', 
            'coppery blood' are valid, while phrases like 'with every inhale' or 
            'he spritzes' are not notes. You excel at extracting meaningful notes 
            from complex descriptive phrases like 'fallen leaves deep in the autumnal 
            forest' (should become 'autumnal forest') or 'petites madeleines soaked 
            in black tea' (should become 'black tea').""",
            llm=self.llm,
            verbose=True,
        )
        
        # Extraction Specialist Agent - focuses on extraction logic
        self.extraction_specialist = Agent(
            role="Note Extraction Specialist",
            goal="Extract one or more valid perfume notes from phrases",
            backstory="""You specialize in parsing text to extract perfume notes.
            You understand that:
            - Notes can be single words (vanilla, rose) or multi-word (vanilla bean, black tea)
            - Some phrases contain multiple notes that should be split
            - Some phrases have no extractable notes and should be marked for deletion
            - Valid notes are typically 1-5 words, 2-50 characters
            - Notes should not be stopwords (and, of, the, etc.)""",
            llm=self.llm,
            verbose=True,
        )
        
    def extract_notes(self, phrase: str, existing_notes: List[str]) -> Dict:
        """
        Extract notes from a phrase using CrewAI
        
        Returns:
            {
                "extracted_notes": ["note1", "note2"] or None,
                "should_delete": bool,
                "reasoning": str
            }
        """
        
        # Task 1: Analyze the phrase
        analyze_task = Task(
            description=f"""
            Analyze this perfume note phrase: "{phrase}"
            
            Existing notes in database (for reference): {', '.join(existing_notes[:50])}
            
            Determine:
            1. Does this phrase contain one or more valid perfume notes?
            2. If yes, what are the note(s)? (return as JSON array)
            3. If no, should this phrase be deleted?
            
            Rules:
            - Valid notes: 1-5 words, 2-50 characters, not stopwords
            - Multi-word notes are valid (e.g., "vanilla bean", "black tea", "white birch wood", "crisp paper", "sweet red apple", "motor oil", "coppery blood")
            - Remove leading adjectives when appropriate (e.g., "fresh sugared ginger" → "sugared ginger")
            - Remove prefixes like "base" (e.g., "base Bourbon Vetiver" → "Bourbon Vetiver")
            - Remove suffixes like "& more" (e.g., "vanilla & more" → "vanilla")
            - Extract notes from phrases like "soaked in black tea" → "black tea"
            - Extract meaningful notes from descriptive phrases (e.g., "fallen leaves deep in the autumnal forest" → "autumnal forest")
            - Split multiple notes when appropriate (e.g., "dragon's blood and a river of wine" → ["dragon's blood", "river of wine"])
            - Phrases with no notes (e.g., "with every inhale") should be marked for deletion
            
            Return JSON format:
            {{
                "has_notes": true/false,
                "extracted_notes": ["note1", "note2"] or null,
                "should_delete": true/false,
                "reasoning": "explanation"
            }}
            """,
            agent=self.perfume_expert,
            expected_output="JSON object with has_notes, extracted_notes, should_delete, and reasoning fields"
        )
        
        # Task 2: Extract and validate notes
        extract_task = Task(
            description=f"""
            Based on the analysis, extract the actual perfume note(s) from: "{phrase}"
            
            If notes were identified, return them as a clean JSON array.
            If no valid notes exist, return null.
            
            Examples:
            - "petites madeleines soaked in black tea" → ["black tea"]
            - "fresh sugared ginger" → ["sugared ginger"]
            - "white birch wood" → ["white birch wood"] (keep as-is)
            - "crisp paper" → ["crisp paper"] (keep as-is)
            - "sweet red apple" → ["sweet red apple"] (keep as-is)
            - "motor oil" → ["motor oil"] (keep as-is)
            - "dirt" → ["dirt"] (keep as-is)
            - "coppery blood" → ["coppery blood"] (keep as-is)
            - "base Bourbon Vetiver" → ["Bourbon Vetiver"] (remove "base" prefix)
            - "vanilla & more" → ["vanilla"] (remove "& more" suffix)
            - "along with hints of musk" → ["musk"]
            - "fallen leaves deep in the autumnal forest." → ["autumnal forest"]
            - "dragon's blood and a river of wine" → ["dragon's blood", "river of wine"]
            - "with every inhale" → null (delete)
            - "he spritzes a touch of the 80s" → null (delete)
            - "opoponax/resins" → ["opoponax", "resins"]
            - "the fabulous vanilla bean orchid" → ["vanilla bean", "orchid"]
            
            Return JSON:
            {{
                "extracted_notes": ["note1", "note2"] or null,
                "should_delete": true/false
            }}
            """,
            agent=self.extraction_specialist,
            expected_output="JSON object with extracted_notes array and should_delete boolean"
        )
        
        # Create crew - revert to original working version
        crew = Crew(
            agents=[self.perfume_expert, self.extraction_specialist],
            tasks=[analyze_task, extract_task],
            process=Process.sequential,
            verbose=True,  # Keep verbose as it was working before
        )
        
        # Execute - simple version that was working
        try:
            result = crew.kickoff()
            
            # Parse result
            # CrewAI returns a string, we need to extract JSON from it
            result_text = str(result)
            
            # Try to find JSON in the result
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_json = json.loads(json_match.group())
                return result_json
            else:
                # Fallback: try to parse the whole result
                return json.loads(result_text)
                
        except Exception as e:
            print(f"❌ Error extracting notes: {e}")
            return {
                "extracted_notes": None,
                "should_delete": True,
                "reasoning": f"Error during extraction: {str(e)}"
            }


def load_ambiguous_notes(input_file: Optional[str] = None) -> List[Dict]:
    """Load notes that need AI extraction"""
    if input_file:
        with open(input_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    # Otherwise, return empty list (user should provide input)
    return []


def save_results(results: List[Dict], output_file: str, format: str = "json"):
    """Save extraction results to JSON or Markdown file"""
    output_path = project_root / "reports" / output_file
    output_path.parent.mkdir(exist_ok=True)
    
    if format == "md":
        # Generate markdown report
        md_content = generate_markdown_report(results)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
    else:
        # Save as JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Results saved to: {output_path}")


def generate_markdown_report(results: List[Dict]) -> str:
    """Generate a markdown report from extraction results"""
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    
    # Counts
    extracted_count = sum(1 for r in results if r.get("extracted_notes"))
    deleted_count = sum(1 for r in results if r.get("should_delete"))
    no_action_count = len(results) - extracted_count - deleted_count
    
    md = f"""# AI-Powered Note Extraction - Dry Run Report

**Generated:** {timestamp}

⚠️ **DRY RUN MODE** - No changes have been made to the database

---

## Summary

- **Total Notes Processed:** {len(results)}
- **Notes with Extracted Notes:** {extracted_count}
- **Notes Marked for Deletion:** {deleted_count}
- **Notes Requiring Review:** {no_action_count}

---

## Notes with Extracted Notes

"""
    
    # Group by extraction type
    extracted_notes = [r for r in results if r.get("extracted_notes")]
    deleted_notes = [r for r in results if r.get("should_delete") and not r.get("extracted_notes")]
    review_notes = [r for r in results if not r.get("extracted_notes") and not r.get("should_delete")]
    
    if extracted_notes:
        md += "### Extracted Notes\n\n"
        md += "| Original Phrase | Extracted Note(s) | Reasoning |\n"
        md += "|-----------------|-------------------|----------|\n"
        
        for result in extracted_notes:
            phrase = result.get("original_phrase", "")
            notes = result.get("extracted_notes", [])
            reasoning = result.get("reasoning", "N/A")
            
            notes_str = ", ".join([f'"{n}"' for n in notes]) if notes else "None"
            md += f'| "{phrase}" | {notes_str} | {reasoning[:100]}... |\n'
        
        md += "\n"
    
    if deleted_notes:
        md += "### Notes Marked for Deletion\n\n"
        md += "| Original Phrase | Reasoning |\n"
        md += "|-----------------|----------|\n"
        
        for result in deleted_notes:
            phrase = result.get("original_phrase", "")
            reasoning = result.get("reasoning", "No extractable notes")
            md += f'| "{phrase}" | {reasoning[:100]}... |\n'
        
        md += "\n"
    
    if review_notes:
        md += "### Notes Requiring Manual Review\n\n"
        md += "| Original Phrase | Status | Reasoning |\n"
        md += "|-----------------|--------|----------|\n"
        
        for result in review_notes:
            phrase = result.get("original_phrase", "")
            reasoning = result.get("reasoning", "No action determined")
            md += f'| "{phrase}" | Review Needed | {reasoning[:100]}... |\n'
        
        md += "\n"
    
    md += """---

## Next Steps

1. Review the extracted notes above
2. Verify the notes marked for deletion
3. Manually review notes requiring attention
4. Run without `--dry-run` to apply changes (after backup)

**⚠️ Remember to backup first:**
```bash
npm run db:backup
```
"""
    
    return md


def main():
    parser = argparse.ArgumentParser(description="AI-powered note extraction using CrewAI")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without applying")
    parser.add_argument("--input", type=str, help="Input JSON file with ambiguous notes")
    parser.add_argument("--all", action="store_true", help="Process all ambiguous notes from database")
    parser.add_argument("--model", type=str, default="gpt-4o-mini", help="OpenAI model to use")
    
    args = parser.parse_args()
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not found in environment variables")
        print("   Add it to your .env file or export it")
        sys.exit(1)
    
    print("=" * 60)
    print("AI-Powered Note Extraction")
    print("=" * 60)
    
    if args.dry_run:
        print("⚠️  DRY RUN MODE - No changes will be made\n")
    
    # Initialize crew
    crew = NoteExtractionCrew(model=args.model)
    
    # Load notes to process
    if args.input:
        notes = load_ambiguous_notes(args.input)
        print(f"📋 Loaded {len(notes)} notes from {args.input}\n")
    elif args.all:
        # TODO: Connect to database and get ambiguous notes
        print("⚠️  --all flag not yet implemented. Use --input to provide a JSON file.")
        sys.exit(1)
    else:
        print("❌ Please provide --input file or use --all flag")
        sys.exit(1)
    
    # Process notes
    results = []
    existing_notes = []  # TODO: Load from database
    
    for i, note_data in enumerate(notes, 1):
        # Support multiple formats
        phrase = note_data.get("name", note_data.get("phrase", note_data.get("original_phrase", "")))
        note_id = note_data.get("id", f"note_{i}")
        
        print(f"\n[{i}/{len(notes)}] Processing: {phrase}")
        
        try:
            result = crew.extract_notes(phrase, existing_notes)
            result["original_phrase"] = phrase
            result["note_id"] = note_id
            results.append(result)
            
            if result.get("extracted_notes"):
                print(f"   ✅ Extracted: {result['extracted_notes']}")
            elif result.get("should_delete"):
                print(f"   🗑️  Marked for deletion")
            else:
                print(f"   ⚠️  No notes extracted")
        except TimeoutError:
            print(f"   ⏱️  Timeout - Skipping this phrase")
            results.append({
                "original_phrase": phrase,
                "note_id": note_id,
                "extracted_notes": None,
                "should_delete": True,
                "reasoning": "Processing timed out - marked for deletion"
            })
        except Exception as e:
            print(f"   ❌ Error: {e} - Skipping")
            results.append({
                "original_phrase": phrase,
                "note_id": note_id,
                "extracted_notes": None,
                "should_delete": True,
                "reasoning": f"Error during processing: {str(e)}"
            })
    
    # Save results
    timestamp = __import__("datetime").datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    
    # Save as both JSON and Markdown
    json_file = f"ai-note-extraction-{timestamp}.json"
    md_file = f"ai-note-extraction-{timestamp}.md"
    
    save_results(results, json_file, format="json")
    save_results(results, md_file, format="md")
    
    # Summary
    extracted_count = sum(1 for r in results if r.get("extracted_notes"))
    deleted_count = sum(1 for r in results if r.get("should_delete"))
    
    print(f"\n📊 Summary:")
    print(f"   • Notes processed: {len(results)}")
    print(f"   • Notes extracted: {extracted_count}")
    print(f"   • Notes to delete: {deleted_count}")
    print(f"\n📄 Reports saved:")
    print(f"   • JSON: reports/{json_file}")
    print(f"   • Markdown: reports/{md_file}")
    
    if args.dry_run:
        print("\n✅ Dry run complete. Review the markdown report before applying changes.")


if __name__ == "__main__":
    main()
