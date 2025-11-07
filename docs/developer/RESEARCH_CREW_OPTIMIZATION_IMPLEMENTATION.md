# Research Crew Optimization Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the optimizations identified in the analysis. The optimizations address both **performance issues** (5-10x improvement) and **missing data issues** (data quality guarantees).

---

## Phase 1: Quick Wins (Implemented ✅)

### 1. Data Validation Module ✅
**File**: `crews/shared/data_validation.py`

**What it does**:
- Validates URLs, images, notes, descriptions before use
- Ensures data quality at each step
- Prevents invalid data from being stored

**Usage**:
```python
from shared.data_validation import DataValidator, EnrichedDataValidator

# Validate individual fields
is_valid, notes = DataValidator.validate_notes(scraped_data.get('notes'))
is_valid, desc = DataValidator.validate_description(scraped_data.get('description'))

# Validate complete enriched data
is_valid, missing_fields, validated_data = EnrichedDataValidator.validate_enriched_data(enriched_data)
completeness_score = EnrichedDataValidator.calculate_completeness_score(enriched_data)
```

### 2. Retry Logic Module ✅
**File**: `crews/shared/retry_logic.py`

**What it does**:
- Exponential backoff retry for failed operations
- Prevents silent failures
- Reduces transient error impact

**Usage**:
```python
from shared.retry_logic import retry_with_backoff, RetryableOperation

# Direct usage
scraped_data = retry_with_backoff(
    lambda: scraper.scrape_perfume(url),
    max_retries=3,
    initial_delay=1.0
)

# Wrapper class
operation = RetryableOperation(
    lambda: scraper.search_and_scrape(name),
    max_retries=3,
    name="Fragrantica search"
)
result = operation.execute()
```

### 3. Caching Module ✅
**File**: `crews/shared/research_cache.py`

**What it does**:
- Caches enriched perfume data
- Avoids redundant research/API calls
- Configurable TTL

**Usage**:
```python
from shared.research_cache import ResearchCache

cache = ResearchCache(ttl_days=30)

# Check cache first
cached_data = cache.get(perfume_name, house)
if cached_data:
    return cached_data

# Cache after enrichment
cache.set(perfume_name, house, enriched_data)
```

---

## Phase 2: Core Optimizations (To Implement)

### Step 1: Update `crew.py` - Add Imports and Initialize Helpers

**Location**: Top of `crews/research_crew/crew.py`

**Changes**:
```python
# Add to imports
from shared.data_validation import DataValidator, EnrichedDataValidator
from shared.retry_logic import retry_with_backoff, RetryableOperation
from shared.research_cache import ResearchCache
from concurrent.futures import ThreadPoolExecutor, as_completed
import os

class ResearchCrew:
    def __init__(self):
        """Initialize the research crew with agents."""
        self.web_scraper = create_web_scraper_agent()
        self.description_writer = create_description_writer_agent()
        self.note_analyzer = create_note_analyzer_agent()
        self.quality_reviewer = create_quality_reviewer_agent()
        
        # Initialize optimization helpers
        self.cache = ResearchCache()
        self.max_workers = int(os.getenv('RESEARCH_MAX_WORKERS', '5'))
```

### Step 2: Update `enrich_perfume` - Add Caching and Validation

**Key Changes**:
1. Check cache first
2. Validate all extracted data
3. Use retry logic for scraping
4. Implement fallback chain
5. Validate before returning

**Implementation**:
```python
def enrich_perfume(self, perfume_name: str, ...):
    # 1. Check cache first
    cached = self.cache.get(perfume_name, perfume_house)
    if cached:
        print(f"✅ Using cached data for {perfume_name}")
        return cached
    
    # 2. Validate inputs
    if not DataValidator.validate_perfume_name(perfume_name):
        raise ValueError(f"Invalid perfume name: {perfume_name}")
    
    # 3. Scrape with retry and validation
    if detail_url:
        scraped_data = self._scrape_with_fallback(detail_url, perfume_name, perfume_house)
        
        # Validate and use scraped data
        if scraped_data:
            image_url = self._validate_and_extract_image(scraped_data, image_url)
            perfume_house = self._validate_and_extract_house(scraped_data, perfume_house)
            existing_notes = self._validate_and_extract_notes(scraped_data, existing_notes)
            original_description = self._validate_and_extract_description(scraped_data, original_description)
    
    # ... rest of enrichment logic ...
    
    # 4. Validate enriched data before returning
    is_valid, missing_fields, validated_data = EnrichedDataValidator.validate_enriched_data(enriched_data)
    completeness_score = EnrichedDataValidator.calculate_completeness_score(validated_data)
    
    validated_data['completeness_score'] = completeness_score
    validated_data['missing_fields'] = missing_fields
    
    if not is_valid:
        print(f"⚠️  Warning: {perfume_name} missing required fields: {missing_fields}")
    
    # 5. Cache validated data
    self.cache.set(perfume_name, perfume_house, validated_data)
    
    return validated_data
```

