# Modal System Guide

## Overview

The New Smell application uses a unified modal system powered by **Zustand** for state management. All modals throughout the application use the same consistent pattern for opening, closing, and managing modal state.

**Key Components:**
- `useSessionStore` - Zustand store for modal state management
- `Modal` - Reusable modal component (Organism)
- `DangerModal` - Specialized modal for dangerous actions

## Architecture

### State Management (sessionStore)

The modal system is powered by a Zustand store located at `app/stores/sessionStore.ts`. This provides global modal state accessible from anywhere in the application.

**Store Interface:**

```typescript
interface SessionState {
  modalOpen: boolean                      // Is any modal currently open?
  modalData: ModalData | null            // Data passed to the modal
  modalId: string | null                 // Unique identifier for the open modal
  triggerId: RefObject<HTMLButtonElement> | null  // Button that triggered the modal

  // Actions
  toggleModal: (id: RefObject<HTMLButtonElement>, modalId: string, data?: ModalData) => void
  closeModal: () => void
  setModalData: (data: ModalData | null) => void
  setModalId: (id: string | null) => void
}
```

**What it does:**
- Manages modal open/close state
- Handles body overflow (prevents scrolling when modal is open)
- Restores focus to trigger button when modal closes
- Supports passing data to modals
- Prevents multiple modals from opening simultaneously

## Usage

### Basic Modal Usage

```typescript
import { useRef } from 'react'
import { useSessionStore } from '~/stores/sessionStore'
import Modal from '~/components/Organisms/Modal'

function MyComponent() {
  const { modalOpen, modalId, toggleModal } = useSessionStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const MODAL_ID = 'my-modal'

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => toggleModal(buttonRef, MODAL_ID)}
      >
        Open Modal
      </button>

      {modalOpen && modalId === MODAL_ID && (
        <Modal>
          <h2>Modal Content</h2>
          <p>Your content here</p>
        </Modal>
      )}
    </>
  )
}
```

### Modal with Data

```typescript
import { useRef } from 'react'
import { useSessionStore } from '~/stores/sessionStore'
import Modal from '~/components/Organisms/Modal'

function UserModal() {
  const { modalOpen, modalId, modalData, toggleModal } = useSessionStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const MODAL_ID = 'user-modal'

  const openWithData = (userId: string) => {
    toggleModal(buttonRef, MODAL_ID, { userId })
  }

  return (
    <>
      <button ref={buttonRef} onClick={() => openWithData('123')}>
        View User
      </button>

      {modalOpen && modalId === MODAL_ID && (
        <Modal>
          <h2>User Details</h2>
          <p>User ID: {modalData?.userId}</p>
        </Modal>
      )}
    </>
  )
}
```

### Using DangerModal

For dangerous actions (delete, reset, etc.), use the `DangerModal` component:

```typescript
import { useRef } from 'react'
import { useSessionStore } from '~/stores/sessionStore'
import DangerModal from '~/components/Organisms/DangerModal'
import Modal from '~/components/Organisms/Modal'

function DeleteItem() {
  const { modalOpen, modalId, toggleModal, closeModal } = useSessionStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const MODAL_ID = 'delete-item-modal'

  const handleDelete = async () => {
    // Perform delete action
    await deleteItem()
    closeModal()
  }

  return (
    <>
      <button ref={buttonRef} onClick={() => toggleModal(buttonRef, MODAL_ID)}>
        Delete Item
      </button>

      {modalOpen && modalId === MODAL_ID && (
        <Modal>
          <DangerModal>
            <h2>Delete Item?</h2>
            <p>This action cannot be undone.</p>
            <button onClick={handleDelete}>Confirm Delete</button>
            <button onClick={closeModal}>Cancel</button>
          </DangerModal>
        </Modal>
      )}
    </>
  )
}
```

## Modal Component Features

### Modal Component (`app/components/Organisms/Modal/Modal.tsx`)

**Features:**
- Portal rendering to `#modal-portal`
- Smooth animations (fade in/out)
- Click outside to close
- Keyboard support (Enter/Space on overlay)
- Built-in close button
- Accessibility support

**Props:**

