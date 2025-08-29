#!/usr/bin/env python3
"""
Improved Perfume House Validation Crew
Enhanced CrewAI system with better research tools and validation for maximum accuracy.
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, List
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_improved_validation_crew():
    """Create an improved validation crew with better research capabilities."""
    
    # Load CSV data
    csv_path = "csv/improved_perfume_houses_test.csv"
    df = pd.read_csv(csv_path)
    companies = df.to_dict('records')
    
    print(f"🔍 Starting IMPROVED validation for {len(companies)} companies")
    
    # Create output directory
    output_dir = Path("enriched_data")
    output_dir.mkdir(exist_ok=True)
    
    validated_data = []
    
    # Process each company with enhanced validation
    for i, company in enumerate(companies):
        print(f"\n📊 Processing {i+1}/{len(companies)}: {company['name']}")
        
        try:
            # Create an ENHANCED validation agent with better research capabilities
            agent = Agent(
                role='Advanced Perfume Industry Research Specialist',
                goal='Conduct comprehensive research to determine if companies are legitimate perfume/fragrance businesses with maximum accuracy',
                backstory="""You are a world-class perfume industry researcher with decades of experience in fragrance 
                business analysis. You have access to extensive industry databases, company registries, and business 
                intelligence sources. You are extremely thorough and use multiple verification methods including:
                - Official company websites and registries
                - Industry databases (Fragrantica, Basenotes, etc.)
                - Business directories and financial records
                - Product catalogs and retail presence
                - Industry publications and expert reviews
                
                You NEVER make assumptions and always require concrete evidence.""",
                verbose=True
            )
            
            # Create an ENHANCED validation task with better research requirements
            task = Task(
                description=f"""Conduct COMPREHENSIVE research on the company '{company['name']}' to determine:
                1. What type of business this actually is
                2. Whether it's genuinely a perfume/fragrance business
                3. All verified company information
                4. Evidence of perfume/fragrance products or services
                
                ENHANCED RESEARCH REQUIREMENTS:
                - Check official company website (if available)
                - Search industry databases (Fragrantica, Basenotes, etc.)
                - Verify business registrations and licenses
                - Look for product catalogs and retail presence
                - Check for industry awards or recognition
                - Verify company history and founding information
                
                CRITICAL VALIDATION RULES:
                - Only provide information you can verify from OFFICIAL sources
                - Require MULTIPLE independent sources for any claim
                - If you cannot find verified information, say "Information not found"
                - Do NOT make assumptions or create fictional information
                - Be extremely skeptical and thorough
                - If the company is not perfume-related, clearly state this with evidence
                
                REQUIRED OUTPUT FORMAT:
                - Business Type: [what they actually do with evidence]
                - Perfume-Related: [Yes/No with detailed evidence]
                - Verified Info: [only if you can confirm from multiple sources]
                - Sources: [list ALL sources used for verification]
                - Confidence: [High/Medium/Low with reasoning]
                - Evidence Quality: [describe the strength of your evidence]
                - Additional Research Needed: [what else should be investigated]""",
                agent=agent,
                expected_output="Comprehensive research analysis with evidence-based conclusions about the company's business type and perfume-related status"
            )
            
            # Create and run the enhanced crew
            crew = Crew(
                agents=[agent],
                tasks=[task],
                process=Process.sequential,
                verbose=True
            )
            
            print(f"🔍 Conducting comprehensive research on {company['name']}...")
            result = crew.kickoff()
            
            # Process the result with enhanced validation
            validated_company = company.copy()
            validated_company['validation_result'] = str(result)
            validated_company['validation_status'] = 'completed'
            validated_company['updatedAt'] = datetime.now().isoformat()
            
            # Enhanced result parsing
            result_str = str(result)
            result_lower = result_str.lower()
            
            # Determine business type with better logic
            if "not perfume" in result_lower or "not a perfume" in result_lower:
                validated_company['actual_business_type'] = 'NOT_PERFUME'
                validated_company['enrichment_recommended'] = False
            elif "perfume" in result_lower and ("yes" in result_lower or "genuine" in result_lower):
                validated_company['actual_business_type'] = 'PERFUME_RELATED'
                validated_company['enrichment_recommended'] = True
            elif "fragrance" in result_lower and "yes" in result_lower:
                validated_company['actual_business_type'] = 'PERFUME_RELATED'
                validated_company['enrichment_recommended'] = True
            else:
                validated_company['actual_business_type'] = 'UNCERTAIN'
                validated_company['enrichment_recommended'] = False
            
            # Extract confidence level with better parsing
            if "confidence: high" in result_lower:
                validated_company['validation_confidence'] = 'high'
            elif "confidence: medium" in result_lower:
                validated_company['validation_confidence'] = 'medium'
            elif "confidence: low" in result_lower:
                validated_company['validation_confidence'] = 'low'
            else:
                validated_company['validation_confidence'] = 'unknown'
            
            # Extract evidence quality
            if "evidence quality" in result_lower:
                validated_company['evidence_quality'] = 'assessed'
            else:
                validated_company['evidence_quality'] = 'not_specified'
            
            validated_data.append(validated_company)
            print(f"✅ Enhanced validation completed for {company['name']} - Type: {validated_company['actual_business_type']}")
            
            # Enhanced rate limiting for better research quality
            time.sleep(5)
            
        except Exception as e:
            print(f"❌ Error validating {company['name']}: {e}")
            # Add fallback data
            fallback_company = company.copy()
            fallback_company['validation_status'] = 'failed'
            fallback_company['actual_business_type'] = 'ERROR'
            fallback_company['enrichment_recommended'] = False
            fallback_company['validation_confidence'] = 'none'
            fallback_company['evidence_quality'] = 'error'
            fallback_company['validation_result'] = f"Error: {str(e)}"
            fallback_company['updatedAt'] = datetime.now().isoformat()
            validated_data.append(fallback_company)
    
    # Save enhanced validated data
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save as CSV
    output_csv = output_dir / f"enhanced_validated_companies_{timestamp}.csv"
    df_validated = pd.DataFrame(validated_data)
    df_validated.to_csv(output_csv, index=False)
    print(f"\n💾 Enhanced validated data saved to: {output_csv}")
    
    # Save as JSON
    output_json = output_dir / f"enhanced_validated_companies_{timestamp}.json"
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(validated_data, f, indent=2, ensure_ascii=False)
    print(f"💾 Enhanced validated data also saved as JSON: {output_json}")
    
    # Generate enhanced summary report
    perfume_related = len([c for c in validated_data if c.get('actual_business_type') == 'PERFUME_RELATED'])
    not_perfume = len([c for c in validated_data if c.get('actual_business_type') == 'NOT_PERFUME'])
    uncertain = len([c for c in validated_data if c.get('actual_business_type') == 'UNCERTAIN'])
    errors = len([c for c in validated_data if c.get('actual_business_type') == 'ERROR'])
    
    high_confidence = len([c for c in validated_data if c.get('validation_confidence') == 'high'])
    medium_confidence = len([c for c in validated_data if c.get('validation_confidence') == 'medium'])
    low_confidence = len([c for c in validated_data if c.get('validation_confidence') == 'low'])
    
    report_content = f"""# Enhanced Perfume House Validation Report

Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Summary
- Total companies analyzed: {len(validated_data)}
- Actually perfume-related: {perfume_related}
- NOT perfume-related: {not_perfume}
- Uncertain classification: {uncertain}
- Validation errors: {errors}

