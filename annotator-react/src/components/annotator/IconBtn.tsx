import React, { useState } from 'react'
import { InlineTooltip } from './InlineTooltip'
import { colors, radii, buttonSize, transitions, transforms, zIndex } from '../../designTokens'

export function IconBtn({ Icon, active, onClick, danger = false, disabled = false, label, shortcut }: {
    Icon: React.ElementType; active: boolean; onClick: () => void; danger?: boolean; disabled?: boolean
    label?: string; shortcut?: string
}) {
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
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: buttonSize.icon, height: buttonSize.icon, borderRadius: radii.lg,
                border: 'none', zIndex: hov ? zIndex.hoverBtn : 'auto',
                background: disabled ? 'transparent'
                    : active ? colors.white22
                    : (danger && hov) ? colors.dangerHover : hov ? colors.white15 : 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer', padding: 0,
                transition: transitions.fast,
                transform: pressed && !disabled ? transforms.pressed : transforms.normal,
                outline: 'none',
                opacity: disabled ? 0.45 : 1,
            }}
        >
            <Icon size={20} strokeWidth={1.6}
                color={active ? colors.textPrimary : (danger && hov && !disabled) ? colors.error : colors.textPrimary}
                style={{
                    transition: transitions.fast,
                    opacity: disabled ? 0.5 : active || hov ? 1 : 0.65
                }}
            />
            {active && !disabled && (
                <span style={{
                    position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                    width: 14, height: 2, borderRadius: 1, background: colors.textPrimary,
                }} />
            )}
            {label && hov && !pressed && !disabled && <InlineTooltip label={label} shortcut={shortcut} />}
        </button>
    )
}

export function Sep() {
    return <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.25)', margin: '0 8px' }} />
}
