# CSV Noir - Film Noir Enriched Perfume Data

This directory contains perfume data enriched with **film noir-themed descriptions**.

## What's Here

When you run the Research Crew, it generates CSV files here with names like:

```
perfumes_enriched_2025-11-01_14-30-45.csv
perfumes_fzotic_enriched_2025-11-01_15-20-10.csv
```

## CSV Structure

Each enriched CSV contains:

| Column                 | Description                         |
| ---------------------- | ----------------------------------- |
| `name`                 | Perfume name                        |
| `original_description` | Original description from source    |
| `enriched_description` | **Film noir-styled description** ⭐ |
| `notes`                | JSON array of all fragrance notes   |
| `sources`              | JSON array of source URLs           |
| `quality_review`       | Quality score and review            |
| `timestamp`            | When it was enriched                |

## Film Noir Style

All enriched descriptions follow the film noir aesthetic:

**Tone**: Dark, mysterious, sophisticated, sensual

**Example**:

> "A shadowy blend that whispers secrets in velvet tones, like a femme fatale's confession in a smoke-filled room. Midnight jasmine mingles with dark leather and amber, while sandalwood smolders beneath like a forgotten cigarette."

## Workflow

```
1. Run Research Crew
   ↓
2. CSV files created HERE (csv_noir/)
   ↓
3. YOU manually review descriptions
   ↓
4. Edit if needed
   ↓
5. Import directly to database using import script
```

## Importing CSV Files to Database

### Overview

The `import-csv-noir.ts` script imports perfume data from CSV files in the `csv_noir/` directory into the database. It intelligently handles duplicates, updates existing records, and manages perfume notes.

### Usage

Import a single CSV file at a time **from this directory**:

```bash
npm run import:csv-noir <filename.csv>
```

**Examples (files must live in `csv_noir/`):**

```bash
# Import Kyse perfumes
npm run import:csv-noir perfumes_kyse.csv

# Import Abaco perfumes
npm run import:csv-noir perfumes_abaco_clean.csv

# Import Fzotic perfumes
npm run import:csv-noir perfumes_fzotic.csv

# Import Zara perfumes
npm run import:csv-noir perfumes_zara.csv
```

> ⚠️ For CSVs stored in the `csv/` directory (non-noir data), create or run a dedicated importer under `scripts/importers/` instead of using this script.

**If you run without a filename:**

```bash
npm run import:csv-noir
```

The script will show an error message and list all available CSV files in the `csv_noir/` directory.

### CSV File Format

Your CSV files must have the following columns:

| Column        | Description                                    | Required | Example                                    |
| ------------- | ---------------------------------------------- | -------- | ------------------------------------------ |
| `name`        | Perfume name                                   | ✅ Yes   | "Zucchero Filato"                          |
| `description` | Film noir-styled description                   | ❌ No    | "Whispers of spun sugar..."                |
| `image`       | Image URL                                      | ❌ No    | "https://assets.bigcartel.com/..."        |
| `perfumeHouse`| Perfume house/brand name                       | ❌ No    | "Kyse Perfumes"                            |
| `openNotes`   | JSON array of top notes                        | ❌ No    | `[""sugar"", ""berries""]`                 |
| `heartNotes`  | JSON array of heart notes                      | ❌ No    | `[""jasmine"", ""rose""]`                  |
| `baseNotes`   | JSON array of base notes                       | ❌ No    | `[""vanilla"", ""sandalwood""]`           |
| `detailURL`   | URL to perfume detail page                     | ❌ No    | "https://kyseperfumes.bigcartel.com/..."   |

**Important Notes:**
- Notes fields should be JSON arrays (e.g., `[""note1"", ""note2""]`)
- Empty arrays should be `[]`
- Fields containing brackets must be quoted (e.g., `"[""note1""]"`)

### How It Works

The import script handles data intelligently:

#### 1. **Uses Existing Notes**
- Checks if notes already exist in the database
- Only creates new notes when needed
- Reuses existing note records to avoid duplicates

#### 2. **Same House, Same Name**
- If a perfume with the same name exists in the **same house**:
  - Updates the existing perfume with any missing information
  - Calculates a "data completeness score" based on:
    - Description (10 points)
    - Image (10 points)
    - Number of notes (2 points each)
  - If duplicates exist, **keeps only the one with the most data**
  - Removes other duplicates automatically

#### 3. **Different House, Same Name**
- If a perfume with the same name exists in a **different house**:
  - Appends the house name to the perfume name
  - Example: "Grey" from "Abaco" becomes "Grey - Abaco"
  - Creates a new perfume record with the renamed version

#### 4. **New Perfume**
- If no perfume with that name exists:
  - Creates a new perfume record
  - Creates perfume house if it doesn't exist
  - Links all notes properly

### Example Output

```
🚀 Starting CSV import from csv_noir...
Importing CSV file: perfumes_kyse.csv
Importing 19 records from perfumes_kyse.csv
Updating existing perfume "Zucchero Filato" from same house (new data has more info)
Found 2 duplicates in same house for "Bonbons Au Lait"
  Deleting duplicate perfume with less data: abc123-def456
Renaming "Grey" to "Grey - Abaco" (different house)
✅ Completed importing 19 records from perfumes_kyse.csv
✅ CSV import completed!
```

### Troubleshooting

**CSV Parse Error: Invalid Opening Quote**
- Make sure fields containing brackets are properly quoted
- Example: `"[""note1"", ""note2""]"` not `[""note1"", ""note2""]`

**File Not Found**
- Verify the CSV file exists in `csv_noir/` directory
- Check the filename spelling (case-sensitive)

**Database Connection Error**
- Ensure your database is running
- Check your `.env` file has correct database credentials

### Safety Features

✅ **No data loss**: Updates existing records instead of replacing  
✅ **Duplicate prevention**: Automatically removes duplicates in same house  
✅ **Note reuse**: Uses existing notes to avoid database bloat  
✅ **One file at a time**: Prevents accidental bulk imports  
✅ **Error handling**: Continues processing even if individual records fail  

## Important: Manual Review Required ⚠️

**DO NOT automatically import these files to the database!**

Always review:

- ✅ Descriptions match film noir style
- ✅ Note categorizations are accurate
- ✅ Quality scores are acceptable (60+)
- ✅ Sources are valid

## Safety

The Research Crew:

- ✅ Outputs ONLY to this directory
- ❌ NEVER modifies `csv/` (original data)
- ❌ NEVER accesses the database
- ✅ You control all imports

## Error Logs

If errors occur during enrichment, you'll also find:

```
perfumes_enriched_2025-11-01_14-30-45.errors.json
```

This contains details about perfumes that failed to enrich.

## Related

- **Run Research Crew**: `cd crews && python scripts/run_research_crew.py`
- **Documentation**: `crews/research_crew/README.md`
- **Film Noir Guide**: `crews/shared/film_noir_style.py`
- **Usage Guide**: `docs/developer/CREWAI_USAGE.md`

---

**Remember**: These are AI-generated descriptions. Always review before using! 🎭


