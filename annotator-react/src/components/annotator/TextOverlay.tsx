import React, { useRef, useEffect, useState, useCallback } from 'react'
import { colors, typography } from '../../designTokens'
import { MIN_TEXT_WIDTH, MIN_TEXT_HEIGHT } from '../../constants'
import { TextSizeMenu } from './TextSizeMenu'

interface TextOverlayProps {
    x: number; y: number; w: number; h: number
    content: string; color: string; fontSize: number; scale: number
    onChange: (updates: { content?: string; x?: number; y?: number; w?: number; h?: number; fontSize?: number }) => void
    onConfirm: () => void
    onCancel: () => void
}

type HandlePos = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const HANDLE_CURSORS: Record<HandlePos, string> = {
    n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
    ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize',
}

function ResizeHandle({ pos, onDragStart }: { pos: HandlePos; onDragStart: (pos: HandlePos, e: React.MouseEvent) => void }) {
    const size = 4
    const half = size / 2
    const style: React.CSSProperties = {
        position: 'absolute', width: size, height: size,
        background: colors.selectionBorder,
        borderRadius: 1, cursor: HANDLE_CURSORS[pos], zIndex: 10,
    }

    if (pos.includes('n')) style.top = -half
    else if (pos.includes('s')) style.bottom = -half
    else { style.top = '50%'; style.marginTop = -half }

    if (pos.includes('w')) style.left = -half
    else if (pos.includes('e')) style.right = -half
    else { style.left = '50%'; style.marginLeft = -half }

    return <div style={style} onMouseDown={e => { e.stopPropagation(); onDragStart(pos, e) }} />
}

export function TextOverlay({ x, y, w, h, content, color, fontSize, scale, onChange, onConfirm, onCancel }: TextOverlayProps) {
    const taRef = useRef<HTMLTextAreaElement>(null)
    const [resizing, setResizing] = useState<{
        pos: HandlePos; startMouseX: number; startMouseY: number
        startX: number; startY: number; startW: number; startH: number
    } | null>(null)

    useEffect(() => {
        setTimeout(() => {
            const ta = taRef.current
            if (!ta) return
            ta.focus()
            ta.selectionStart = ta.selectionEnd = ta.value.length
        }, 30)
    }, [])

    const handleDragStart = useCallback((pos: HandlePos, e: React.MouseEvent) => {
        e.preventDefault()
        setResizing({
            pos, startMouseX: e.clientX, startMouseY: e.clientY,
            startX: x, startY: y, startW: w, startH: h,
        })
    }, [x, y, w, h])

    useEffect(() => {
        if (!resizing) return
        function handleMove(e: MouseEvent) {
            if (!resizing) return
            const dx = (e.clientX - resizing.startMouseX) / scale
            const dy = (e.clientY - resizing.startMouseY) / scale
            const minW = MIN_TEXT_WIDTH / scale
            const minH = MIN_TEXT_HEIGHT / scale

            let newX = resizing.startX, newY = resizing.startY
            let newW = resizing.startW, newH = resizing.startH

            if (resizing.pos.includes('e')) {
                newW = Math.max(minW, resizing.startW + dx)
            }
            if (resizing.pos.includes('w')) {
                const candidateW = resizing.startW - dx
                if (candidateW >= minW) {
                    newW = candidateW
                    newX = resizing.startX + dx
                } else {
                    newW = minW
                    newX = resizing.startX + resizing.startW - minW
                }
            }
            if (resizing.pos.includes('s')) {
                newH = Math.max(minH, resizing.startH + dy)
            }
            if (resizing.pos.includes('n')) {
                const candidateH = resizing.startH - dy
                if (candidateH >= minH) {
                    newH = candidateH
                    newY = resizing.startY + dy
                } else {
                    newH = minH
                    newY = resizing.startY + resizing.startH - minH
                }
            }

            onChange({ x: newX, y: newY, w: newW, h: newH })
        }
        function handleUp() { setResizing(null) }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
        }
    }, [resizing, scale, onChange])

    const screenX = x * scale
    const screenY = y * scale
    const screenW = w * scale
    const screenH = h * scale
    const displayFontSize = fontSize

    return (
        <>
            <TextSizeMenu
                fontSize={fontSize}
                x={x} y={y} scale={scale}
                onChangeSize={delta => onChange({ fontSize: fontSize + delta })}
            />
            <div style={{
                position: 'absolute',
                left: screenX, top: screenY,
                width: screenW, height: screenH,
                zIndex: 10,
            }}>
                {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as HandlePos[]).map(pos => (
                    <ResizeHandle key={pos} pos={pos} onDragStart={handleDragStart} />
                ))}
                <div style={{
                    position: 'absolute', inset: -1,
                    border: `1px solid ${colors.selectionBorder}`,
                    borderRadius: 1, pointerEvents: 'none',
                }} />
                <textarea
                    ref={taRef}
                    value={content}
                    onChange={e => onChange({ content: e.target.value })}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onConfirm() }
                        if (e.key === 'Escape') { e.preventDefault(); onCancel() }
                    }}
                    style={{
                        width: '100%', height: '100%',
                        resize: 'none', border: 'none', outline: 'none',
                        background: 'transparent', padding: '2px 4px', margin: 0,
                        color, fontSize: displayFontSize,
                        fontFamily: typography.fontFamily,
                        fontWeight: typography.weight.normal,
                        lineHeight: 1.3,
                        caretColor: color,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                    }}
                />
            </div>
        </>
    )
}
