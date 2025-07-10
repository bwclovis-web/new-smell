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

export default constants
