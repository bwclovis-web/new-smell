# Enriching Perfumes with Missing Notes and Descriptions

This guide explains how to use the Research Crew (also known as the "embellish crew") to enrich perfumes that have missing notes or descriptions.

## Overview

The Research Crew is an AI-powered system that:
- 🔍 Researches perfumes from multiple sources (Fragrantica, Basenotes, etc.)
- ✍️ Generates film noir-themed descriptions
- 🎵 Finds and categorizes fragrance notes (top/heart/base)
- ✅ Reviews and validates the enriched data

## Quick Start

### Step 1: Export Perfumes with Missing Data

Export perfumes missing notes or descriptions to a CSV file:

```bash
# Export perfumes missing notes OR descriptions (default)
node scripts/export-missing-data-for-crew.js

# Export only perfumes missing notes
node scripts/export-missing-data-for-crew.js --missing-notes

# Export only perfumes missing descriptions
node scripts/export-missing-data-for-crew.js --missing-descriptions

# Export to a specific file
node scripts/export-missing-data-for-crew.js --output=csv/missing-data.csv
```

This creates a CSV file in the `csv/` directory with all perfumes that need enrichment.

### Step 2: Run the Research Crew

Navigate to the crews directory and run the research crew on the exported CSV:

```bash
cd crews/scripts

# Run on the exported CSV (limit to first 10 for testing)
python run_research_crew.py --csv ../../csv/perfumes-missing-data-YYYY-MM-DD.csv --limit 10

# Run on all perfumes (no limit)
python run_research_crew.py --csv ../../csv/perfumes-missing-data-YYYY-MM-DD.csv

# Specify custom output file
python run_research_crew.py \
  --csv ../../csv/perfumes-missing-data-YYYY-MM-DD.csv \
  --output perfumes_enriched_missing_data.csv \
  --limit 10
```

### Step 3: Review Enriched Data

The Research Crew generates an enriched CSV file in the `csv_noir/` directory. Review it before importing:

```bash
# Check the output location (shown in the crew output)
# Usually: csv_noir/perfumes_enriched_YYYY-MM-DD_HH-MM-SS.csv

# View the enriched data
head -20 csv_noir/perfumes_enriched_*.csv
```

### Step 4: Import Enriched Data (Optional)

If you're satisfied with the enriched data, you can import it back to the database. However, note that the Research Crew generates **film noir-themed descriptions** which may not match your existing description style. Review carefully before importing.

```bash
# Import the enriched CSV (if needed)
npm run import:csv csv_noir/perfumes_enriched_YYYY-MM-DD_HH-MM-SS.csv --dir=csv_noir
```

## Detailed Workflow

### Understanding the Export Script

The `export-missing-data-for-crew.js` script:

1. **Queries the database** for all perfumes
2. **Filters perfumes** based on:
   - Missing notes (no notes in any category)
   - Missing descriptions (empty or null description)
3. **Exports to CSV** in the format expected by the Research Crew:
   - `name` - Perfume name
   - `description` - Current description (if any)
   - `image` - Image URL (if any)
   - `perfumeHouse` - House/brand name
   - `openNotes` - Top notes (JSON array)
   - `heartNotes` - Heart notes (JSON array)
   - `baseNotes` - Base notes (JSON array)
   - `detailURL` - Fragrantica/product URL (empty, will be found by crew)

### Understanding the Research Crew

The Research Crew (`crews/scripts/run_research_crew.py`) processes perfumes in the following steps:

1. **Research Phase**:
   - If `detailURL` exists, scrapes that page directly
   - Otherwise, searches Fragrantica using perfume name + house
   - Extracts images, notes, descriptions, and metadata

2. **Note Categorization**:
   - Categorizes found notes into top/heart/base
   - Validates note names and structures

3. **Description Writing**:
   - Creates a **film noir-themed description**
   - Uses dark, mysterious, sophisticated language
   - 2-3 sentences, 50-150 words

4. **Quality Review**:
   - Validates the description quality
   - Scores the description (0-100)
   - Only approves descriptions with 60+ score

### Output Format

The enriched CSV contains:

- `name` - Perfume name (unchanged)
- `original_description` - Description from the input CSV
- `enriched_description` - **New film noir-styled description**
- `notes` - All notes found (JSON array)
- `sources` - Sources used for research (JSON array)
- `perfumeHouse` - House name
- `image` - Image URL (updated if found)
- `quality_review` - Quality review results
- `timestamp` - When enrichment occurred

## Examples

### Example 1: Enrich Perfumes Missing Notes

```bash
# 1. Export perfumes missing notes
node scripts/export-missing-data-for-crew.js --missing-notes

# Output: csv/perfumes-missing-data-2025-01-15.csv
# Found 45 perfumes missing notes

# 2. Run research crew (test with 5 first)
cd crews/scripts
python run_research_crew.py --csv ../../csv/perfumes-missing-data-2025-01-15.csv --limit 5

# 3. Review output
cat ../../csv_noir/perfumes_enriched_*.csv | head -20

# 4. If satisfied, run on all
python run_research_crew.py --csv ../../csv/perfumes-missing-data-2025-01-15.csv
```

### Example 2: Enrich Perfumes Missing Descriptions

```bash
# 1. Export perfumes missing descriptions
node scripts/export-missing-data-for-crew.js --missing-descriptions

# 2. Run research crew
cd crews/scripts
python run_research_crew.py --csv ../../csv/perfumes-missing-data-2025-01-15.csv --limit 10
```

