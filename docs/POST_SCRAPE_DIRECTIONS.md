# Post-Scrape Directions

After scraping perfume data, you'll need to clean and validate the CSV file before importing it into the database. This guide covers the post-scrape workflow.

## Overview

The post-scrape process involves:
1. **Validating Notes** - Using CrewAI to identify and extract only valid fragrance notes
2. **Cleaning Formatting** - Removing line breaks, normalizing whitespace, and fixing CSV escaping

Both steps are combined into a single script for convenience.

## Quick Start

```bash
# From project root
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv

# Or from scraper directory
cd scraper
python clean_and_validate_csv.py ../csv/perfumes_birchandbesom.csv
```

This will:
- Validate all notes using CrewAI
- Clean CSV formatting (remove line breaks, fix quotes)
- Output to `csv/perfumes_birchandbesom_cleaned.csv`

## Script: `clean_and_validate_csv.py`

### Location
`scraper/clean_and_validate_csv.py`

### What It Does

1. **Note Validation (CrewAI)**
   - Removes invalid entries like:
     - Descriptive phrases (e.g., "a basket of freshly-picked berries")
     - Product information and ingredient lists
     - Incomplete fragments (e.g., "an elixir of", "drizzled")
     - Meta-text about the scent (e.g., "scent", "evocative of")
   - Keeps only valid fragrance notes (e.g., "vanilla", "jasmine", "sandalwood")
   - Normalizes notes to lowercase
   - Removes duplicates

2. **Formatting Cleanup**
   - Removes line breaks from descriptions (converts to spaces)
   - Normalizes whitespace (multiple spaces → single space)
   - Properly escapes quotes for CSV format
   - Validates JSON in notes fields
   - Ensures consistent formatting

### Usage

**Basic usage (validates notes AND cleans formatting):**
```bash
python scraper/clean_and_validate_csv.py <input_csv> [output_csv]
```

**Examples:**
```bash
# Auto-generate output filename (adds '_cleaned' before .csv)
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv

# Specify output filename
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv csv/perfumes_birchandbesom_final.csv

# Skip note validation (only clean formatting)
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv --no-validate
```

### Options

- `<input_csv>` - Path to the CSV file to process (required)
- `[output_csv]` - Optional output filename (default: adds `_cleaned` before `.csv`)
- `--no-validate` - Skip CrewAI note validation, only clean formatting

### Requirements

- Python 3.9+
- CrewAI dependencies (if validating notes)
- `.env` file with `OPENAI_API_KEY` (if validating notes)

## Alternative: `validate_notes.py` (Convenience Wrapper)

For backward compatibility, there's also a wrapper script:

```bash
python scraper/validate_notes.py csv/perfumes_birchandbesom.csv
```

This is equivalent to running `clean_and_validate_csv.py` with note validation enabled.

## Workflow Example

### Step 1: Run the Scraper
```bash
python scraper/birchandbesom-scraper.py
```

This creates: `csv/perfumes_birchandbesom.csv`

### Step 2: Clean and Validate
```bash
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv
```

This creates: `csv/perfumes_birchandbesom_cleaned.csv`

### Step 3: Review the Output
- Check the cleaned CSV for any issues
- Verify notes look correct
- Ensure descriptions are properly formatted

### Step 4: Import to Database
Use your standard import script to load the cleaned CSV into the database.

## What Gets Cleaned

### Notes Validation
**Before:**
```json
["pinecone gelée makrut lime mousse", "topped pecan cream", "cardamom foam", "brown sugar tuile", "available products", "why youll love", "ingredients"]
```

**After:**
```json
["cardamom"]
```

### Description Formatting
**Before:**
```
Space Queen is an ode to my favorite strain and breezy summer nights...
Available Products:
1ml Sample Oil - Jojoba-based perfume oil...
WHY YOU'LL LOVE IT
🤍 Naturally hypoallergenic...
```

**After:**
```
Space Queen is an ode to my favorite strain and breezy summer nights... Available Products: 1ml Sample Oil - Jojoba-based perfume oil... WHY YOU'LL LOVE IT 🤍 Naturally hypoallergenic...
```

## Troubleshooting

### "ModuleNotFoundError" or Import Errors
**Solution:** Make sure you're running from the project root or have the correct Python path:
```bash
# From project root (recommended)
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv

# Or activate virtual environment first
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

### "AuthenticationError: Invalid API key"
**Solution:** Check your `.env` file has the correct `OPENAI_API_KEY`:
```bash
# In project root .env file
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### "CSV file not found"
**Solution:** Use correct path relative to where you're running the script:
```bash
# From project root
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv

# From scraper directory
python clean_and_validate_csv.py ../csv/perfumes_birchandbesom.csv
```

### Notes Still Contain Invalid Entries
**Solution:** The CrewAI validation might miss some edge cases. You can:
1. Review the output manually
2. Run validation again (it's idempotent)
3. Manually edit the CSV if needed

### Want to Skip Note Validation
If you only want to clean formatting (faster, no API calls):
```bash
python scraper/clean_and_validate_csv.py csv/perfumes_birchandbesom.csv --no-validate
```

## Best Practices

1. **Always validate notes** - Invalid notes can cause issues in the database
2. **Review output** - Check the cleaned CSV before importing
3. **Keep originals** - Don't overwrite your original scraped CSV
4. **Test with small batches** - If processing many perfumes, test with a few first
5. **Check costs** - CrewAI validation uses OpenAI API (costs ~$0.01-0.02 per perfume)

## Related Documentation

- [Scraper Documentation](../scraper/README.md) - How to create and run scrapers
- [CrewAI Usage](../crews/README.md) - More about CrewAI validation
- [Import Scripts](../scripts/import-csv.ts) - How to import cleaned CSVs to database

## Scripts Reference

| Script | Purpose | Notes |
|--------|---------|-------|
| `clean_and_validate_csv.py` | Main script - validates notes & cleans formatting | Recommended |
| `validate_notes.py` | Wrapper for backward compatibility | Calls `clean_and_validate_csv.py` |
| `clean_notes_csv.py` (in crews/) | Core CrewAI note validation logic | Used internally |

## Output Files

The script generates output files with the pattern:
- Input: `csv/perfumes_house.csv`
- Output: `csv/perfumes_house_cleaned.csv` (default)
- Or: `csv/perfumes_house_final.csv` (if specified)

Always review the cleaned output before importing to the database.

