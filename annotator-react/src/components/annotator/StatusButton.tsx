import React, { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { InlineTooltip } from './InlineTooltip'
import { colors, radii, buttonSize, transitions, transforms, zIndex } from '../../designTokens'
import type { SendStatus } from '../../types'

interface StatusButtonConfig {
    labels: Record<SendStatus, string>
    tooltipLabel: string
    width: number
    IdleIcon: React.ElementType
}

export function StatusButton({ status, onClick, config }: {
    status: SendStatus
    onClick: () => void
    config: StatusButtonConfig
}) {
    const disabled = status === 'sending' || status === 'success'
    const [pressed, setPressed] = useState(false)
    const [hov, setHov] = useState(false)

    const bgMap: Record<SendStatus, string> = {
        idle: hov ? colors.white22 : colors.white14,
        sending: colors.white5,
        success: colors.white12,
        error: colors.errorBg,
    }

    const colorMap: Record<SendStatus, string> = {
        idle: colors.textMedium, sending: colors.textDisabled,
        success: colors.textMedium, error: colors.error,
    }

    const { IdleIcon, labels, tooltipLabel, width } = config

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => !disabled && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                position: 'relative', zIndex: hov ? zIndex.hoverBtn : 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width, height: buttonSize.icon, borderRadius: radii.lg,
                background: bgMap[status], border: 'none',
                cursor: disabled && status !== 'success' ? 'default' : 'pointer',
                transition: transitions.fast,
                opacity: (disabled && status === 'sending') ? 0.7 : 1,
                transform: pressed ? transforms.pressed : transforms.normal,
                outline: 'none',
                color: colorMap[status],
                fontWeight: 500, fontSize: 13, letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
            }}
        >
            {/* Idle state */}
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: transitions.fast, pointerEvents: 'none',
                transitionDelay: status === 'idle' ? '0.1s' : '0s',
                opacity: status === 'idle' ? 1 : 0, transform: status === 'idle' ? transforms.normal : transforms.pressed
            }}>
                <IdleIcon size={20} strokeWidth={1.5} color={colorMap[status]} style={{ opacity: 0.9 }} />
                <span>{labels.idle}</span>
            </div>

            {/* Sending state */}
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: transitions.fast, pointerEvents: 'none',
                transitionDelay: status === 'sending' ? '0.1s' : '0s',
                opacity: status === 'sending' ? 1 : 0, transform: status === 'sending' ? transforms.normal : transforms.pressed
            }}>
                <Loader2 size={14} style={{ animation: status === 'sending' ? 'spin 1s linear infinite' : 'none' }} />
                <span>{labels.sending}</span>
            </div>

            {/* Success state */}
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: transitions.fast, pointerEvents: 'none',
                transitionDelay: status === 'success' ? '0.1s' : '0s',
                opacity: status === 'success' ? 1 : 0, transform: status === 'success' ? transforms.normal : transforms.pressed
            }}>
                <Check size={18} strokeWidth={1.6} />
                <span>{labels.success}</span>
            </div>

            {hov && !pressed && status === 'idle' && <InlineTooltip label={tooltipLabel} />}
        </button>
    )
}
