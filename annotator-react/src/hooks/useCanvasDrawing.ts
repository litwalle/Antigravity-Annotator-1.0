import { useRef, useEffect, useState, useCallback } from 'react'
import type { ToolId, CommentState, CropRect, Annotation, FreehandAnnotation, RectAnnotation, ArrowAnnotation, TextAnnotation, CommentAnnotation } from '../types'
import { CURSOR_MAP, DEFAULT_TEXT_FONT_SIZE, DEFAULT_TEXT_WIDTH, MIN_TEXT_HEIGHT, TEXT_FONT_SIZE_MIN, TEXT_FONT_SIZE_MAX } from '../constants'
import { toCanvas, genId, renderAll, hitTest, moveAnnotation, drawCommentRect } from '../utils/canvasUtils'
import { useAnnotatorHistory } from './useAnnotatorHistory'

export function useCanvasDrawing(imgDataUrl: string, activeColor: string) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawingRef = useRef(false)
    const startPosRef = useRef({ x: 0, y: 0 })
    const startCropRectRef = useRef<CropRect | null>(null)
    const commentRectRef = useRef<{ x: number; y: number; w: number; h: number; color: string } | null>(null)
    const scaleRef = useRef(1)
    const bgImageRef = useRef<HTMLImageElement | null>(null)
    const freehandPointsRef = useRef<{ x: number; y: number }[]>([])
    const dragRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null)

    const [tool, setTool] = useState<ToolId>('draw')
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 })
    const [annotations, setAnnotations] = useState<Annotation[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [draft, setDraft] = useState<Annotation | null>(null)

    // 文字编辑状态
    const [editingText, setEditingText] = useState<{
        id: string | null  // null = 新建, string = 编辑已有
        x: number; y: number; w: number; h: number
        content: string; color: string; fontSize: number
    } | null>(null)

    // 评论状态
    const [commentState, setCommentState] = useState<CommentState>({ visible: false, x: 0, y: 0, mode: 'comment' })
    const [commentText, setCommentText] = useState('')

    // 裁剪状态
    const [cropRect, setCropRect] = useState<CropRect | null>(null)
    const [isCropActive, setIsCropActive] = useState(false)
    const [isCropSelected, setIsCropSelected] = useState(false)
    const [isHoveringHandle, setIsHoveringHandle] = useState(false)
    const [isResizing, setIsResizing] = useState<string | null>(null)
    const [isMovingCrop, setIsMovingCrop] = useState(false)

    const { saveState, undoState, redoState, canRedo, clearToEmpty } = useAnnotatorHistory()

    // ── Canvas 初始化 ──
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        const img = new Image()
        img.onload = () => {
            const imgW = img.naturalWidth
            const imgH = img.naturalHeight
            canvas.width = imgW
            canvas.height = imgH
            const s = Math.min(window.innerWidth / imgW, window.innerHeight / imgH, 1)
            scaleRef.current = s
            setDisplaySize({ w: Math.round(imgW * s), h: Math.round(imgH * s) })
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(img, 0, 0, imgW, imgH)
            bgImageRef.current = img
            saveState([])
        }
        img.src = imgDataUrl
    }, [imgDataUrl])

    // ── 渲染循环 ──
    useEffect(() => {
        const canvas = canvasRef.current
        const bg = bgImageRef.current
        if (!canvas || !bg) return
        const ctx = canvas.getContext('2d')!
        renderAll(ctx, canvas, bg, annotations, draft, selectedIds, scaleRef.current)
    }, [annotations, draft, selectedIds])

    // 全局 mouseup 防止卡住
    useEffect(() => {
        function handleGlobalMouseUp() {
            if (dragRef.current) {
                if (dragRef.current.moved) saveState(annotations)
                dragRef.current = null
            }
            if (isDrawingRef.current) {
                isDrawingRef.current = false
                setDraft(null)
            }
        }
        window.addEventListener('mouseup', handleGlobalMouseUp)
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
    }, [annotations, saveState])

    // ── 工具切换 ──
    function changeTool(t: ToolId) {
        if (editingText) confirmText()
        if (commentState.visible) closeComment()

        if (t === 'crop') {
            const nextActive = !isCropActive
            setIsCropActive(nextActive)
            setIsCropSelected(nextActive)
            if (nextActive) {
                setTool('crop')
            } else {
                setCropRect(null)
                if (tool === 'crop') setTool('draw')
            }
            return
        }
        if (isCropActive) {
            setIsCropSelected(false)
            setIsHoveringHandle(false)
        }
        setTool(t)
        if (t !== 'select') setSelectedIds(new Set())
    }

    // ── 评论 ──
    function openComment(x: number, y: number) {
        setCommentState({ visible: true, x: Math.min(x + 12, window.innerWidth - 264), y: Math.min(y, window.innerHeight - 160), mode: 'comment' })
        setCommentText('')
    }

    function closeComment() {
        setCommentState(s => ({ ...s, visible: false }))
        commentRectRef.current = null
        setDraft(null)
    }

    function submitComment() {
        const text = commentText.trim()
        if (!text || !commentRectRef.current) { closeComment(); return }
        const canvas = canvasRef.current
        if (!canvas) { closeComment(); return }
        const s = scaleRef.current
        const { x, y, w, h, color } = commentRectRef.current
        const rx = Math.min(x, x + w), ry = Math.min(y, y + h)
        const rw = Math.abs(w), rh = Math.abs(h)

        // 计算文字位置
        const ctx = canvas.getContext('2d')!
        const fontSize = Math.round(17 / s)
        ctx.font = `400 ${fontSize}px -apple-system, 'Inter', sans-serif`
        const lines = text.split('\n')
        const maxW = Math.max(...lines.map(l => ctx.measureText(l).width))
        let textX = rx + rw + Math.round(14 / s)
        const textY = ry
        const canvasW = canvas.width
        if (textX + maxW > canvasW - 10) textX = Math.max(6, rx - maxW - Math.round(14 / s))

        const ann: CommentAnnotation = {
            id: genId(), type: 'comment', color,
            rect: { x: rx, y: ry, w: rw, h: rh },
            content: text, textX, textY,
        }
        const next = [...annotations, ann]
        setAnnotations(next)
        saveState(next)
        closeComment()
    }

    // ── 文字 ──
    function startTextEditing(cx: number, cy: number) {
        const s = scaleRef.current
        const defaultH = (DEFAULT_TEXT_FONT_SIZE * 1.3 + 4) / s
        setEditingText({
            id: null,
            x: cx, y: cy,
            w: DEFAULT_TEXT_WIDTH / s,
            h: defaultH,
            content: '',
            color: activeColor,
            fontSize: DEFAULT_TEXT_FONT_SIZE,
        })
    }

    function confirmText() {
        if (!editingText) return
        const text = editingText.content.trim()
        if (text) {
            if (editingText.id) {
                // 编辑已有
                const next = annotations.map(a =>
                    a.id === editingText.id
                        ? { ...a, content: text, x: editingText.x, y: editingText.y, w: editingText.w, h: editingText.h, fontSize: editingText.fontSize } as TextAnnotation
                        : a
                )
                setAnnotations(next)
                saveState(next)
            } else {
                // 新建
                const ann: TextAnnotation = {
                    id: genId(), type: 'text', color: editingText.color,
                    x: editingText.x, y: editingText.y,
                    w: editingText.w, h: editingText.h,
                    content: text, fontSize: editingText.fontSize,
                }
                const next = [...annotations, ann]
                setAnnotations(next)
                saveState(next)
            }
        }
        setEditingText(null)
    }

    function cancelText() {
        setEditingText(null)
    }

    // ── 选择 & 删除 ──
    function deleteSelected() {
        if (selectedIds.size === 0) return
        const next = annotations.filter(a => !selectedIds.has(a.id))
        setAnnotations(next)
        saveState(next)
        setSelectedIds(new Set())
    }

    function updateAnnotationFontSize(id: string, delta: number) {
        const next = annotations.map(a => {
            if (a.id === id && a.type === 'text') {
                const newSize = Math.max(TEXT_FONT_SIZE_MIN, Math.min(TEXT_FONT_SIZE_MAX, a.fontSize + delta))
                return { ...a, fontSize: newSize }
            }
            return a
        })
        setAnnotations(next)
        saveState(next)
    }

    // ── Undo / Redo / Clear ──
    function undo() {
        if (editingText) { cancelText(); return }
        if (commentState.visible) { closeComment(); return }
        const prev = undoState()
        if (prev) {
            setAnnotations(prev)
            setSelectedIds(new Set())
        }
    }

    function redo() {
        if (editingText || commentState.visible) return
        const next = redoState()
        if (next) {
            setAnnotations(next)
            setSelectedIds(new Set())
        }
    }

    function clearAll() {
        if (editingText) cancelText()
        if (commentState.visible) closeComment()
        const empty = clearToEmpty()
        setAnnotations(empty)
        setSelectedIds(new Set())
        setCropRect(null)
    }

    // ── Mouse Handlers ──
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (editingText) { confirmText(); return }
        if (commentState.visible) { closeComment(); return }
        const s = scaleRef.current
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY, s)

        // 裁剪交互优先
        if (isCropActive && cropRect) {
            const { x, y, w, h } = cropRect
            const margin = 12 / s
            const onLeft = Math.abs(cx - x) < margin && cy >= y - margin && cy <= y + h + margin
            const onRight = Math.abs(cx - (x + w)) < margin && cy >= y - margin && cy <= y + h + margin
            const onTop = Math.abs(cy - y) < margin && cx >= x - margin && cx <= x + w + margin
            const onBottom = Math.abs(cy - (y + h)) < margin && cx >= x - margin && cx <= x + w + margin

            let resizeDir = ''
            if (onLeft && onTop) resizeDir = 'nw'
            else if (onRight && onTop) resizeDir = 'ne'
            else if (onLeft && onBottom) resizeDir = 'sw'
            else if (onRight && onBottom) resizeDir = 'se'
            else if (onTop) resizeDir = 'n'
            else if (onBottom) resizeDir = 's'
            else if (onLeft) resizeDir = 'w'
            else if (onRight) resizeDir = 'e'

            if (resizeDir && (isCropSelected || isHoveringHandle || onLeft || onRight || onTop || onBottom)) {
                setIsResizing(resizeDir)
                setIsCropSelected(true)
                return
            }

            if (cx > x && cx < x + w && cy > y && cy < y + h) {
                if (tool === 'crop') {
                    setIsMovingCrop(true)
                    setIsCropSelected(true)
                    startPosRef.current = { x: cx - x, y: cy - y }
                    return
                } else {
                    setIsCropSelected(false)
                }
            } else {
                setIsCropSelected(false)
            }
        }

        if (tool === 'crop') {
            isDrawingRef.current = true
            startPosRef.current = { x: cx, y: cy }
            startCropRectRef.current = cropRect
            return
        }

        // Select 工具
        if (tool === 'select') {
            let hit: Annotation | null = null
            for (let i = annotations.length - 1; i >= 0; i--) {
                if (hitTest(annotations[i], cx, cy, s)) {
                    hit = annotations[i]
                    break
                }
            }
            // 双击文本标注 → 进入编辑模式
            if (hit && hit.type === 'text' && e.detail === 2) {
                const ta = hit as TextAnnotation
                setEditingText({
                    id: ta.id, x: ta.x, y: ta.y, w: ta.w, h: ta.h,
                    content: ta.content, color: ta.color, fontSize: ta.fontSize,
                })
                setSelectedIds(new Set())
                return
            }
            if (hit) {
                if (e.metaKey || e.ctrlKey) {
                    setSelectedIds(prev => {
                        const next = new Set(prev)
                        if (next.has(hit!.id)) next.delete(hit!.id)
                        else next.add(hit!.id)
                        return next
                    })
                } else {
                    if (!selectedIds.has(hit.id)) {
                        setSelectedIds(new Set([hit.id]))
                    }
                    // 开始拖拽
                    dragRef.current = { startX: cx, startY: cy, moved: false }
                }
            } else {
                setSelectedIds(new Set())
            }
            return
        }

        // Text 工具
        if (tool === 'text') {
            startTextEditing(cx, cy)
            return
        }

        // 绘制工具 (draw / rect / arrow / comment)
        isDrawingRef.current = true
        startPosRef.current = { x: cx, y: cy }

        if (tool === 'draw') {
            freehandPointsRef.current = [{ x: cx, y: cy }]
        }
    }, [commentState.visible, editingText, tool, activeColor, cropRect, isCropActive, isCropSelected, isHoveringHandle, annotations])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const s = scaleRef.current
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY, s)

        // 裁剪 hover 检测
        if (isCropActive && !isResizing && !isMovingCrop && cropRect) {
            const { x, y, w, h } = cropRect
            const margin = 12 / s
            const onLeft = Math.abs(cx - x) < margin && cy >= y - margin && cy <= y + h + margin
            const onRight = Math.abs(cx - (x + w)) < margin && cy >= y - margin && cy <= y + h + margin
            const onTop = Math.abs(cy - y) < margin && cx >= x - margin && cx <= x + w + margin
            const onBottom = Math.abs(cy - (y + h)) < margin && cx >= x - margin && cx <= x + w + margin

            let cursor = tool === 'crop' ? 'crosshair' : CURSOR_MAP[tool]
            let isHovering = true

            if (onLeft && onTop) cursor = 'nwse-resize'
            else if (onRight && onTop) cursor = 'nesw-resize'
            else if (onLeft && onBottom) cursor = 'nesw-resize'
            else if (onRight && onBottom) cursor = 'nwse-resize'
            else if (onTop || onBottom) cursor = 'ns-resize'
            else if (onLeft || onRight) cursor = 'ew-resize'
            else {
                isHovering = false
                if (tool === 'crop' && cx > x && cx < x + w && cy > y && cy < y + h) cursor = 'move'
            }

            if (isHovering !== isHoveringHandle) setIsHoveringHandle(isHovering)

            if (isHovering || isCropSelected || tool === 'crop') {
                e.currentTarget.style.cursor = cursor
                if (isHovering) return
            }
        }

        if (isResizing && cropRect) {
            const { x, y, w, h } = cropRect
            const next = { ...cropRect }
            if (isResizing.includes('e')) next.w = Math.max(40, cx - x)
            if (isResizing.includes('w')) { const nw = x + w - cx; if (nw > 40) { next.x = cx; next.w = nw } else { next.x = x + w - 40; next.w = 40 } }
            if (isResizing.includes('s')) next.h = Math.max(40, cy - y)
            if (isResizing.includes('n')) { const nh = y + h - cy; if (nh > 40) { next.y = cy; next.h = nh } else { next.y = y + h - 40; next.h = 40 } }
            setCropRect(next)
            return
        }

        if (isMovingCrop && cropRect) {
            setCropRect({ ...cropRect, x: cx - startPosRef.current.x, y: cy - startPosRef.current.y })
            return
        }

        // Select 工具 hover 时显示 move 光标
        if (tool === 'select' && !dragRef.current) {
            let hoveringSelected = false
            for (let i = annotations.length - 1; i >= 0; i--) {
                if (selectedIds.has(annotations[i].id) && hitTest(annotations[i], cx, cy, s)) {
                    hoveringSelected = true
                    break
                }
            }
            e.currentTarget.style.cursor = hoveringSelected ? 'move' : 'default'
        }

        // 拖拽移动选中标注
        if (dragRef.current && selectedIds.size > 0) {
            e.currentTarget.style.cursor = 'move'
            const dx = cx - dragRef.current.startX
            const dy = cy - dragRef.current.startY
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                dragRef.current.moved = true
                setAnnotations(prev => prev.map(a =>
                    selectedIds.has(a.id) ? moveAnnotation(a, dx, dy) : a
                ))
                dragRef.current.startX = cx
                dragRef.current.startY = cy
            }
            return
        }

        if (!isDrawingRef.current) return
        const { x: sx, y: sy } = startPosRef.current

        if (tool === 'crop') {
            setCropRect({ x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(cx - sx), h: Math.abs(cy - sy) })
            return
        }

        if (tool === 'draw') {
            freehandPointsRef.current.push({ x: cx, y: cy })
            setDraft({
                id: '_draft', type: 'freehand', color: activeColor,
                points: [...freehandPointsRef.current],
                lineWidth: 3 / s,
            } as FreehandAnnotation)
        } else if (tool === 'rect' || tool === 'comment') {
            const dx = cx - sx, dy = cy - sy
            setDraft({
                id: '_draft', type: 'rect', color: activeColor,
                x: Math.min(sx, cx), y: Math.min(sy, cy),
                w: Math.abs(dx), h: Math.abs(dy),
            } as RectAnnotation)
        } else if (tool === 'arrow') {
            setDraft({
                id: '_draft', type: 'arrow', color: activeColor,
                x1: sx, y1: sy, x2: cx, y2: cy,
                lineWidth: 3 / s,
            } as ArrowAnnotation)
        }
    }, [tool, activeColor, isResizing, isMovingCrop, cropRect, isCropActive, isCropSelected, isHoveringHandle, selectedIds, annotations])

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsResizing(null); setIsMovingCrop(false)

        // 拖拽结束：保存历史
        if (dragRef.current) {
            if (dragRef.current.moved) {
                saveState(annotations)
            }
            dragRef.current = null
        }

        if (!isDrawingRef.current) return
        isDrawingRef.current = false
        const s = scaleRef.current
        const { x: sx, y: sy } = startPosRef.current
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY, s)
        const dx = cx - sx, dy = cy - sy

        if (tool === 'crop') {
            setDraft(null)
            const finalRect = { x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(dx), h: Math.abs(dy) }
            if (finalRect.w < 5 || finalRect.h < 5) {
                setCropRect(startCropRectRef.current)
            } else {
                setCropRect(finalRect)
                setIsCropSelected(true)
            }
            return
        }

        if (tool === 'draw') {
            setDraft(null)
            const points = freehandPointsRef.current
            if (points.length > 1) {
                const ann: FreehandAnnotation = {
                    id: genId(), type: 'freehand', color: activeColor,
                    points: [...points], lineWidth: 3 / s,
                }
                const next = [...annotations, ann]
                setAnnotations(next)
                saveState(next)
            }
            freehandPointsRef.current = []
        } else if (tool === 'rect') {
            setDraft(null)
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                const ann: RectAnnotation = {
                    id: genId(), type: 'rect', color: activeColor,
                    x: Math.min(sx, cx), y: Math.min(sy, cy),
                    w: Math.abs(dx), h: Math.abs(dy),
                }
                const next = [...annotations, ann]
                setAnnotations(next)
                saveState(next)
            }
        } else if (tool === 'arrow') {
            setDraft(null)
            const len = Math.sqrt(dx * dx + dy * dy)
            if (len > 5) {
                const ann: ArrowAnnotation = {
                    id: genId(), type: 'arrow', color: activeColor,
                    x1: sx, y1: sy, x2: cx, y2: cy,
                    lineWidth: 3 / s,
                }
                const next = [...annotations, ann]
                setAnnotations(next)
                saveState(next)
            }
        } else if (tool === 'comment') {
            // 保留 draft 显示，直到评论提交或取消
            if (Math.abs(dx) > 10 && Math.abs(dy) > 10) {
                commentRectRef.current = { x: sx, y: sy, w: dx, h: dy, color: activeColor }
                openComment(Math.max(e.clientX, sx * s), Math.max(e.clientY, sy * s))
            } else {
                setDraft(null)
            }
        }
    }, [tool, activeColor, annotations])

    return {
        canvasRef, scaleRef, bgImageRef,
        tool, displaySize, annotations, selectedIds, draft, editingText,
        commentState, commentText, setCommentText,
        cropRect, isCropActive, isCropSelected, isHoveringHandle,
        changeTool, undo, redo, canRedo, clearAll, deleteSelected,
        submitComment, confirmText, cancelText, setEditingText,
        updateAnnotationFontSize,
        handleMouseDown, handleMouseMove, handleMouseUp,
        setAnnotations, setSelectedIds, saveState,
    }
}
