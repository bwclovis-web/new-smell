#!/usr/bin/env python3
"""
Script to normalize note capitalization in perfume CSV files.
Converts capitalized notes to lowercase while preserving proper nouns and formatting.
"""

import csv
import re
import os
import json
from pathlib import Path

def singularize_word(word):
    """
    Convert a plural word to its singular form using common English pluralization rules.
    """
    if not word or len(word) < 2:
        return word
    
    # Handle some irregular plurals first
    irregular_plurals = {
        'feet': 'foot',
        'geese': 'goose',
        'men': 'man',
        'women': 'woman',
        'children': 'child',
        'teeth': 'tooth',
        'mice': 'mouse',
        'people': 'person',
        'oxen': 'ox',
        'deer': 'deer',
        'sheep': 'sheep',
        'fish': 'fish',
        'moose': 'moose',
        'species': 'species',
        'series': 'series',
        'fungi': 'fungus',
        'cacti': 'cactus',
        'alumni': 'alumnus',
        'analyses': 'analysis',
        'bases': 'basis',
        'crises': 'crisis',
        'diagnoses': 'diagnosis',
        'ellipses': 'ellipsis',
        'hypotheses': 'hypothesis',
        'oases': 'oasis',
        'parentheses': 'parenthesis',
        'syntheses': 'synthesis',
        'theses': 'thesis'
    }
    
    word_lower = word.lower()
    if word_lower in irregular_plurals:
        # Preserve original capitalization
        singular = irregular_plurals[word_lower]
        if word[0].isupper():
            return singular.capitalize()
        return singular
    
    # Regular pluralization rules (in order of specificity)
    
    # Words ending in -ies (but not -eies)
    if word_lower.endswith('ies') and len(word) > 3 and not word_lower.endswith('eies'):
        return word[:-3] + 'y'
    
    # Words ending in -oes
    if word_lower.endswith('oes') and len(word) > 3:
        return word[:-2]
    
    # Words ending in -ves
    if word_lower.endswith('ves') and len(word) > 3:
        return word[:-3] + 'f'
    
    # Words ending in -ses
    if word_lower.endswith('ses') and len(word) > 3:
        return word[:-2]
    
    # Words ending in -ches, -shes, -xes, -zes
    if word_lower.endswith(('ches', 'shes', 'xes', 'zes')) and len(word) > 4:
        return word[:-2]
    
    # Words ending in -s (but not -ss, -us, -is)
    if word_lower.endswith('s') and len(word) > 1:
        if not word_lower.endswith(('ss', 'us', 'is', 'as', 'os')):
            return word[:-1]
    
    # If no rule applies, return the original word
    return word

def normalize_notes_in_text(text):
    """
    Normalize capitalization in notes text, remove leading articles, and singularize words.
    Converts standalone capitalized words to lowercase while preserving:
    - Proper nouns (geographic locations, brand names, etc.)
    - Acronyms
    - Text at the beginning of sentences
    Also removes leading "a" or "and" words from notes and converts plurals to singular.
    """
    if not text or text.strip() == '':
        return text
    
    # Remove leading "a " or "and " (case insensitive)
    text = re.sub(r'^(a |and )', '', text, flags=re.IGNORECASE)
    
    # Common proper nouns that should stay capitalized
    proper_nouns = {
        'African', 'American', 'Arabian', 'Asian', 'Australian', 'Brazilian', 
        'Bulgarian', 'Calabrian', 'Chinese', 'Egyptian', 'English', 'European',
        'French', 'German', 'Greek', 'Indian', 'Italian', 'Japanese', 'Moroccan',
        'Persian', 'Roman', 'Russian', 'Sicilian', 'Spanish', 'Turkish', 'Yemeni',
        'Madagascar', 'Burma', 'Mysore', 'Virginia', 'Kalimantan', 'Irian',
        'Saint', 'Thomas', 'Riyadh', 'Peru', 'Tolu', 'Sinai'
    }
    
    # Words that should NOT be singularized (always plural or not actual plurals)
    exclude_from_singularization = {
        'musk', 'musks', 'woods', 'spices', 'notes', 'accents', 'grass', 'cypress',
        'iris', 'moss', 'canvas', 'glass', 'brass', 'chess', 'dress', 'stress',
        'business', 'princess', 'goddess', 'address', 'process', 'express',
        'success', 'access', 'progress', 'darkness', 'sweetness', 'softness',
        'bless', 'less', 'unless', 'restless', 'endless', 'harmless', 'careless'
    }
    
    # Process word by word
    words = text.split()
    processed_words = []
    
    for i, word in enumerate(words):
        # Skip if word contains special characters that indicate it's part of a compound
        if any(char in word for char in ['-', "'", '"', '(', ')', '[', ']']):
            processed_words.append(word)
            continue
            
        # Check if it's a proper noun
        clean_word = re.sub(r'[^\w]', '', word)  # Remove punctuation for checking
        if clean_word in proper_nouns:
            processed_words.append(word)
            continue
            
        # Check if it's an acronym (all caps, 2+ letters)
        if clean_word.isupper() and len(clean_word) >= 2:
            processed_words.append(word)
            continue
        
        # Check if word should be excluded from singularization
        clean_word_lower = clean_word.lower()
        if clean_word_lower in exclude_from_singularization:
            # Still apply capitalization rules
            if word and word[0].isupper() and i > 0:
                processed_word = word[0].lower() + word[1:] if len(word) > 1 else word.lower()
                processed_words.append(processed_word)
            else:
                processed_words.append(word)
            continue
            
        # Apply singularization
        singularized = singularize_word(clean_word)
        
        # Reconstruct word with original punctuation
        if clean_word != word:
            # Has punctuation, replace the word part but keep punctuation
            word = word.replace(clean_word, singularized)
        else:
            word = singularized
            
        # If word is capitalized and not at start, convert to lowercase
        if word and word[0].isupper() and i > 0:
            processed_word = word[0].lower() + word[1:] if len(word) > 1 else word.lower()
            processed_words.append(processed_word)
        else:
            processed_words.append(word)
    
    return ' '.join(processed_words)

