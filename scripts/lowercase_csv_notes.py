#!/usr/bin/env python3
import csv
import os
import re
from pathlib import Path

def lowercase_notes_in_csv(csv_path):
    """
    Process a CSV file and convert all notes to lowercase, handling the special format
    where notes are stored as JSON-like arrays with double-quoted strings.
    """
    print(f"Processing {csv_path}")
    temp_path = f"{csv_path}.temp"
    
    # Read the entire file content
    with open(csv_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Create a pattern to find notes columns with their values
    # This pattern looks for fields that contain JSON-like arrays with quoted strings
    pattern = r'((?:notes|openNotes|heartNotes|baseNotes)","?\[(?:"[^"]*"(?:,\s*"[^"]*")*)\])'
    
    # Function to process each match
    def lowercase_match(match):
        full_match = match.group(0)
        column_part = match.group(1).split('","')[0]
        
        # Extract the array part
        array_start = full_match.find('[')
        if array_start == -1:
            return full_match
        
        array_part = full_match[array_start:]
        
        # Convert all text inside quotes to lowercase
        def lowercase_quoted_text(m):
            return m.group(1) + m.group(2).lower() + m.group(3)
        
        lowercased_array = re.sub(r'(")([^"]*)(")', lowercase_quoted_text, array_part)
        
        # Reconstruct the full match
        return full_match[:array_start] + lowercased_array
    
    # Find and replace all matches
    modified_content = re.sub(pattern, lowercase_match, content, flags=re.IGNORECASE)
    
    # Check if any changes were made
    if modified_content != content:
        # Write the modified content back to a temporary file
        with open(temp_path, 'w', encoding='utf-8') as file:
            file.write(modified_content)
        
        # Replace the original file with the temporary file
        os.replace(temp_path, csv_path)
        print(f"Updated {csv_path}")
        return True
    else:
        print(f"No changes needed for {csv_path}")
        return False

def main():
    # Set the path to the CSV directory
    csv_dir = Path('c:/Repos/new-smell/csv')
    
    # Process all CSV files in the directory
    processed_count = 0
    total_count = 0
    
    for csv_file in csv_dir.glob('*.csv'):
        total_count += 1
        if lowercase_notes_in_csv(csv_file):
            processed_count += 1
    
    print(f"\nSummary: {processed_count} out of {total_count} CSV files were updated.")

if __name__ == "__main__":
    main()
