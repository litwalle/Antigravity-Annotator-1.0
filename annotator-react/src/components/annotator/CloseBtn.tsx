import React, { useState } from 'react'
import { X } from 'lucide-react'
import { InlineTooltip } from './InlineTooltip'
import { colors, radii, buttonSize, transitions, transforms } from '../../designTokens'

export function CloseBtn({ onClick }: { onClick: () => void }) {
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
                position: 'relative', zIndex: hov ? 200 : 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: buttonSize.icon, height: buttonSize.icon, borderRadius: radii.lg,
                border: 'none',
                background: hov ? colors.white22 : colors.white14,
                cursor: 'pointer', transition: transitions.fast,
                transform: pressed ? transforms.pressed : transforms.normal,
                flexShrink: 0, outline: 'none',
            }}
        >
            <X size={20} strokeWidth={1.5}
                color={colors.textMedium}
                style={{
                    transition: transitions.opacity,
                    opacity: hov ? 1 : 0.8
                }}
            />
            {hov && !pressed && <InlineTooltip label="Close" shortcut="Esc" />}
        </button>
    )
}
