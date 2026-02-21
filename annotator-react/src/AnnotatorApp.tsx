// AnnotatorApp.tsx — 主标注 UI（React）+ 纯黑工具栏
import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
    Pencil, Square, MessageSquare, Type,
    Undo2, X, Send, Loader2, Check, Eraser
} from 'lucide-react'

// ---- 类型定义 ----
type ToolId = 'draw' | 'rect' | 'comment' | 'text'
type SendStatus = 'idle' | 'sending' | 'success' | 'error'

interface CommentState {
    visible: boolean; x: number; y: number; mode: 'comment' | 'text'
}

interface AnnotatorAppProps {
    imgDataUrl: string
    onClose: () => void
}

// ---- 工具列表 (快捷键改为单独字段) ----
const TOOLS: { id: ToolId; label: string; shortcut?: string; Icon: React.ElementType }[] = [
    { id: 'draw', label: 'Freehand pen', shortcut: 'P', Icon: Pencil },
    { id: 'rect', label: 'Highlight area', shortcut: 'H', Icon: Square },
    { id: 'comment', label: 'Add comment', shortcut: 'C', Icon: MessageSquare },
    { id: 'text', label: 'Add text', shortcut: 'T', Icon: Type },
]

const COLORS = [
    '#CCFF00', // 荧光黄
    '#39FF14', // 荧光绿
    '#00FFFF', // 荧光青
    '#1F51FF', // 荧光蓝
    '#BC13FE', // 荧光紫
    '#FF44CC', // 荧光粉
    '#FF073A', // 荧光红
    '#FF6700', // 荧光橙
]

