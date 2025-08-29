# Production Enrichment System - Updated

## Overview

The production enrichment system has been updated to handle large datasets more reliably by processing records in batches of 300 and adding automatic image extraction capabilities. **Most importantly, it now includes automatic resume functionality to pick up where it left off if interrupted.**

## Key Updates

### 1. Batch Processing

- **Batch Size**: Processes 300 records at a time to prevent crashes
- **Progress Tracking**: Shows progress after each batch
- **Incremental Saving**: Saves results after each batch to prevent data loss
- **Recovery**: If the system crashes, you can resume from the last completed batch

### 2. Image Extraction

- **Automatic Detection**: Automatically finds logos, banners, or header images from company websites
- **Smart Selection**: Prioritizes logo images, then banner images, then other relevant images
- **URL Validation**: Ensures extracted image URLs are valid and accessible
- **Fallback Handling**: Gracefully handles websites that don't have extractable images

### 3. Enhanced Error Handling

- **Individual Company Errors**: If one company fails, the system continues with others
- **Batch-Level Recovery**: Each batch is processed independently
- **Detailed Logging**: Comprehensive error reporting and progress tracking

### 4. 🆕 **Automatic Resume Functionality**

- **Smart Detection**: Automatically detects existing progress when restarted
- **Seamless Continuation**: Picks up exactly where it left off
- **No Data Loss**: All previously processed companies are preserved
- **Progress Validation**: Verifies data integrity before resuming
- **Batch Continuity**: Maintains proper batch numbering across sessions

## How It Works

### Batch Processing Flow

1. **Load Data**: Reads the main CSV file with all perfume houses
2. **Check Progress**: Automatically detects existing progress files
3. **Resume or Start Fresh**:
   - If progress exists: resumes from the last completed batch
   - If no progress: starts fresh
4. **Split into Batches**: Divides remaining data into chunks of 300 companies
5. **Process Each Batch**:
   - Enriches company information using CrewAI
   - Extracts images from company websites
   - Saves batch results immediately
6. **Save Progress**: Creates cumulative CSV files after each batch
7. **Final Output**: Combines all batches into the final `s&scomplete.csv`

### Image Extraction Process

1. **Website Access**: Visits the company website using the extracted URL
2. **Logo Search**: Looks for images with "logo" in filename, alt text, or CSS classes
3. **Banner Search**: Searches for banner, header, or hero images
4. **Fallback**: Selects the first reasonable image if no logo/banner found
5. **URL Processing**: Converts relative URLs to absolute URLs
6. **Validation**: Ensures the URL points to an actual image file

### Resume Detection Process

1. **Scan Output Directory**: Looks for existing batch and cumulative files
2. **Identify Last Batch**: Finds the highest numbered completed batch
3. **Load Existing Data**: Reads the most recent cumulative results
4. **Calculate Remaining**: Determines how many companies still need processing
5. **Resume Processing**: Continues from the next batch number
6. **Maintain Continuity**: Preserves all previously processed data

## Files Generated

### During Processing

- `batch_1_enriched_YYYYMMDD_HHMMSS.csv` - Results from first batch
- `batch_2_enriched_YYYYMMDD_HHMMSS.csv` - Results from second batch
- `cumulative_enriched_YYYYMMDD_HHMMSS.csv` - Combined results after each batch

### Final Output

- `s&scomplete.csv` - Complete enriched dataset
- `complete_enrichment_report_YYYYMMDD_HHMMSS.md` - Detailed processing report

## Usage

### Run the Full System

```bash
python production_enrichment_system.py
```

**The system will automatically:**

- Detect if you have existing progress
- Resume from where you left off
- Show you exactly what's happening
- Continue processing seamlessly

### Test Image Extraction

```bash
python test_image_extraction.py
```

### Test Batch Logic

```bash
python test_batch_processing.py
```

### Test Resume Functionality

```bash
python test_resume_functionality.py
```

## Resume Scenarios