```typescript
interface ModalProps {
  children: ReactNode
  background?: 'default' | 'dark' | 'light'
  innerType?: 'default' | 'wide' | 'narrow'
  animateStart?: boolean
}
```

**Variants:**

```typescript
// Default modal
<Modal>Content</Modal>

// Dark background
<Modal background="dark">Content</Modal>

// Wide content area
<Modal innerType="wide">Content</Modal>

// Start with animation
<Modal animateStart>Content</Modal>
```

## Best Practices

### 1. Use Unique Modal IDs

Always use a unique, descriptive modal ID:

```typescript
// Good
const MODAL_ID = 'edit-perfume-modal'
const MODAL_ID = `delete-comment-${commentId}`

// Bad
const MODAL_ID = 'modal'
const MODAL_ID = 'modal1'
```

### 2. Use Refs for Trigger Buttons

Always attach a ref to the button that triggers the modal for proper focus management:

```typescript
const buttonRef = useRef<HTMLButtonElement>(null)

<button ref={buttonRef} onClick={() => toggleModal(buttonRef, MODAL_ID)}>
  Open Modal
</button>
```

### 3. Check Both modalOpen and modalId

Always check both conditions before rendering a modal:

```typescript
// Good
{modalOpen && modalId === MODAL_ID && (
  <Modal>...</Modal>
)}

// Bad - will render all modals when any modal is open
{modalOpen && (
  <Modal>...</Modal>
)}
```

### 4. Close Modals After Actions

Remember to close the modal after completing an action:

```typescript
const handleSubmit = async () => {
  await saveData()
  closeModal()  // Don't forget this!
}
```

### 5. Clean Up Modal Data

If your modal uses sensitive data, consider clearing it when closed:

```typescript
const handleClose = () => {
  closeModal()
  setModalData(null)
}
```

## Common Patterns

### Confirmation Modal

```typescript
function ConfirmationModal({ onConfirm }: { onConfirm: () => void }) {
  const { modalOpen, modalId, toggleModal, closeModal } = useSessionStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const MODAL_ID = 'confirmation-modal'

  const handleConfirm = () => {
    onConfirm()
    closeModal()
  }

  return (
    <>
      <button ref={buttonRef} onClick={() => toggleModal(buttonRef, MODAL_ID)}>
        Confirm Action
      </button>

      {modalOpen && modalId === MODAL_ID && (
        <Modal>
          <h2>Are you sure?</h2>
          <div className="flex gap-4">
            <button onClick={handleConfirm}>Confirm</button>
            <button onClick={closeModal}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  )
}
```

### Form Modal

```typescript
function FormModal() {
  const { modalOpen, modalId, toggleModal, closeModal } = useSessionStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const MODAL_ID = 'form-modal'
  const [formData, setFormData] = useState({ name: '' })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await saveData(formData)
    closeModal()
    setFormData({ name: '' }) // Reset form
  }

  return (
    <>
      <button ref={buttonRef} onClick={() => toggleModal(buttonRef, MODAL_ID)}>
        Open Form
      </button>

      {modalOpen && modalId === MODAL_ID && (
        <Modal>
          <form onSubmit={handleSubmit}>
            <h2>Submit Form</h2>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="Name"
            />
            <button type="submit">Submit</button>
            <button type="button" onClick={closeModal}>Cancel</button>
          </form>
        </Modal>
      )}
    </>
  )
}
```

### Dynamic Modal Content

```typescript
function DynamicModal() {
  const { modalOpen, modalId, modalData, toggleModal } = useSessionStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const MODAL_ID = 'dynamic-modal'

  const openWithItem = (item: Item) => {
    toggleModal(buttonRef, MODAL_ID, { item })
  }

  return (
    <>
      {items.map((item) => (
        <button
          key={item.id}
          ref={buttonRef}
          onClick={() => openWithItem(item)}
        >
          View {item.name}
        </button>
      ))}

      {modalOpen && modalId === MODAL_ID && modalData?.item && (
        <Modal>
          <h2>{modalData.item.name}</h2>
          <p>{modalData.item.description}</p>
        </Modal>
      )}
    </>
  )
}
```