// ---- 主组件 ----
export function AnnotatorApp({ imgDataUrl, onClose }: AnnotatorAppProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bgSnapshotRef = useRef<ImageData | null>(null)
    const historyRef = useRef<ImageData[]>([])
    const isDrawingRef = useRef(false)
    const startPosRef = useRef({ x: 0, y: 0 })
    const commentRectRef = useRef<{ x: number; y: number; w: number; h: number; color: string } | null>(null)
    // scale: Canvas 原始像素尺寸 → 屏幕显示的缩放比
    const scaleRef = useRef(1)

    const [isClosing, setIsClosing] = useState(false)
    // mounted: false→true after two rAFs，确保初始 opacity:0 先绘制，再触发 transition 入场
    const [mounted, setMounted] = useState(false)
    const [tool, setTool] = useState<ToolId>('draw')
    // 画布显示尺寸（CSS px），初始为 0 表示图像未加载
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 })
    const [commentState, setCommentState] = useState<CommentState>({ visible: false, x: 0, y: 0, mode: 'comment' })
    const [commentText, setCommentText] = useState('')
    const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
    const [activeColor, setActiveColor] = useState(COLORS[5]) // 默认荧光粉

    // ---- 入场动画：双 rAF 确保初始 opacity:0 先绘制，再触发 transition ----
    useEffect(() => {
        let id2: number
        const id1 = requestAnimationFrame(() => {
            id2 = requestAnimationFrame(() => setMounted(true))
        })
        return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2) }
    }, [])

    // ---- Canvas 初始化（保持截图原始分辨率）----
    // Canvas 使用图像真实像素尺寸（Retina 屏幕下可能是 2x 甚至 3x 视口大小）
    // CSS transform scale 缩放到适合屏幕大小显示，避免图像被下采样导致模糊
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        const img = new Image()
        img.onload = () => {
            const imgW = img.naturalWidth
            const imgH = img.naturalHeight
            canvas.width = imgW
            canvas.height = imgH
            // 计算缩放比：适配视口，不超过 1（不放大）
            const s = Math.min(window.innerWidth / imgW, window.innerHeight / imgH, 1)
            scaleRef.current = s
            setDisplaySize({ w: Math.round(imgW * s), h: Math.round(imgH * s) })
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(img, 0, 0, imgW, imgH)
            bgSnapshotRef.current = ctx.getImageData(0, 0, imgW, imgH)
            saveState(ctx, canvas)
        }
        img.src = imgDataUrl
    }, [imgDataUrl])

    // ---- 屏幕坐标 → Canvas 坐标转换 ----
    function toCanvas(screenX: number, screenY: number) {
        const s = scaleRef.current
        return { x: screenX / s, y: screenY / s }
    }

    const MAX_HISTORY = 30
    function saveState(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
        if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    }
    function restoreLastState() {
        const canvas = canvasRef.current; if (!canvas) return
        const stack = historyRef.current
        if (stack.length > 0) canvas.getContext('2d')!.putImageData(stack[stack.length - 1], 0, 0)
    }
    function undo() {
        if (commentState.visible) { closeComment(); restoreLastState(); return }
        const stack = historyRef.current
        if (stack.length > 1) {
            stack.pop()
            canvasRef.current!.getContext('2d')!.putImageData(stack[stack.length - 1], 0, 0)
        }
    }
    function clearAll() {
        if (commentState.visible) closeComment()
        const canvas = canvasRef.current; if (!canvas || !bgSnapshotRef.current) return
        const ctx = canvas.getContext('2d')!
        ctx.putImageData(bgSnapshotRef.current, 0, 0)
        historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)]
    }
    function changeTool(t: ToolId) {
        if (commentState.visible) { closeComment(); restoreLastState() }
        setTool(t)
    }
    const handleClose = useCallback(() => {
        setIsClosing(true)
        setTimeout(onClose, 300)
    }, [onClose])

    function openComment(x: number, y: number, mode: 'comment' | 'text') {
        setCommentState({ visible: true, x: Math.min(x + 12, window.innerWidth - 264), y: Math.min(y, window.innerHeight - 160), mode })
        setCommentText('')
    }
    function closeComment() {
        setCommentState(s => ({ ...s, visible: false })); commentRectRef.current = null
    }

    // ---- Canvas 绘图工具 ----
    function drawStrokedText(canvas: HTMLCanvasElement, text: string, x: number, y: number) {
        const ctx = canvas.getContext('2d')!
        const s = scaleRef.current
        // 字体大小按 1/scale 放大，保证视觉上约 17px 的显示大小
        const fontSize = Math.round(17 / s)
        ctx.font = `500 ${fontSize}px -apple-system, 'Inter', sans-serif`
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        text.split('\n').forEach((line, i) => {
            const ty = y + i * (fontSize + Math.round(5 / s))
            ctx.lineWidth = 1 / s; ctx.strokeStyle = '#FFFFFF'; ctx.lineJoin = 'round'
            ctx.strokeText(line, x, ty)
            ctx.fillStyle = activeColor; ctx.fillText(line, x, ty)
        })
    }

    function drawCommentRect(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, color: string) {
        const s = scaleRef.current
        ctx.beginPath(); ctx.rect(rx, ry, rw, rh)
        ctx.strokeStyle = color; ctx.lineWidth = 3 / s; ctx.setLineDash([8 / s, 6 / s]); ctx.stroke()
        ctx.setLineDash([])
    }

    function submitComment() {
        const text = commentText.trim()
        if (!text) { closeComment(); restoreLastState(); return }
        const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!

        if (commentState.mode === 'text') {
            const { x: tx, y: ty } = toCanvas(commentState.x, commentState.y)
            drawStrokedText(canvas, text, tx, ty)
        } else if (commentState.mode === 'comment' && commentRectRef.current) {
            const { x, y, w, h, color } = commentRectRef.current
            const rx = Math.min(x, x + w), ry = Math.min(y, y + h)
            const rw = Math.abs(w), rh = Math.abs(h)
            drawCommentRect(ctx, rx, ry, rw, rh, color)
            const s = scaleRef.current
            const fontSize = Math.round(17 / s)
            ctx.font = `500 ${fontSize}px -apple-system, 'Inter', sans-serif`
            const lines = text.split('\n')
            const maxW = Math.max(...lines.map(l => ctx.measureText(l).width))
            let textX = rx + rw + Math.round(14 / s)
            const textY = ry
            const canvasW = canvasRef.current?.width ?? window.innerWidth
            if (textX + maxW > canvasW - 10) textX = Math.max(6, rx - maxW - Math.round(14 / s))
            const midTextY = textY + (lines.length * (fontSize + 5)) / 2
            ctx.beginPath(); ctx.moveTo(rx + rw, ry + rh / 2); ctx.lineTo(textX, midTextY)
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([]); ctx.stroke()
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.stroke()
            ctx.setLineDash([])
            drawStrokedText(canvas, text, textX, textY)
        }
        saveState(ctx, canvas); closeComment()
    }

    // ---- Canvas 鼠标事件（坐标统一转换到 Canvas 坐标系）----
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (commentState.visible) { closeComment(); restoreLastState(); return }
        isDrawingRef.current = true
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY)
        startPosRef.current = { x: cx, y: cy }
        const ctx = canvasRef.current!.getContext('2d')!
        ctx.beginPath(); ctx.moveTo(cx, cy)
        if (tool === 'draw') {
            const s = scaleRef.current
            ctx.lineWidth = 3 / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = activeColor
        }
    }, [commentState.visible, tool, activeColor])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!
        const { x: sx, y: sy } = startPosRef.current
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY)
        const dx = cx - sx, dy = cy - sy
        const s = scaleRef.current
        if (tool === 'draw') { ctx.lineTo(cx, cy); ctx.stroke() }
        else if (tool === 'rect' || tool === 'comment') {
            restoreLastState()
            ctx.beginPath(); ctx.rect(sx, sy, dx, dy)
            ctx.fillStyle = `${activeColor}1F`; ctx.fill() // 约 12% 透明度
            ctx.strokeStyle = activeColor; ctx.lineWidth = 3 / s; ctx.setLineDash([8 / s, 6 / s]); ctx.stroke(); ctx.setLineDash([])
        }
    }, [tool, activeColor])

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        isDrawingRef.current = false
        const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!
        const { x: sx, y: sy } = startPosRef.current
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY)
        const dx = cx - sx, dy = cy - sy
        if (tool === 'draw' || tool === 'rect') {
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) saveState(ctx, canvas)
        } else if (tool === 'comment') {
            if (Math.abs(dx) > 10 && Math.abs(dy) > 10) {
                commentRectRef.current = { x: sx, y: sy, w: dx, h: dy, color: activeColor }
                restoreLastState()
                const rx = Math.min(sx, cx), ry = Math.min(sy, cy)
                drawCommentRect(ctx, rx, ry, Math.abs(dx), Math.abs(dy), activeColor)
                saveState(ctx, canvas)
                // 输入框用屏幕坐标
                openComment(Math.max(e.clientX, sx * scaleRef.current), Math.max(e.clientY, sy * scaleRef.current), 'comment')
            } else { restoreLastState() }
        } else if (tool === 'text') {
            openComment(e.clientX, e.clientY, 'text')
        }
    }, [tool, activeColor])

    // ---- 全局 mouseup：防止鼠标在 Canvas 外松开后 isDrawingRef 卡住 ----
    useEffect(() => {
        function handleGlobalMouseUp() {
            isDrawingRef.current = false
        }
        window.addEventListener('mouseup', handleGlobalMouseUp)
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
    }, [])

    // ---- 键盘快捷键 ----
    useEffect(() => {
        function handler(e: KeyboardEvent) {
            // 用 composedPath() 检查，避免 Shadow DOM 跨边界后 e.target 被重定向为 host 元素
            const path = e.composedPath()
            if (path.some(el => el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement)) return
            // 有 modifier 键时不触发单键快捷键（避免 Ctrl+C 意外切换工具）
            if (!e.metaKey && !e.ctrlKey && !e.altKey) {
                if (e.key.toLowerCase() === 'p') changeTool('draw')
                if (e.key.toLowerCase() === 'h') changeTool('rect')
                if (e.key.toLowerCase() === 'c') changeTool('comment')
                if (e.key.toLowerCase() === 't') changeTool('text')
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') undo()
            if (e.key === 'Escape') {
                if (commentState.visible) { closeComment(); restoreLastState() } else handleClose()
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [commentState.visible, handleClose])

    // ---- 发送到 IDE ----
    function sendToIDE() {
        setSendStatus('sending')
        chrome.runtime.sendMessage(
            {
                action: 'SEND_TO_IDE',
                payload: {
                    image: canvasRef.current!.toDataURL('image/png'),
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    devicePixelRatio: window.devicePixelRatio
                }
            },
            (res) => {
                if (chrome.runtime.lastError || !res?.success) { setSendStatus('error'); setTimeout(() => setSendStatus('idle'), 3000) }
                else { setSendStatus('success'); setTimeout(() => setSendStatus('idle'), 2000) }
            }
        )
    }

    const cursorMap: Record<ToolId, string> = { draw: 'crosshair', rect: 'crosshair', comment: 'cell', text: 'text' }

    // show=true → 完全可见；false → 透明+下移（入场前 or 退场中）
    const show = mounted && !isClosing
    const enterT = 'opacity 0.28s cubic-bezier(0,0,0.2,1), transform 0.34s cubic-bezier(0,0,0.2,1)'
    const exitT  = 'opacity 0.22s cubic-bezier(0.4,0,1,1), transform 0.22s cubic-bezier(0.4,0,1,1)'

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2147483647, background: '#000',
            opacity: show ? 1 : 0,
            transition: isClosing ? 'opacity 0.26s ease-in' : 'opacity 0.24s ease-out',
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes tooltipIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(3px) scale(0.97); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
            `}} />
            {/* Canvas 以原始分辨率渲染，CSS width/height 控制显示尺寸 */}
            <canvas ref={canvasRef}
                style={{
                    display: 'block',
                    cursor: cursorMap[tool],
                    width: displaySize.w > 0 ? `${displaySize.w}px` : undefined,
                    height: displaySize.h > 0 ? `${displaySize.h}px` : undefined,
                }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />

            {/* ── Toolbar ── 纯黑底，icon-only */}
            <div style={{
                position: 'fixed', bottom: 28, left: '50%',
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                borderRadius: 10, background: '#000000',
                boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06) inset',
                border: '1px solid rgba(255,255,255,0.15)', userSelect: 'none',
                opacity: show ? 1 : 0,
                transform: `translateX(-50%) translateY(${show ? 0 : 28}px)`,
                transition: isClosing ? exitT : enterT,
            }}>
                {/* 工具按钮 */}
                {TOOLS.map(({ id, label, shortcut, Icon }) => (
                    <IconBtn key={id} active={tool === id} onClick={() => changeTool(id)} Icon={Icon}
                        label={label} shortcut={shortcut} />
                ))}

                <ColorPicker activeColor={activeColor} onChange={setActiveColor} />

                <Sep />
                <IconBtn Icon={Undo2} active={false} onClick={undo} label="Undo" shortcut="⌘Z" />
                <IconBtn Icon={Eraser} active={false} onClick={clearAll} danger label="Clear all" />
                <Sep />
                <SendButton status={sendStatus} onClick={sendToIDE} />
                <CloseBtn onClick={handleClose} />
            </div>

            {/* 评论 / 文字输入浮层 */}
            {commentState.visible && (
                <CommentInput x={commentState.x} y={commentState.y} mode={commentState.mode}
                    value={commentText} onChange={setCommentText}
                    onConfirm={submitComment} onCancel={() => { closeComment(); restoreLastState() }} />
            )}
        </div>
    )
}

// ── Icon-only 工具按钮（内联 Tooltip，不使用 Portal，避免跨 Shadow DOM 崩溃）──
function IconBtn({ Icon, active, onClick, danger = false, label, shortcut }: {
    Icon: React.ElementType; active: boolean; onClick: () => void; danger?: boolean
    label?: string; shortcut?: string
}) {
    const [hov, setHov] = useState(false)
    const [pressed, setPressed] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 10,
                border: 'none', zIndex: hov ? 200 : 'auto' as any,
                background: active
                    ? 'rgba(255,255,255,0.22)'
                    : (danger && hov) ? 'rgba(239,68,68,0.15)' : hov ? 'rgba(255,255,255,0.15)' : 'transparent',
                cursor: 'pointer', padding: 0,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: pressed ? 'scale(0.95)' : 'scale(1)',
                outline: 'none',
            }}
        >
            <Icon size={20} strokeWidth={1.6}
                color={active ? '#ffffff' : (danger && hov) ? '#f87171' : '#ffffff'}
                style={{
                    transition: 'all 0.2s',
                    opacity: active || hov ? 1 : 0.65
                }}
            />
            {/* 激活指示器 */}
            {active && (
                <span style={{
                    position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                    width: 14, height: 2, borderRadius: 1, background: '#ffffff',
                }} />
            )}
            {/* 内联 Tooltip：hover 时显示在按钮上方 */}
            {label && hov && !pressed && <InlineTooltip label={label} shortcut={shortcut} />}
        </button>
    )
}

function Sep() {
    return <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.25)', margin: '0 8px' }} />
}

// ── 内联 Tooltip（纯 CSS 定位，不跨 Shadow DOM）──────────────
function InlineTooltip({ label, shortcut }: { label: string; shortcut?: string }) {
    // 用固定 bottom 值（按钮最高 40px + 间距 14px = 54px），确保所有 tooltip 出现在同一水平线
    return (
        <span style={{
            position: 'absolute', bottom: 54, left: '50%', zIndex: 999,
            transform: 'translateX(-50%) translateY(3px) scale(0.97)',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            background: '#000000', color: 'rgba(255,255,255,0.88)',
            fontSize: 11.5, fontWeight: 400, letterSpacing: 0.1, lineHeight: 1.4,
            padding: '5px 9px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            fontFamily: '-apple-system, "Inter", sans-serif',
            opacity: 0,
            animation: 'tooltipIn 0.18s cubic-bezier(0, 0, 0.2, 1) forwards',
        }}>
            <span>{label}</span>
            {shortcut && (
                <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 18, height: 18, padding: '0 4px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4, fontSize: 10, fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                }}>
                    {shortcut}
                </span>
            )}
        </span>
    )
}

// ── Close 按钮（默认透明，Hover 变红） ──────────────────────
function CloseBtn({ onClick }: { onClick: () => void }) {
    const [hov, setHov] = useState(false)
    const [pressed, setPressed] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                position: 'relative', zIndex: hov ? 200 : 'auto' as any,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 10,
                border: 'none',
                background: hov ? '#e11d48' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer', transition: 'all 0.2s',
                transform: pressed ? 'scale(0.95)' : 'scale(1)',
                flexShrink: 0, outline: 'none',
            }}
        >
            <X size={20} strokeWidth={2.2}
                color="#ffffff"
                style={{
                    transition: 'opacity 0.2s',
                    opacity: hov ? 1 : 0.75
                }}
            />
            {hov && !pressed && <InlineTooltip label="Close" shortcut="Esc" />}
        </button>
    )
}

// ── 发送按钮 ─────────────────────────────────────────────────
function SendButton({ status, onClick }: { status: SendStatus; onClick: () => void }) {
    const disabled = status === 'sending' || status === 'success'
    const [pressed, setPressed] = useState(false)
    const [hov, setHov] = useState(false)
    const bgMap: Record<SendStatus, string> = {
        idle: hov ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)', sending: 'rgba(255,255,255,0.05)',
        success: 'rgba(255,255,255,0.12)', error: 'rgba(248,113,113,0.15)',
    }
    const labelMap: Record<SendStatus, string> = {
        idle: 'Add to Chat', sending: 'Sending…', success: 'Added', error: 'Error',
    }
    const colorMap: Record<SendStatus, string> = {
        idle: 'rgba(255,255,255,0.8)', sending: 'rgba(255,255,255,0.4)',
        success: 'rgba(255,255,255,0.8)', error: '#f87171',
    }
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => !disabled && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                position: 'relative', zIndex: hov ? 200 : 'auto' as any,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '0 12px', height: 40, minWidth: 130, borderRadius: 8,
                background: bgMap[status], border: 'none',
                cursor: disabled && status !== 'success' ? 'default' : 'pointer',
                color: colorMap[status],
                fontWeight: 500, fontSize: 14, letterSpacing: '0.3px',
                transition: 'all 0.2s', opacity: (disabled && status === 'sending') ? 0.7 : 1, whiteSpace: 'nowrap',
                transform: pressed ? 'scale(0.96)' : 'scale(1)',
                outline: 'none',
            }}
        >
            {status === 'sending' && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            {status === 'success' && <Check size={18} strokeWidth={2.5} />}
            {status === 'idle' && (
                <Send size={20} strokeWidth={1.5}
                    color="#ffffff"
                    style={{ opacity: 0.9 }}
                />
            )}
            {labelMap[status]}
            {hov && !pressed && status === 'idle' && <InlineTooltip label="Send to Antigravity" />}
        </button>
    )
}

// ── 评论 / 文字输入浮层 ──────────────────────────────────────
function CommentInput({ x, y, mode, value, onChange, onConfirm, onCancel }: {
    x: number; y: number; mode: 'comment' | 'text';
    value: string; onChange: (v: string) => void; onConfirm: () => void; onCancel: () => void;
}) {
    const taRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => { setTimeout(() => taRef.current?.focus(), 30) }, [])
    return (
        <div style={{
            position: 'fixed', left: x, top: y, width: 240,
            background: '#000000', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            padding: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10,
        }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {mode === 'text' ? 'TEXT' : 'COMMENT'}
            </div>
            <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
                placeholder={mode === 'text' ? 'Add text…' : 'Add a comment… (⌘↵)'}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onConfirm(); if (e.key === 'Escape') onCancel() }}
                style={{
                    width: '100%', height: 68, resize: 'none',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 7, padding: '7px 10px',
                    color: '#f3f4f6', fontSize: 13, lineHeight: 1.55,
                    outline: 'none', fontFamily: '-apple-system, Inter, sans-serif', boxSizing: 'border-box',
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <PopBtn onClick={onCancel} primary={false}>Cancel</PopBtn>
                <PopBtn onClick={onConfirm} primary={true}>Confirm</PopBtn>
            </div>
        </div>
    )
}

function PopBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary: boolean }) {
    const [hov, setHov] = useState(false)
    const [pressed, setPressed] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
                border: primary ? '1px solid transparent' : '1px solid rgba(255,255,255,0.15)',
                background: primary
                    ? (hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.15)')
                    : (hov ? 'rgba(255,255,255,0.08)' : 'transparent'),
                color: primary ? '#ffffff' : 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
                transform: pressed ? 'scale(0.96)' : 'scale(1)',
                outline: 'none',
            }}
        >
            {children}
        </button>
    )
}

// ── 颜色选择器组件 (圆形交互) ──────────────────────────
function ColorPicker({ activeColor, onChange }: { activeColor: string; onChange: (c: string) => void }) {
    const [open, setOpen] = useState(false)
    const [hov, setHov] = useState(false)
    const [pressed, setPressed] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // 点击外部关闭（用 composedPath 兼容 Shadow DOM）
    useEffect(() => {
        if (!open) return
        function handleClickOutside(e: MouseEvent) {
            const path = e.composedPath()
            if (containerRef.current && !path.includes(containerRef.current)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
                onClick={() => setOpen(!open)}
                onMouseOver={() => setHov(true)}
                onMouseOut={() => { setHov(false); setPressed(false) }}
                onMouseDown={() => setPressed(true)}
                onMouseUp={() => setPressed(false)}
                style={{
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, borderRadius: 10,
                    border: 'none',
                    background: open || hov ? 'rgba(255,255,255,0.15)' : 'transparent',
                    cursor: 'pointer', padding: 0,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: pressed ? 'scale(0.95)' : 'scale(1)',
                    outline: 'none',
                }}
            >
                {/* 内部颜色圆块 */}
                <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: activeColor,
                    boxShadow: `0 0 8px ${activeColor}66`,
                    border: '1.5px solid rgba(255,255,255,0.15)',
                }} />

                {open && (
                    <span style={{
                        position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                        width: 14, height: 2, borderRadius: 1, background: '#ffffff',
                    }} />
                )}
            </button>

            {open && (
                <>
                    <div style={{ position: 'absolute', bottom: 40, left: 0, width: '100%', height: 16 }} />
                    <div style={{
                        position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)',
                        background: '#000000', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 10, padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.8)', zIndex: 100,
                    }}>
                        {COLORS.map(c => (
                            <ColorSwatch key={c} color={c} active={activeColor === c}
                                onClick={() => { onChange(c); setOpen(false) }} />
                        ))}
                    </div>
                </>
            )}
            {hov && !open && <InlineTooltip label="Stroke color" />}
        </div>
    )
}

function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
    const [hov, setHov] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => setHov(false)}
            style={{
                width: 26, height: 26, borderRadius: '50%', background: color,
                border: active ? '2.5px solid rgba(255,255,255,0.8)' : '1.5px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hov ? 'scale(1.15)' : active ? 'scale(1.1)' : 'scale(1)',
                flexShrink: 0, outline: 'none',
                boxSizing: 'border-box',
                boxShadow: hov ? `0 0 12px ${color}aa` : active ? `0 0 8px ${color}88` : 'none',
            }}
        />
    )
}

