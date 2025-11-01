# CrewAI Usage Guide

## Overview

The New Smell platform integrates CrewAI to provide autonomous AI agent crews for:

1. **Development Crew**: Automates code quality analysis, test generation, documentation, and performance optimization
2. **Research Crew**: Enriches perfume data by researching multiple sources and generating film noir-themed descriptions

**⚠️ IMPORTANT**: These crews NEVER access the database directly. They only generate files (code, documentation, CSV) for manual review and approval.

## Setup

### Prerequisites

- Python 3.9 or higher
- pip package manager
- OpenAI API key

### Installation

1. Navigate to the crews directory:

```bash
cd crews
```

2. Create and activate a Python virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables in the root `.env` file:

```bash
# Required
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Optional CrewAI Configuration
CREWAI_API_PORT=8888
CREWAI_API_HOST=localhost
RESEARCH_OUTPUT_DIR=enriched_data
RESEARCH_MAX_RETRIES=3
RESEARCH_DELAY_MS=2000
FRAGRANTICA_BASE_URL=https://www.fragrantica.com
BASENOTES_BASE_URL=https://basenotes.com
```

## Development Crew

The Development Crew helps maintain code quality through automated analysis, test generation, documentation, and performance optimization.

### Available Commands

#### Code Analysis

Analyze a file for code quality issues, best practices, and potential problems:

```bash
cd crews
python scripts/run_dev_crew.py analyze --file app/components/Atoms/Button/Button.tsx
```

**Output**: Detailed analysis report with:

- Overall quality score (0-100)
- Issues categorized by severity (critical/high/medium/low)
- Specific recommendations
- Code examples for fixes

#### Test Generation

Generate comprehensive tests for a component:

```bash
cd crews
python scripts/run_dev_crew.py test --file app/components/Atoms/Button/Button.tsx
```

**Optional**: Specify a reference test to match style:

```bash
python scripts/run_dev_crew.py test \
  --file app/components/Atoms/NewComponent/NewComponent.tsx \
  --reference app/components/Atoms/ValidationMessage/ValidationMessage.test.tsx
```

**Output**: Generated test file following project conventions

#### Documentation Generation

Create comprehensive documentation for a component or module:

```bash
cd crews
python scripts/run_dev_crew.py document --file app/components/Atoms/Button/Button.tsx
```

**Output**: Markdown documentation with:

- Component overview
- Props documentation
- Usage examples
- Accessibility notes

#### Performance Analysis

Analyze performance and identify optimization opportunities:

```bash
cd crews
python scripts/run_dev_crew.py performance --file app/routes/home.tsx
```

**Output**: Performance report with:

- Performance score (0-100)
- Identified issues with impact assessment
- Optimization recommendations
- Expected improvements

#### Code Review (Multiple Files)

Review multiple files at once:

```bash
cd crews
python scripts/run_dev_crew.py review \
  --files app/components/Atoms/Button/Button.tsx \
          app/components/Atoms/Input/Input.tsx \
          app/routes/home.tsx
```

**Output**: Comprehensive review for each file

### Integration with Workflow

#### Manual Usage

Run crews directly when needed:

```bash
cd crews
source venv/bin/activate  # or venv\Scripts\activate on Windows
python scripts/run_dev_crew.py analyze --file path/to/file.tsx
```

#### Future: NPM Scripts (Planned)

```json
{
  "scripts": {
    "ai:analyze": "node scripts/ai-code-review.js",
    "ai:test": "node scripts/ai-generate-tests.js",
    "ai:document": "node scripts/ai-document.js"
  }
}
```

## Research Crew

The Research Crew enriches perfume data by researching multiple authoritative sources and generating film noir-themed descriptions.

### Film Noir Style

All descriptions follow a strict film noir aesthetic:

**Tone**: Dark, mysterious, sophisticated, sensual

**Encouraged Vocabulary**: shadow, whisper, velvet, smoky, midnight, seductive, sultry, dangerous, forbidden

**Avoided Words**: cute, fun, playful, bright, cheerful, sweet, nice, pretty

**Structure**: 2-3 sentences (50-150 words), opening with noir atmosphere, describing the scent journey, closing with intrigue

**Example**:

> "A shadowy blend that whispers secrets in velvet tones, like a femme fatale's confession in a smoke-filled room. Midnight jasmine mingles with dark leather and amber, while sandalwood smolders beneath like a forgotten cigarette."

### Available Commands

#### Enrich Single Perfume

Research and enrich a single perfume:

```bash
cd crews
python scripts/run_research_crew.py \
  --perfume "Lampblack" \
  --sources fragrantica,basenotes
```

#### Enrich from CSV (Batch)

Process multiple perfumes from an existing CSV file:

```bash
cd crews
python scripts/run_research_crew.py \
  --csv ../csv/perfumes_fzotic.csv \
  --limit 5 \
  --output perfumes_fzotic_enriched.csv
```

**Parameters**:

- `--csv`: Path to input CSV file
- `--limit`: Maximum number of perfumes to process (optional)
- `--output`: Output filename (auto-generated with timestamp if not provided)
- `--sources`: Comma-separated list of sources (optional, defaults to Fragrantica, Basenotes)

**Output Location**: `enriched_data/perfumes_enriched_YYYY-MM-DD_HH-MM-SS.csv`

### Output Format

The research crew generates CSV files with the following columns:

