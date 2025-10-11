const constants = {
  AUTH_SESSION_KEY: '_authId'
}

export const FORM_TYPES = {
  CREATE_HOUSE_FORM: 'createHouseForm' as const,
  EDIT_HOUSE_FORM: 'editHouseForm' as const,
  CREATE_PERFUME_FORM: 'createPerfumeForm' as const,
  EDIT_PERFUME_FORM: 'editPerfumeForm' as const
}

export const MODAL_IDS = {
  CREATE_COMMENT_MODAL: 'createCommentModal' as const,
  EDIT_COMMENT_MODAL: 'editCommentModal' as const,
  DELETE_COMMENT_MODAL: 'deleteCommentModal' as const
}

export const FORM_DATA_ACTIONS = {
  ADD_COMMENT: 'add-comment' as const,
  TOGGLE_COMMENT_VISIBILITY: 'toggle-comment-visibility' as const,
  DELETE_COMMENT: 'delete-comment' as const
}

// DEPRECATED: Rating labels are now managed via i18n translations
// See: public/locales/{en,es}/translation.json -> singlePerfume.rating.labels
// This constant is kept for reference only and is no longer used in components
export const RATING_LABELS = {
  longevity: {
    1: 'Fleeting Shadow',
    2: 'Brief Encounter',
    3: 'Steady Presence',
    4: 'Lingering Mystery',
    5: 'Eternal Obsession'
  },
  sillage: {
    1: 'Whispered Secret',
    2: 'Subtle Intrigue',
    3: 'Bold Statement',
    4: 'Commanding Aura',
    5: 'Room Domination'
  },
  gender: {
    1: 'Distinctly Feminine',
    2: 'Ladylike Edge',
    3: 'Mysterious Unisex',
    4: 'Suited Mystique',
    5: 'Distinctly Masculine'
  },
  priceValue: {
    1: 'Highway Robbery',
    2: 'Steep Price',
    3: 'Fair Deal',
    4: 'Smart Investment',
    5: 'Stolen Treasure'
  },
  overall: {
    1: 'Despise',
    2: 'Dismiss',
    3: 'Tolerable',
    4: 'Admire',
    5: 'Obsessed'
  }
}

export default constants
