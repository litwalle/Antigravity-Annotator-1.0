import React from 'react'
import { colors, radii, typography, shadows, transitions, zIndex } from '../../designTokens'

export function InlineTooltip({ label, shortcut }: { label: string; shortcut?: string }) {
    return (
        <span style={{
            position: 'absolute', bottom: 54, left: '50%', zIndex: zIndex.tooltip,
            transform: 'translateX(-50%) translateY(3px) scale(0.97)',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            background: colors.bgSolid, color: colors.textLabel,
            fontSize: typography.size.sm, fontWeight: typography.weight.normal,
            letterSpacing: 0.1, lineHeight: typography.lineHeight.snug,
            padding: '5px 9px', borderRadius: radii.sm,
            border: `1px solid ${colors.white15}`,
            boxShadow: shadows.tooltip,
            fontFamily: typography.fontFamily,
            opacity: 0,
            animation: `tooltipIn 0.18s ${transitions.enterEase} forwards`,
        }}>
            <span>{label}</span>
            {shortcut && (
                <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 18, height: 18, padding: '0 4px',
                    background: colors.white8,
                    border: `1px solid ${colors.white15}`,
                    borderRadius: radii.xs, fontSize: typography.size.xs, fontWeight: typography.weight.semibold,
                    color: colors.textMuted,
                }}>
                    {shortcut}
                </span>
            )}
        </span>
    )
}
