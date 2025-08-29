#!/usr/bin/env python3
"""
Test script for batch processing functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_batch_logic():
    """Test the batch processing logic without running actual enrichment."""
    
    # Simulate different dataset sizes
    test_sizes = [100, 300, 600, 1000, 1500]
    
    print("🧪 Testing Batch Processing Logic")
    print("=" * 50)
    
    for total_size in test_sizes:
        batch_size = 300
        total_batches = (total_size + batch_size - 1) // batch_size
        
        print(f"\n📊 Dataset size: {total_size}")
        print(f"🔄 Batch size: {batch_size}")
        print(f"📦 Total batches: {total_batches}")
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min((batch_num + 1) * batch_size, total_size)
            batch_size_actual = end_idx - start_idx
            
            print(f"   Batch {batch_num + 1}: companies {start_idx + 1} to {end_idx} ({batch_size_actual} companies)")
        
        # Verify total
        total_processed = sum(
            min(batch_size, total_size - i * batch_size) 
            for i in range(total_batches)
        )
        print(f"   ✅ Total companies covered: {total_processed}")
    
    print("\n🎯 Batch logic test completed!")

if __name__ == "__main__":
    test_batch_logic()
