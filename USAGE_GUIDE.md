# 🚀 Usage Guide: Perfume House Data Enrichment System

**Complete system for validating and enriching perfume house data using CrewAI**

## 📋 **System Overview**

This system provides three main capabilities:

1. **Data Validation** - Identify legitimate perfume houses
2. **Data Enrichment** - Gather comprehensive company information
3. **Automated Processing** - Ongoing validation for new CSV imports

## 🎯 **Quick Start**

### **1. Environment Setup**

```bash
# Install dependencies
pip install -r requirements.txt

# Set up OpenAI API key
cp env_example.txt .env
# Edit .env and add your OPENAI_API_KEY
```

### **2. Basic Usage**

```bash
# Find legitimate perfume houses from main CSV
python find_legitimate_perfume_houses.py

# Run enhanced validation
python improved_validation_crew.py

# Enrich validated companies
python enrichment_crew_final.py

# Test automated system
python automated_validation_system.py
```

## 🔧 **Core Components**

### **A. Data Source Identification**

**File:** `find_legitimate_perfume_houses.py`

**Purpose:** Extract legitimate perfume houses from your main CSV (6,548 companies)

**Usage:**

```python
from find_legitimate_perfume_houses import find_legitimate_perfume_houses

# Get high-scoring perfume house candidates
replacements = find_legitimate_perfume_houses()

# Create improved test CSV
output_file = create_improved_test_csv()
```

**Output:**

- Identifies companies with high perfume-related scores
- Creates clean test dataset with legitimate companies
- Scoring based on keywords: 'perfume', 'parfum', 'fragrance', etc.

### **B. Enhanced Validation System**

**File:** `improved_validation_crew.py`

**Purpose:** Comprehensive validation using CrewAI with industry research

**Usage:**

```python
from improved_validation_crew import create_improved_validation_crew

# Run full validation
results = create_improved_validation_crew()
```

**Features:**

- Multi-source research (websites, databases, registries)
- Evidence quality assessment
- Confidence scoring
- Business type classification

### **C. Data Enrichment System**

**File:** `enrichment_crew_final.py`

**Purpose:** Gather detailed information for validated companies

**Usage:**

```python
from enrichment_crew_final import enrich_validated_perfume_houses

# Enrich validated companies
results = enrich_validated_perfume_houses()
```

**Data Collected:**

- Company descriptions and brand stories
- Founding dates and history
- Contact information and addresses
- Business models and product lines
- Website URLs and social presence

### **D. Automated Validation System**

**File:** `automated_validation_system.py`

**Purpose:** Ongoing validation for new CSV imports and batch processing

**Usage:**

```python
from automated_validation_system import AutomatedValidationSystem

# Initialize system
validator = AutomatedValidationSystem()

# Quick validation for individual companies
results = validator.quick_validation(["Company A", "Company B"])

# Batch validation for CSV files
batch_result = validator.validate_csv_batch("your_file.csv", 0, 10)

# Full CSV validation
overall_result = validator.validate_entire_csv("your_file.csv")
```

## 📊 **Data Flow**

```
Main CSV (6,548 companies)
           ↓
    Intelligent Scoring
           ↓
   High-Score Companies
           ↓
    Enhanced Validation
           ↓
   Validated Perfume Houses
           ↓
    Data Enrichment
           ↓
   Final Enriched Dataset
```

## 🎯 **Use Cases**

### **1. Initial Dataset Cleanup**

```bash
# Step 1: Find legitimate companies
python find_legitimate_perfume_houses.py

# Step 2: Validate the companies
python improved_validation_crew.py

# Step 3: Enrich with detailed information
python enrichment_crew_final.py
```

### **2. Ongoing CSV Validation**

```python
from automated_validation_system import AutomatedValidationSystem

validator = AutomatedValidationSystem()

# Process new CSV imports
results = validator.validate_entire_csv("new_companies.csv")

# Quick checks for individual companies
quick_check = validator.quick_validation(["New Company"])
```

### **3. Batch Processing**

```python
# Process large files in manageable chunks
for start_row in range(0, total_companies, 50):
    batch_result = validator.validate_csv_batch(
        "large_file.csv",
        start_row,
        50
    )
    print(f"Batch {start_row//50 + 1} completed")
```

## 📁 **Output Structure**

