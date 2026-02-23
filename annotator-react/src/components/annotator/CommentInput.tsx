import React, { useRef, useEffect, useState } from 'react'
import { colors, radii, shadows, typography, transitions, transforms, zIndex } from '../../designTokens'

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
                padding: '7px 18px', borderRadius: radii.md, cursor: 'pointer',
                border: primary ? '1px solid transparent' : `1px solid ${colors.white15}`,
                background: primary
                    ? (hov ? colors.white22 : colors.white15)
                    : (hov ? colors.white8 : 'transparent'),
                color: primary ? colors.textPrimary : colors.textMuted,
                fontSize: typography.size.md, fontWeight: typography.weight.medium,
                transition: transitions.fast,
                transform: pressed ? transforms.pressedSm : transforms.normal,
                outline: 'none',
            }}
        >
            {children}
        </button>
    )
}

export function CommentInput({ x, y, mode, value, onChange, onConfirm, onCancel }: {
    x: number; y: number; mode: 'comment' | 'text';
    value: string; onChange: (v: string) => void; onConfirm: () => void; onCancel: () => void;
}) {
    const taRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => { setTimeout(() => taRef.current?.focus(), 30) }, [])
    return (
        <div style={{
            position: 'fixed', left: x, top: y, width: 240,
            background: colors.bgSolid, border: `1px solid ${colors.white15}`,
            borderRadius: radii.lg, boxShadow: shadows.popover,
            padding: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: zIndex.popover,
        }}>
            <div style={{ fontSize: typography.size.xs, color: colors.textGhost, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {mode === 'text' ? 'TEXT' : 'COMMENT'}
            </div>
            <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
                placeholder={mode === 'text' ? 'Add text…' : 'Add a comment… (⌘↵)'}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onConfirm(); if (e.key === 'Escape') onCancel() }}
                style={{
                    width: '100%', height: 68, resize: 'none',
                    background: colors.white5, border: `1px solid ${colors.white15}`,
                    borderRadius: 7, padding: '7px 10px',
                    color: '#f3f4f6', fontSize: typography.size.base, lineHeight: typography.lineHeight.normal,
                    outline: 'none', fontFamily: typography.fontFamily, boxSizing: 'border-box',
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <PopBtn onClick={onCancel} primary={false}>Cancel</PopBtn>
                <PopBtn onClick={onConfirm} primary={true}>Confirm</PopBtn>
            </div>
        </div>
    )
}