| Column                 | Description                           |
| ---------------------- | ------------------------------------- |
| `name`                 | Perfume name                          |
| `original_description` | Original description from source data |
| `enriched_description` | Film noir-styled description          |
| `notes`                | JSON array of fragrance notes         |
| `sources`              | JSON array of source URLs consulted   |
| `quality_review`       | Quality review results                |
| `timestamp`            | Generation timestamp                  |

### Quality Review

Each enriched perfume undergoes automated quality review checking:

- Film noir style adherence (noir vocabulary, no avoided words)
- Appropriate length (50-150 words)
- Proper note categorization (top/heart/base)
- All required fields present
- Minimum quality score of 60/100

### Manual Review Workflow

**⚠️ CRITICAL**: The Research Crew NEVER writes to the database. All enriched data requires manual review.

1. **Run Enrichment**:

   ```bash
   cd crews
   python scripts/run_research_crew.py --csv ../csv/perfumes_house.csv
   ```

2. **Review Output**:

   - Open the generated CSV in `enriched_data/`
   - Review each enriched description for quality and accuracy
   - Verify note categorizations are appropriate
   - Check that sources are valid

3. **Edit if Needed**:

   - Manually edit descriptions that don't meet standards
   - Adjust note categorizations
   - Remove entries that failed quality checks

4. **Merge to Source CSV**:

   - Manually copy approved enriched descriptions to original CSV files
   - Example: Update `csv/perfumes_fzotic.csv` with enriched descriptions

5. **Import to Database**:
   - Use existing import scripts to update database
   - Example: `node scripts/import_s_and_s_complete.js`

## Web Scraping Configuration

The Research Crew uses Selenium for web scraping. You can configure custom sources by providing URL patterns and CSS selectors.

### Example Configuration

```python
# In research_crew/tools.py, you can extend scraping configuration:
SCRAPING_CONFIG = {
    "fragrantica": {
        "search_url": "https://www.fragrantica.com/search/",
        "selectors": {
            "description": ".fragrance-description",
            "notes": ".pyramid-main",
            "reviews": ".review-box"
        }
    },
    "your_custom_source": {
        "search_url": "https://example.com/search/",
        "selectors": {
            "description": ".perfume-desc",
            "notes": ".notes-list",
            "reviews": ".user-reviews"
        }
    }
}
```

## Troubleshooting

### Python Environment Issues

**Problem**: `ModuleNotFoundError` when running crews

**Solution**: Ensure virtual environment is activated:

```bash
cd crews
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### OpenAI API Errors

**Problem**: `AuthenticationError` or `RateLimitError`

**Solution**:

1. Verify `OPENAI_API_KEY` is set in `.env`
2. Check API key is valid and has credits
3. Reduce batch size if hitting rate limits

### Selenium/ChromeDriver Issues

**Problem**: ChromeDriver errors when scraping

**Solution**:

1. Ensure Chrome browser is installed
2. `webdriver-manager` will auto-install correct ChromeDriver
3. If issues persist, run: `pip install --upgrade selenium webdriver-manager`

### Quality Review Failures

**Problem**: Most descriptions fail quality review

**Solution**:

1. Check noir style guide settings in `crews/shared/film_noir_style.py`
2. Adjust description writer agent's prompts if needed
3. Review examples in style guide
4. Lower minimum quality score if appropriate (not recommended)

## Best Practices

### Development Crew

1. **Start Small**: Analyze one component before reviewing entire codebase
2. **Review Results**: Don't blindly accept AI suggestions - review and validate
3. **Iterative Improvement**: Use feedback to improve code incrementally
4. **Reference Tests**: Always provide reference test files for consistent style

### Research Crew

1. **Batch Processing**: Process 5-10 perfumes at a time, not hundreds
2. **Manual Review**: ALWAYS review enriched data before importing
3. **Source Quality**: Use authoritative perfume databases
4. **Noir Consistency**: Maintain consistent noir aesthetic across all descriptions
5. **Note Verification**: Verify note categorizations against perfume expertise

## Advanced Usage

### Programmatic Access

You can import and use crews programmatically:

```python
from crews.dev_crew.crew import DevCrew
from crews.research_crew.crew import ResearchCrew

# Development Crew
dev_crew = DevCrew()
analysis = dev_crew.analyze_code("app/components/Atoms/Button/Button.tsx")
tests = dev_crew.generate_tests("app/components/Atoms/Button/Button.tsx")

# Research Crew
research_crew = ResearchCrew()
enriched = research_crew.enrich_perfume(
    perfume_name="Lampblack",
    sources=["Fragrantica", "Basenotes"],
    existing_notes=["cypress", "nagarmotha", "grapefruit"]
)
```

### Custom Agents

To create custom agents, see:

- `crews/dev_crew/agents.py`
- `crews/research_crew/agents.py`

Extend or modify agent definitions, tools, and tasks as needed.

## Future Enhancements

### Planned Features

1. **FastAPI Server**: REST API for crew execution
2. **TypeScript Client**: Node.js integration for seamless npm script usage
3. **GitHub Actions**: Automated code review on PRs
4. **Web UI**: Browser-based interface for crew management
5. **Fine-tuned Models**: Custom models trained on codebase patterns

### Configuration Database

Future versions may include:

- Saved source configurations
- Custom style guides
- Agent behavior profiles
- Quality thresholds

## Support

For issues or questions:

1. Review this documentation
2. Check the AI Integration Roadmap: `docs/developer/AI_INTEGRATION_ROADMAP.md`
3. Review crew source code in `crews/`

---

**Remember**: Crews are assistants, not replacements. Always review and validate their output before using in production.
