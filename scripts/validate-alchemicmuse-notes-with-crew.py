#!/usr/bin/env python3
"""
Extract potentially problematic notes from cleaned Alchemic Muse CSV
and validate them through CrewAI
"""

import csv
import json
import sys
from pathlib import Path
from typing import List, Dict, Set

# Set UTF-8 encoding for stdout on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Notes that might need validation (descriptive phrases, ambiguous terms, etc.)
SUSPICIOUS_PATTERNS = [
    'sweet notes', 'top', 'fire', 'sand', 'green leaves', 'marshmallow',
    'amber oil', 'smoky sandalwood', 'charred cedar', 'burnt', 'smoke',
    'fragrance', 'perfume', 'scent', 'aroma'
]

def extract_notes_for_validation(input_path: Path) -> List[Dict]:
    """Extract notes that might need validation."""
    notes_data = []
    seen_phrases = set()
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            perfume_name = row['name']
            
            # Get notes from all three categories
            for note_type in ['openNotes', 'heartNotes', 'baseNotes']:
                notes_str = row.get(note_type, '[]')
                
                try:
                    notes = json.loads(notes_str) if notes_str else []
                except:
                    notes = []
                
                # Check each note
                for note in notes:
                    if not note or len(str(note).strip()) < 2:
                        continue
                    
                    note_str = str(note).strip().lower()
                    
                    # Skip if we've already processed this exact phrase
                    if note_str in seen_phrases:
                        continue
                    seen_phrases.add(note_str)
                    
                    # Check if it matches suspicious patterns
                    is_suspicious = any(pattern in note_str for pattern in SUSPICIOUS_PATTERNS)
                    
                    # Also flag multi-word notes that might be descriptive phrases
                    is_multi_word = len(note_str.split()) > 2
                    
                    # Or notes that look like they might need validation
                    needs_validation = is_suspicious or is_multi_word
                    
                    if needs_validation:
                        notes_data.append({
                            'perfume_name': perfume_name,
                            'original_phrase': note_str,
                            'note_type': note_type.replace('Notes', '').lower(),
                            'reason': 'suspicious_pattern' if is_suspicious else 'multi_word'
                        })
    
    return notes_data

def save_for_crew(notes_data: List[Dict], output_path: Path):
    """Save notes in format expected by clean-notes-ai.py"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Extracted {len(notes_data)} notes for validation")
    print(f"   Saved to: {output_path}")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract notes from cleaned Alchemic Muse CSV for crew validation')
    parser.add_argument('--input', default='csv_noir/perfumes_alchemicmuse_noir_cleaned.csv', help='Input CSV file')
    parser.add_argument('--output', default='reports/alchemicmuse-notes-for-validation.json', help='Output JSON file for crew')
    
    args = parser.parse_args()
    
    project_root = Path(__file__).parent.parent
    input_path = project_root / args.input
    output_path = project_root / args.output
    
    # Create reports directory if it doesn't exist
    output_path.parent.mkdir(exist_ok=True)
    
    if not input_path.exists():
        print(f"❌ Error: Input file not found: {input_path}")
        sys.exit(1)
    
    print(f"Extracting notes for validation from: {input_path}")
    notes_data = extract_notes_for_validation(input_path)
    
    if not notes_data:
        print("✅ No suspicious notes found - all notes look good!")
        sys.exit(0)
    
    save_for_crew(notes_data, output_path)
    
    print(f"\n📋 Next steps:")
    print(f"   1. Review extracted notes: {output_path}")
    print(f"   2. Run crew validation (dry-run first):")
    print(f"      python scripts/clean-notes-ai.py --input reports/alchemicmuse-notes-for-validation.json --dry-run --limit 10")

