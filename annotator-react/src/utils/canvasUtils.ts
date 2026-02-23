import type { Annotation, FreehandAnnotation, RectAnnotation, ArrowAnnotation, TextAnnotation, CommentAnnotation } from '../types'
import { colors } from '../designTokens'

/**
 * 屏幕坐标 → Canvas 坐标转换
 */
export function toCanvas(screenX: number, screenY: number, scale: number) {
    return { x: screenX / scale, y: screenY / scale }
}

/**
 * 生成唯一 ID
 */
export function genId(): string {
    return Math.random().toString(36).slice(2, 10)
}

// ── 单项渲染 ──

function renderFreehand(ctx: CanvasRenderingContext2D, ann: FreehandAnnotation) {
    if (ann.points.length < 2) return
    ctx.beginPath()
    ctx.moveTo(ann.points[0].x, ann.points[0].y)
    for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo(ann.points[i].x, ann.points[i].y)
    }
    ctx.strokeStyle = ann.color
    ctx.lineWidth = ann.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
}

function renderRect(ctx: CanvasRenderingContext2D, ann: RectAnnotation, scale: number) {
    ctx.beginPath()
    ctx.rect(ann.x, ann.y, ann.w, ann.h)
    ctx.fillStyle = `${ann.color}1F`
    ctx.fill()
    ctx.strokeStyle = ann.color
    ctx.lineWidth = 3 / scale
    ctx.setLineDash([8 / scale, 6 / scale])
    ctx.stroke()
    ctx.setLineDash([])
}

function renderArrow(ctx: CanvasRenderingContext2D, ann: ArrowAnnotation) {
    const { x1, y1, x2, y2, color, lineWidth } = ann
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return

    const angle = Math.atan2(dy, dx)
    const headLen = Math.min(22, len * 0.35)
    const spread = Math.PI / 5.5

    // 箭头三角顶点
    const tipX = x2, tipY = y2
    const leftX = tipX - headLen * Math.cos(angle - spread)
    const leftY = tipY - headLen * Math.sin(angle - spread)
    const rightX = tipX - headLen * Math.cos(angle + spread)
    const rightY = tipY - headLen * Math.sin(angle + spread)
    // 线段终点缩回到箭头底边中点，避免线与箭头重叠
    const baseX = (leftX + rightX) / 2
    const baseY = (leftY + rightY) / 2

    // 线段（从起点到箭头底边中点）
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(baseX, baseY)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()

    // 箭头头部（三角形）
    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(leftX, leftY)
    ctx.lineTo(rightX, rightY)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
}

