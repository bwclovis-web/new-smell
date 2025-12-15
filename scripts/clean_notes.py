#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Clean Duplicate and Erroneous Notes Script

Safely removes duplicate notes, invalid notes (with special characters), stopwords, and descriptive phrases.
All perfume relationships are preserved by reassociating to canonical notes.

IMPORTANT: Run `npm run db:backup` before executing this script!
If rollback is needed, use `npm run db:restore` with the backup created before cleanup.

Usage:
  python scripts/clean_notes.py           # Execute cleanup
  python scripts/clean_notes.py --dry-run  # Preview changes without applying
"""

import os
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2 import sql
except ImportError:
    print("❌ Error: psycopg2 is required. Install it with: pip install psycopg2-binary")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    print("❌ Error: python-dotenv is required. Install it with: pip install python-dotenv")
    sys.exit(1)

# Load environment variables
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
load_dotenv(env_path, verbose=False)

# Check for dry-run flag
is_dry_run = "--dry-run" in sys.argv

# Stopwords to remove (common English words that aren't perfume notes)
# Also removes descriptive phrases/sentences like "fall part one", "none of us really changes over time"
STOPWORDS = [
    "and", "of", "with", "the", "a", "an", "or", "but", "in", "on", "at", "to",
    "for", "from", "by", "as", "is", "was", "are", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "should", "could",
    "may", "might", "must", "can"
]

# Valid characters: letters, numbers, spaces, hyphens, apostrophes
VALID_CHAR_REGEX = re.compile(r'^[a-zA-Z0-9\s\-\']+$')


def normalize_name(name):
    """Normalize note name (lowercase, trim)"""
    return name.strip().lower()


def escape_regex(text):
    """Escape special regex characters in a string"""
    return re.escape(text)


def is_valid_note_name(name):
    """Check if note name contains only valid characters"""
    return bool(VALID_CHAR_REGEX.match(name))


def clean_note_name(name):
    """Clean note name by removing invalid characters"""
    return re.sub(r'[^a-zA-Z0-9\s\-\']', '', name).strip()


def is_stopword(name):
    """Check if note is a stopword"""
    return normalize_name(name) in STOPWORDS


def extract_note_from_phrase(name, existing_notes):
    """
    Extract note name from descriptive phrase
    Examples: "the delicate scent of roses" → "roses", "a hint of vanilla" → "vanilla"
    Returns None if no note can be extracted
    """
    normalized = normalize_name(name)
    trimmed = normalized.strip()
    words = [w for w in trimmed.split() if w]
    
    # Patterns that indicate a note name follows
    extraction_patterns = [
        # "smells like: [adjective] [note]" - captures "vanilla" from "smells like: velvety vanilla"
        re.compile(r'smells?\s+like:?\s+(?:(?:velvety|delicate|subtle|strong|soft|light|heavy|faint|intense|rich|deep|fresh|warm|cool|sweet|bitter|spicy|floral|woody|citrus)\s+)?(\w+(?:\s+\w+){0,4})', re.IGNORECASE),
        # "the [adjective] scent of [note]" - captures "roses" from "the delicate scent of roses"
        re.compile(r'(?:the\s+)?(?:\w+\s+)?scent\s+of\s+(\w+(?:\s+\w+){0,4})', re.IGNORECASE),
        # "a hint of [note]" - captures "vanilla" from "a hint of vanilla"
        re.compile(r'(?:a\s+)?hint\s+of\s+(\w+(?:\s+\w+){0,4})', re.IGNORECASE),
        # "notes of [note]" or "note of [note]"
        re.compile(r'notes?\s+of\s+(\w+(?:\s+\w+){0,4})', re.IGNORECASE),
        # "with notes of [note]" or "featuring [note]"
        re.compile(r'(?:with|featuring)\s+(?:notes?\s+of\s+)?(\w+(?:\s+\w+){0,4})', re.IGNORECASE),
        # "velvety [note]", "delicate [note]", etc. - captures note after adjective
        re.compile(r'(?:velvety|delicate|subtle|strong|soft|light|heavy|faint|intense|rich|deep|fresh|warm|cool|sweet|bitter|spicy|floral|woody|citrus)\s+(\w+(?:\s+\w+){0,4})', re.IGNORECASE),
        # "[note] scent", "[note] aroma", "[note] fragrance" - captures note before descriptor
        re.compile(r'(\w+(?:\s+\w+){0,4})\s+(?:scent|aroma|fragrance|note|notes)', re.IGNORECASE),
        # "the [adjective] [note]" - e.g., "the delicate roses"
        re.compile(r'the\s+(?:delicate|subtle|strong|soft|light|heavy|faint|intense|rich|deep|fresh|warm|cool|sweet|bitter|spicy|floral|woody|citrus)\s+(\w+(?:\s+\w+){0,4})', re.IGNORECASE),
    ]
    
    # Try extraction patterns first
    for pattern in extraction_patterns:
        match = pattern.search(trimmed)
        if match and match.group(1):
            extracted = match.group(1).strip()
            
            # Skip if extracted is a stopword
            if is_stopword(extracted):
                continue
            
            # Skip if too short (less than 2 characters)
            if len(extracted) < 2:
                continue
            
            # Try to strip common adjectives from the beginning (e.g., "velvety vanilla" → "vanilla")
            adjectives = ['velvety', 'delicate', 'subtle', 'strong', 'soft', 'light', 'heavy', 'faint', 'intense', 'rich', 'deep', 'fresh', 'warm', 'cool', 'sweet', 'bitter', 'spicy', 'floral', 'woody', 'citrus', 'creamy', 'smooth', 'sharp', 'mellow']
            cleaned_extracted = extracted
            extracted_words = extracted.split()
            if len(extracted_words) > 1 and normalize_name(extracted_words[0]) in adjectives:
                # Remove the first word if it's an adjective
                cleaned_extracted = ' '.join(extracted_words[1:])
            
            # Check if cleaned extracted note exists in database (case-insensitive)
            found_note = next((n for n in existing_notes if normalize_name(n['name']) == normalize_name(cleaned_extracted)), None)
            if found_note:
                return found_note['name']
            
            # Check original extracted note too
            found_note_original = next((n for n in existing_notes if normalize_name(n['name']) == normalize_name(extracted)), None)
            if found_note_original:
                return found_note_original['name']
            
            # Also check if it's a valid note name (1-5 words for multi-word notes like "frosted pumpkin pecan cookies", reasonable length)
            word_count = len(cleaned_extracted.split())
            if 1 <= word_count <= 5 and len(cleaned_extracted) <= 50:
                return cleaned_extracted
            
            # Fallback to original if cleaned is too short
            original_word_count = len(extracted.split())
            if 1 <= original_word_count <= 5 and len(extracted) <= 50:
                return extracted
    
    # Fallback: try to find a known note name in the phrase
    # Check if any existing note name appears in the phrase
    for existing_note in existing_notes:
        note_name = normalize_name(existing_note['name'])
        # Check if the note name appears as a whole word in the phrase
        note_words = note_name.split()
        if len(note_words) == 1:
            # Single word note - check if it appears as a whole word
            # Escape special regex characters in the note name
            escaped_note = escape_regex(note_words[0])
            word_boundary_regex = re.compile(rf'\b{escaped_note}\b', re.IGNORECASE)
            if word_boundary_regex.search(trimmed):
                return existing_note['name']
        else:
            # Multi-word note - check if the phrase contains it
            if note_name in trimmed:
                return existing_note['name']
    
    # Last resort: try to extract the last significant word(s) if phrase is short
    # Look for patterns like "smells like: [note]" at the end
    smells_like_match = re.search(r'smells?\s+like:?\s+(.+)$', trimmed, re.IGNORECASE)
    if smells_like_match and smells_like_match.group(1):
        candidate = smells_like_match.group(1).strip()
        if 2 <= len(candidate) <= 50:
            word_count = len(candidate.split())
            if 1 <= word_count <= 5 and not is_stopword(candidate):
                # Check if it matches an existing note
                found_note = next((n for n in existing_notes if normalize_name(n['name']) == normalize_name(candidate)), None)
                if found_note:
                    return found_note['name']
                return candidate
    
    # Try last 1-5 words as potential note name (for multi-word notes like "frosted pumpkin pecan cookies")
    if 3 <= len(words) <= 10:
        for i in range(1, 6):
            candidate = ' '.join(words[-i:])
            if 2 <= len(candidate) <= 50:
                # Skip if it's a stopword
                if is_stopword(candidate):
                    continue
                
                # Check if it matches an existing note
                found_note = next((n for n in existing_notes if normalize_name(n['name']) == normalize_name(candidate)), None)
                if found_note:
                    return found_note['name']
                
                # If it's a reasonable length and not a stopword, return it
                # Prefer shorter extractions (1-3 words) over longer ones (4-5 words)
                if i <= 3 or (i <= 5 and len(candidate) <= 40):
                    return candidate
    
    return None


def is_descriptive_phrase(name):
    """
    Check if note is a descriptive phrase/sentence (not a valid perfume note)
    Examples: "fall part one", "none of us really changes over time", "a tendril of smoke lighter"
    Also includes phrases that can have notes extracted: "the delicate scent of roses"
    """
    normalized = normalize_name(name)
    trimmed = normalized.strip()
    
    # Too long to be a perfume note (allow up to 50 chars for multi-word notes like "frosted pumpkin pecan cookies")
    if len(trimmed) > 50:
        return True
    
    # Contains sentence-like patterns
    # Multiple common words that form a phrase (6+ words suggests a sentence/phrase, not a note)
    # Allow 4-5 words for valid multi-word notes like "frosted pumpkin pecan cookies"
    words = [w for w in trimmed.split() if w]
    if len(words) >= 6:
        return True
    
    # Contains common phrase patterns that should be removed (no extraction possible)
    phrase_patterns = [
        re.compile(r'\b(part\s+(one|two|three|1|2|3))\b', re.IGNORECASE),
        re.compile(r'\b(none\s+of\s+us)\b', re.IGNORECASE),
        re.compile(r'\b(changes?\s+over\s+time)\b', re.IGNORECASE),
        re.compile(r'\b(a\s+tendril\s+of)\b', re.IGNORECASE),
        re.compile(r'\b(lighter|heavier|stronger|weaker)\s+(than|then)\b', re.IGNORECASE),
        re.compile(r'\b(one\s+of\s+the)\b', re.IGNORECASE),
        re.compile(r'\b(all\s+of\s+the)\b', re.IGNORECASE),
        re.compile(r'\b(some\s+of\s+the)\b', re.IGNORECASE),
        # Phrases that fade/transition without extractable notes
        re.compile(r'\b(but|and|or)\s+that\s+(fades?|transitions?|turns?|becomes?|changes?)\s+(into|to|from)\b', re.IGNORECASE),
        re.compile(r'\b(fades?|transitions?|turns?|becomes?|changes?)\s+(into|to|from)\s+(the|a|an)\s+\w+\s+\w+', re.IGNORECASE),
        # Phrases that might contain extractable notes (these will be handled by extraction logic)
        re.compile(r'\b(scent|aroma|fragrance|hint|note|notes)\s+(of|with)\b', re.IGNORECASE),
        re.compile(r'\b(the|a|an)\s+\w+\s+(scent|aroma|fragrance)\s+of\b', re.IGNORECASE),
        re.compile(r'\bsmells?\s+like:?\b', re.IGNORECASE),
    ]
    
    for pattern in phrase_patterns:
        if pattern.search(trimmed):
            return True
    
    return False


def get_db_connection():
    """Get database connection from environment variables"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    # Parse PostgreSQL connection string
    # Format: postgresql://user:password@host:port/database
    import urllib.parse
    parsed = urllib.parse.urlparse(database_url)
    
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path[1:] if parsed.path else None,
        user=parsed.username,
        password=parsed.password
    )
    return conn


