import React from 'react'
import { Store, MonitorCheck, MousePointer2, PlugZap, Copy } from 'lucide-react'
import { Modal } from './Modal'
import { colors, radii, typography } from '../../designTokens'

export function GuideModal({ onClose }: { onClose: () => void }) {
    const steps: { Icon: React.ElementType; text: React.ReactNode }[] = [
        {
            Icon: Store,
            text: (
                <>
                    Open Antigravity&apos;s{' '}
                    <b style={{ color: colors.textPrimary }}>Extensions Marketplace</b> and search for{' '}
                    <b style={{ color: colors.textPrimary }}>&quot;Annotate&quot;</b> or{' '}
                    <b style={{ color: colors.textPrimary }}>&quot;Annotate for Antigravity&quot;</b>.
                    Install the plugin.
                </>
            ),
        },
        {
            Icon: MonitorCheck,
            text: (
                <>
                    Make sure <b style={{ color: colors.textPrimary }}>Antigravity is running</b> — the plugin
                    starts the helper service automatically when Antigravity is open.
                </>
            ),
        },
        {
            Icon: MousePointer2,
            text: (
                <>
                    Place your cursor in the{' '}
                    <b style={{ color: colors.textPrimary }}>Antigravity chat input</b>, then click{' '}
                    <b style={{ color: colors.textPrimary }}>&quot;Add to Antigravity&quot;</b> again.
                </>
            ),
        },
    ]

    return (
        <Modal onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: radii.lg,
                        background: colors.white10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <PlugZap size={20} color={colors.textPrimary} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: typography.size['2xl'], color: colors.textPrimary, fontWeight: typography.weight.semibold, lineHeight: typography.lineHeight.tight }}>
                            Plugin Required
                        </h3>
                        <p style={{ margin: 0, fontSize: typography.size.md, color: colors.textDim, marginTop: 3 }}>
                            Annotate for Antigravity
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: typography.size.lg, color: colors.textSecondary, lineHeight: typography.lineHeight.loose }}>
                    The <b style={{ color: colors.textHigh }}>Annotate for Antigravity</b> companion
                    plugin was not detected. Please follow the steps below.
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {steps.map(({ Icon, text }, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: radii.md,
                                background: colors.white8,
                                border: `1px solid ${colors.white10}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginTop: 1,
                            }}>
                                <Icon size={15} color={colors.textBody} strokeWidth={1.8} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.textSubtle, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Step {i + 1}
                                </span>
                                <div style={{ fontSize: typography.size.base, color: colors.textBody, lineHeight: typography.lineHeight.relaxed }}>
                                    {text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tip */}
                <div style={{
                    fontSize: typography.size.md, color: colors.textFaint, lineHeight: 1.5,
                    padding: '10px 12px', borderRadius: radii.md,
                    background: colors.white4,
                    border: `1px solid ${colors.white8}`,
                }}>
                    <b style={{ color: 'rgba(255,255,255,0.55)' }}>Tip:</b> Your cursor must be focused
                    in the Antigravity chat input before clicking &quot;Add to Antigravity&quot;.
                    <br /><br />
                    <b style={{ color: 'rgba(255,255,255,0.55)' }}>Alternative:</b> Use the{' '}
                    <Copy size={11} style={{ display: 'inline', verticalAlign: 'middle', marginBottom: 1 }} color="rgba(255,255,255,0.5)" />{' '}
                    <b style={{ color: colors.textDim }}>Copy</b> button to copy the screenshot
                    to your clipboard, then paste it manually into Antigravity.
                </div>

                {/* CTA */}
                <button onClick={onClose} style={{
                    padding: '11px', borderRadius: radii.lg, background: colors.textPrimary, color: colors.bgSolid,
                    border: 'none', fontWeight: typography.weight.semibold, fontSize: typography.size.xl, cursor: 'pointer',
                    letterSpacing: '0.2px',
                }}>
                    Got it
                </button>
            </div>
        </Modal>
    )
}