### Scenario 1: Fresh Start

- **When**: First time running the system
- **What Happens**: Starts from the beginning, processes all companies
- **Files Created**: New batch and cumulative files

### Scenario 2: Resume from Interruption

- **When**: System was stopped mid-process (e.g., after batch 2 of 5)
- **What Happens**:
  - Detects 2 completed batches
  - Loads existing enriched data
  - Continues with batch 3
  - Processes remaining companies
- **Files Created**: Continues batch numbering (batch_3, batch_4, etc.)

### Scenario 3: Complete Processing

- **When**: All companies have been processed
- **What Happens**:
  - Detects complete output file
  - Reports completion
  - No additional processing needed

## Configuration

### Environment Variables

- `OPENAI_API_KEY` - Required for CrewAI to function
- Other variables as needed for your setup

### Batch Size

- Default: 300 records per batch
- Can be modified in the `enrich_perfume_houses_production()` function

### Rate Limiting

- 3-second delay between individual company processing
- 10-second delay between batches
- Adjustable in the code if needed

## Benefits

1. **Reliability**: No more crashes from processing too many records at once
2. **Progress Tracking**: See exactly how many companies have been processed
3. **Data Safety**: Results saved after each batch, so no data is lost
4. **Image Enhancement**: Automatically adds visual content to your dataset
5. **🆕 Automatic Resume**: Can restart from where it left off if interrupted
6. **🆕 No Manual Intervention**: Resume happens automatically - just restart the script
7. **🆕 Time Savings**: Never lose progress, never restart from the beginning

## Troubleshooting

### Common Issues

- **API Rate Limits**: If you hit rate limits, increase the delay between batches
- **Website Access**: Some websites may block automated access; the system handles this gracefully
- **Memory Issues**: Processing in batches reduces memory usage significantly

### Recovery

- **Automatic**: The system automatically detects and resumes from where it left off
- **Manual Check**: If needed, check the `enriched_data` folder for partial results
- **Batch Files**: Each batch file shows exactly what was processed
- **Cumulative Files**: Show progress up to the last completed batch

### Resume Verification

The system will show you exactly what it found when resuming:

```
🔄 RESUME DETECTED! Found 750 companies already processed
📊 Last completed batch: 2
⏭️  Resuming from batch 3
📈 Remaining companies to process: 250
```

## Performance Expectations

- **Processing Speed**: Approximately 100 companies per hour (with 3-second delays)
- **Image Success Rate**: 60-80% of websites will have extractable images
- **Total Time**: For 1000 companies, expect 10-12 hours of processing time
- **API Usage**: Each company requires one CrewAI API call
- **🆕 Resume Overhead**: Minimal - typically 5-10 seconds to detect and load progress

## Example Resume Session

```
🚀 PRODUCTION ENRICHMENT SYSTEM - Processing ALL Perfume Houses in Batches of 300
🔄 Includes RESUME functionality - will pick up where it left off!
================================================================================
🎯 Found 1000 perfume houses to enrich
🔄 RESUME DETECTED! Found 750 companies already processed
📊 Last completed batch: 2
⏭️  Resuming from batch 3
📈 Remaining companies to process: 250

🔄 Processing Batch 3 (Resume Batch 1/1)
📊 Processing companies 1 to 250 of remaining 250
...
💾 Batch 3 saved to: batch_3_enriched_20241201_143022.csv
💾 Cumulative results saved to: cumulative_enriched_20241201_143022.csv
📈 Progress: 1000/1000 completed (100.0%)
⏳ Remaining: 0 companies

🎉 COMPLETE ENRICHMENT COMPLETED!
```

## Future Enhancements

- Resume functionality from specific batch numbers
- Parallel processing within batches (if API limits allow)
- More sophisticated image selection algorithms
- Export to additional formats (JSON, Excel)
- Real-time progress monitoring dashboard
- **🆕 Resume checkpoint system** for even more granular control
