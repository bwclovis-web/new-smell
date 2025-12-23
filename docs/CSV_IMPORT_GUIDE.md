# CSV Import Guide

This guide explains how to import perfume data from CSV files into the database using the unified import script.

## Overview

The unified CSV import script (`scripts/import-csv.ts`) handles importing perfume data with intelligent duplicate detection and data merging. It automatically:

- **Uses existing notes** from the database (case-insensitive matching)
- **Creates new notes** only when needed
- **Updates existing perfumes** in the same house with missing information
- **Handles duplicates** intelligently:
  - Same house: Updates existing perfume with missing data, keeps the one with most data
  - Different house: Appends "-house name" to perfume name
- **Fixes image URLs** (handles `//` protocol-relative URLs and relative paths)
- **Parses JSON descriptions** with `cleaned_description` and `extracted_notes` fields

## CSV File Format

Your CSV file should have the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `name` | ✅ Yes | Perfume name |
| `description` | ❌ No | Perfume description (can be plain text or JSON with `cleaned_description` and `extracted_notes`) |
| `image` | ❌ No | Image URL (can be protocol-relative `//` or relative `/`) |
| `perfumeHouse` | ❌ No | Perfume house name (will be created if doesn't exist) |
| `openNotes` | ❌ No | JSON array of top/open notes: `["note1", "note2"]` or comma-separated |
| `heartNotes` | ❌ No | JSON array of heart notes: `["note1", "note2"]` or comma-separated |
| `baseNotes` | ❌ No | JSON array of base notes: `["note1", "note2"]` or comma-separated |
| `detailURL` | ❌ No | Optional detail URL (not currently imported) |

### Example CSV

```csv
name,description,image,perfumeHouse,openNotes,heartNotes,baseNotes,detailURL
Almond Milk,"A luscious, indulgent blend...",//example.com/image.jpg,Aroma Kaz,"[""almonds"", ""vanilla""]",[],[],https://example.com/almond-milk
```

## Usage

### Basic Usage

```bash
npm run import:csv <filename.csv> [--dir=<directory>]
```

### Examples

```bash
# Import from csv directory (default)
npm run import:csv perfumes_aromakaz.csv --dir=csv

# Import from csv_noir directory
npm run import:csv perfumes_kyse.csv --dir=csv_noir

# Import from custom directory
npm run import:csv perfumes_custom.csv --dir=../data/csv
```

### Command Options

- `<filename.csv>` - **Required**: The CSV file to import
- `--dir=<directory>` - **Optional**: Directory containing the CSV file (default: `../csv`)

## How It Works

### 1. Duplicate Detection

The script checks for existing perfumes by name:

- **Same house**: Updates the existing perfume with any missing information (description, image, notes)
- **Different house**: Creates a new perfume with name appended: `"Perfume Name - House Name"`
- **Multiple duplicates in same house**: Keeps the one with the most complete data, deletes others

### 2. Data Completeness Scoring

The script calculates a completeness score based on:
- Description: +10 points
- Image: +10 points
- Each note: +2 points

The perfume with the highest score is kept when duplicates exist.

### 3. Note Handling

- **Existing notes**: Found using case-insensitive matching (e.g., "Vanilla" matches "vanilla")
- **New notes**: Created automatically if they don't exist
- **JSON descriptions**: If `openNotes` is empty, the script checks for `extracted_notes` in JSON description fields

### 4. Image URL Fixing

The script automatically fixes:
- Protocol-relative URLs: `//example.com/image.jpg` → `https://example.com/image.jpg`
- Relative paths: Left as-is (you may need to configure a base URL)

### 5. JSON Description Parsing

If a description field contains JSON like:
```json
{
  "cleaned_description": "A beautiful fragrance...",
  "extracted_notes": ["rose", "jasmine", "musk"]
}
```

The script will:
- Extract `cleaned_description` as the perfume description
- Use `extracted_notes` as open notes if `openNotes` column is empty

## Output

The script provides detailed console output:

```
🚀 Starting CSV import...
📁 Importing CSV file: perfumes_aromakaz.csv from directory csv

📦 Importing 297 records from perfumes_aromakaz.csv
  ✏️  Updating existing perfume "Almond Milk" from same house
  🔀 Renaming "Amber Rose" to "Amber Rose - Aroma Kaz" (different house)
  ⏭️  Renamed perfume "Chocolate - Aroma Kaz" already exists, skipping...
  ⏳ Processed 50 of 297 records
  ...
✅ Completed: 295 successful, 2 errors
✅ CSV import completed!
```

### Status Icons

- 📦 Importing records
- ✏️ Updating existing perfume
- 🔀 Renaming perfume (different house)
- ⏭️ Skipping (already exists)
- 🔄 Found duplicates
- 🗑️ Deleting duplicate
- ⏳ Progress update
- ✅ Success
- ❌ Error

## Error Handling

The script continues processing even if individual records fail:

- **Empty name**: Record is skipped
- **Invalid JSON**: Falls back to comma-separated parsing
- **Database errors**: Logged with record details, processing continues
- **File not found**: Error message displayed, script exits

## Best Practices

1. **Backup your database** before importing large files
2. **Test with a small CSV** first to verify the format
3. **Check for duplicates** in your CSV before importing
4. **Use consistent house names** to avoid creating duplicate houses
5. **Validate JSON** in notes columns before importing
6. **Review the output** for any errors or warnings

## Troubleshooting

### "File not found" Error

- Check the file path and name
- Verify the `--dir` parameter points to the correct directory
- Use absolute paths if relative paths don't work

### Duplicate Perfume Names

- The script handles this automatically
- Same house: Updates existing
- Different house: Appends house name
- Check console output for details

### Notes Not Importing

- Verify notes are in JSON array format: `["note1", "note2"]`
- Or use comma-separated format: `note1, note2`
- Check for JSON parsing errors in console output

### Image URLs Not Working

- Protocol-relative URLs (`//`) are automatically fixed
- Relative paths may need a base URL configured
- Verify URLs are accessible

## Related Scripts

- `scripts/import-csv-noir.ts` - Legacy script for csv_noir directory
- `scripts/import-csv-aromakaz.ts` - Legacy script for Aroma Kaz imports

**Note**: The unified `import-csv.ts` script replaces these legacy scripts and should be used for all future imports.

## Support

For issues or questions:
1. Check the console output for error messages
2. Verify your CSV format matches the expected structure
3. Review this documentation
4. Check the script source code for implementation details

