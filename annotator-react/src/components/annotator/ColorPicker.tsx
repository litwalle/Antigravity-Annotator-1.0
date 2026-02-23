import React, { useState, useRef, useEffect } from 'react'
import { InlineTooltip } from './InlineTooltip'
import { COLORS } from '../../constants'
import { colors, radii, buttonSize, shadows, transitions, transforms, zIndex } from '../../designTokens'

function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
    const [hov, setHov] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => setHov(false)}
            style={{
                width: 26, height: 26, borderRadius: radii.full, background: color,
                border: active ? `2.5px solid ${colors.textMedium}` : `1.5px solid ${colors.white15}`,
                cursor: 'pointer', transition: transitions.fast,
                transform: hov ? 'scale(1.15)' : active ? 'scale(1.1)' : transforms.normal,
                flexShrink: 0, outline: 'none',
                boxSizing: 'border-box',
                boxShadow: hov ? `0 0 12px ${color}aa` : active ? `0 0 8px ${color}88` : 'none',
            }}
        />
    )
}

export function ColorPicker({ activeColor, onChange }: { activeColor: string; onChange: (c: string) => void }) {
    const [open, setOpen] = useState(false)
    const [hov, setHov] = useState(false)
    const [pressed, setPressed] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

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
                    width: buttonSize.icon, height: buttonSize.icon, borderRadius: radii.lg,
                    border: 'none',
                    background: open || hov ? colors.white15 : 'transparent',
                    cursor: 'pointer', padding: 0,
                    transition: transitions.fast,
                    transform: pressed ? transforms.pressed : transforms.normal,
                    outline: 'none',
                }}
            >
                <div style={{
                    width: 18, height: 18, borderRadius: radii.full, background: activeColor,
                    boxShadow: `0 0 8px ${activeColor}66`,
                    border: `1.5px solid ${colors.white15}`,
                }} />

                {open && (
                    <span style={{
                        position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                        width: 14, height: 2, borderRadius: 1, background: colors.textPrimary,
                    }} />
                )}
            </button>

            {open && (
                <>
                    <div style={{ position: 'absolute', bottom: 40, left: 0, width: '100%', height: 16 }} />
                    <div style={{
                        position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)',
                        background: colors.bgSolid, border: `1px solid ${colors.white15}`,
                        borderRadius: radii.lg, padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
                        boxShadow: shadows.dropdown, zIndex: zIndex.toolbar,
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