## Testing

### Testing Components with Modals

```typescript
import { renderHook, act } from '@testing-library/react'
import { useSessionStore } from '~/stores/sessionStore'

describe('MyModalComponent', () => {
  beforeEach(() => {
    // Reset modal state before each test
    act(() => {
      useSessionStore.setState({
        modalOpen: false,
        modalData: null,
        modalId: null,
        triggerId: null,
      })
    })
  })

  it('should open modal', () => {
    const { result } = renderHook(() => useSessionStore())
    const buttonRef = createRef<HTMLButtonElement>()

    act(() => {
      result.current.toggleModal(buttonRef, 'test-modal')
    })

    expect(result.current.modalOpen).toBe(true)
    expect(result.current.modalId).toBe('test-modal')
  })
})
```

## Migration from Old System

If you're migrating from the old `SessionProvider` or `useModal` hook:

### Old Pattern (Deprecated)

```typescript
// OLD - Don't use
import SessionContext from '~/providers/sessionProvider'
import { useContext } from 'react'

const { modalOpen, toggleModal } = useContext(SessionContext)
```

### New Pattern (Current)

```typescript
// NEW - Use this
import { useSessionStore } from '~/stores/sessionStore'

const { modalOpen, toggleModal } = useSessionStore()
```

## Troubleshooting

### Modal Not Appearing

1. **Check Portal Element**: Ensure `#modal-portal` exists in the DOM (it's in `root.tsx`)
2. **Check Conditions**: Verify both `modalOpen` and `modalId` match
3. **Check Z-Index**: Modal uses `z-[9999]`, ensure nothing is layered above it

### Focus Not Returning

1. **Check Button Ref**: Ensure the trigger button has a ref attached
2. **Check Button in DOM**: The button must still exist when modal closes

### Body Still Scrolling

This is handled automatically, but if you encounter issues:
1. Check browser console for errors
2. Verify modal is properly closed with `closeModal()`

### Multiple Modals Opening

Only one modal should open at a time. If multiple modals render:
1. Check your modal ID conditions
2. Ensure you're checking `modalId === YOUR_MODAL_ID`

## Examples in Codebase

See these files for real-world examples:

- `app/components/Containers/MyScents/CommentsModal/CommentsModal.tsx`
- `app/components/Containers/MyScents/MyScentsModal/MyScentsModal.tsx`
- `app/components/Organisms/AddToCollectionModal/AddToCollectionModal.tsx`
- `app/components/Molecules/MobileNavigation/MobileNavigation.tsx`

## API Reference

### useSessionStore

```typescript
const {
  modalOpen,    // boolean - Is any modal open?
  modalData,    // object | null - Data passed to modal
  modalId,      // string | null - ID of open modal
  triggerId,    // RefObject | null - Button that opened modal
  toggleModal,  // function - Open/close modal
  closeModal,   // function - Close modal
  setModalData, // function - Update modal data
  setModalId    // function - Update modal ID
} = useSessionStore()
```

### toggleModal(buttonRef, modalId, data?)

Opens a modal or closes it if already open.

**Parameters:**
- `buttonRef`: RefObject<HTMLButtonElement> - Reference to trigger button
- `modalId`: string - Unique identifier for the modal
- `data?`: object - Optional data to pass to the modal

**Returns:** void

### closeModal()

Closes the currently open modal.

**Parameters:** none

**Returns:** void

### setModalData(data)

Updates the data for the currently open modal.

**Parameters:**
- `data`: object | null - New data or null to clear

**Returns:** void

### setModalId(id)

Updates the modal ID.

**Parameters:**
- `id`: string | null - New modal ID or null to clear

**Returns:** void

## Summary

- ✅ Use `useSessionStore` for all modal operations
- ✅ Always use unique modal IDs
- ✅ Check both `modalOpen` and `modalId` before rendering
- ✅ Attach refs to trigger buttons for focus management
- ✅ Close modals after completing actions
- ✅ One modal system, one consistent pattern
- ✅ Fully tested with 22+ comprehensive tests

The unified modal system provides a consistent, accessible, and easy-to-use pattern for all modal interactions throughout the application.

