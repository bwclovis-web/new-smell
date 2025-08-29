# S&S Complete Import Script

This script imports the `s&scomplete.csv` file into your database, specifically importing perfume houses.

## Prerequisites

1. **Database Setup**: Ensure your PostgreSQL database is running and accessible
2. **Environment Variables**: Make sure your `DATABASE_URL` is properly configured
3. **Dependencies**: The script uses `@prisma/client` and `csv-parser` which are already included in your project

## Usage

### Option 1: Using npm script (Recommended)

```bash
npm run import:s&s
```

### Option 2: Direct execution

```bash
node scripts/import_s_and_s_complete.js
```

## What the Script Does

1. **Reads the CSV**: Parses the `enriched_data/s&scomplete.csv` file
2. **Data Validation**: Cleans and validates each row before import
3. **Duplicate Prevention**: Skips houses that already exist in the database
4. **Batch Processing**: Imports data in batches of 100 to avoid overwhelming the database
5. **Error Handling**: Includes retry logic and comprehensive error reporting
6. **Progress Tracking**: Shows real-time progress and final statistics

## Data Mapping

The script maps CSV columns to database fields as follows:

| CSV Column    | Database Field | Notes                                                               |
| ------------- | -------------- | ------------------------------------------------------------------- |
| `name`        | `name`         | Required field, must be unique                                      |
| `description` | `description`  | Optional                                                            |
| `image`       | `image`        | Optional, URL or image path                                         |
| `website`     | `website`      | Optional, URL                                                       |
| `country`     | `country`      | Optional                                                            |
| `founded`     | `founded`      | Optional, founding year                                             |
| `email`       | `email`        | Optional                                                            |
| `phone`       | `phone`        | Optional                                                            |
| `address`     | `address`      | Optional                                                            |
| `type`        | `type`         | Mapped to HouseType enum (indie/niche/designer/celebrity/drugstore) |

## House Type Mapping

- **niche** → `niche`
- **designer** → `designer`
- **celebrity** → `celebrity`
- **drugstore** → `drugstore`
- **default** → `indie`

## Configuration

You can modify these constants in the script:

```javascript
const CSV_FILE_PATH = path.join(
  process.cwd(),
  "enriched_data",
  "s&scomplete.csv"
);
const BATCH_SIZE = 100; // Number of houses to process per batch
const MAX_RETRIES = 3; // Maximum retry attempts for failed imports
```

## Output

The script provides detailed logging including:

- 📊 Progress indicators every 100 rows
- 🔄 Batch processing status
- ✅ Successfully imported houses
- ⏭️ Skipped houses (already exist)
- ❌ Failed imports with error details
- 📊 Final statistics summary

## Example Output

```
🚀 Starting S&S Complete import...
📁 Reading from: /path/to/enriched_data/s&scomplete.csv
📊 Processed 100 rows...
📊 Processed 200 rows...

📋 CSV parsing complete. Found 6547 valid houses to import.

🔄 Processing batch 1/66
✅ Created house: 1+1
✅ Created house: 19-69
⏭️  House "1907" already exists
...

🎉 Import complete!
📊 Final Statistics:
   Total rows processed: 6548
   Houses imported: 6540
   Houses skipped (already exist): 8
   Errors: 0
   Duration: 45.23 seconds
🔌 Database connection closed.
```

## Error Handling

- **Retry Logic**: Failed imports are retried up to 3 times with exponential backoff
- **Data Validation**: Invalid rows are logged and skipped
- **Database Errors**: Connection issues and constraint violations are handled gracefully
- **Graceful Shutdown**: Database connections are properly closed even on errors

## Troubleshooting

### Common Issues

1. **File Not Found**: Ensure `s&scomplete.csv` exists in the `enriched_data` directory
2. **Database Connection**: Check your `DATABASE_URL` environment variable
3. **Permission Issues**: Ensure the script has read access to the CSV file
4. **Memory Issues**: For very large files, consider reducing `BATCH_SIZE`

### Database Constraints

- House names must be unique
- All string fields have reasonable length limits
- The script handles these constraints gracefully

## Performance

- **Batch Processing**: Processes 100 houses at a time
- **Streaming**: Uses Node.js streams for memory-efficient CSV parsing
- **Connection Pooling**: Leverages Prisma's connection management
- **Progress Tracking**: Minimal overhead for logging

## Safety Features

- **Duplicate Prevention**: Won't create duplicate houses
- **Transaction Safety**: Each house import is atomic
- **Rollback Capability**: Failed imports don't affect successful ones
- **Data Validation**: Ensures data quality before import

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify your database connection and permissions
3. Ensure the CSV file format matches expectations
4. Check that all required dependencies are installed