def validate_database(conn):
    """Pre-flight validation checks"""
    print("🔍 Running pre-flight checks...\n")
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Count notes and relations
            cur.execute("SELECT COUNT(*) as count FROM \"PerfumeNotes\"")
            note_count = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM \"PerfumeNoteRelation\"")
            relation_count = cur.fetchone()['count']
            
            print(f"✅ Found {note_count} notes and {relation_count} note relations\n")
            
            return {'note_count': note_count, 'relation_count': relation_count}
    except Exception as error:
        print(f"❌ Pre-flight check failed: {error}")
        raise


def validate_cleanup(conn, initial_counts):
    """Post-cleanup validation"""
    print("\n🔍 Running post-cleanup validation...\n")
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) as count FROM \"PerfumeNotes\"")
            final_note_count = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM \"PerfumeNoteRelation\"")
            final_relation_count = cur.fetchone()['count']
            
            # Check for orphaned relations
            cur.execute("""
                SELECT COUNT(*) as count
                FROM \"PerfumeNoteRelation\" pnr
                LEFT JOIN \"PerfumeNotes\" pn ON pnr.\"noteId\" = pn.id
                WHERE pn.id IS NULL
            """)
            orphaned_count = cur.fetchone()['count']
            
            if orphaned_count > 0:
                print(f"❌ Found {orphaned_count} orphaned relations!")
                raise ValueError("Orphaned relations detected")
            
            print(f"✅ Final counts: {final_note_count} notes, {final_relation_count} relations")
            print("✅ No orphaned relations found")
            print("✅ All notes are valid")
            
            return {
                'notes_removed': initial_counts['note_count'] - final_note_count,
                'relations_updated': initial_counts['relation_count'] - final_relation_count
            }
    except Exception as error:
        print(f"❌ Post-cleanup validation failed: {error}")
        raise