function renderText(ctx: CanvasRenderingContext2D, ann: TextAnnotation, scale: number) {
    if (!ann.content) return
    const fontSize = ann.fontSize / scale
    ctx.font = `400 ${fontSize}px -apple-system, 'Inter', sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const lineHeight = 1.3
    const lineSpacing = fontSize * lineHeight
    const padX = 4 / scale
    const padY = 2 / scale
    // CSS textarea 的 half-leading：(lineHeight - 1) * fontSize / 2
    const halfLeading = (lineHeight - 1) * fontSize / 2
    const lines = ann.content.split('\n')
    lines.forEach((line, i) => {
        const tx = ann.x + padX
        const ty = ann.y + padY + halfLeading + i * lineSpacing
        // 白色描边
        ctx.lineWidth = 1 / scale
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineJoin = 'round'
        ctx.strokeText(line, tx, ty)
        // 彩色填充
        ctx.fillStyle = ann.color
        ctx.fillText(line, tx, ty)
    })
}

function renderComment(ctx: CanvasRenderingContext2D, ann: CommentAnnotation, scale: number) {
    const { rect, content, textX, textY, color } = ann
    // 虚线矩形
    drawCommentRect(ctx, rect.x, rect.y, rect.w, rect.h, color, scale)
    if (!content) return
    // 连接线
    const fontSize = Math.round(17 / scale)
    ctx.font = `400 ${fontSize}px -apple-system, 'Inter', sans-serif`
    const lines = content.split('\n')
    const midTextY = textY + (lines.length * (fontSize + 5)) / 2
    ctx.beginPath()
    ctx.moveTo(rect.x + rect.w, rect.y + rect.h / 2)
    ctx.lineTo(textX, midTextY)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([])
    ctx.stroke()
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.setLineDash([5, 4])
    ctx.stroke()
    ctx.setLineDash([])
    // 文字
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => {
        const ty = textY + i * (fontSize + Math.round(5 / scale))
        ctx.lineWidth = 1 / scale
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineJoin = 'round'
        ctx.strokeText(line, textX, ty)
        ctx.fillStyle = color
        ctx.fillText(line, textX, ty)
    })
}

/**
 * 渲染单个标注
 */
export function renderAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation, scale: number) {
    ctx.save()
    switch (ann.type) {
        case 'freehand': renderFreehand(ctx, ann); break
        case 'rect': renderRect(ctx, ann, scale); break
        case 'arrow': renderArrow(ctx, ann); break
        case 'text': renderText(ctx, ann, scale); break
        case 'comment': renderComment(ctx, ann, scale); break
    }
    ctx.restore()
}

/**
 * 全量渲染：清空 → 背景 → 标注 → 草稿 → 选中指示器
 */
export function renderAll(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    bgImage: HTMLImageElement,
    annotations: Annotation[],
    draft: Annotation | null,
    selectedIds: Set<string>,
    scale: number,
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)
    for (const ann of annotations) {
        renderAnnotation(ctx, ann, scale)
    }
    if (draft) renderAnnotation(ctx, draft, scale)
    for (const ann of annotations) {
        if (selectedIds.has(ann.id)) {
            drawSelectionIndicator(ctx, ann, scale)
        }
    }
}

// ── Hit Test ──

export function getAnnotationBounds(ann: Annotation): { x: number; y: number; w: number; h: number } {
    switch (ann.type) {
        case 'freehand': {
            if (ann.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
            for (const p of ann.points) {
                if (p.x < minX) minX = p.x
                if (p.y < minY) minY = p.y
                if (p.x > maxX) maxX = p.x
                if (p.y > maxY) maxY = p.y
            }
            return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
        }
        case 'rect':
            return { x: ann.x, y: ann.y, w: ann.w, h: ann.h }
        case 'arrow': {
            const x = Math.min(ann.x1, ann.x2), y = Math.min(ann.y1, ann.y2)
            return { x, y, w: Math.abs(ann.x2 - ann.x1), h: Math.abs(ann.y2 - ann.y1) }
        }
        case 'text':
            return { x: ann.x, y: ann.y, w: ann.w, h: ann.h }
        case 'comment': {
            // 合并矩形区域和文字区域
            const rx = ann.rect.x, ry = ann.rect.y
            const rr = rx + ann.rect.w, rb = ry + ann.rect.h
            const minX = Math.min(rx, ann.textX)
            const minY = Math.min(ry, ann.textY)
            return { x: minX, y: minY, w: Math.max(rr, ann.textX + 100) - minX, h: Math.max(rb, ann.textY + 20) - minY }
        }
    }
}

/**
 * 平移标注 (dx, dy) — 返回新对象
 */
export function moveAnnotation(ann: Annotation, dx: number, dy: number): Annotation {
    switch (ann.type) {
        case 'freehand':
            return { ...ann, points: ann.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
        case 'rect':
            return { ...ann, x: ann.x + dx, y: ann.y + dy }
        case 'arrow':
            return { ...ann, x1: ann.x1 + dx, y1: ann.y1 + dy, x2: ann.x2 + dx, y2: ann.y2 + dy }
        case 'text':
            return { ...ann, x: ann.x + dx, y: ann.y + dy }
        case 'comment':
            return { ...ann, rect: { ...ann.rect, x: ann.rect.x + dx, y: ann.rect.y + dy }, textX: ann.textX + dx, textY: ann.textY + dy }
    }
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1, dy = y2 - y1
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    const projX = x1 + t * dx, projY = y1 + t * dy
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
}

/**
 * 点击命中检测（Canvas 坐标）
 */
export function hitTest(ann: Annotation, cx: number, cy: number, scale: number): boolean {
    const tolerance = 8 / scale
    switch (ann.type) {
        case 'freehand': {
            for (let i = 1; i < ann.points.length; i++) {
                const d = distToSegment(cx, cy, ann.points[i - 1].x, ann.points[i - 1].y, ann.points[i].x, ann.points[i].y)
                if (d < tolerance) return true
            }
            return false
        }
        case 'rect': {
            // 点在矩形内部或边框附近
            const { x, y, w, h } = ann
            return cx >= x - tolerance && cx <= x + w + tolerance && cy >= y - tolerance && cy <= y + h + tolerance
        }
        case 'arrow': {
            return distToSegment(cx, cy, ann.x1, ann.y1, ann.x2, ann.y2) < tolerance
        }
        case 'text': {
            return cx >= ann.x - tolerance && cx <= ann.x + ann.w + tolerance &&
                cy >= ann.y - tolerance && cy <= ann.y + ann.h + tolerance
        }
        case 'comment': {
            const { rect } = ann
            return cx >= rect.x - tolerance && cx <= rect.x + rect.w + tolerance &&
                cy >= rect.y - tolerance && cy <= rect.y + rect.h + tolerance
        }
    }
}

// ── 选中指示器 ──

export function drawSelectionIndicator(ctx: CanvasRenderingContext2D, ann: Annotation, scale: number) {
    const bounds = getAnnotationBounds(ann)
    const pad = 4 / scale
    const x = bounds.x - pad, y = bounds.y - pad
    const w = bounds.w + pad * 2, h = bounds.h + pad * 2

    ctx.save()
    ctx.strokeStyle = colors.selectionBorder
    ctx.lineWidth = 1 / scale
    ctx.setLineDash([])
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
}

// ── 遗留兼容函数 ──

/**
 * 绘制描边文字（白色描边 + 彩色填充）
 */
export function drawStrokedText(
    canvas: HTMLCanvasElement,
    text: string,
    x: number,
    y: number,
    color: string,
    scale: number,
) {
    const ctx = canvas.getContext('2d')!
    const fontSize = Math.round(17 / scale)
    ctx.font = `400 ${fontSize}px -apple-system, 'Inter', sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    text.split('\n').forEach((line, i) => {
        const ty = y + i * (fontSize + Math.round(5 / scale))
        ctx.lineWidth = 1 / scale
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineJoin = 'round'
        ctx.strokeText(line, x, ty)
        ctx.fillStyle = color
        ctx.fillText(line, x, ty)
    })
}

/**
 * 绘制评论虚线矩形
 */
export function drawCommentRect(
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    color: string,
    scale: number,
) {
    ctx.beginPath()
    ctx.rect(rx, ry, rw, rh)
    ctx.strokeStyle = color
    ctx.lineWidth = 3 / scale
    ctx.setLineDash([8 / scale, 6 / scale])
    ctx.stroke()
    ctx.setLineDash([])
}
