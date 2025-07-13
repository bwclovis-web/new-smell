#!/bin/bash

echo "Starting bulk import of all CSV files..."

CSV_FILES=(
  "csv/bpal_enhanced_progress_1450.csv"
  "csv/perfumes_4160tuesdays_updated.csv"
  "csv/perfumes_akro_updated.csv"
  "csv/perfumes_blackcliff.csv"
  "csv/perfumes_luvmilk.csv"
  "csv/perfumes_navitus_updated.csv"
  "csv/perfumes_pnicolai.csv"
  "csv/perfumes_poesieperfume_updated.csv"
  "csv/perfumes_possets.csv"
  "csv/perfumes_sagegoddess.csv"
  "csv/perfumes_sarahbaker.csv"
  "csv/perfumes_scentsofwood_fixed.csv"
  "csv/perfumes_shopsorce_updated.csv"
  "csv/perfumes_strangesouth_updated.csv"
  "csv/perfumes_thoo.csv"
  "csv/perfumes_tiziana_terenzi.csv"
  "csv/perfumes_xerjoff.csv"
)

for file in "${CSV_FILES[@]}"; do
  echo "Processing $file..."
  node perfume_import.js "$file"
  echo "Completed $file"
  echo "---"
done

echo "All imports completed!"
