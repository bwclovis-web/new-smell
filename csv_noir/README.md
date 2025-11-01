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

| Column | Description |
|--------|-------------|
| `name` | Perfume name |
| `original_description` | Original description from source |
| `enriched_description` | **Film noir-styled description** ⭐ |
| `notes` | JSON array of all fragrance notes |
| `sources` | JSON array of source URLs |
| `quality_review` | Quality score and review |
| `timestamp` | When it was enriched |

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
5. Copy approved data to csv/perfumes_[house].csv
   ↓
6. Run import script to update database
```

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