def identify_duplicates(conn):
    """Phase 1: Identify and merge duplicates"""
    print("🔍 Phase 1: Identifying duplicate notes...\n")
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Get all notes with their relations
        cur.execute("""
            SELECT pn.*, 
                   COUNT(pnr.id) as relation_count
            FROM \"PerfumeNotes\" pn
            LEFT JOIN \"PerfumeNoteRelation\" pnr ON pn.id = pnr.\"noteId\"
            GROUP BY pn.id
            ORDER BY relation_count DESC, pn.\"createdAt\" ASC
        """)
        all_notes = cur.fetchall()
        
        # Get relations for each note
        for note in all_notes:
            cur.execute("""
                SELECT * FROM \"PerfumeNoteRelation\"
                WHERE \"noteId\" = %s
            """, (note['id'],))
            note['perfumeNoteRelations'] = cur.fetchall()
    
    # Group by normalized name
    notes_by_name = defaultdict(list)
    for note in all_notes:
        normalized_name = normalize_name(note['name'])
        notes_by_name[normalized_name].append(note)
    
    # Find duplicates
    duplicates = []
    for normalized_name, notes in notes_by_name.items():
        if len(notes) > 1:
            # Sort by relation count (desc), then by createdAt (asc)
            notes_sorted = sorted(notes, key=lambda n: (
                -len(n.get('perfumeNoteRelations', [])),
                n['createdAt']
            ))
            duplicates.append({
                'normalized_name': normalized_name,
                'notes': notes_sorted
            })
    
    return duplicates


