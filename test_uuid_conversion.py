#!/usr/bin/env python3
"""
Quick test to verify UUID to cmd conversion
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from production_enrichment_system import preserve_or_generate_id

def test_uuid_conversion():
    """Test UUID to cmd conversion."""
    
    print("🧪 TESTING UUID TO CMD CONVERSION")
    print("=" * 50)
    
    # Test UUIDs that should be converted
    test_uuids = [
        "454da245-c613-4a46-b51d-815fd47606d6",
        "af9a5783-00d8-4cb0-b42c-d79f464c719f",
        "29ec9cb6-598a-4568-b3eb-fbbd0183c7c6",
        "bb36e8c3-2e96-4b3b-98a0-51ab69a9f6c7",
        "94008f68-b491-4308-889c-ccc5524f4629"
    ]
    
    print("📊 Converting UUIDs to cmd format:")
    print("-" * 50)
    
    for uuid_id in test_uuids:
        converted_id = preserve_or_generate_id(uuid_id)
        print(f"UUID: {uuid_id}")
        print(f"CMD:  {converted_id}")
        print(f"      {'✅' if converted_id.startswith('cmd') and len(converted_id) == 23 else '❌'}")
        print()
    
    # Test existing cmd IDs that should be preserved
    test_cmd_ids = [
        "cmd292a7b00zlob8kzhulxhhh",
        "cmd2929l300jhob8kfnky2dyy",
        "cmd292fx3045eob8kquagfw47"
    ]
    
    print("📊 Preserving existing cmd IDs:")
    print("-" * 50)
    
    for cmd_id in test_cmd_ids:
        preserved_id = preserve_or_generate_id(cmd_id)
        print(f"Original: {cmd_id}")
        print(f"Preserved: {preserved_id}")
        print(f"          {'✅' if preserved_id == cmd_id else '❌'}")
        print()
    
    print("🎯 UUID conversion test completed!")

if __name__ == "__main__":
    test_uuid_conversion()