### Step 3: Add Helper Methods for Data Extraction

**Add to `ResearchCrew` class**:
```python
def _scrape_with_fallback(self, url: str, perfume_name: str, house: str) -> Dict[str, Any]:
    """Scrape with retry and fallback to multiple methods."""
    # Method 1: Direct URL scraping (with retry)
    if 'fragrantica.com' in url.lower():
        operation = RetryableOperation(
            lambda: self._scrape_fragrantica_url(url),
            max_retries=3,
            name=f"Fragrantica scrape: {perfume_name}"
        )
        try:
            return operation.execute()
        except Exception as e:
            print(f"  ⚠️  Fragrantica scrape failed: {e}")
    
    # Method 2: Generic scraping (with retry)
    operation = RetryableOperation(
        lambda: self._scrape_generic_url(url),
        max_retries=2,
        name=f"Generic scrape: {perfume_name}"
    )
    try:
        return operation.execute()
    except Exception as e:
        print(f"  ⚠️  Generic scrape failed: {e}")
    
    # Method 3: Fallback to search
    if house:
        operation = RetryableOperation(
            lambda: self._search_fragrantica(perfume_name, house),
            max_retries=2,
            name=f"Fragrantica search: {perfume_name}"
        )
        try:
            return operation.execute()
        except Exception as e:
            print(f"  ⚠️  Fragrantica search failed: {e}")
    
    return {}

def _validate_and_extract_image(self, scraped_data: Dict, current_image: str) -> str:
    """Extract and validate image URL."""
    if current_image and DataValidator.validate_image_url(current_image):
        return current_image
    
    image = scraped_data.get('image', '')
    if image and DataValidator.validate_image_url(image):
        return image
    
    return current_image  # Return existing or empty

def _validate_and_extract_notes(self, scraped_data: Dict, current_notes: List[str]) -> List[str]:
    """Extract and validate notes."""
    is_valid, validated_notes = DataValidator.validate_notes(current_notes or [])
    current_valid = validated_notes if is_valid else []
    
    scraped_notes = scraped_data.get('notes', {})
    is_valid_scraped, validated_scraped = DataValidator.validate_notes(scraped_notes)
    
    if is_valid_scraped and validated_scraped:
        # Merge and deduplicate
        combined = list(set(current_valid + validated_scraped))
        return combined
    
    return current_valid

def _validate_and_extract_description(self, scraped_data: Dict, current_desc: str) -> str:
    """Extract and validate description."""
    if current_desc:
        is_valid, validated = DataValidator.validate_description(current_desc)
        if is_valid:
            return validated
    
    scraped_desc = scraped_data.get('description', '')
    if scraped_desc:
        is_valid, validated = DataValidator.validate_description(scraped_desc)
        if is_valid:
            return validated
    
    return current_desc or ''
```

### Step 4: Consolidate Crew Executions

**Current**: 3 separate crew executions  
**Optimized**: 1 crew execution with all tasks

**Implementation**:
```python
# Instead of separate executions, combine all tasks
all_tasks = []

# Step 1: Research (if needed)
if sources and len(sources) > 0:
    research_task = create_research_task(
        self.web_scraper,
        perfume_name,
        sources,
        context
    )
    all_tasks.append(research_task)

# Step 2: Note categorization (if we have notes)
if notes:
    categorization_task = create_note_categorization_task(
        self.note_analyzer,
        perfume_name,
        notes
    )
    all_tasks.append(categorization_task)

# Step 3: Description writing
description_task = create_description_writing_task(
    self.description_writer,
    perfume_name,
    str(context),
    notes
)
all_tasks.append(description_task)

# Step 4: Quality review
review_task = create_quality_review_task(
    self.quality_reviewer,
    perfume_name,
    {}  # Will be populated after description
)
all_tasks.append(review_task)

# Single crew execution with all agents
all_agents = [
    self.web_scraper,
    self.note_analyzer,
    self.description_writer,
    self.quality_reviewer
]

crew = Crew(
    agents=all_agents,
    tasks=all_tasks,
    process=Process.sequential,
    verbose=True
)

result = crew.kickoff()  # Single execution instead of 3!
```

### Step 5: Implement Parallel Batch Processing

