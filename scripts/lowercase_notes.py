#!/usr/bin/env python3
import csv
import json
import os
import sys
from pathlib import Path

def lowercase_notes(csv_path):
    """
    Processes a CSV file and converts all notes to lowercase.
    """
    print(f"Processing {csv_path}")
    temp_path = f"{csv_path}.temp"
    
    # Read the CSV file
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    # Check if we have the necessary columns
    note_columns = ['notes', 'openNotes', 'heartNotes', 'baseNotes']
    columns_to_process = [col for col in note_columns if col in fieldnames]
    
    if not columns_to_process:
        print(f"No note columns found in {csv_path}")
        return False
    
    changes_made = False
    
    # Process each row
    for row in rows:
        for col in columns_to_process:
            if col in row and row[col]:
                try:
                    # Check if the column value is not empty
                    if row[col].strip():
                        # Parse the JSON array
                        notes_array = json.loads(row[col].replace('""', '"'))
                        if isinstance(notes_array, list):
                            # Convert each note to lowercase
                            lowercase_notes = [note.lower() for note in notes_array]
                            # Check if any changes were made
                            if any(note != note.lower() for note in notes_array):
                                changes_made = True
                            # Convert back to JSON string with proper quoting for CSV
                            row[col] = json.dumps(lowercase_notes).replace('"', '""')
                except json.JSONDecodeError as e:
                    print(f"Warning: Could not parse JSON in {col} column: {row[col]}")
                    print(f"Error: {e}")
    
    # Only write to file if changes were made
    if changes_made:
        # Write the updated data back to a temporary file
        with open(temp_path, 'w', encoding='utf-8', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        # Replace the original file with the temporary file
        os.replace(temp_path, csv_path)
        print(f"Updated {csv_path}")
        return True
    else:
        print(f"No changes needed for {csv_path}")
        return False

def main():
    # Set the path to the CSV directory directly
    csv_dir = Path('c:/Repos/new-smell/csv')
    
    # Process all CSV files in the directory
    processed_count = 0
    total_count = 0
    
    for csv_file in csv_dir.glob('*.csv'):
        total_count += 1
        if lowercase_notes(csv_file):
            processed_count += 1
    
    print(f"\nSummary: {processed_count} out of {total_count} CSV files were updated.")

if __name__ == "__main__":
    main()
