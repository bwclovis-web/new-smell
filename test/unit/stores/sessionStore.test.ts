/**
 * Tests for sessionStore (modal state management)
 *
 * Tests the Zustand store that manages modal state including:
 * - Opening and closing modals
 * - Managing modal data
 * - Focus management
 * - Body overflow handling
 *
 * @group unit
 * @group stores
 * @group modal
 */

import { createRef } from "react"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSessionStore } from "~/stores/sessionStore"

describe("sessionStore - Modal Management", () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useSessionStore.setState({
        modalOpen: false,
        modalData: null,
        modalId: null,
        triggerId: null,
      })
    })

    // Reset document overflow
    document.documentElement.style.overflow = "auto"
  })

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useSessionStore())

      expect(result.current.modalOpen).toBe(false)
      expect(result.current.modalData).toBe(null)
      expect(result.current.modalId).toBe(null)
      expect(result.current.triggerId).toBe(null)
    })
  })

  describe("toggleModal", () => {
    it("should open a modal", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(result.current.modalOpen).toBe(true)
      expect(result.current.modalId).toBe("test-modal")
      expect(result.current.triggerId).toBe(buttonRef)
      expect(result.current.modalData).toBe(null)
    })

    it("should open a modal with data", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()
      const testData = { userId: "123", name: "Test" }

      act(() => {
        result.current.toggleModal(buttonRef, "test-modal", testData)
      })

      expect(result.current.modalOpen).toBe(true)
      expect(result.current.modalId).toBe("test-modal")
      expect(result.current.modalData).toEqual(testData)
    })

    it("should set body overflow to hidden when opening", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(document.documentElement.style.overflow).toBe("hidden")
    })

    it("should close modal when toggling the same modal ID", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      // Open modal
      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(result.current.modalOpen).toBe(true)

      // Toggle same modal - should close
      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(result.current.modalOpen).toBe(false)
      expect(result.current.modalId).toBe(null)
      expect(result.current.modalData).toBe(null)
      expect(result.current.triggerId).toBe(null)
    })

    it("should restore body overflow when closing via toggle", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      // Open modal
      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(document.documentElement.style.overflow).toBe("hidden")

      // Close modal
      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(document.documentElement.style.overflow).toBe("auto")
    })

    it("should switch to different modal when toggling different ID", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef1 = createRef<HTMLButtonElement>()
      const buttonRef2 = createRef<HTMLButtonElement>()

      // Open first modal
      act(() => {
        result.current.toggleModal(buttonRef1, "modal-1")
      })

      expect(result.current.modalId).toBe("modal-1")

      // Open second modal
      act(() => {
        result.current.toggleModal(buttonRef2, "modal-2")
      })

      expect(result.current.modalOpen).toBe(true)
      expect(result.current.modalId).toBe("modal-2")
      expect(result.current.triggerId).toBe(buttonRef2)
    })

    it("should focus trigger button when closing", () => {
      const { result } = renderHook(() => useSessionStore())
      const button = document.createElement("button")
      document.body.appendChild(button)
      const buttonRef = createRef<HTMLButtonElement>()
      // @ts-expect-error - setting current for test
      buttonRef.current = button

      const focusSpy = vi.spyOn(button, "focus")

      // Open and close modal
      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(focusSpy).toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(button)
    })
  })

  describe("closeModal", () => {
    it("should close the modal", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      // Open modal first
      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(result.current.modalOpen).toBe(true)

      // Close modal
      act(() => {
        result.current.closeModal()
      })

      expect(result.current.modalOpen).toBe(false)
      expect(result.current.modalId).toBe(null)
      expect(result.current.modalData).toBe(null)
      expect(result.current.triggerId).toBe(null)
    })

    it("should restore body overflow when closing", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      // Open modal
      act(() => {
        result.current.toggleModal(buttonRef, "test-modal")
      })

      expect(document.documentElement.style.overflow).toBe("hidden")

      // Close modal
      act(() => {
        result.current.closeModal()
      })

      expect(document.documentElement.style.overflow).toBe("auto")
    })

    it("should be safe to call when no modal is open", () => {
      const { result } = renderHook(() => useSessionStore())

      expect(() => {
        act(() => {
          result.current.closeModal()
        })
      }).not.toThrow()

      expect(result.current.modalOpen).toBe(false)
    })
  })

  describe("setModalData", () => {
    it("should update modal data", () => {
      const { result } = renderHook(() => useSessionStore())
      const newData = { key: "value" }

      act(() => {
        result.current.setModalData(newData)
      })

      expect(result.current.modalData).toEqual(newData)
    })

    it("should clear modal data when set to null", () => {
      const { result } = renderHook(() => useSessionStore())

      // Set data first
      act(() => {
        result.current.setModalData({ key: "value" })
      })

      expect(result.current.modalData).not.toBe(null)

      // Clear data
      act(() => {
        result.current.setModalData(null)
      })

      expect(result.current.modalData).toBe(null)
    })
  })

  describe("setModalId", () => {
    it("should update modal ID", () => {
      const { result } = renderHook(() => useSessionStore())

      act(() => {
        result.current.setModalId("new-modal-id")
      })

      expect(result.current.modalId).toBe("new-modal-id")
    })

    it("should clear modal ID when set to null", () => {
      const { result } = renderHook(() => useSessionStore())

      // Set ID first
      act(() => {
        result.current.setModalId("test-id")
      })

      expect(result.current.modalId).toBe("test-id")

      // Clear ID
      act(() => {
        result.current.setModalId(null)
      })

      expect(result.current.modalId).toBe(null)
    })
  })

  describe("Integration Scenarios", () => {
    it("should handle complete modal lifecycle", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()
      const modalData = { userId: "123" }

      // Open modal
      act(() => {
        result.current.toggleModal(buttonRef, "user-modal", modalData)
      })

      expect(result.current.modalOpen).toBe(true)
      expect(result.current.modalId).toBe("user-modal")
      expect(result.current.modalData).toEqual(modalData)

      // Update data
      const updatedData = { userId: "456" }
      act(() => {
        result.current.setModalData(updatedData)
      })

      expect(result.current.modalData).toEqual(updatedData)

      // Close modal
      act(() => {
        result.current.closeModal()
      })

      expect(result.current.modalOpen).toBe(false)
      expect(result.current.modalData).toBe(null)
    })

    it("should handle switching between modals", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef1 = createRef<HTMLButtonElement>()
      const buttonRef2 = createRef<HTMLButtonElement>()

      // Open first modal
      act(() => {
        result.current.toggleModal(buttonRef1, "modal-1", { data: 1 })
      })

      expect(result.current.modalId).toBe("modal-1")
      expect(result.current.modalData).toEqual({ data: 1 })

      // Open second modal
      act(() => {
        result.current.toggleModal(buttonRef2, "modal-2", { data: 2 })
      })

      expect(result.current.modalId).toBe("modal-2")
      expect(result.current.modalData).toEqual({ data: 2 })
      expect(result.current.modalOpen).toBe(true)
    })

    it("should maintain body overflow state correctly across multiple operations", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      // Initial state
      expect(document.documentElement.style.overflow).toBe("auto")

      // Open modal
      act(() => {
        result.current.toggleModal(buttonRef, "modal-1")
      })
      expect(document.documentElement.style.overflow).toBe("hidden")

      // Switch modal
      act(() => {
        result.current.toggleModal(buttonRef, "modal-2")
      })
      expect(document.documentElement.style.overflow).toBe("hidden")

      // Close modal
      act(() => {
        result.current.closeModal()
      })
      expect(document.documentElement.style.overflow).toBe("auto")
    })
  })

  describe("Edge Cases", () => {
    it("should handle toggle with null button ref gracefully", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()
      // buttonRef.current is null

      expect(() => {
        act(() => {
          result.current.toggleModal(buttonRef, "test-modal")
        })
      }).not.toThrow()
    })

    it("should handle rapid toggle calls", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      act(() => {
        result.current.toggleModal(buttonRef, "modal-1")
        result.current.toggleModal(buttonRef, "modal-1")
        result.current.toggleModal(buttonRef, "modal-1")
      })

      // Should be open after odd number of toggles
      expect(result.current.modalOpen).toBe(true)
    })

    it("should handle empty modal data object", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()

      act(() => {
        result.current.toggleModal(buttonRef, "test-modal", {})
      })

      expect(result.current.modalData).toEqual({})
    })

    it("should handle complex modal data objects", () => {
      const { result } = renderHook(() => useSessionStore())
      const buttonRef = createRef<HTMLButtonElement>()
      const complexData = {
        user: { id: "123", name: "Test" },
        settings: { theme: "dark", lang: "en" },
        nested: { deeply: { nested: { value: true } } },
      }

      act(() => {
        result.current.toggleModal(buttonRef, "test-modal", complexData)
      })

      expect(result.current.modalData).toEqual(complexData)
    })
  })
})
