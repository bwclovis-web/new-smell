#!/usr/bin/env python3
"""
Find Legitimate Perfume Houses
Extract actual perfume companies from the main CSV to replace non-perfume companies.
"""

import pandas as pd
import csv
from pathlib import Path

def find_legitimate_perfume_houses():
    """Find legitimate perfume houses from the main CSV."""
    
    # Load the main CSV with 6,548 perfume houses using robust parsing
    main_csv_path = "csv/S&S perfume houses.csv"
    
    try:
        # Try standard pandas first
        main_df = pd.read_csv(main_csv_path)
    except:
        # If that fails, use robust CSV reader
        print("⚠️  Standard CSV parsing failed, using robust parser...")
        rows = []
        with open(main_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader)  # Skip header
            
            for row in reader:
                if len(row) >= 13:  # Ensure minimum columns
                    rows.append(row[:13])  # Take only first 13 columns
        
        # Create DataFrame from parsed rows
        columns = ['id', 'name', 'description', 'image', 'website', 'country', 'founded', 'type', 'email', 'phone', 'address', 'createdAt', 'updatedAt']
        main_df = pd.DataFrame(rows, columns=columns)
    
    print(f"📊 Main CSV contains {len(main_df)} companies")
    
    # Filter for companies that are likely legitimate perfume houses
    # Look for companies with names that suggest perfume/fragrance business
    perfume_keywords = [
        'perfume', 'parfum', 'fragrance', 'scent', 'aroma', 'essence',
        'attar', 'oud', 'musk', 'amber', 'vanilla', 'rose', 'jasmine',
        'lavender', 'bergamot', 'patchouli', 'sandalwood', 'vetiver'
    ]
    
    # Create a scoring system for likely perfume houses
    def calculate_perfume_score(name):
        if pd.isna(name):
            return 0
        
        name_lower = str(name).lower()
        score = 0
        
        # High confidence indicators
        if any(keyword in name_lower for keyword in ['perfume', 'parfum', 'fragrance']):
            score += 10
        
        # Medium confidence indicators
        if any(keyword in name_lower for keyword in ['attar', 'oud', 'musk', 'amber']):
            score += 7
        
        # Lower confidence indicators (common in perfume names)
        if any(keyword in name_lower for keyword in ['vanilla', 'rose', 'jasmine', 'lavender']):
            score += 5
        
        # Italian/French perfume house indicators
        if any(prefix in name_lower for prefix in ['acqua di', 'eau de', 'maison', 'atelier']):
            score += 8
        
        # Avoid generic names
        if len(name) <= 3 or name.isdigit():
            score -= 5
        
        return score
    
    # Calculate scores for all companies
    main_df['perfume_score'] = main_df['name'].apply(calculate_perfume_score)
    
    # Filter for companies with good perfume scores
    likely_perfume_houses = main_df[main_df['perfume_score'] >= 5].copy()
    
    print(f"🎯 Found {len(likely_perfume_houses)} companies likely to be legitimate perfume houses")
    
    # Sort by score and show top candidates
    top_candidates = likely_perfume_houses.nlargest(20, 'perfume_score')
    
    print("\n🏆 Top 20 Likely Perfume House Candidates:")
    print("=" * 80)
    for idx, row in top_candidates.iterrows():
        print(f"{row['name']:<40} Score: {row['perfume_score']}")
    
    # Select 9 high-quality replacements (to replace the 9 non-perfume companies)
    replacements = likely_perfume_houses.nlargest(9, 'perfume_score')
    
    print(f"\n🔄 Selected {len(replacements)} replacement companies:")
    print("=" * 80)
    for idx, row in replacements.iterrows():
        print(f"{row['name']:<40} Score: {row['perfume_score']}")
    
    return replacements

def create_improved_test_csv():
    """Create an improved test CSV with legitimate perfume houses."""
    
    # Get legitimate replacements
    replacements = find_legitimate_perfume_houses()
    
    # Load the original test CSV
    test_csv_path = "csv/S&S perfume houses test ultimate.csv"
    test_df = pd.read_csv(test_csv_path)
    
    print(f"\n📝 Original test CSV has {len(test_df)} companies")
    
    # Keep only Amphora Parfum (the confirmed perfume company)
    perfume_companies = test_df[test_df['name'] == 'Amphora Parfum'].copy()
    
    # Add the replacement companies
    for idx, replacement in replacements.iterrows():
        new_row = {
            'id': replacement['id'],
            'name': replacement['name'],
            'description': '',
            'image': '',
            'website': '',
            'country': '',
            'founded': '',
            'type': 'indie',
            'email': '',
            'phone': '',
            'address': '',
            'createdAt': replacement['createdAt'],
            'updatedAt': replacement['updatedAt']
        }
        perfume_companies = pd.concat([perfume_companies, pd.DataFrame([new_row])], ignore_index=True)
    
    # Save the improved test CSV
    output_path = "csv/improved_perfume_houses_test.csv"
    perfume_companies.to_csv(output_path, index=False)
    
    print(f"\n💾 Improved test CSV saved to: {output_path}")
    print(f"📊 New test CSV contains {len(perfume_companies)} legitimate perfume companies")
    
    return output_path

if __name__ == "__main__":
    try:
        output_file = create_improved_test_csv()
        print(f"\n✅ Successfully created improved test CSV with legitimate perfume houses!")
        print(f"📁 File: {output_file}")
    except Exception as e:
        print(f"❌ Error: {e}")
