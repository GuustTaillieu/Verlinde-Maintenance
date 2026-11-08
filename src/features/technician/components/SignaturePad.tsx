import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '#/features/shared/components/ui/button'
import { RotateCcw, PenTool } from 'lucide-react'

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void
  disabled?: boolean
}

export function SignaturePad({ onSignatureChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Configure high-DPI canvas context
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#0f172a' // slate-900
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  useEffect(() => {
    setupCanvas()
    window.addEventListener('resize', setupCanvas)
    return () => window.removeEventListener('resize', setupCanvas)
  }, [setupCanvas])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    return { x: 0, y: 0 }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    if ('touches' in e) {
      // Prevent scrolling when drawing on touch screens
      e.stopPropagation()
    }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    isDrawing.current = true
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || disabled) return
    if ('touches' in e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()

    if (!hasDrawn) {
      setHasDrawn(true)
    }
  }

  const stopDrawing = () => {
    if (!isDrawing.current) return
    isDrawing.current = false

    const canvas = canvasRef.current
    if (canvas && hasDrawn) {
      onSignatureChange(canvas.toDataURL('image/png'))
    }
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasDrawn(false)
    onSignatureChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <PenTool className="size-3.5 text-primary" />
          Digitale Handtekening Klant (met vinger of stylus):
        </label>
        {hasDrawn && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={disabled}
            className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Wissen
          </Button>
        )}
      </div>

      <div className="relative w-full h-36 bg-background border-2 border-dashed border-border rounded-xl overflow-hidden touch-none select-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair bg-white"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-muted-foreground/50">
            <span className="text-xs font-medium">Teken hier voor ontvangst & akkoord</span>
            <div className="w-48 h-px bg-muted-foreground/20 mt-6" />
          </div>
        )}
      </div>
    </div>
  )
}
