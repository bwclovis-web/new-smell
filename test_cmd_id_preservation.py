#!/usr/bin/env python3
"""
Test script to verify ID preservation with cmd format IDs
"""
import sys
import os
import pandas as pd
from pathlib import Path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from production_enrichment_system import preserve_or_generate_id, generate_cmd_id

def test_id_preservation():
    """Test ID preservation functionality."""
    
    print("🧪 TESTING ID PRESERVATION FUNCTIONALITY")
    print("=" * 60)
    
    # Test cases
    test_cases = [
        # Existing UUID format IDs
        ("454da245-c613-4a46-b51d-815fd47606d6", "UUID format - should be preserved"),
        ("af9a5783-00d8-4cb0-b42c-d79f464c719f", "UUID format - should be preserved"),
        
        # Existing cmd format IDs
        ("cmd292a7b00zlob8kzhulxhhh", "CMD format - should be preserved"),
        ("cmd2929l300jhob8kfnky2dyy", "CMD format - should be preserved"),
        ("cmd292fx3045eob8kquagfw47", "CMD format - should be preserved"),
        
        # Empty or None IDs
        ("", "Empty string - should generate new cmd ID"),
        (None, "None value - should generate new cmd ID"),
        ("   ", "Whitespace only - should generate new cmd ID"),
    ]
    
    print("📊 Testing ID Preservation Logic:")
    print("-" * 60)
    
    for test_id, description in test_cases:
        preserved_id = preserve_or_generate_id(test_id)
        
        print(f"\n🔍 Test: {description}")
        print(f"   Input ID: {repr(test_id)}")
        print(f"   Output ID: {preserved_id}")
        
        if test_id and str(test_id).strip():
            # Should preserve existing ID
            if preserved_id == str(test_id).strip():
                print("   ✅ PASS: ID preserved correctly")
            else:
                print("   ❌ FAIL: ID was changed when it should have been preserved")
        else:
            # Should generate new cmd ID
            if preserved_id.startswith("cmd") and len(preserved_id) == 23:
                print("   ✅ PASS: New cmd ID generated correctly")
            else:
                print("   ❌ FAIL: New ID format is incorrect")
    
    # Test cmd ID generation format
    print(f"\n🔧 Testing CMD ID Generation Format:")
    print("-" * 60)
    
    for i in range(5):
        new_id = generate_cmd_id()
        print(f"   Generated ID {i+1}: {new_id}")
        
        # Verify format
        if new_id.startswith("cmd") and len(new_id) == 23:
            print(f"      ✅ Format correct: starts with 'cmd' and is 23 characters")
        else:
            print(f"      ❌ Format incorrect: {new_id}")
    
    print(f"\n🎯 ID preservation test completed!")

if __name__ == "__main__":
    test_id_preservation()
