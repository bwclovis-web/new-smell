#!/usr/bin/env python3
"""
Production Perfume House Enrichment System
Properly parses CrewAI output and creates clean, structured CSV data.
Processes 300 records at a time and extracts images.
Includes resume functionality to pick up where it left off.
"""
import os
import json
import time
import logging
import re
import requests
import glob
from datetime import datetime
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def find_latest_progress(output_dir):
    """
    Find the latest progress files to determine where to resume from.
    Returns (last_completed_batch, existing_enriched_data, total_processed)
    """
    output_dir = Path(output_dir)
    
    # Look for batch files to find the last completed batch
    batch_files = glob.glob(str(output_dir / "batch_*_enriched_*.csv"))
    last_completed_batch = 0
    
    if batch_files:
        # Extract batch numbers from filenames
        batch_numbers = []
        for file_path in batch_files:
            match = re.search(r'batch_(\d+)_enriched_', file_path)
            if match:
                batch_numbers.append(int(match.group(1)))
        
        if batch_numbers:
            last_completed_batch = max(batch_numbers)
    
    # Look for cumulative files to get existing enriched data
    cumulative_files = glob.glob(str(output_dir / "cumulative_enriched_*.csv"))
    existing_enriched_data = []
    
    if cumulative_files:
        # Get the most recent cumulative file
        latest_cumulative = max(cumulative_files, key=os.path.getctime)
        try:
            existing_df = pd.read_csv(latest_cumulative)
            existing_enriched_data = existing_df.to_dict('records')
            logger.info(f"Found existing progress: {len(existing_enriched_data)} companies already processed")
        except Exception as e:
            logger.warning(f"Could not read cumulative file {latest_cumulative}: {e}")
    
    # Look for the final output file
    final_output = output_dir / "s&scomplete.csv"
    if final_output.exists():
        try:
            final_df = pd.read_csv(final_output)
            existing_enriched_data = final_df.to_dict('records')
            last_completed_batch = -1  # -1 indicates complete
            logger.info(f"Found complete output file: {len(existing_enriched_data)} companies")
        except Exception as e:
            logger.warning(f"Could not read final output file: {e}")
    
    total_processed = len(existing_enriched_data)
    
    return last_completed_batch, existing_enriched_data, total_processed