**Current**: Sequential processing  
**Optimized**: Parallel processing with ThreadPoolExecutor

**Implementation**:
```python
def enrich_batch(
    self,
    perfumes: List[Dict[str, Any]],
    sources: Optional[List[str]] = None,
    output_file: Optional[str] = None,
    max_workers: Optional[int] = None
) -> str:
    """Enrich multiple perfumes in parallel."""
    if max_workers is None:
        max_workers = self.max_workers
    
    print(f"\n{'#'*60}")
    print(f"BATCH ENRICHMENT: {len(perfumes)} perfumes (parallel with {max_workers} workers)")
    print(f"{'#'*60}\n")
    
    enriched_perfumes = []
    errors = []
    
    # Process in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_perfume = {
            executor.submit(
                self._enrich_single_with_error_handling,
                perfume,
                sources
            ): perfume
            for perfume in perfumes
        }
        
        # Process results as they complete
        for future in as_completed(future_to_perfume):
            perfume = future_to_perfume[future]
            try:
                result = future.result()
                if result.get('error'):
                    errors.append(result)
                else:
                    enriched_perfumes.append(result.get('data'))
            except Exception as e:
                errors.append({
                    "perfume": perfume.get('name', 'Unknown'),
                    "error": str(e)
                })
    
    # Generate output CSV
    # ... rest of implementation ...
    
    return str(output_path)

def _enrich_single_with_error_handling(
    self,
    perfume: Dict[str, Any],
    sources: Optional[List[str]]
) -> Dict[str, Any]:
    """Wrapper to handle errors and preserve partial data."""
    try:
        enriched = self.enrich_perfume(
            perfume_name=perfume.get('name', ''),
            sources=perfume.get('sources', sources),
            original_description=perfume.get('description', ''),
            existing_notes=perfume.get('notes', None),
            perfume_house=perfume.get('perfumeHouse', ''),
            image_url=perfume.get('image', ''),
            detail_url=perfume.get('detailURL', '')
        )
        return {'data': enriched, 'error': None}
    except Exception as e:
        # Save partial data if available
        partial_data = {
            'name': perfume.get('name', 'Unknown'),
            'error': str(e),
            'partial_data': perfume  # Preserve input data
        }
        return {'data': None, 'error': partial_data}
```

### Step 6: Improve Research Result Parsing

**Current**: Fragile regex parsing  
**Optimized**: Structured JSON parsing with fallbacks

**Implementation**:
```python
def _parse_research_result(self, result: Any) -> Dict[str, Any]:
    """Parse research crew result with multiple fallback strategies."""
    parsed = {
        'notes': [],
        'descriptions': [],
        'sources': []
    }
    
    result_str = str(result)
    
    # Strategy 1: Try JSON parsing
    try:
        # Look for JSON objects in the result
        import json
        import re
        
        # Try to find JSON block
        json_match = re.search(r'\{.*\}', result_str, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            data = json.loads(json_str)
            
            if 'notes' in data:
                is_valid, notes = DataValidator.validate_notes(data['notes'])
                if is_valid:
                    parsed['notes'] = notes
            
            if 'descriptions' in data:
                descriptions = data['descriptions']
                if isinstance(descriptions, list):
                    parsed['descriptions'] = [
                        d for d in descriptions
                        if DataValidator.validate_description(d)[0]
                    ]
            
            if 'sources' in data:
                parsed['sources'] = data['sources']
            
            return parsed
    except Exception as e:
        print(f"  ⚠️  JSON parsing failed: {e}")
    
    # Strategy 2: Regex fallback (improved)
    try:
        notes_match = re.search(r'"notes":\s*\[(.*?)\]', result_str, re.DOTALL)
        if notes_match:
            notes_str = notes_match.group(1)
            note_items = re.findall(r'"([^"]+)"', notes_str)
            is_valid, validated_notes = DataValidator.validate_notes(note_items)
            if is_valid:
                parsed['notes'] = validated_notes
    except Exception as e:
        print(f"  ⚠️  Regex parsing failed: {e}")
    
    return parsed
```

### Step 7: Validate CSV Output

