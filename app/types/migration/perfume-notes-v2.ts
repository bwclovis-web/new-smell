/**
 * Types for Perfume Notes Junction Table
 * 
 * Type definitions for working with the perfume notes junction table structure (PerfumeNoteRelation).
 * These types support the many-to-many relationship between perfumes and notes.
 */

import type { Perfume, PerfumeNotes } from "../database"

/**
 * PerfumeNoteRelation - Junction table entry
 * Links a perfume to a note with a specific type (open/heart/base)
 */
export interface PerfumeNoteRelation {
  id: string
  perfumeId: string
  noteId: string
  noteType: "open" | "heart" | "base"
  createdAt: Date
  perfume?: Perfume
  note?: PerfumeNotes
}

/**
 * PerfumeWithNotesV2 - Perfume with junction table structure
 * Use this type when querying perfumes with perfumeNoteRelations
 */
export interface PerfumeWithNotesV2 extends Perfume {
  perfumeNoteRelations: PerfumeNoteRelation[]
  // Display format (transformed from junction table)
  perfumeNotesOpen?: PerfumeNotes[]
  perfumeNotesHeart?: PerfumeNotes[]
  perfumeNotesClose?: PerfumeNotes[]
}

/**
 * Note type enum values
 */
export type PerfumeNoteType = "open" | "heart" | "base"

/**
 * Helper type for creating a new PerfumeNoteRelation
 */
export type CreatePerfumeNoteRelationInput = {
  perfumeId: string
  noteId: string
  noteType: PerfumeNoteType
}

/**
 * Helper type for updating a PerfumeNoteRelation
 */
export type UpdatePerfumeNoteRelationInput = Partial<
  Pick<PerfumeNoteRelation, "noteType">
>

/**
 * Type guard to check if perfume has junction table notes
 */
export function isPerfumeWithNotesV2(perfume: Perfume | PerfumeWithNotesV2): perfume is PerfumeWithNotesV2 {
  return (
    "perfumeNoteRelations" in perfume &&
    Array.isArray(perfume.perfumeNoteRelations)
  )
}