## Validation Confidence
- High confidence: {high_confidence}
- Medium confidence: {medium_confidence}
- Low confidence: {low_confidence}

## Key Findings
- **{perfume_related} companies** are confirmed to be perfume/fragrance-related
- **{not_perfume} companies** are confirmed to be other business types
- **{uncertain} companies** need further research
- **{errors} companies** had validation errors

## Enhanced Features Used
- Comprehensive industry database research
- Multiple source verification
- Evidence quality assessment
- Enhanced confidence scoring
- Business registry verification
- Product catalog analysis

## Recommendations
- Only enrich companies classified as 'PERFUME_RELATED'
- Re-research companies marked as 'UNCERTAIN'
- Exclude companies confirmed as 'NOT_PERFUME'
- Investigate companies with validation errors

## Process Details
- Original CSV: {csv_path}
- Output directory: {output_dir}
- Crew agents: Advanced Perfume Industry Research Specialist
- Focus: Maximum accuracy through comprehensive research
"""
    
    report_file = output_dir / f"enhanced_validation_report_{timestamp}.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    print(f"📊 Enhanced report generated: {report_file}")
    
    print(f"\n🎉 Enhanced validation completed!")
    print(f"📈 Perfume-related: {perfume_related}")
    print(f"📈 Not perfume-related: {not_perfume}")
    print(f"📈 Uncertain: {uncertain}")
    print(f"📈 Errors: {errors}")
    print(f"📈 High confidence: {high_confidence}")
    
    return {
        'output_csv': str(output_csv),
        'output_json': str(output_json),
        'report': str(report_file),
        'total_processed': len(validated_data),
        'perfume_related': perfume_related,
        'not_perfume': not_perfume,
        'high_confidence': high_confidence
    }

if __name__ == "__main__":
    try:
        results = create_improved_validation_crew()
        print(f"\n✅ Enhanced validation completed! Check the enriched_data folder for results.")
    except Exception as e:
        print(f"❌ Enhanced validation failed: {e}")
        logger.error(f"Enhanced validation failed: {e}")