def process_notes_field(field_value):
    """
    Process a notes field that may contain JSON array format or plain text.
    """
    if not field_value or field_value.strip() == '':
        return field_value
    
    # Handle JSON array format like ["note1 note2", "note3 note4"]
    if field_value.strip().startswith('[') and field_value.strip().endswith(']'):
        try:
            # Parse as JSON
            notes_list = json.loads(field_value)
            if isinstance(notes_list, list):
                # Process each note string in the array
                processed_notes = [normalize_notes_in_text(note) for note in notes_list]
                return json.dumps(processed_notes)
        except json.JSONDecodeError:
            # If JSON parsing fails, treat as plain text
            pass
    
    # Handle plain text
    return normalize_notes_in_text(field_value)

def process_csv_file(file_path):
    """
    Process a single CSV file to normalize note capitalization.
    """
    print(f"Processing {file_path}...")
    
    # Read the CSV file
    rows = []
    headers = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', newline='') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)
            
            # Find note columns
            note_columns = []
            for i, header in enumerate(headers):
                if 'note' in header.lower() or 'notes' in header.lower():
                    note_columns.append(i)
            
            if not note_columns:
                print(f"  No note columns found in {file_path}")
                return
            
            print(f"  Found note columns: {[headers[i] for i in note_columns]}")
            
            # Process each row
            changes_made = 0
            for row_num, row in enumerate(reader, start=2):  # Start at 2 because we already read headers
                if len(row) < len(headers):
                    # Pad row if it's too short
                    row.extend([''] * (len(headers) - len(row)))
                
                original_row = row.copy()
                
                # Process note columns
                for col_idx in note_columns:
                    if col_idx < len(row):
                        original_value = row[col_idx]
                        processed_value = process_notes_field(original_value)
                        row[col_idx] = processed_value
                        
                        if original_value != processed_value:
                            changes_made += 1
                
                rows.append(row)
            
            print(f"  Made changes to {changes_made} note fields")
    
    except Exception as e:
        print(f"  Error reading {file_path}: {e}")
        return
    
    # Write the processed CSV back
    try:
        with open(file_path, 'w', encoding='utf-8', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(headers)
            writer.writerows(rows)
        print(f"  Successfully updated {file_path}")
    except Exception as e:
        print(f"  Error writing {file_path}: {e}")

def main():
    """
    Main function to process all CSV files in the csv directory.
    """
    csv_dir = Path('csv')
    
    if not csv_dir.exists():
        print("CSV directory not found!")
        return
    
    # Find all CSV files
    csv_files = list(csv_dir.glob('*.csv'))
    
    if not csv_files:
        print("No CSV files found in csv directory!")
        return
    
    print(f"Found {len(csv_files)} CSV files to process:")
    for csv_file in csv_files:
        print(f"  - {csv_file}")
    
    print("\nProcessing files...")
    
    for csv_file in csv_files:
        process_csv_file(csv_file)
    
    print("\nProcessing complete!")

if __name__ == "__main__":
    main()