def merge_duplicates(conn, duplicates, is_dry_run):
    """Phase 1: Merge duplicates"""
    if len(duplicates) == 0:
        print("✅ No duplicate notes found!\n")
        return {'merged': 0, 'relations_updated': 0}
    
    print(f"📊 Found {len(duplicates)} duplicate group(s):\n")
    
    total_notes_to_merge = sum(len(dup['notes']) - 1 for dup in duplicates)
    for dup in duplicates:
        print(f"  \"{dup['normalized_name']}\" ({len(dup['notes'])} variants):")
        for index, note in enumerate(dup['notes']):
            keep = " (KEEP - canonical)" if index == 0 else " (MERGE)"
            relation_count = len(note.get('perfumeNoteRelations', []))
            print(f"    {index + 1}. \"{note['name']}\" ({note['id']}) - {relation_count} relations{keep}")
        print("")
    
    print(f"📋 Summary: {total_notes_to_merge} notes will be merged into {len(duplicates)} canonical notes\n")
    
    if is_dry_run:
        print("✅ Dry run complete for Phase 1.\n")
        return {'merged': 0, 'relations_updated': 0}
    
    print("🔄 Starting merge process...\n")
    
    merged_count = 0
    relations_updated_count = 0
    
    # Use transaction for safety
    with conn:
        with conn.cursor() as cur:
            for dup in duplicates:
                canonical_note = dup['notes'][0]  # Most used (or oldest if tie)
                notes_to_merge = dup['notes'][1:]
                
                print(f"\n📦 Merging \"{dup['normalized_name']}\"")
                print(f"   Canonical: \"{canonical_note['name']}\" ({canonical_note['id']})")
                
                for duplicate_note in notes_to_merge:
                    try:
                        print(f"   → Merging \"{duplicate_note['name']}\" ({duplicate_note['id']})")
                        
                        # Get all relations pointing to the duplicate note
                        cur.execute("""
                            SELECT * FROM \"PerfumeNoteRelation\"
                            WHERE \"noteId\" = %s
                        """, (duplicate_note['id'],))
                        relations = cur.fetchall()
                        
                        print(f"     Found {len(relations)} relations to reassociate")
                        
                        # Reassociate all relations to canonical note
                        for relation in relations:
                            # Check if canonical note already has this relation (same perfume + noteType)
                            cur.execute("""
                                SELECT id FROM \"PerfumeNoteRelation\"
                                WHERE \"perfumeId\" = %s
                                  AND \"noteId\" = %s
                                  AND \"noteType\" = %s
                            """, (relation['perfumeId'], canonical_note['id'], relation['noteType']))
                            existing_relation = cur.fetchone()
                            
                            if existing_relation:
                                # Relation already exists, just delete the duplicate relation
                                cur.execute("""
                                    DELETE FROM \"PerfumeNoteRelation\"
                                    WHERE id = %s
                                """, (relation['id'],))
                                print("     → Removed duplicate relation (already exists for canonical)")
                            else:
                                # Update relation to point to canonical note
                                cur.execute("""
                                    UPDATE \"PerfumeNoteRelation\"
                                    SET \"noteId\" = %s
                                    WHERE id = %s
                                """, (canonical_note['id'], relation['id']))
                                print("     → Reassociated relation to canonical note")
                            relations_updated_count += 1
                        
                        # Delete the duplicate note (CASCADE will handle any remaining relations)
                        cur.execute("""
                            DELETE FROM \"PerfumeNotes\"
                            WHERE id = %s
                        """, (duplicate_note['id'],))
                        
                        merged_count += 1
                        print("     ✅ Merged successfully")
                    except Exception as error:
                        print(f"     ❌ Error merging: {error}")
                        raise  # Rollback transaction
    
    print(f"\n✅ Phase 1 complete: Merged {merged_count} duplicate notes, updated {relations_updated_count} relations\n")
    
    return {'merged': merged_count, 'relations_updated': relations_updated_count}