### **Validation Results:**

```
enriched_data/
├── enhanced_validated_companies_[timestamp].csv
├── enhanced_validated_companies_[timestamp].json
├── enhanced_validation_report_[timestamp].md
└── [other validation files]
```

### **Enrichment Results:**

```
enriched_data/
├── enriched_perfume_houses_final_[timestamp].csv
├── enriched_perfume_houses_final_[timestamp].json
└── [enrichment files]
```

### **Automated Validation:**

```
automated_validation/
├── validated_batch_[batch_id].csv
├── validated_batch_[batch_id].json
├── overall_validation_[timestamp].csv
└── overall_validation_[timestamp].json
```

## ⚙️ **Configuration Options**

### **Rate Limiting:**

```python
# Adjust delays between API calls
validator.rate_limit_delay = 5  # seconds
```

### **Batch Sizes:**

```python
# Process more/fewer companies per batch
validator.batch_size = 20  # default: 10
```

### **Output Directories:**

```python
# Custom output locations
validator.output_dir = Path("custom_output")
```

## 🔍 **Monitoring and Logging**

### **Log Files:**

- `perfume_house_enrichment.log` - Main enrichment logs
- `validated_enrichment.log` - Validation process logs
- `automated_validation.log` - Automated system logs

### **Progress Tracking:**

```python
# Monitor batch progress
for batch_num in range(total_batches):
    progress = ((batch_num + 1) / total_batches) * 100
    print(f"Progress: {progress:.1f}% complete")
```

## 🚨 **Error Handling**

### **Common Issues:**

1. **API Rate Limits:** System automatically handles delays
2. **CSV Parsing Errors:** Robust error handling with fallbacks
3. **Network Issues:** Automatic retry mechanisms
4. **Data Quality Issues:** Validation confidence scoring

### **Fallback Mechanisms:**

```python
# System automatically creates fallback data
fallback_company = {
    'validation_status': 'failed',
    'actual_business_type': 'ERROR',
    'validation_result': f"Error: {str(e)}"
}
```

## 📈 **Performance Optimization**

### **Batch Processing:**

- Process companies in batches of 10-50
- Adjust batch size based on API limits
- Use progress tracking for large files

### **Parallel Processing:**

```python
# For very large datasets, consider parallel processing
import concurrent.futures

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    futures = [
        executor.submit(validator.validate_csv_batch, csv_path, i, batch_size)
        for i in range(0, total_companies, batch_size)
    ]
```

## 🔮 **Advanced Usage**

### **Custom Validation Rules:**

```python
# Modify validation criteria
task = Task(
    description=f"""Custom validation for '{company_name}':

    YOUR CUSTOM RULES HERE
    - Rule 1: [description]
    - Rule 2: [description]

    OUTPUT FORMAT: [your custom format]""",
    agent=agent
)
```

### **Integration with External Systems:**

```python
# Connect with your business systems
import pandas as pd

# Load enriched data
df = pd.read_csv("enriched_perfume_houses_final_[timestamp].csv")

# Filter for specific criteria
luxury_companies = df[df['company_type'].str.contains('luxury', case=False)]

# Export to your system
luxury_companies.to_csv("luxury_perfume_houses.csv", index=False)
```

## 📞 **Support and Troubleshooting**

### **Common Solutions:**

1. **API Key Issues:** Check `.env` file and API key validity
2. **Memory Issues:** Reduce batch sizes for large files
3. **Timeout Issues:** Increase rate limiting delays
4. **Data Quality:** Review validation confidence scores

### **Debug Mode:**

```python
# Enable verbose logging
agent = Agent(
    role='...',
    goal='...',
    verbose=True  # Enable detailed output
)
```

## 🎉 **Success Metrics**

### **Quality Indicators:**

- **Validation Confidence:** Aim for >80% high confidence
- **Success Rate:** Target >95% successful validations
- **Data Completeness:** >90% of required fields filled
- **Processing Speed:** ~10-20 companies per minute

### **Business Impact:**

- **Data Quality:** 100% legitimate perfume companies
- **Information Richness:** 9+ data fields per company
- **Validation Accuracy:** Industry-standard verification
- **Scalability:** Process thousands of companies

---

**Ready to transform your perfume house data? Start with the Quick Start section above! 🚀**
