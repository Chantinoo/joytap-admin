'use client'

/**
 * ImageCropModal — 无外部依赖的图片裁切弹窗
 * 支持：鼠标拖动移动裁切框 / 拖动四角调整大小 / 滚轮缩放图片 / 确认后输出 base64
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Slider } from 'antd'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface CropBox { x: number; y: number; w: number; h: number }

interface Props {
  /** 要裁切的图片 URL 或 dataURL */
  src: string
  /** 默认宽高比，如 3/2；0 表示自由裁切 */
  aspectRatio?: number
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
}

const HANDLE_SIZE = 10
const MIN_BOX = 40

export default function ImageCropModal({ src, aspectRatio = 3 / 2, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // 图片在 canvas 上的绘制参数
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  // 裁切框（canvas 坐标，相对于 canvas 左上角）
  const [cropBox, setCropBox] = useState<CropBox>({ x: 60, y: 40, w: 280, h: aspectRatio ? 280 / aspectRatio : 200 })
  const [loaded, setLoaded] = useState(false)

  const CANVAS_W = 520
  const CANVAS_H = 340

  // 加载图片
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      setLoaded(true)
      // 初始缩放：让图片刚好填满 canvas
      const scaleW = CANVAS_W / img.naturalWidth
      const scaleH = CANVAS_H / img.naturalHeight
      const s = Math.max(scaleW, scaleH)
      setZoom(s)
      setOffset({
        x: (CANVAS_W - img.naturalWidth * s) / 2,
        y: (CANVAS_H - img.naturalHeight * s) / 2,
      })
      // 初始裁切框居中
      const bw = aspectRatio ? Math.min(CANVAS_W * 0.75, CANVAS_H * 0.75 * aspectRatio) : CANVAS_W * 0.6
      const bh = aspectRatio ? bw / aspectRatio : CANVAS_H * 0.6
      setCropBox({ x: (CANVAS_W - bw) / 2, y: (CANVAS_H - bh) / 2, w: bw, h: bh })
    }
    img.src = src
  }, [src, aspectRatio])

  // 重绘 canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !loaded) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // 暗色遮罩背景
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // 绘制图片（含缩放与位移）
    ctx.save()
    ctx.drawImage(img, offset.x, offset.y, img.naturalWidth * zoom, img.naturalHeight * zoom)
    ctx.restore()

    // 半透明遮罩（裁切框外）
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    // 镂空裁切框
    ctx.clearRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h)
    // 重绘裁切框内的图片（不带遮罩）
    ctx.drawImage(img, offset.x, offset.y, img.naturalWidth * zoom, img.naturalHeight * zoom)
    ctx.restore()

    // 裁切框边框
    ctx.save()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h)

    // 三等分参考线
    ctx.setLineDash([4, 3])
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(cropBox.x + (cropBox.w / 3) * i, cropBox.y)
      ctx.lineTo(cropBox.x + (cropBox.w / 3) * i, cropBox.y + cropBox.h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cropBox.x, cropBox.y + (cropBox.h / 3) * i)
      ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + (cropBox.h / 3) * i)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // 四角手柄
    ctx.fillStyle = '#fff'
    const corners = [
      [cropBox.x, cropBox.y],
      [cropBox.x + cropBox.w - HANDLE_SIZE, cropBox.y],
      [cropBox.x, cropBox.y + cropBox.h - HANDLE_SIZE],
      [cropBox.x + cropBox.w - HANDLE_SIZE, cropBox.y + cropBox.h - HANDLE_SIZE],
    ]
    corners.forEach(([hx, hy]) => ctx.fillRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE))

    // 四边中点手柄
    const midHandles = [
      [cropBox.x + cropBox.w / 2 - HANDLE_SIZE / 2, cropBox.y],
      [cropBox.x + cropBox.w / 2 - HANDLE_SIZE / 2, cropBox.y + cropBox.h - HANDLE_SIZE],
      [cropBox.x, cropBox.y + cropBox.h / 2 - HANDLE_SIZE / 2],
      [cropBox.x + cropBox.w - HANDLE_SIZE, cropBox.y + cropBox.h / 2 - HANDLE_SIZE / 2],
    ]
    midHandles.forEach(([hx, hy]) => ctx.fillRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE))

    ctx.restore()
  }, [zoom, offset, cropBox, loaded])

  useEffect(() => { draw() }, [draw])

  // ─── 鼠标交互 ─────────────────────────────────────────
  type DragMode =
    | 'move-box'   // 整体移动裁切框
    | 'move-img'   // 移动图片（Shift 按住）
    | 'tl' | 'tr' | 'bl' | 'br'  // 四角 resize
    | 'mt' | 'mb' | 'ml' | 'mr'  // 四边 resize

  const dragRef = useRef<{
    mode: DragMode
    startX: number
    startY: number
    startBox: CropBox
    startOffset: { x: number; y: number }
  } | null>(null)

  const getHandle = (mx: number, my: number, box: CropBox): DragMode | null => {
    const { x, y, w, h } = box
    const hs = HANDLE_SIZE + 4 // 点击热区稍大
    if (mx >= x && mx <= x + hs && my >= y && my <= y + hs) return 'tl'
    if (mx >= x + w - hs && mx <= x + w && my >= y && my <= y + hs) return 'tr'
    if (mx >= x && mx <= x + hs && my >= y + h - hs && my <= y + h) return 'bl'
    if (mx >= x + w - hs && mx <= x + w && my >= y + h - hs && my <= y + h) return 'br'
    if (mx >= x + w / 2 - hs && mx <= x + w / 2 + hs && my >= y && my <= y + hs) return 'mt'
    if (mx >= x + w / 2 - hs && mx <= x + w / 2 + hs && my >= y + h - hs && my <= y + h) return 'mb'
    if (mx >= x && mx <= x + hs && my >= y + h / 2 - hs && my <= y + h / 2 + hs) return 'ml'
    if (mx >= x + w - hs && mx <= x + w && my >= y + h / 2 - hs && my <= y + h / 2 + hs) return 'mr'
    if (mx >= x && mx <= x + w && my >= y && my <= y + h) return 'move-box'
    return null
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const handle = getHandle(mx, my, cropBox)
    dragRef.current = {
      mode: handle ?? 'move-img',
      startX: mx,
      startY: my,
      startBox: { ...cropBox },
      startOffset: { ...offset },
    }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const dx = mx - dragRef.current.startX
    const dy = my - dragRef.current.startY
    const { mode, startBox, startOffset } = dragRef.current

    if (mode === 'move-img') {
      setOffset({ x: startOffset.x + dx, y: startOffset.y + dy })
      return
    }

    const fixAspect = (box: CropBox): CropBox => {
      if (!aspectRatio) return box
      return { ...box, h: box.w / aspectRatio }
    }

    let nb = { ...startBox }
    if (mode === 'move-box') {
      nb.x = Math.max(0, Math.min(CANVAS_W - nb.w, startBox.x + dx))
      nb.y = Math.max(0, Math.min(CANVAS_H - nb.h, startBox.y + dy))
    } else if (mode === 'tl') {
      nb.x = startBox.x + dx
      nb.y = startBox.y + dy
      nb.w = Math.max(MIN_BOX, startBox.w - dx)
      nb.h = Math.max(MIN_BOX, startBox.h - dy)
      nb = fixAspect(nb)
    } else if (mode === 'tr') {
      nb.y = startBox.y + dy
      nb.w = Math.max(MIN_BOX, startBox.w + dx)
      nb.h = Math.max(MIN_BOX, startBox.h - dy)
      nb = fixAspect(nb)
    } else if (mode === 'bl') {
      nb.x = startBox.x + dx
      nb.w = Math.max(MIN_BOX, startBox.w - dx)
      nb.h = Math.max(MIN_BOX, startBox.h + dy)
      nb = fixAspect(nb)
    } else if (mode === 'br') {
      nb.w = Math.max(MIN_BOX, startBox.w + dx)
      nb.h = Math.max(MIN_BOX, startBox.h + dy)
      nb = fixAspect(nb)
    } else if (mode === 'mt') {
      nb.y = startBox.y + dy
      nb.h = Math.max(MIN_BOX, startBox.h - dy)
    } else if (mode === 'mb') {
      nb.h = Math.max(MIN_BOX, startBox.h + dy)
    } else if (mode === 'ml') {
      nb.x = startBox.x + dx
      nb.w = Math.max(MIN_BOX, startBox.w - dx)
    } else if (mode === 'mr') {
      nb.w = Math.max(MIN_BOX, startBox.w + dx)
    }
    // 边界保护
    nb.x = Math.max(0, Math.min(CANVAS_W - nb.w, nb.x))
    nb.y = Math.max(0, Math.min(CANVAS_H - nb.h, nb.y))
    nb.w = Math.min(nb.w, CANVAS_W - nb.x)
    nb.h = Math.min(nb.h, CANVAS_H - nb.y)
    setCropBox(nb)
  }

  const onMouseUp = () => { dragRef.current = null }

  // 滚轮缩放图片
  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.05 : -0.05
    setZoom(z => Math.max(0.1, Math.min(5, z + delta)))
  }

  // 光标样式
  const getCursor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const handle = getHandle(mx, my, cropBox)
    const cursors: Record<string, string> = {
      tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize',
      mt: 'n-resize', mb: 's-resize', ml: 'w-resize', mr: 'e-resize',
      'move-box': 'move',
    }
    canvasRef.current.style.cursor = handle ? (cursors[handle] || 'move') : 'crosshair'
  }

  // ─── 输出裁切结果 ────────────────────────────────────
  const handleConfirm = () => {
    const img = imgRef.current
    if (!img) return
    // 将 canvas 坐标转回图片原始像素坐标
    const srcX = (cropBox.x - offset.x) / zoom
    const srcY = (cropBox.y - offset.y) / zoom
    const srcW = cropBox.w / zoom
    const srcH = cropBox.h / zoom

    const OUT_W = 600
    const OUT_H = aspectRatio ? Math.round(OUT_W / aspectRatio) : Math.round(srcH * (OUT_W / srcW))
    const out = document.createElement('canvas')
    out.width = OUT_W
    out.height = OUT_H
    const ctx = out.getContext('2d')!
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H)
    onConfirm(out.toDataURL('image/jpeg', 0.9))
  }

  const handleReset = () => {
    const img = imgRef.current
    if (!img) return
    const s = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight)
    setZoom(s)
    setOffset({ x: (CANVAS_W - img.naturalWidth * s) / 2, y: (CANVAS_H - img.naturalHeight * s) / 2 })
    const bw = aspectRatio ? Math.min(CANVAS_W * 0.75, CANVAS_H * 0.75 * aspectRatio) : CANVAS_W * 0.6
    const bh = aspectRatio ? bw / aspectRatio : CANVAS_H * 0.6
    setCropBox({ x: (CANVAS_W - bw) / 2, y: (CANVAS_H - bh) / 2, w: bw, h: bh })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1A1A2E',
        borderRadius: 12,
        width: 580,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>
        {/* 标题栏 */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>裁切封面图</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>拖动框调整区域 · 框外拖动移动图片 · 滚轮缩放</span>
        </div>

        {/* Canvas 画布 */}
        <div ref={containerRef} style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, background: '#000', margin: '0 auto' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onMouseDown={onMouseDown}
            onMouseMove={(e) => { onMouseMove(e); getCursor(e) }}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            style={{ display: 'block' }}
          />
          {!loaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              图片加载中...
            </div>
          )}
        </div>

        {/* 缩放控制 */}
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ZoomOut size={14} color="rgba(255,255,255,0.5)" />
          <div style={{ flex: 1 }}>
            <Slider
              min={10}
              max={400}
              value={Math.round(zoom * 100)}
              onChange={(v) => setZoom(v / 100)}
              tooltip={{ formatter: (v) => `${v}%` }}
              styles={{ track: { background: '#1677FF' }, rail: { background: 'rgba(255,255,255,0.15)' } }}
            />
          </div>
          <ZoomIn size={14} color="rgba(255,255,255,0.5)" />
          <Button
            size="small"
            type="text"
            icon={<RotateCcw size={13} />}
            onClick={handleReset}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 4 }}
          >
            重置
          </Button>
        </div>

        {/* 操作按钮 */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel} style={{ fontSize: 13 }}>取消</Button>
          <Button type="primary" onClick={handleConfirm} style={{ fontSize: 13 }}>
            确认裁切
          </Button>
        </div>
      </div>
    </div>
  )
}
