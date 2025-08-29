#!/usr/bin/env python3
"""
Automated Perfume House Validation System
Provides ongoing validation and quality assurance for CSV imports.
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('automated_validation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AutomatedValidationSystem:
    """Automated system for validating and enriching perfume house data."""
    
    def __init__(self):
        """Initialize the automated validation system."""
        self.output_dir = Path("automated_validation")
        self.output_dir.mkdir(exist_ok=True)
        
        # Configuration
        self.batch_size = 10  # Process companies in batches
        self.rate_limit_delay = 3  # Seconds between API calls
        self.max_retries = 3
        
    def validate_csv_batch(self, csv_path: str, start_row: int = 0, batch_size: int = None) -> Dict:
        """
        Validate a batch of companies from a CSV file.
        
        Args:
            csv_path: Path to the CSV file
            start_row: Starting row index (0-based)
            batch_size: Number of companies to process in this batch
            
        Returns:
            Dictionary with validation results
        """
        if batch_size is None:
            batch_size = self.batch_size
            
        print(f"🔍 Starting automated validation for CSV: {csv_path}")
        print(f"📊 Processing rows {start_row} to {start_row + batch_size}")
        
        try:
            # Load CSV data
            df = pd.read_csv(csv_path)
            total_companies = len(df)
            
            # Calculate batch boundaries
            end_row = min(start_row + batch_size, total_companies)
            batch_df = df.iloc[start_row:end_row]
            
            print(f"📋 Batch contains {len(batch_df)} companies")
            
            # Process the batch
            validated_data = []
            
            for idx, company in batch_df.iterrows():
                company_data = company.to_dict()
                print(f"\n📊 Processing {idx + 1}/{end_row}: {company_data.get('name', 'Unknown')}")
                
                try:
                    # Create validation agent
                    agent = Agent(
                        role='Automated Perfume Industry Validator',
                        goal='Quickly validate if companies are legitimate perfume/fragrance businesses',
                        backstory="""You are an efficient perfume industry validator that quickly 
                        determines company types using industry knowledge and research.""",
                        verbose=False
                    )
                    
                    # Create validation task
                    task = Task(
                        description=f"""Quickly validate the company '{company_data.get('name', 'Unknown')}':

                        REQUIRED OUTPUT FORMAT:
                        - Business Type: [what they actually do]
                        - Perfume-Related: [Yes/No with brief evidence]
                        - Confidence: [High/Medium/Low]
                        - Key Evidence: [1-2 key points]
                        
                        Be concise but accurate. Focus on speed and reliability.""",
                        agent=agent,
                        expected_output="Quick validation with business type and perfume-related status"
                    )
                    
                    # Run validation
                    crew = Crew(
                        agents=[agent],
                        tasks=[task],
                        process=Process.sequential,
                        verbose=False
                    )
                    
                    result = crew.kickoff()
                    
                    # Process result
                    validated_company = company_data.copy()
                    validated_company['validation_result'] = str(result)
                    validated_company['validation_status'] = 'completed'
                    validated_company['validation_timestamp'] = datetime.now().isoformat()
                    
                    # Extract key information
                    result_str = str(result)
                    result_lower = result_str.lower()
                    
                    # Determine business type
                    if "not perfume" in result_lower or "not a perfume" in result_lower:
                        validated_company['actual_business_type'] = 'NOT_PERFUME'
                        validated_company['enrichment_recommended'] = False
                    elif "perfume" in result_lower and "yes" in result_lower:
                        validated_company['actual_business_type'] = 'PERFUME_RELATED'
                        validated_company['enrichment_recommended'] = True
                    else:
                        validated_company['actual_business_type'] = 'UNCERTAIN'
                        validated_company['enrichment_recommended'] = False
                    
                    # Extract confidence
                    if "confidence: high" in result_lower:
                        validated_company['validation_confidence'] = 'high'
                    elif "confidence: medium" in result_lower:
                        validated_company['validation_confidence'] = 'medium'
                    elif "confidence: low" in result_lower:
                        validated_company['validation_confidence'] = 'low'
                    else:
                        validated_company['validation_confidence'] = 'unknown'
                    
                    validated_data.append(validated_company)
                    print(f"✅ Validated: {company_data.get('name', 'Unknown')} - Type: {validated_company['actual_business_type']}")
                    
                    # Rate limiting
                    time.sleep(self.rate_limit_delay)
                    
                except Exception as e:
                    print(f"❌ Error validating {company_data.get('name', 'Unknown')}: {e}")
                    # Add fallback data
                    fallback_company = company_data.copy()
                    fallback_company['validation_status'] = 'failed'
                    fallback_company['actual_business_type'] = 'ERROR'
                    fallback_company['enrichment_recommended'] = False
                    fallback_company['validation_confidence'] = 'none'
                    fallback_company['validation_result'] = f"Error: {str(e)}"
                    fallback_company['validation_timestamp'] = datetime.now().isoformat()
                    validated_data.append(fallback_company)
            
            # Save batch results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            batch_id = f"batch_{start_row}_{end_row}_{timestamp}"
            
            # Save as CSV
            output_csv = self.output_dir / f"validated_batch_{batch_id}.csv"
            df_validated = pd.DataFrame(validated_data)
            df_validated.to_csv(output_csv, index=False)
            
            # Save as JSON
            output_json = self.output_dir / f"validated_batch_{batch_id}.json"
            with open(output_json, 'w', encoding='utf-8') as f:
                json.dump(validated_data, f, indent=2, ensure_ascii=False)
            
            # Generate batch summary
            perfume_related = len([c for c in validated_data if c.get('actual_business_type') == 'PERFUME_RELATED'])
            not_perfume = len([c for c in validated_data if c.get('actual_business_type') == 'NOT_PERFUME'])
            uncertain = len([c for c in validated_data if c.get('actual_business_type') == 'UNCERTAIN'])
            errors = len([c for c in validated_data if c.get('actual_business_type') == 'ERROR'])
            
            batch_summary = {
                'batch_id': batch_id,
                'csv_path': csv_path,
                'start_row': start_row,
                'end_row': end_row,
                'total_processed': len(validated_data),
                'perfume_related': perfume_related,
                'not_perfume': not_perfume,
                'uncertain': uncertain,
                'errors': errors,
                'output_csv': str(output_csv),
                'output_json': str(output_json),
                'timestamp': timestamp
            }
            
            print(f"\n💾 Batch results saved:")
            print(f"📁 CSV: {output_csv}")
            print(f"📁 JSON: {output_json}")
            print(f"\n📊 Batch Summary:")
            print(f"📈 Perfume-related: {perfume_related}")
            print(f"📈 Not perfume-related: {not_perfume}")
            print(f"📈 Uncertain: {uncertain}")
            print(f"📈 Errors: {errors}")
            
            return batch_summary
            
        except Exception as e:
            print(f"❌ Batch validation failed: {e}")
            logger.error(f"Batch validation failed: {e}")
            return {'error': str(e)}
    
    def validate_entire_csv(self, csv_path: str, batch_size: int = None) -> Dict:
        """
        Validate an entire CSV file in batches.
        
        Args:
            csv_path: Path to the CSV file
            batch_size: Number of companies to process per batch
            
        Returns:
            Dictionary with overall validation results
        """
        if batch_size is None:
            batch_size = self.batch_size
            
        print(f"🚀 Starting full CSV validation: {csv_path}")
        
        try:
            # Get total number of companies
            df = pd.read_csv(csv_path)
            total_companies = len(df)
            total_batches = (total_companies + batch_size - 1) // batch_size
            
            print(f"📊 Total companies: {total_companies}")
            print(f"📊 Total batches: {total_batches}")
            print(f"📊 Batch size: {batch_size}")
            
            all_batch_results = []
            
            # Process all batches
            for batch_num in range(total_batches):
                start_row = batch_num * batch_size
                print(f"\n🔄 Processing batch {batch_num + 1}/{total_batches}")
                print(f"📊 Rows {start_row} to {min(start_row + batch_size, total_companies)}")
                
                batch_result = self.validate_csv_batch(csv_path, start_row, batch_size)
                all_batch_results.append(batch_result)
                
                # Progress update
                progress = ((batch_num + 1) / total_batches) * 100
                print(f"📈 Progress: {progress:.1f}% complete")
                
                # Brief pause between batches
                if batch_num < total_batches - 1:
                    time.sleep(5)
            
            # Generate overall summary
            overall_summary = self._generate_overall_summary(all_batch_results, csv_path)
            
            # Save overall results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            overall_csv = self.output_dir / f"overall_validation_{timestamp}.csv"
            overall_json = self.output_dir / f"overall_validation_{timestamp}.json"
            
            # Combine all batch results
            all_validated_data = []
            for batch_result in all_batch_results:
                if 'output_csv' in batch_result:
                    batch_df = pd.read_csv(batch_result['output_csv'])
                    all_validated_data.extend(batch_df.to_dict('records'))
            
            # Save combined results
            df_combined = pd.DataFrame(all_validated_data)
            df_combined.to_csv(overall_csv, index=False)
            
            with open(overall_json, 'w', encoding='utf-8') as f:
                json.dump(all_validated_data, f, indent=2, ensure_ascii=False)
            
            overall_summary['overall_csv'] = str(overall_csv)
            overall_summary['overall_json'] = str(overall_json)
            
            print(f"\n🎉 Full CSV validation completed!")
            print(f"📁 Overall results saved to:")
            print(f"   📄 CSV: {overall_csv}")
            print(f"   📄 JSON: {overall_json}")
            
            return overall_summary
            
        except Exception as e:
            print(f"❌ Full CSV validation failed: {e}")
            logger.error(f"Full CSV validation failed: {e}")
            return {'error': str(e)}
    
    def _generate_overall_summary(self, batch_results: List[Dict], csv_path: str) -> Dict:
        """Generate overall summary from all batch results."""
        
        total_perfume_related = sum(b.get('perfume_related', 0) for b in batch_results)
        total_not_perfume = sum(b.get('not_perfume', 0) for b in batch_results)
        total_uncertain = sum(b.get('uncertain', 0) for b in batch_results)
        total_errors = sum(b.get('errors', 0) for b in batch_results)
        total_processed = sum(b.get('total_processed', 0) for b in batch_results)
        
        overall_summary = {
            'csv_path': csv_path,
            'total_batches': len(batch_results),
            'total_processed': total_processed,
            'total_perfume_related': total_perfume_related,
            'total_not_perfume': total_not_perfume,
            'total_uncertain': total_uncertain,
            'total_errors': total_errors,
            'success_rate': ((total_processed - total_errors) / total_processed * 100) if total_processed > 0 else 0,
            'perfume_ratio': (total_perfume_related / total_processed * 100) if total_processed > 0 else 0,
            'batch_results': batch_results,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"\n📊 OVERALL VALIDATION SUMMARY:")
        print(f"📈 Total companies processed: {total_processed}")
        print(f"📈 Perfume-related: {total_perfume_related} ({overall_summary['perfume_ratio']:.1f}%)")
        print(f"📈 Not perfume-related: {total_not_perfume}")
        print(f"📈 Uncertain: {total_uncertain}")
        print(f"📈 Errors: {total_errors}")
        print(f"📈 Success rate: {overall_summary['success_rate']:.1f}%")
        
        return overall_summary
    
    def quick_validation(self, company_names: List[str]) -> List[Dict]:
        """
        Quick validation for a list of company names.
        
        Args:
            company_names: List of company names to validate
            
        Returns:
            List of validation results
        """
        print(f"⚡ Quick validation for {len(company_names)} companies")
        
        validated_companies = []
        
        for i, name in enumerate(company_names):
            print(f"\n📊 Quick validation {i+1}/{len(company_names)}: {name}")
            
            try:
                # Create quick validation agent
                agent = Agent(
                    role='Quick Perfume Validator',
                    goal='Quickly determine if a company is perfume-related',
                    backstory="""You are a fast perfume industry validator that makes quick 
                    but accurate assessments.""",
                    verbose=False
                )
                
                # Create quick task
                task = Task(
                    description=f"""Quick validation: Is '{name}' a perfume/fragrance company?

                    OUTPUT: Just "YES" or "NO" with 1-2 word reason.
                    Example: "YES - perfume house" or "NO - food company" """,
                    agent=agent,
                    expected_output="Quick YES/NO with brief reason"
                )
                
                # Run quick validation
                crew = Crew(
                    agents=[agent],
                    tasks=[task],
                    process=Process.sequential,
                    verbose=False
                )
                
                result = crew.kickoff()
                
                # Process result
                result_str = str(result).strip().upper()
                is_perfume = result_str.startswith('YES')
                
                validated_company = {
                    'name': name,
                    'is_perfume_related': is_perfume,
                    'quick_result': str(result),
                    'validation_timestamp': datetime.now().isoformat()
                }
                
                validated_companies.append(validated_company)
                print(f"✅ {name}: {'PERFUME' if is_perfume else 'NOT PERFUME'}")
                
                # Quick rate limiting
                time.sleep(1)
                
            except Exception as e:
                print(f"❌ Error validating {name}: {e}")
                validated_companies.append({
                    'name': name,
                    'is_perfume_related': None,
                    'quick_result': f"Error: {str(e)}",
                    'validation_timestamp': datetime.now().isoformat()
                })
        
        return validated_companies

def main():
    """Main function for testing the automated validation system."""
    
    # Initialize the system
    validator = AutomatedValidationSystem()
    
    print("🤖 Automated Perfume House Validation System")
    print("=" * 50)
    
    # Example usage
    print("\n1. Quick validation example:")
    test_companies = ["Chanel", "Nike", "Acqua di Parma", "McDonald's"]
    quick_results = validator.quick_validation(test_companies)
    
    print("\n2. Batch validation example:")
    # You can test with your CSV files here
    # batch_result = validator.validate_csv_batch("your_file.csv", 0, 5)
    
    print("\n✅ Automated validation system ready for use!")
    print("📁 Output directory: automated_validation/")
    print("📊 Use validate_csv_batch() for small batches")
    print("🚀 Use validate_entire_csv() for full files")
    print("⚡ Use quick_validation() for quick checks")

if __name__ == "__main__":
    main()
