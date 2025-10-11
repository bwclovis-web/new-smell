import React, { useRef, useEffect, useState } from 'react'
import { styleMerge } from '~/utils/styleUtils'

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxLength?: number
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Write your review...',
  className,
  disabled = false,
  maxLength = 5000
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [currentLength, setCurrentLength] = useState(0)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
      setCurrentLength(getTextLength(value))
    }
  }, [value])

  const getTextLength = (html: string) => {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent?.length || 0
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current && onChange) {
      const content = editorRef.current.innerHTML
      const textLength = getTextLength(content)

      if (textLength <= maxLength) {
        setCurrentLength(textLength)
        onChange(content)
      } else {
        // Prevent further input if over limit
        e.preventDefault()
        // Revert to previous content
        editorRef.current.innerHTML = value
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Allow normal typing, but prevent if we're at the limit
    if (editorRef.current) {
      const currentLength = getTextLength(editorRef.current.innerHTML)
      if (currentLength >= maxLength && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        e.preventDefault()
      }
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    // Trigger input event manually
    if (editorRef.current && onChange) {
      const content = editorRef.current.innerHTML
      const textLength = getTextLength(content)
      setCurrentLength(textLength)
      onChange(content)
    }
  }

  const formatButtons = [
    { command: 'bold', icon: 'B', title: 'Bold' },
    { command: 'italic', icon: 'I', title: 'Italic' },
    { command: 'underline', icon: 'U', title: 'Underline' },
    { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
    { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' }
  ]

  return (
    <div className={styleMerge('rich-text-editor', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-300 bg-gray-50 rounded-t-md">
        {formatButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            onClick={() => execCommand(button.command)}
            className="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title={button.title}
            disabled={disabled}
          >
            {button.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={styleMerge(
          'min-h-[120px] p-3 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 cursor-not-allowed',
          isFocused && 'ring-2 ring-blue-500 border-blue-500'
        )}
        style={{
          minHeight: '120px',
          direction: 'ltr',
          textAlign: 'left'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Character count */}
      <div className="flex justify-between items-center px-3 py-1 text-xs text-gray-500 bg-gray-50 rounded-b-md">
        <span>{currentLength} / {maxLength} characters</span>
        {currentLength > maxLength * 0.9 && (
          <span className="text-orange-600">
            {maxLength - currentLength} characters remaining
          </span>
        )}
      </div>

      {/* Placeholder styling */}
      <style jsx>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