def identify_invalid_notes(conn):
    """Phase 2: Identify notes with invalid characters"""
    print("🔍 Phase 2: Identifying notes with invalid characters...\n")
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM \"PerfumeNotes\"")
        all_notes = cur.fetchall()
    
    invalid_notes = []
    for note in all_notes:
        if not is_valid_note_name(note['name']):
            cleaned_name = clean_note_name(note['name'])
            if len(cleaned_name) == 0:
                # Name becomes empty after cleaning - mark for deletion
                invalid_notes.append({
                    'note': note,
                    'action': 'delete',
                    'cleaned_name': None
                })
            else:
                invalid_notes.append({
                    'note': note,
                    'action': 'clean',
                    'cleaned_name': cleaned_name
                })
    
    return invalid_notes


def clean_invalid_notes(conn, invalid_notes, is_dry_run):
    """Phase 2: Clean invalid notes"""
    if len(invalid_notes) == 0:
        print("✅ No invalid notes found!\n")
        return {'cleaned': 0, 'deleted': 0, 'relations_updated': 0}
    
    print(f"📊 Found {len(invalid_notes)} invalid note(s):\n")
    
    for item in invalid_notes:
        if item['action'] == 'delete':
            print(f"  ❌ \"{item['note']['name']}\" ({item['note']['id']}) - Will be deleted (empty after cleaning)")
        else:
            print(f"  🔧 \"{item['note']['name']}\" ({item['note']['id']}) → \"{item['cleaned_name']}\"")
    print("")
    
    if is_dry_run:
        print("✅ Dry run complete for Phase 2.\n")
        return {'cleaned': 0, 'deleted': 0, 'relations_updated': 0}
    
    print("🔄 Starting cleanup process...\n")
    
    cleaned_count = 0
    deleted_count = 0
    relations_updated_count = 0
    
    # Use transaction for safety
    with conn:
        with conn.cursor() as cur:
            for item in invalid_notes:
                try:
                    note = item['note']
                    action = item['action']
                    cleaned_name = item['cleaned_name']
                    
                    print(f"\n🔧 Processing \"{note['name']}\" ({note['id']})")
                    
                    if action == 'delete':
                        # Get relations before deletion for logging
                        cur.execute("""
                            SELECT COUNT(*) as count FROM \"PerfumeNoteRelation\"
                            WHERE \"noteId\" = %s
                        """, (note['id'],))
                        relation_count = cur.fetchone()[0]
                        
                        print(f"   Found {relation_count} relations - will be removed (note is invalid)")
                        
                        # Delete note (CASCADE will remove relations)
                        cur.execute("""
                            DELETE FROM \"PerfumeNotes\"
                            WHERE id = %s
                        """, (note['id'],))
                        
                        deleted_count += 1
                        print("   ✅ Deleted invalid note")
                    else:
                        # Get relations to reassociate
                        cur.execute("""
                            SELECT * FROM \"PerfumeNoteRelation\"
                            WHERE \"noteId\" = %s
                        """, (note['id'],))
                        relations = cur.fetchall()
                        
                        print(f"   Found {len(relations)} relations to reassociate")
                        
                        # Check if cleaned name already exists
                        cur.execute("""
                            SELECT * FROM \"PerfumeNotes\"
                            WHERE name = %s
                        """, (cleaned_name,))
                        cleaned_note = cur.fetchone()
                        
                        if not cleaned_note:
                            # No existing cleaned note - update the current note's name
                            cur.execute("""
                                UPDATE \"PerfumeNotes\"
                                SET name = %s
                                WHERE id = %s
                            """, (cleaned_name, note['id']))
                            print(f"   Updated note name to cleaned version: \"{cleaned_name}\"")
                        else:
                            # Cleaned note already exists - reassociate relations and delete invalid note
                            print(f"   Found existing cleaned note: \"{cleaned_name}\" ({cleaned_note['id']})")
                            
                            # Reassociate relations
                            for relation in relations:
                                # Check if cleaned note already has this relation
                                cur.execute("""
                                    SELECT id FROM \"PerfumeNoteRelation\"
                                    WHERE \"perfumeId\" = %s
                                      AND \"noteId\" = %s
                                      AND \"noteType\" = %s
                                """, (relation['perfumeId'], cleaned_note['id'], relation['noteType']))
                                existing_relation = cur.fetchone()
                                
                                if existing_relation:
                                    # Relation already exists, delete duplicate
                                    cur.execute("""
                                        DELETE FROM \"PerfumeNoteRelation\"
                                        WHERE id = %s
                                    """, (relation['id'],))
                                    print("   → Removed duplicate relation (already exists for cleaned note)")
                                else:
                                    # Update relation to point to cleaned note
                                    cur.execute("""
                                        UPDATE \"PerfumeNoteRelation\"
                                        SET \"noteId\" = %s
                                        WHERE id = %s
                                    """, (cleaned_note['id'], relation['id']))
                                    print("   → Reassociated relation to cleaned note")
                                relations_updated_count += 1
                            
                            # Delete the invalid note (relations already reassociated)
                            cur.execute("""
                                DELETE FROM \"PerfumeNotes\"
                                WHERE id = %s
                            """, (note['id'],))
                            print("   ✅ Deleted invalid note, kept existing cleaned version")
                        
                        cleaned_count += 1
                except Exception as error:
                    print(f"   ❌ Error processing: {error}")
                    raise  # Rollback transaction
    
    print(f"\n✅ Phase 2 complete: Cleaned {cleaned_count} notes, deleted {deleted_count} notes, updated {relations_updated_count} relations\n")
    
    return {'cleaned': cleaned_count, 'deleted': deleted_count, 'relations_updated': relations_updated_count}


