import * as React from 'react'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/features/shared/components/ui/toggle-group'
import { Bold, Italic, List } from 'lucide-react'
import { sanitizeHtml } from '#/features/shared/lib/htmlSanitizer'

interface RichEmailEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichEmailEditor({
  value,
  onChange,
  placeholder = 'Typ hier uw bericht...',
  className = '',
}: RichEmailEditorProps) {
  const editorRef = React.useRef<HTMLDivElement | null>(null)
  const lastHtmlRef = React.useRef<string | null>(null)
  const [activeFormats, setActiveFormats] = React.useState<string[]>([])

  // Synchronize incoming value changes safely via DOM ref on mount and on value changes
  React.useEffect(() => {
    if (editorRef.current && (value || '') !== lastHtmlRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(value || '')
      lastHtmlRef.current = editorRef.current.innerHTML
    }
  }, [value])

  const updateActiveFormats = React.useCallback(() => {
    if (typeof document === 'undefined') return
    const formats: string[] = []
    try {
      if (document.queryCommandState('bold')) formats.push('bold')
      if (document.queryCommandState('italic')) formats.push('italic')
      if (document.queryCommandState('insertUnorderedList')) formats.push('list')
    } catch {
      // Ignore security/DOM exceptions
    }
    setActiveFormats(formats)
  }, [])

  const handleInput = () => {
    if (!editorRef.current) return
    const currentHtml = editorRef.current.innerHTML
    const cleanHtml = sanitizeHtml(currentHtml)
    lastHtmlRef.current = cleanHtml
    onChange(cleanHtml)
    updateActiveFormats()
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const htmlData = e.clipboardData.getData('text/html')
    const textData = e.clipboardData.getData('text/plain')

    let cleanContent = ''
    if (htmlData) {
      cleanContent = sanitizeHtml(htmlData)
    } else if (textData) {
      // Escape plain text for HTML insertion preserving line breaks
      cleanContent = textData
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
    }

    if (cleanContent) {
      document.execCommand('insertHTML', false, cleanContent)
      handleInput()
    }
  }

  const execFormat = (command: 'bold' | 'italic' | 'insertUnorderedList') => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false)
    handleInput()
    updateActiveFormats()
  }

  return (
    <div className={`flex flex-col border border-border rounded-lg overflow-hidden bg-background ${className}`}>
      {/* Editor Toolbar */}
      <div className="px-3 py-1.5 border-b border-border bg-muted/20 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">Opmaak:</span>
          <ToggleGroup
            type="multiple"
            size="sm"
            variant="outline"
            value={activeFormats}
            className="h-6.5"
          >
            <ToggleGroupItem
              value="bold"
              onClick={() => execFormat('bold')}
              className="h-6.5 px-2 data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              title="Vetgedrukt (Ctrl+B)"
            >
              <Bold className="size-3" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="italic"
              onClick={() => execFormat('italic')}
              className="h-6.5 px-2 data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              title="Cursief (Ctrl+I)"
            >
              <Italic className="size-3" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              onClick={() => execFormat('insertUnorderedList')}
              className="h-6.5 px-2 data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              title="Opsomming (Bullet list)"
            >
              <List className="size-3" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <span className="text-[10px] text-muted-foreground/75">
          Visuele editor (HTML)
        </span>
      </div>

      {/* ContentEditable visual text area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="flex-1 w-full text-xs font-sans leading-relaxed text-foreground bg-background p-3.5 focus:outline-none min-h-48 overflow-y-auto [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-0.5 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
      />
    </div>
  )
}