### Example 3: Process Specific Perfume House

If you want to enrich perfumes from a specific house:

```bash
# 1. Export all missing data
node scripts/export-missing-data-for-crew.js --output=csv/temp-missing.csv

# 2. Filter the CSV for specific house (using grep or text editor)
grep "House Name" csv/temp-missing.csv > csv/house-missing.csv

# 3. Run research crew on filtered CSV
cd crews/scripts
python run_research_crew.py --csv ../../csv/house-missing.csv
```

## Important Notes

### ⚠️ Film Noir Descriptions

The Research Crew generates **film noir-themed descriptions** which are:
- Dark, mysterious, sophisticated
- Use noir vocabulary (shadows, smoke, midnight, etc.)
- May not match your existing description style

**Review carefully** before importing enriched descriptions. You may want to:
- Use only the notes from enriched data
- Keep original descriptions if they're preferred
- Manually edit noir descriptions to match your style

### ⚠️ Processing Time

The Research Crew processes perfumes sequentially:
- **~70-130 seconds per perfume** (depending on sources)
- 10 perfumes = ~12-22 minutes
- 100 perfumes = ~2-3.5 hours

Use `--limit` to test with a small batch first.

### ⚠️ API Costs

The Research Crew uses OpenAI API (GPT-4o-mini by default):
- Each perfume makes multiple API calls
- Costs ~$0.01-0.05 per perfume (depending on data found)
- Monitor your usage if processing large batches

### ⚠️ Rate Limiting

Fragrantica has rate limits. The scraper includes:
- 3-second delay between requests (default)
- Automatic retries on failures
- Respects Fragrantica's robots.txt

If you get rate-limited:
- Increase delay in the scraper settings
- Process in smaller batches
- Wait between batches

## Troubleshooting

### Issue: "No perfumes found with missing data"

**Solution**: Check your filters. The script might be too restrictive. Try:
```bash
# Export all missing data (both notes and descriptions)
node scripts/export-missing-data-for-crew.js
```

### Issue: Research Crew fails on CSV

**Solution**: Check CSV format. Ensure:
- CSV has required columns: `name`, `description`, `image`, `perfumeHouse`, `openNotes`, `heartNotes`, `baseNotes`, `detailURL`
- Notes are JSON arrays: `["note1", "note2"]` or empty arrays `[]`
- UTF-8 encoding

### Issue: No data found during research

**Possible causes**:
- Perfume name doesn't match Fragrantica
- House name incorrect
- Fragrantica doesn't have data for this perfume
- Rate limiting blocked requests

**Solution**: 
- Check the output for warnings
- Verify perfume/house names are correct
- Try searching Fragrantica manually
- Add `detailURL` to CSV if you have a direct link

### Issue: Film noir descriptions don't match style

**Solution**: 
- Import only the notes from enriched CSV
- Keep original descriptions
- Manually edit descriptions to match your style
- Consider creating a custom description writer agent

## Notes-Only Workflow

If you want to enrich existing CSVs with **only notes** (not descriptions), you have two options:

### Option 1: Using Fragrantica Scraper (Recommended)

If your CSV has `detailURL` columns with Fragrantica URLs, use the direct scraper:

```bash
cd crews/research_crew

# Scrape notes from Fragrantica URLs (also updates descriptions if found)
python scrape_from_csv.py ../../csv/your-perfumes.csv

# This creates: csv/your-perfumes_enriched.csv
# With notes from Fragrantica (top/heart/base categorized)
```

**Note**: This script will also update descriptions if found on Fragrantica. If you want to keep your original descriptions, you can:
- Manually review the output and keep original descriptions
- Use a script to merge only the notes column from the enriched CSV

See `crews/research_crew/EXAMPLE_CSV_USAGE.md` for more details.

### Option 2: Notes-Only Mode with Research Crew (Recommended)

For a notes-only workflow without description generation, use the `--notes-only` flag:

```bash
cd crews/scripts

# Research and categorize notes only (no description generation)
python run_research_crew.py --csv ../../csv/your-perfumes.csv --notes-only --limit 10

# Works with or without Fragrantica URLs (will search if needed)
python run_research_crew.py --csv ../../csv/your-perfumes.csv --notes-only
```

**What it does**:
- ✅ Researches notes from Fragrantica (searches if no URL provided)
- ✅ Categorizes notes into top/heart/base
- ✅ Keeps your original descriptions (doesn't generate new ones)
- ✅ Faster than full enrichment (skips description generation and quality review)
- ✅ Works with any CSV format (name, perfumeHouse, detailURL, etc.)

**Output**: The enriched CSV will have:
- Updated notes (top/heart/base categorized)
- Original descriptions (unchanged)
- Updated images (if found)
- All other original fields preserved

This is the best option if you want to enrich notes but keep your existing descriptions.

## Summary

**To enrich perfumes with missing notes/descriptions:**

1. **Export**: `node scripts/export-missing-data-for-crew.js`
2. **Run Crew**: `cd crews/scripts && python run_research_crew.py --csv ../../csv/perfumes-missing-data-*.csv --limit 10`
3. **Review**: Check `csv_noir/perfumes_enriched_*.csv`
4. **Import** (optional): Import if satisfied with results

**Remember**: The Research Crew generates film noir descriptions. Review before importing!

