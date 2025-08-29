#!/usr/bin/env python3
"""
Test script for resume functionality
"""
import sys
import os
import pandas as pd
from pathlib import Path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from production_enrichment_system import find_latest_progress

def test_resume_detection():
    """Test the resume detection functionality."""
    
    print("🧪 Testing Resume Functionality")
    print("=" * 50)
    
    # Test with different scenarios
    test_scenarios = [
        "no_progress",
        "partial_progress", 
        "complete_progress"
    ]
    
    for scenario in test_scenarios:
        print(f"\n📊 Testing Scenario: {scenario}")
        
        # Create test output directory
        test_dir = Path(f"test_resume_{scenario}")
        test_dir.mkdir(exist_ok=True)
        
        if scenario == "no_progress":
            print("   🆕 No progress files - should start fresh")
            
        elif scenario == "partial_progress":
            # Create a fake batch file
            fake_batch_data = [
                {'id': 1, 'name': 'Test Company 1', 'description': 'Test description'},
                {'id': 2, 'name': 'Test Company 2', 'description': 'Test description'}
            ]
            batch_df = pd.DataFrame(fake_batch_data)
            batch_file = test_dir / "batch_1_enriched_20241201_120000.csv"
            batch_df.to_csv(batch_file, index=False)
            
            # Create a fake cumulative file
            cumulative_df = pd.DataFrame(fake_batch_data)
            cumulative_file = test_dir / "cumulative_enriched_20241201_120000.csv"
            cumulative_df.to_csv(cumulative_file, index=False)
            
            print(f"   🔄 Partial progress - batch 1 completed with {len(fake_batch_data)} companies")
            
        elif scenario == "complete_progress":
            # Create a fake complete output file
            complete_data = [
                {'id': 1, 'name': 'Test Company 1', 'description': 'Test description'},
                {'id': 2, 'name': 'Test Company 2', 'description': 'Test description'},
                {'id': 3, 'name': 'Test Company 3', 'description': 'Test description'}
            ]
            complete_df = pd.DataFrame(complete_data)
            complete_file = test_dir / "s&scomplete.csv"
            complete_df.to_csv(complete_file, index=False)
            
            print(f"   ✅ Complete progress - all {len(complete_data)} companies processed")
        
        # Test the resume detection
        try:
            last_batch, existing_data, total_processed = find_latest_progress(test_dir)
            
            print(f"   📊 Last completed batch: {last_batch}")
            print(f"   📈 Existing data found: {len(existing_data)} companies")
            print(f"   🎯 Total processed: {total_processed}")
            
            if last_batch == -1:
                print("   🎉 Status: Complete - all companies processed!")
            elif last_batch > 0:
                print(f"   🔄 Status: Partial - resume from batch {last_batch + 1}")
            else:
                print("   🆕 Status: Fresh start needed")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Clean up test directory
        import shutil
        shutil.rmtree(test_dir)
    
    print("\n🎯 Resume functionality test completed!")

def simulate_resume_scenario():
    """Simulate a realistic resume scenario."""
    
    print("\n🔄 Simulating Realistic Resume Scenario")
    print("=" * 50)
    
    # Simulate having processed 750 companies out of 1000
    total_companies = 1000
    processed_companies = 750
    batch_size = 300
    
    print(f"📊 Total companies: {total_companies}")
    print(f"📈 Already processed: {processed_companies}")
    print(f"🔄 Batch size: {batch_size}")
    
    # Calculate batches
    completed_batches = processed_companies // batch_size
    remaining_companies = total_companies - processed_companies
    remaining_batches = (remaining_companies + batch_size - 1) // batch_size
    
    print(f"✅ Completed batches: {completed_batches}")
    print(f"⏳ Remaining companies: {remaining_companies}")
    print(f"🔄 Remaining batches: {remaining_batches}")
    
    # Show what would happen on resume
    print(f"\n🔄 On Resume:")
    print(f"   📊 Would start from batch {completed_batches + 1}")
    print(f"   📈 Would process {remaining_companies} remaining companies")
    print(f"   ⏱️  Estimated time: {remaining_companies / 100:.1f} hours")
    print(f"   💾 Would save progress after each remaining batch")
    
    print("\n🎯 Resume simulation completed!")

if __name__ == "__main__":
    test_resume_detection()
    simulate_resume_scenario()
