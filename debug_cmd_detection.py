#!/usr/bin/env python3
"""
Debug script to see why cmd ID detection is failing
"""
import re

def test_cmd_detection():
    """Test cmd ID detection logic."""
    
    test_ids = [
        "cmd292a7b00zlob8kzhulxhhh",
        "cmd2929l300jhob8kfnky2dyy", 
        "cmd292fx3045eob8kquagfw47",
        "454da245-c613-4a46-b51d-815fd47606d6",
        "af9a5783-00d8-4cb0-b42c-d79f464c719f"
    ]
    
    print("🧪 DEBUGGING CMD ID DETECTION")
    print("=" * 50)
    
    for test_id in test_ids:
        print(f"\n🔍 Testing ID: {test_id}")
        print(f"   Length: {len(test_id)}")
        print(f"   Starts with 'cmd': {test_id.startswith('cmd')}")
        print(f"   Is 23 chars: {len(test_id) == 23}")
        
        # Check if it's already in cmd format
        is_cmd_format = test_id.startswith('cmd') and len(test_id) == 23
        print(f"   Is cmd format: {is_cmd_format}")
        
        # Check if it's a UUID
        is_uuid = bool(re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', test_id, re.IGNORECASE))
        print(f"   Is UUID: {is_uuid}")
        
        # Show what would happen
        if is_cmd_format:
            print(f"   Action: PRESERVE (keep as is)")
        elif is_uuid:
            print(f"   Action: CONVERT to cmd")
        else:
            print(f"   Action: GENERATE new cmd")

if __name__ == "__main__":
    test_cmd_detection()