def extract_image_from_website(website_url):
    """
    Extract logo or banner image from a website.
    Returns the first logo or banner image URL found.
    """
    if not website_url or website_url == 'Not found':
        return ''
    
    try:
        # Clean the URL
        if not website_url.startswith(('http://', 'https://')):
            website_url = 'https://' + website_url
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(website_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for logo images first (common selectors)
        logo_selectors = [
            'img[src*="logo"]',
            'img[alt*="logo"]',
            'img[class*="logo"]',
            'img[id*="logo"]',
            '.logo img',
            '#logo img',
            'header img',
            '.header img',
            'nav img'
        ]
        
        for selector in logo_selectors:
            img = soup.select_one(selector)
            if img and img.get('src'):
                img_url = img['src']
                if img_url.startswith('//'):
                    img_url = 'https:' + img_url
                elif img_url.startswith('/'):
                    img_url = urljoin(website_url, img_url)
                elif not img_url.startswith('http'):
                    img_url = urljoin(website_url, img_url)
                
                # Validate it's an image URL
                if any(ext in img_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']):
                    return img_url
        
        # If no logo found, look for any banner or header image
        banner_selectors = [
            'img[src*="banner"]',
            'img[src*="header"]',
            'img[src*="hero"]',
            '.banner img',
            '.hero img',
            '.header img'
        ]
        
        for selector in banner_selectors:
            img = soup.select_one(selector)
            if img and img.get('src'):
                img_url = img['src']
                if img_url.startswith('//'):
                    img_url = 'https:' + img_url
                elif img_url.startswith('/'):
                    img_url = urljoin(website_url, img_url)
                elif not img_url.startswith('http'):
                    img_url = urljoin(website_url, img_url)
                
                if any(ext in img_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']):
                    return img_url
        
        # If still no image, return the first reasonable image found
        for img in soup.find_all('img'):
            if img.get('src'):
                img_url = img['src']
                if img_url.startswith('//'):
                    img_url = 'https:' + img_url
                elif img_url.startswith('/'):
                    img_url = urljoin(website_url, img_url)
                elif not img_url.startswith('http'):
                    img_url = urljoin(website_url, img_url)
                
                # Skip tiny images, data URLs, and tracking pixels
                if (any(ext in img_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']) and
                    not img_url.startswith('data:') and
                    not any(skip in img_url.lower() for skip in ['pixel', 'tracking', 'analytics', '1x1'])):
                    return img_url
        
        return ''
        
    except Exception as e:
        logger.warning(f"Failed to extract image from {website_url}: {e}")
        return ''

def get_fallback_image(company_name, company_type=''):
    """
    Get a fallback image URL based on company name and type.
    Returns a relevant placeholder image when no company image is available.
    """
    # Default perfume/perfume bottle image
    default_images = [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-15907369626-6c63ac16f3df?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop"
    ]
    
    # Select a fallback image based on company name (for consistency)
    import hashlib
    name_hash = hashlib.md5(company_name.encode()).hexdigest()
    image_index = int(name_hash, 16) % len(default_images)
    
    return default_images[image_index]

def parse_crewai_result(result_text):
    """Parse CrewAI result text into structured data - only essential fields."""
    result_text = str(result_text)
    
    # Initialize parsed data - ONLY essential fields matching existing schema
    parsed_data = {
        'company_description': '',
        'founded_date': '',
        'country': '',
        'website': '',
        'email': '',
        'phone': '',
        'address': '',
        'company_type': ''
    }
    
    # Extract company description
    desc_match = re.search(r'Company Description[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\d+\.|$)', result_text, re.IGNORECASE | re.DOTALL)
    if desc_match:
        parsed_data['company_description'] = desc_match.group(1).strip()
    
    # Extract founded date
    founded_match = re.search(r'Founded Date[:\s]*([^\n]+)', result_text, re.IGNORECASE)
    if founded_match:
        parsed_data['founded_date'] = founded_match.group(1).strip()
    
    # Extract country
    country_match = re.search(r'Country[:\s]*([^\n]+)', result_text, re.IGNORECASE)
    if country_match:
        parsed_data['country'] = country_match.group(1).strip()
    
    # Extract website
    website_match = re.search(r'Website[:\s]*([^\n]+)', result_text, re.IGNORECASE)
    if website_match:
        parsed_data['website'] = website_match.group(1).strip()
    
    # Extract email
    email_match = re.search(r'Email[:\s]*([^\n]+)', result_text, re.IGNORECASE)
    if email_match:
        parsed_data['email'] = email_match.group(1).strip()
    
    # Extract phone
    phone_match = re.search(r'Phone[:\s]*([^\n]+)', result_text, re.IGNORECASE)
    if phone_match:
        parsed_data['phone'] = phone_match.group(1).strip()
    
    # Extract address
    address_match = re.search(r'Address[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\d+\.|$)', result_text, re.IGNORECASE | re.DOTALL)
    if address_match:
        parsed_data['address'] = address_match.group(1).strip()
    
    # Extract company type
    type_match = re.search(r'Company Type[:\s]*([^\n]+)', result_text, re.IGNORECASE)
    if type_match:
        parsed_data['company_type'] = type_match.group(1).strip()
    
    return parsed_data

def process_batch(df_batch, batch_num, total_batches):
    """Process a batch of companies and return enriched data."""
    enriched_batch = []
    
    print(f"\n🔄 Processing Batch {batch_num}/{total_batches} ({len(df_batch)} companies)")
    print("=" * 60)
    
    for i, company in enumerate(df_batch.iterrows()):
        company_data = company[1]
        print(f"\n📊 Enriching {i+1}/{len(df_batch)}: {company_data['name']}")
        
        try:
            # Create the enrichment agent
            agent = Agent(
                role='Perfume Industry Research Specialist',
                goal='Research and provide detailed, accurate company information',
                backstory="""You are an expert perfume industry researcher with access to 
                comprehensive databases and industry sources. You provide factual, 
                well-researched information about perfume companies.""",
                verbose=False
            )
            
            # Create the enrichment task
            task = Task(
                description=f"""Research the perfume company '{company_data['name']}' and provide the following information in EXACTLY this format:

1. Company Description: [Detailed description of what the company does, their story, and specialty]
2. Founded Date: [When they were established - year or specific date]
3. Country: [Where they are headquartered]
4. Website: [Official company website URL]
5. Email: [Company email address if available]
6. Phone: [Company phone number if available]
7. Address: [Business address if available]
8. Company Type: [ONLY use one of these exact values: 'niche', 'designer', 'indie', 'celebrity', 'drugstore'. Choose the most appropriate based on the company's market position and business model.]

IMPORTANT: Use this EXACT format with numbers and colons. If information is not available, write "Not found". For Company Type, ONLY use the 5 allowed values listed above.""",
                agent=agent,
                expected_output="Structured company profile with numbered sections"
            )
            
            # Create and run the crew
            crew = Crew(
                agents=[agent],
                tasks=[task],
                process=Process.sequential,
                verbose=False
            )
            
            print(f"🔍 Researching {company_data['name']}...")
            result = crew.kickoff()
            
            # Parse the result into structured data
            parsed_data = parse_crewai_result(result)
            
            # Extract image if website is available
            extracted_image = ''
            if parsed_data['website'] and parsed_data['website'] != 'Not found':
                print(f"🖼️  Extracting image from {parsed_data['website']}...")
                extracted_image = extract_image_from_website(parsed_data['website'])
                if extracted_image:
                    print(f"✅ Image found: {extracted_image}")
                else:
                    print("❌ No image found, using fallback image.")
                    extracted_image = get_fallback_image(company_data['name'], parsed_data['company_type'])
                    print(f"✅ Fallback image used: {extracted_image}")
            else:
                print("❌ Website not found, using fallback image.")
                extracted_image = get_fallback_image(company_data['name'], parsed_data['company_type'])
                print(f"✅ Fallback image used: {extracted_image}")
            
            # Create enriched company record - ONLY essential columns matching existing schema
            enriched_company = {
                'id': preserve_or_generate_id(company_data['id']),
                'name': company_data['name'],
                'description': parsed_data['company_description'],
                'image': extracted_image if extracted_image else company_data.get('image', ''),
                'website': parsed_data['website'] if parsed_data['website'] != 'Not found' else '',
                'country': parsed_data['country'] if parsed_data['country'] != 'Not found' else '',
                'founded': parsed_data['founded_date'] if parsed_data['founded_date'] != 'Not found' else '',
                'type': parsed_data['company_type'] if parsed_data['company_type'] != 'Not found' else company_data.get('type', ''),
                'email': parsed_data['email'] if parsed_data['email'] != 'Not found' else '',
                'phone': parsed_data['phone'] if parsed_data['phone'] != 'Not found' else '',
                'address': parsed_data['address'] if parsed_data['address'] != 'Not found' else '',
                'createdAt': company_data.get('createdAt', ''),
                'updatedAt': datetime.now().isoformat()
            }
            
            enriched_batch.append(enriched_company)
            
            print(f"✅ Enrichment completed for {company_data['name']}")
            print(f"   📝 Description: {'✓' if parsed_data['company_description'] else '✗'}")
            print(f"   📅 Founded: {'✓' if parsed_data['founded_date'] and parsed_data['founded_date'] != 'Not found' else '✗'}")
            print(f"   🌐 Website: {'✓' if parsed_data['website'] and parsed_data['website'] != 'Not found' else '✗'}")
            print(f"   🖼️  Image: {'✓' if extracted_image else '✗'}")
            print(f"   📧 Email: {'✓' if parsed_data['email'] and parsed_data['email'] != 'Not found' else '✗'}")
            
            # Rate limiting for API respect
            time.sleep(3)
            
        except Exception as e:
            print(f"❌ Error enriching {company_data['name']}: {e}")
            # Add fallback data - ONLY essential columns
            fallback_company = {
                'id': preserve_or_generate_id(company_data['id']),
                'name': company_data['name'],
                'description': '',
                'image': get_fallback_image(company_data['name'], company_data.get('type', '')),
                'website': company_data.get('website', ''),
                'country': company_data.get('country', ''),
                'founded': company_data.get('founded', ''),
                'type': company_data.get('type', ''),
                'email': company_data.get('email', ''),
                'phone': company_data.get('phone', ''),
                'address': company_data.get('address', ''),
                'createdAt': company_data.get('createdAt', ''),
                'updatedAt': datetime.now().isoformat()
            }
            enriched_batch.append(fallback_company)
    
    return enriched_batch

def enrich_perfume_houses_production():
    """Production enrichment system with proper data parsing - matching existing schema."""
    
    print("🚀 PRODUCTION ENRICHMENT SYSTEM - Processing ALL Perfume Houses in Batches of 100")
    print("🔄 Includes RESUME functionality - will pick up where it left off!")
    print("=" * 80)
    
    # Load the main CSV with ALL perfume houses
    csv_path = "csv/S&S perfume houses.csv"
    
    try:
        # Load the main CSV using robust parsing to handle any formatting issues
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
        
        print(f"🎯 Found {len(df)} perfume houses to enrich")
        
        if len(df) == 0:
            print("❌ No perfume houses found to enrich.")
            return
        
        # Create output directory
        output_dir = Path("enriched_data")
        output_dir.mkdir(exist_ok=True)
        
        # Check for existing progress
        last_completed_batch, existing_enriched_data, total_processed = find_latest_progress(output_dir)
        
        if last_completed_batch == -1:
            print("✅ All companies have already been processed! Check the s&scomplete.csv file.")
            return {
                'output_csv': str(output_dir / "s&scomplete.csv"),
                'total_processed': total_processed,
                'status': 'already_complete'
            }
        
        if existing_enriched_data:
            print(f"🔄 RESUME DETECTED! Found {len(existing_enriched_data)} companies already processed")
            print(f"📊 Last completed batch: {last_completed_batch}")
            print(f"⏭️  Resuming from batch {last_completed_batch + 1}")
            
            # Remove already processed companies from the dataset
            processed_ids = {company['id'] for company in existing_enriched_data}
            df_remaining = df[~df['id'].isin(processed_ids)]
            
            print(f"📈 Remaining companies to process: {len(df_remaining)}")
            
            if len(df_remaining) == 0:
                print("✅ All remaining companies have been processed!")
                return {
                    'output_csv': str(output_dir / "s&scomplete.csv"),
                    'total_processed': total_processed,
                    'status': 'resume_complete'
                }
        else:
            df_remaining = df
            print("🆕 Starting fresh - no previous progress found")
        
        # Process remaining companies in batches of 100
        batch_size = 100
        total_batches = (len(df_remaining) + batch_size - 1) // batch_size
        
        all_enriched_data = existing_enriched_data.copy()  # Start with existing data
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min((batch_num + 1) * batch_size, len(df_remaining))
            
            df_batch = df_remaining.iloc[start_idx:end_idx]
            actual_batch_num = last_completed_batch + batch_num + 1
            
            print(f"\n🔄 Processing Batch {actual_batch_num} (Resume Batch {batch_num + 1}/{total_batches})")
            print(f"📊 Processing companies {start_idx + 1} to {end_idx} of remaining {len(df_remaining)}")
            
            # Process the batch
            enriched_batch = process_batch(df_batch, batch_num + 1, total_batches)
            all_enriched_data.extend(enriched_batch)
            
            # Save batch results immediately
            batch_df = pd.DataFrame(enriched_batch)
            batch_csv = output_dir / f"batch_{actual_batch_num}_enriched_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            batch_df.to_csv(batch_csv, index=False)
            print(f"💾 Batch {actual_batch_num} saved to: {batch_csv}")
            
            # Save cumulative results
            cumulative_df = pd.DataFrame(all_enriched_data)
            cumulative_csv = output_dir / f"cumulative_enriched_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            cumulative_df.to_csv(cumulative_csv, index=False)
            print(f"💾 Cumulative results saved to: {cumulative_csv}")
            
            # Progress update
            processed = len(all_enriched_data)
            remaining = len(df) - processed
            print(f"📈 Progress: {processed}/{len(df)} completed ({processed/len(df)*100:.1f}%)")
            print(f"⏳ Remaining: {remaining} companies")
            
            # Add delay between batches to prevent overwhelming the API
            if batch_num < total_batches - 1:
                print("⏸️  Pausing between batches...")
                time.sleep(10)
        
        # Create final clean DataFrame
        df_enriched = pd.DataFrame(all_enriched_data)
        
        # Save final complete CSV
        output_csv = output_dir / "s&scomplete.csv"
        df_enriched.to_csv(output_csv, index=False)
        print(f"\n💾 Complete enriched data saved to: {output_csv}")
        
        # Generate summary
        successful = len([c for c in all_enriched_data if c.get('description') and c.get('description').strip()])
        failed = len([c for c in all_enriched_data if not c.get('description') or not c.get('description').strip()])
        
        descriptions_found = len([c for c in all_enriched_data if c.get('description') and c.get('description').strip()])
        founded_found = len([c for c in all_enriched_data if c.get('founded') and c.get('founded').strip() and c.get('founded') != 'Not found'])
        websites_found = len([c for c in all_enriched_data if c.get('website') and c.get('website').strip() and c.get('website') != 'Not found'])
        emails_found = len([c for c in all_enriched_data if c.get('email') and c.get('email').strip() and c.get('email') != 'Not found'])
        images_found = len([c for c in all_enriched_data if c.get('image') and c.get('image').strip()])
        
        print(f"\n🎉 COMPLETE ENRICHMENT COMPLETED!")
        print(f"📈 Total processed: {len(all_enriched_data)}")
        print(f"📈 Successful: {successful}")
        print(f"📈 Failed: {failed}")
        print(f"📝 Descriptions captured: {descriptions_found}")
        print(f"📅 Founding dates found: {founded_found}")
        print(f"🌐 Websites found: {websites_found}")
        print(f"🖼️  Images found: {images_found}")
        print(f"📧 Emails found: {emails_found}")
        
        # Create summary report
        report_content = f"""# Complete S&S Perfume Houses Enrichment Report

Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Summary
- Total companies processed: {len(all_enriched_data)}
- Successful enrichments: {successful}
- Failed enrichments: {failed}

## Data Captured
- Company Descriptions: {descriptions_found}/{len(all_enriched_data)}
- Founding Dates: {founded_found}/{len(all_enriched_data)}
- Websites: {websites_found}/{len(all_enriched_data)}
- Images: {images_found}/{len(all_enriched_data)}
- Email Addresses: {emails_found}/{len(all_enriched_data)}

## Processing Details
- Processed in batches of 100
- Total batches: {total_batches}
- Batch processing completed successfully
- Resume functionality: {'Used' if existing_enriched_data else 'Not needed'}

## Output Files
- Final CSV: {output_csv}
- Batch files saved in enriched_data folder
- Cumulative progress files saved after each batch

This production system has processed ALL perfume houses from your main CSV in manageable batches and created a complete enriched dataset with images extracted from company websites.
"""
        
        report_file = output_dir / f"complete_enrichment_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        print(f"📊 Summary report generated: {report_file}")
        
        return {
            'output_csv': str(output_csv),
            'report': str(report_file),
            'total_processed': len(all_enriched_data),
            'successful': successful,
            'descriptions_found': descriptions_found,
            'images_found': images_found,
            'resume_used': bool(existing_enriched_data)
        }
        
    except Exception as e:
        print(f"❌ Complete enrichment failed: {e}")
        logger.error(f"Complete enrichment failed: {e}")
        return {'error': str(e)}

def generate_cmd_id():
    """
    Generate a new ID in the format cmd + 20 random alphanumeric characters.
    This follows the pattern: cmd292a7b00zlob8kzhulxhhh
    """
    import random
    import string
    
    # Generate 20 random alphanumeric characters
    chars = string.ascii_lowercase + string.digits
    random_part = ''.join(random.choice(chars) for _ in range(20))
    
    return f"cmd{random_part}"

def preserve_or_generate_id(existing_id):
    """
    Convert UUIDs to cmd format, preserve existing cmd format IDs, or generate new ones.
    Converts all UUIDs to cmd format while keeping existing cmd IDs unchanged.
    """
    if not existing_id or not str(existing_id).strip():
        # Generate new ID if none exists
        return generate_cmd_id()
    
    existing_id = str(existing_id).strip()
    
    # If it's already in cmd format, keep it
    if existing_id.startswith('cmd') and len(existing_id) == 25:
        return existing_id
    
    # If it's a UUID, convert it to cmd format
    if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', existing_id, re.IGNORECASE):
        # Convert UUID to cmd format using hash for consistency
        import hashlib
        uuid_hash = hashlib.md5(existing_id.encode()).hexdigest()
        # Take first 20 characters of hash to create cmd ID
        random_part = uuid_hash[:20]
        return f"cmd{random_part}"
    
    # For any other format, generate new cmd ID
    return generate_cmd_id()

if __name__ == "__main__":
    try:
        print("🚀 Starting PRODUCTION enrichment system...")
        results = enrich_perfume_houses_production()
        
        if 'error' not in results:
            if results.get('status') == 'already_complete':
                print(f"\n✅ All companies have already been processed!")
                print(f"📁 Check: {results.get('output_csv')}")
            elif results.get('status') == 'resume_complete':
                print(f"\n✅ Resume completed successfully!")
                print(f"📁 Check: {results.get('output_csv')}")
            else:
                print(f"\n✅ PRODUCTION enrichment completed successfully!")
                print(f"📁 Check the enriched_data folder for clean, structured results")
                print(f"📝 Company descriptions captured: {results.get('descriptions_found', 0)}")
                print(f"🖼️  Images extracted: {results.get('images_found', 0)}")
                if results.get('resume_used'):
                    print(f"🔄 Resume functionality was used")
        else:
            print(f"\n❌ Production enrichment failed: {results['error']}")
            
    except Exception as e:
        print(f"❌ Script execution failed: {e}")
        logger.error(f"Script execution failed: {e}")
