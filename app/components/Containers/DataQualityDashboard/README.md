# Data Quality Dashboard

A dashboard to monitor and track the quality of perfume data in the database.

## Features

- Visual representation of missing data and duplicates
- Breakdown by brand for quick identification of problem areas
- Historical tracking of progress
- Integration with data analysis scripts

## Usage

### Viewing the Dashboard

Access the dashboard at `/admin/data-quality`. This page is restricted to administrators.

### Generating Reports

Reports can be generated manually by running the report generation script:

```bash
node scripts/generate_data_quality_reports.js
```

This will create markdown, CSV, and JSON reports in the `docs/reports` directory.

### Scheduled Reports

Set up a cron job to run the report generation script regularly:

```bash
# Run daily at midnight
0 0 * * * cd /path/to/project && node scripts/generate_data_quality_reports.js
```

## Implementation Details

### Dashboard Component

The dashboard visualizes data from the analysis scripts using Chart.js and displays summary statistics.

### API Endpoint

The `/api/data-quality` endpoint runs the Python analysis scripts and returns formatted data for the dashboard.

### Report Generation

The `generate_data_quality_reports.js` script can be scheduled to run periodically to track progress over time.

## Dependencies

- chart.js: For visualizing data
- react-chartjs-2: React wrapper for Chart.js
- Python analysis scripts in the `scraper` directory