**Add validation before writing CSV**:
```python
def _write_enriched_csv(self, perfumes: List[Dict[str, Any]], output_path: Path):
    """Write enriched perfume data to CSV with validation."""
    if not perfumes:
        print("⚠️ No perfumes to write")
        return
    
    fieldnames = [
        'name', 'description', 'image', 'perfumeHouse',
        'openNotes', 'heartNotes', 'baseNotes', 'detailURL',
        'completeness_score', 'missing_fields'
    ]
    
    validated_rows = []
    invalid_rows = []
    
    for perfume in perfumes:
        # Validate before writing
        is_valid, missing_fields, validated = EnrichedDataValidator.validate_enriched_data(perfume)
        
        if not is_valid:
            invalid_rows.append({
                'perfume': perfume.get('name', 'Unknown'),
                'missing_fields': missing_fields
            })
            continue
        
        # Categorize notes
        notes = validated.get('notes', [])
        categorized = self._categorize_notes(notes)
        
        row = {
            'name': validated.get('name', ''),
            'description': validated.get('enriched_description', validated.get('original_description', '')),
            'image': validated.get('image', ''),
            'perfumeHouse': validated.get('perfumeHouse', ''),
            'openNotes': json.dumps(categorized['top']),
            'heartNotes': json.dumps(categorized['heart']),
            'baseNotes': json.dumps(categorized['base']),
            'detailURL': validated.get('detailURL', ''),
            'completeness_score': validated.get('completeness_score', 0.0),
            'missing_fields': ', '.join(missing_fields) if missing_fields else ''
        }
        validated_rows.append(row)
    
    # Write validated rows
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(validated_rows)
    
    print(f"✅ Wrote {len(validated_rows)} validated perfumes to {output_path}")
    
    if invalid_rows:
        invalid_file = output_path.with_suffix('.invalid.json')
        with open(invalid_file, 'w', encoding='utf-8') as f:
            json.dump(invalid_rows, f, indent=2)
        print(f"⚠️  {len(invalid_rows)} invalid records saved to {invalid_file}")
```

---

## Phase 3: Testing and Validation

### Test Data Validation
```python
# Test validation functions
def test_validation():
    # Test URL validation
    assert DataValidator.validate_image_url("https://example.com/image.jpg")
    assert not DataValidator.validate_image_url("not-a-url")
    
    # Test notes validation
    is_valid, notes = DataValidator.validate_notes(["bergamot", "rose", "musk"])
    assert is_valid and len(notes) == 3
    
    # Test completeness scoring
    data = {
        'name': 'Test Perfume',
        'enriched_description': 'A beautiful scent',
        'notes': ['bergamot', 'rose'],
        'image': 'https://example.com/image.jpg'
    }
    score = EnrichedDataValidator.calculate_completeness_score(data)
    assert score == 1.0
```

### Test Caching
```python
def test_caching():
    cache = ResearchCache()
    
    # Cache data
    data = {'name': 'Test', 'description': 'Test desc'}
    cache.set('Test Perfume', 'Test House', data)
    
    # Retrieve from cache
    cached = cache.get('Test Perfume', 'Test House')
    assert cached == data
    
    # Invalidate
    cache.invalidate('Test Perfume', 'Test House')
    assert cache.get('Test Perfume', 'Test House') is None
```

---

## Environment Variables

Add to `.env`:
```bash
# Research Crew Optimization
RESEARCH_MAX_WORKERS=5  # Number of parallel workers for batch processing
RESEARCH_CACHE_TTL_DAYS=30  # Cache TTL in days
RESEARCH_RETRY_MAX=3  # Maximum retries for failed operations
RESEARCH_RETRY_DELAY=1.0  # Initial retry delay in seconds
```

---

## Migration Path

1. **Backup current crew.py**: `cp crew.py crew.py.backup`
2. **Implement Phase 1 modules** (already done ✅)
3. **Update crew.py incrementally**:
   - Add imports and initialization
   - Add validation helpers
   - Update enrich_perfume with caching
   - Consolidate crew executions
   - Implement parallel batch processing
4. **Test with small batch** (5-10 perfumes)
5. **Validate output quality**
6. **Roll out to production**

---

## Expected Results

After full implementation:

### Performance
- ✅ 5-10x faster batch processing (100 perfumes in 10-20 min vs 2-3.5 hours)
- ✅ 66% fewer API calls (combined crew executions)
- ✅ 30-50% cost reduction (caching + batching)

### Data Quality
- ✅ 100% data validation before storage
- ✅ No silent failures (all errors logged with context)
- ✅ Completeness scoring for all records
- ✅ Automatic fallback to alternative sources
- ✅ Invalid data flagged and excluded

### Reliability
- ✅ Retry logic prevents transient failures
- ✅ Cache reduces redundant operations
- ✅ Partial data preserved on errors
- ✅ Progress tracking and resume capability

---

## Monitoring

After implementation, monitor:
- Cache hit rate (should be >50% for repeated runs)
- Completeness scores (should average >0.8)
- Error rates (should decrease with retry logic)
- Processing time (should decrease 5-10x)
- API call counts (should decrease 66%)
