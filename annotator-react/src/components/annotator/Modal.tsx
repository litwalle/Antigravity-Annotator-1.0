import React from 'react'
import { X } from 'lucide-react'
import { colors, radii, shadows, typography, zIndex } from '../../designTokens'

export function Modal({ onClose, width = 420, children }: {
    onClose: () => void
    width?: number
    children: React.ReactNode
}) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: zIndex.modal,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: colors.bgOverlay, backdropFilter: 'blur(4px)',
            animation: 'opacityIn 0.2s ease-out'
        }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes opacityIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}} />
            <div style={{
                width, background: colors.bgCard, borderRadius: radii.xl,
                padding: '28px 24px', position: 'relative',
                border: `1px solid ${colors.white12}`,
                boxShadow: shadows.modal,
                animation: 'modalUp 0.3s cubic-bezier(0,0,0.2,1) forwards',
                fontFamily: typography.fontFamily,
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', right: 16, top: 16, background: 'none', border: 'none',
                    cursor: 'pointer', color: colors.textFaint, padding: 4, lineHeight: 0,
                }}>
                    <X size={20} />
                </button>
                {children}
            </div>
        </div>
    )
}
