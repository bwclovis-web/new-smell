#!/usr/bin/env python3
"""
Test script for the enrichment system with a small sample of 5 random companies
"""
import sys
import os
import pandas as pd
import random
from pathlib import Path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from production_enrichment_system import process_batch, find_latest_progress, get_fallback_image

def test_small_sample():
    """Test the enrichment system with 5 random companies."""
    
    print("🧪 TESTING ENRICHMENT SYSTEM WITH 5 RANDOM COMPANIES")
    print("=" * 60)
    
    # Load the main CSV
    csv_path = "csv/S&S perfume houses.csv"
    
    try:
        # Load the CSV
        try:
            df = pd.read_csv(csv_path)
        except:
            print("⚠️  Standard CSV parsing failed, using robust parser...")
            import csv
            rows = []
            with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                header = next(reader)  # Skip header
                
                for row in reader:
                    if len(row) >= 13:  # Ensure minimum columns
                        rows.append(row[:13])  # Take only first 13 columns
            
            # Create DataFrame from parsed rows
            columns = ['id', 'name', 'description', 'image', 'website', 'country', 'founded', 'type', 'email', 'phone', 'address', 'createdAt', 'updatedAt']
            df = pd.DataFrame(rows, columns=columns)
        
        print(f"🎯 Found {len(df)} total perfume houses in CSV")
        
        if len(df) == 0:
            print("❌ No perfume houses found to test with.")
            return
        
        # Select 5 random companies
        sample_size = min(5, len(df))
        random_indices = random.sample(range(len(df)), sample_size)
        df_sample = df.iloc[random_indices].copy()
        
        print(f"\n🎲 Selected {sample_size} random companies for testing:")
        for i, (_, company) in enumerate(df_sample.iterrows()):
            print(f"   {i+1}. {company['name']} (ID: {company['id']})")
        
        # Create test output directory
        test_output_dir = Path("test_enrichment_sample")
        test_output_dir.mkdir(exist_ok=True)
        
        print(f"\n📁 Test results will be saved to: {test_output_dir}")
        
        # Process the sample as a single batch
        print(f"\n🔄 Processing test sample as batch 1...")
        enriched_sample = process_batch(df_sample, 1, 1)
        
        # Save the test results
        sample_df = pd.DataFrame(enriched_sample)
        test_csv = test_output_dir / "test_sample_enriched.csv"
        sample_df.to_csv(test_csv, index=False)
        
        print(f"\n💾 Test results saved to: {test_csv}")
        
        # Show summary of results
        successful = len([c for c in enriched_sample if c.get('description') and c.get('description').strip()])
        failed = len([c for c in enriched_sample if not c.get('description') or not c.get('description').strip()])
        
        descriptions_found = len([c for c in enriched_sample if c.get('description') and c.get('description').strip()])
        founded_found = len([c for c in enriched_sample if c.get('founded') and c.get('founded').strip() and c.get('founded') != 'Not found'])
        websites_found = len([c for c in enriched_sample if c.get('website') and c.get('website').strip() and c.get('website') != 'Not found'])
        emails_found = len([c for c in enriched_sample if c.get('email') and c.get('email').strip() and c.get('email') != 'Not found'])
        images_found = len([c for c in enriched_sample if c.get('image') and c.get('image').strip()])
        
        print(f"\n🎉 TEST SAMPLE COMPLETED!")
        print(f"📊 Sample size: {sample_size}")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"📝 Descriptions: {descriptions_found}/{sample_size}")
        print(f"📅 Founded dates: {founded_found}/{sample_size}")
        print(f"🌐 Websites: {websites_found}/{sample_size}")
        print(f"🖼️  Images: {images_found}/{sample_size}")
        print(f"📧 Emails: {emails_found}/{sample_size}")
        
        # Show detailed results for each company
        print(f"\n📋 DETAILED RESULTS:")
        print("-" * 60)
        
        for i, company in enumerate(enriched_sample):
            print(f"\n{i+1}. {company['name']}")
            print(f"   📝 Description: {'✓' if company.get('description') else '✗'}")
            if company.get('description'):
                desc_preview = company['description'][:100] + "..." if len(company['description']) > 100 else company['description']
                print(f"      Preview: {desc_preview}")
            
            print(f"   📅 Founded: {'✓' if company.get('founded') else '✗'}")
            if company.get('founded'):
                print(f"      Date: {company['founded']}")
            
            print(f"   🌐 Website: {'✓' if company.get('website') else '✗'}")
            if company.get('website'):
                print(f"      URL: {company['website']}")
            
            print(f"   🖼️  Image: {'✓' if company.get('image') else '✗'}")
            if company.get('image'):
                print(f"      Image: {company['image']}")
            
            print(f"   📧 Email: {'✓' if company.get('email') else '✗'}")
            if company.get('email'):
                print(f"      Email: {company['email']}")
        
        # Test resume functionality with the test data
        print(f"\n🔄 Testing Resume Functionality with Test Data:")
        print("-" * 60)
        
        # Simulate having some progress
        last_batch, existing_data, total_processed = find_latest_progress(test_output_dir)
        
        if existing_data:
            print(f"📊 Found existing data: {len(existing_data)} companies")
            print(f"🔄 Resume would continue from batch {last_batch + 1}")
        else:
            print("🆕 No existing progress found - would start fresh")
        
        # Show the CSV file contents
        print(f"\n📄 CSV FILE CONTENTS:")
        print("-" * 60)
        print(f"File: {test_csv}")
        print(f"Size: {test_csv.stat().st_size} bytes")
        print(f"Rows: {len(sample_df)}")
        print(f"Columns: {list(sample_df.columns)}")
        
        print(f"\n📊 CSV PREVIEW (first 3 rows):")
        print("-" * 60)
        for i, (_, row) in enumerate(sample_df.head(3).iterrows()):
            print(f"\nRow {i+1}:")
            print(f"  Name: {row['name']}")
            print(f"  Description: {row['description'][:80] + '...' if len(str(row['description'])) > 80 else row['description']}")
            print(f"  Image: {row['image']}")
            print(f"  Website: {row['website']}")
            print(f"  Founded: {row['founded']}")
            print(f"  Type: {row['type']}")
        
        print(f"\n🎯 Test completed successfully!")
        print(f"📁 Check the test results in: {test_output_dir}")
        print(f"💡 If everything looks good, you can run the full system!")
        
        return {
            'test_csv': str(test_csv),
            'sample_size': sample_size,
            'successful': successful,
            'failed': failed,
            'descriptions_found': descriptions_found,
            'images_found': images_found
        }
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}

if __name__ == "__main__":
    try:
        print("🚀 Starting small sample test...")
        results = test_small_sample()
        
        if 'error' not in results:
            print(f"\n✅ Test completed successfully!")
            print(f"📊 Sample processed: {results.get('sample_size', 0)} companies")
            print(f"📝 Descriptions found: {results.get('descriptions_found', 0)}")
            print(f"🖼️  Images extracted: {results.get('images_found', 0)}")
        else:
            print(f"\n❌ Test failed: {results['error']}")
            
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()
