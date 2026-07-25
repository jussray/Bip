/**
 * HTML5 Canvas API - Mood Drawing
 * Let teens draw their mood with canvas
 */

import React, { useRef, useEffect } from 'react'

interface MoodCanvasProps {
  onSave: (imageData: string) => void
  width?: number
  height?: number
}

export function MoodCanvas({ onSave, width = 400, height = 300 }: MoodCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Fill with white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)
  }, [width, height])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const { offsetX, offsetY } = e.nativeEvent
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(offsetX, offsetY)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const { offsetX, offsetY } = e.nativeEvent
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = color
      ctx.lineTo(offsetX, offsetY)
      ctx.stroke()
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const imageData = canvas.toDataURL('image/png')
      onSave(imageData)
    }
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white"
      />

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="color" className="text-sm font-medium">
            Color:
          </label>
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="size" className="text-sm font-medium">
            Size:
          </label>
          <input
            id="size"
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-600">{brushSize}px</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Save Drawing
        </button>
      </div>
    </div>
  )
}
