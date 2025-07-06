#!/usr/bin/env python3
import csv
import json
import os
import re
from pathlib import Path

def check_notes_case(csv_path):
    """
    Check if all notes are already in lowercase.
    """
    print(f"Checking {csv_path}")
    
    # Read the CSV file
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames
        
        # Check which note columns exist in this file
        note_columns = ['notes', 'openNotes', 'heartNotes', 'baseNotes']
        columns_to_check = [col for col in note_columns if col in fieldnames]
        
        if not columns_to_check:
            print(f"No note columns found in {csv_path}")
            return
        
        # Check each row
        row_num = 1
        for row in reader:
            row_num += 1
            for col in columns_to_check:
                if col in row and row[col] and row[col].strip():
                    try:
                        # Clean up the value for JSON parsing
                        value = row[col].replace('""', '"')
                        notes_array = json.loads(value)
                        
                        if isinstance(notes_array, list):
                            # Check if any note contains uppercase letters
                            for note in notes_array:
                                if note != note.lower():
                                    print(f"Found uppercase in {csv_path}, row {row_num}, column {col}: '{note}'")
                    except json.JSONDecodeError as e:
                        print(f"Warning: Could not parse JSON in {csv_path}, row {row_num}, {col} column: {row[col]}")
                        print(f"Error: {e}")

def main():
    # Set the path to the CSV directory
    csv_dir = Path('c:/Repos/new-smell/csv')
    
    # Process all CSV files in the directory
    for csv_file in csv_dir.glob('*.csv'):
        check_notes_case(csv_file)

if __name__ == "__main__":
    main()
