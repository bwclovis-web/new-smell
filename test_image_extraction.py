#!/usr/bin/env python3
"""
Test script for image extraction functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from production_enrichment_system import extract_image_from_website

def test_image_extraction():
    """Test image extraction from various perfume house websites."""
    
    # Test URLs - some popular perfume houses
    test_urls = [
        "https://www.creed.com",
        "https://www.tomford.com",
        "https://www.byredo.com",
        "https://www.lelabofragrances.com"
    ]
    
    print("🧪 Testing Image Extraction Functionality")
    print("=" * 50)
    
    for url in test_urls:
        print(f"\n🔍 Testing: {url}")
        try:
            image_url = extract_image_from_website(url)
            if image_url:
                print(f"✅ Image found: {image_url}")
            else:
                print("❌ No image found")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n🎯 Test completed!")

if __name__ == "__main__":
    test_image_extraction()
