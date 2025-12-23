#!/usr/bin/env python3
"""
Extract notes from DSH Perfumes CSV, run through CrewAI, and update CSV
"""

import csv
import json
import sys
from pathlib import Path
from typing import List, Dict

# Set UTF-8 encoding for stdout on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def extract_notes_for_crew(input_path: Path) -> List[Dict]:
    """Extract all notes from CSV and prepare for crew processing."""
    notes_data = []
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            perfume_name = row['name']
            open_notes_str = row.get('openNotes', '[]')
            
            try:
                open_notes = json.loads(open_notes_str) if open_notes_str else []
            except:
                open_notes = []
            
            # Add each note with perfume context
            for note in open_notes:
                if note and len(note.strip()) > 2:
                    notes_data.append({
                        'perfume_name': perfume_name,
                        'original_phrase': note,
                        'note_type': 'open'  # All notes are in openNotes per requirements
                    })
    
    return notes_data

def save_for_crew(notes_data: List[Dict], output_path: Path):
    """Save notes in format expected by clean-notes-ai.py"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(notes_data)} notes to {output_path}")
    print(f"   Ready for crew processing")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract notes from DSH Perfumes CSV for crew processing')
    parser.add_argument('--input', default='csv/perfumes_dshperfumes_cleaned.csv', help='Input CSV file')
    parser.add_argument('--output', default='reports/dshperfumes-notes-for-crew.json', help='Output JSON file for crew')
    
    args = parser.parse_args()
    
    project_root = Path(__file__).parent.parent
    input_path = project_root / args.input
    output_path = project_root / args.output
    
    # Create reports directory if it doesn't exist
    output_path.parent.mkdir(exist_ok=True)
    
    if not input_path.exists():
        print(f"❌ Error: Input file not found: {input_path}")
        sys.exit(1)
    
    print(f"Extracting notes from: {input_path}")
    notes_data = extract_notes_for_crew(input_path)
    
    if not notes_data:
        print("❌ No notes found in CSV")
        sys.exit(1)
    
    save_for_crew(notes_data, output_path)
    
    print(f"\n📋 Next steps:")
    print(f"   1. Review the extracted notes: {output_path}")
    print(f"   2. Run crew processing:")
    print(f"      python scripts/clean-notes-ai.py --input reports/dshperfumes-notes-for-crew.json")
    print(f"   3. Update CSV with cleaned notes (manual step for now)")

