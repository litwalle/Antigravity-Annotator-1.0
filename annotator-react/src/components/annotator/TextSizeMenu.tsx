import React, { useState } from 'react'
import { AArrowDown, AArrowUp } from 'lucide-react'
import { colors, radii, shadows, typography, transitions, transforms } from '../../designTokens'
import { TEXT_FONT_SIZE_STEP, TEXT_FONT_SIZE_MIN, TEXT_FONT_SIZE_MAX } from '../../constants'

function SizeBtn({ Icon, onClick, disabled }: { Icon: React.ElementType; onClick: () => void; disabled: boolean }) {
    const [hov, setHov] = useState(false)
    const [pressed, setPressed] = useState(false)
    return (
        <button
            onClick={disabled ? undefined : onClick}
            onMouseOver={() => !disabled && setHov(true)}
            onMouseOut={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => !disabled && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                width: 34, height: 34, borderRadius: radii.sm,
                border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                background: hov && !disabled ? colors.white15 : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: transitions.fast, padding: 0, outline: 'none',
                transform: pressed && !disabled ? transforms.pressed : transforms.normal,
                opacity: disabled ? 0.55 : hov ? 1 : 0.65,
            }}
        >
            <Icon size={20} strokeWidth={1.6}
                color={colors.textPrimary}
            />
        </button>
    )
}

export function TextSizeMenu({ fontSize, x, y, scale, onChangeSize }: {
    fontSize: number
    x: number; y: number
    scale: number
    onChangeSize: (delta: number) => void
}) {
    const screenX = x * scale
    const screenY = y * scale - 50

    return (
        <div style={{
            position: 'absolute',
            left: screenX, top: Math.max(4, screenY),
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 6px',
            background: colors.bgSolid,
            border: `1px solid ${colors.white15}`,
            borderRadius: radii.lg,
            boxShadow: shadows.tooltip,
            zIndex: 999,
            userSelect: 'none',
        }}>
            <SizeBtn Icon={AArrowDown} onClick={() => onChangeSize(-TEXT_FONT_SIZE_STEP)} disabled={fontSize <= TEXT_FONT_SIZE_MIN} />
            <span style={{
                fontSize: typography.size.sm,
                color: colors.textMuted,
                minWidth: 28, textAlign: 'center',
                fontFamily: typography.fontFamily,
                fontWeight: typography.weight.medium,
            }}>
                {fontSize}
            </span>
            <SizeBtn Icon={AArrowUp} onClick={() => onChangeSize(TEXT_FONT_SIZE_STEP)} disabled={fontSize >= TEXT_FONT_SIZE_MAX} />
        </div>
    )
}