def identify_stopwords(conn):
    """Phase 3: Identify stopwords and descriptive phrases"""
    print("🔍 Phase 3: Identifying stopword and descriptive phrase notes...\n")
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM \"PerfumeNotes\"")
        all_notes = cur.fetchall()
        
        # Get relations for each note
        for note in all_notes:
            cur.execute("""
                SELECT * FROM \"PerfumeNoteRelation\"
                WHERE \"noteId\" = %s
            """, (note['id'],))
            note['perfumeNoteRelations'] = cur.fetchall()
    
    invalid_notes = []
    extractable_phrases = []
    
    for note in all_notes:
        if is_stopword(note['name']):
            invalid_notes.append({'note': note, 'type': 'stopword', 'extracted_note': None})
        elif is_descriptive_phrase(note['name']):
            # Try to extract a note from the phrase
            extracted_note = extract_note_from_phrase(note['name'], all_notes)
            if extracted_note:
                extractable_phrases.append({'note': note, 'type': 'extractable', 'extracted_note': extracted_note})
            else:
                invalid_notes.append({'note': note, 'type': 'descriptive', 'extracted_note': None})
    
    return {'invalid_notes': invalid_notes, 'extractable_phrases': extractable_phrases}


def remove_stopwords(conn, identification_results, is_dry_run):
    """Phase 3: Extract notes from phrases and remove stopwords/descriptive phrases"""
    invalid_notes = identification_results['invalid_notes']
    extractable_phrases = identification_results['extractable_phrases']
    
    total_invalid = len(invalid_notes)
    total_extractable = len(extractable_phrases)
    
    if total_invalid == 0 and total_extractable == 0:
        print("✅ No stopword or descriptive phrase notes found!\n")
        return {'removed': 0, 'relations_removed': 0, 'relations_reassociated': 0}
    
    print(f"📊 Found {total_invalid} invalid note(s) and {total_extractable} extractable phrase(s):\n")
    
    # Show extractable phrases
    if total_extractable > 0:
        print("  Phrases with extractable notes:")
        for item in extractable_phrases:
            relation_count = len(item['note'].get('perfumeNoteRelations', []))
            print(f"  🔧 \"{item['note']['name']}\" → \"{item['extracted_note']}\" ({relation_count} relations will be reassociated)")
        print("")
    
    # Show invalid notes
    if total_invalid > 0:
        print("  Invalid notes (will be removed):")
        total_relations = sum(len(item['note'].get('perfumeNoteRelations', [])) for item in invalid_notes)
        for item in invalid_notes:
            relation_count = len(item['note'].get('perfumeNoteRelations', []))
            print(f"  ❌ \"{item['note']['name']}\" ({item['note']['id']}) - {relation_count} relations will be removed ({item['type']})")
        print("")
        print(f"📋 Summary: {total_invalid} invalid notes will be removed, {total_relations} relations will be deleted")
    
    if total_extractable > 0:
        total_extracted_relations = sum(len(item['note'].get('perfumeNoteRelations', [])) for item in extractable_phrases)
        print(f"📋 Summary: {total_extractable} phrases will be converted, {total_extracted_relations} relations will be reassociated")
    print("")
    
    if is_dry_run:
        print("✅ Dry run complete for Phase 3.\n")
        return {'removed': 0, 'relations_removed': 0, 'relations_reassociated': 0}
    
    print("🔄 Starting processing...\n")
    
    removed_count = 0
    relations_removed_count = 0
    relations_reassociated_count = 0
    
    # Use transaction for safety
    with conn:
        with conn.cursor() as cur:
            # First, handle extractable phrases
            for item in extractable_phrases:
                try:
                    note = item['note']
                    extracted_note = item['extracted_note']
                    print(f"\n🔧 Processing phrase \"{note['name']}\" → extracting \"{extracted_note}\"")
                    
                    # Get all relations
                    cur.execute("""
                        SELECT * FROM \"PerfumeNoteRelation\"
                        WHERE \"noteId\" = %s
                    """, (note['id'],))
                    relations = cur.fetchall()
                    
                    print(f"   Found {len(relations)} relations to reassociate")
                    
                    # Find or create the extracted note
                    cur.execute("""
                        SELECT * FROM \"PerfumeNotes\"
                        WHERE name = %s
                    """, (extracted_note,))
                    target_note = cur.fetchone()
                    
                    if not target_note:
                        # Create the extracted note
                        from datetime import datetime
                        import uuid
                        note_id = str(uuid.uuid4())
                        cur.execute("""
                            INSERT INTO \"PerfumeNotes\" (id, name, \"createdAt\")
                            VALUES (%s, %s, %s)
                        """, (note_id, extracted_note, datetime.now()))
                        target_note = {'id': note_id, 'name': extracted_note}
                        print(f"   Created note: \"{extracted_note}\"")
                    else:
                        print(f"   Found existing note: \"{extracted_note}\"")
                    
                    # Reassociate relations
                    for relation in relations:
                        # Check if target note already has this relation
                        cur.execute("""
                            SELECT id FROM \"PerfumeNoteRelation\"
                            WHERE \"perfumeId\" = %s
                              AND \"noteId\" = %s
                              AND \"noteType\" = %s
                        """, (relation['perfumeId'], target_note['id'], relation['noteType']))
                        existing_relation = cur.fetchone()
                        
                        if existing_relation:
                            # Relation already exists, delete duplicate
                            cur.execute("""
                                DELETE FROM \"PerfumeNoteRelation\"
                                WHERE id = %s
                            """, (relation['id'],))
                            print("   → Removed duplicate relation (already exists for extracted note)")
                        else:
                            # Update relation to point to extracted note
                            cur.execute("""
                                UPDATE \"PerfumeNoteRelation\"
                                SET \"noteId\" = %s
                                WHERE id = %s
                            """, (target_note['id'], relation['id']))
                            print("   → Reassociated relation to extracted note")
                        relations_reassociated_count += 1
                    
                    # Delete the phrase note
                    cur.execute("""
                        DELETE FROM \"PerfumeNotes\"
                        WHERE id = %s
                    """, (note['id'],))
                    
                    print(f"   ✅ Extracted note and reassociated {len(relations)} relations")
                except Exception as error:
                    print(f"   ❌ Error processing: {error}")
                    raise  # Rollback transaction
            
            # Then, handle invalid notes (stopwords and non-extractable phrases)
            for item in invalid_notes:
                try:
                    note = item['note']
                    note_type = item['type']
                    print(f"\n🗑️  Removing {note_type} \"{note['name']}\" ({note['id']})")
                    
                    relation_count = len(note.get('perfumeNoteRelations', []))
                    print(f"   Found {relation_count} relations - will be removed ({note_type} is not a valid note)")
                    
                    # Delete note (CASCADE will automatically remove relations)
                    cur.execute("""
                        DELETE FROM \"PerfumeNotes\"
                        WHERE id = %s
                    """, (note['id'],))
                    
                    removed_count += 1
                    relations_removed_count += relation_count
                    print(f"   ✅ Removed {note_type} and {relation_count} relations")
                except Exception as error:
                    print(f"   ❌ Error removing: {error}")
                    raise  # Rollback transaction
    
    print(f"\n✅ Phase 3 complete:")
    print(f"   • Removed {removed_count} invalid notes")
    print(f"   • Extracted notes from {len(extractable_phrases)} phrases")
    print(f"   • Deleted {relations_removed_count} relations")
    print(f"   • Reassociated {relations_reassociated_count} relations\n")
    
    return {
        'removed': removed_count,
        'relations_removed': relations_removed_count,
        'relations_reassociated': relations_reassociated_count
    }


def clean_notes():
    """Main cleanup function"""
    try:
        print("=" * 60)
        print("🧹 Clean Duplicate and Erroneous Notes")
        print("=" * 60)
        print("")
        
        if is_dry_run:
            print("⚠️  DRY RUN MODE - No changes will be made\n")
        else:
            print("⚠️  IMPORTANT: Ensure you have run `npm run db:backup` before proceeding!\n")
        
        # Get database connection
        conn = get_db_connection()
        
        try:
            # Pre-flight validation
            initial_counts = validate_database(conn)
            
            # Phase 1: Merge duplicates
            duplicates = identify_duplicates(conn)
            phase1_results = merge_duplicates(conn, duplicates, is_dry_run)
            
            # Phase 2: Clean invalid characters
            invalid_notes = identify_invalid_notes(conn)
            phase2_results = clean_invalid_notes(conn, invalid_notes, is_dry_run)
            
            # Phase 3: Remove stopwords and descriptive phrases
            invalid_phrase_notes = identify_stopwords(conn)
            phase3_results = remove_stopwords(conn, invalid_phrase_notes, is_dry_run)
            
            # Post-cleanup validation
            if not is_dry_run:
                validation_results = validate_cleanup(conn, initial_counts)
                
                # Final summary
                print("=" * 60)
                print("\n📊 CLEANUP SUMMARY")
                print("=" * 60)
                print(f"\nPhase 1 - Duplicates:")
                print(f"  • Merged: {phase1_results['merged']} notes")
                print(f"  • Relations updated: {phase1_results['relations_updated']}")
                print(f"\nPhase 2 - Invalid Characters:")
                print(f"  • Cleaned: {phase2_results['cleaned']} notes")
                print(f"  • Deleted: {phase2_results['deleted']} notes")
                print(f"  • Relations updated: {phase2_results['relations_updated']}")
                print(f"\nPhase 3 - Stopwords & Descriptive Phrases:")
                print(f"  • Removed: {phase3_results['removed']} invalid notes")
                if phase3_results['relations_reassociated'] > 0:
                    print(f"  • Notes extracted from phrases: Yes")
                    print(f"  • Relations reassociated: {phase3_results['relations_reassociated']}")
                print(f"  • Relations removed: {phase3_results['relations_removed']}")
                print(f"\nTotal:")
                print(f"  • Notes removed: {validation_results['notes_removed']}")
                total_relations_affected = (
                    phase1_results['relations_updated'] +
                    phase2_results['relations_updated'] +
                    phase3_results['relations_removed']
                )
                print(f"  • Relations affected: {total_relations_affected}")
                print(f"\n✅ Cleanup completed successfully!")
                print(f"\n💡 If you need to rollback, use: npm run db:restore")
            else:
                print("\n✅ Dry run completed successfully!")
                print("   Run without --dry-run to apply changes.")
        finally:
            conn.close()
    
    except Exception as error:
        print(f"\n❌ Cleanup failed: {error}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    clean_notes()
