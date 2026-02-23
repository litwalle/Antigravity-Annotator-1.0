import React from 'react'
import { Undo2, Redo2, Eraser, Trash2, Copy, Send } from 'lucide-react'
import { IconBtn, Sep } from './IconBtn'
import { CloseBtn } from './CloseBtn'
import { StatusButton } from './StatusButton'
import { ColorPicker } from './ColorPicker'
import { TOOLS } from '../../constants'
import { colors, radii, shadows, zIndex } from '../../designTokens'
import type { ToolId, SendStatus } from '../../types'

const COPY_CONFIG = {
    labels: { idle: 'Copy', sending: 'Copying…', success: 'Copied', error: 'Error' } as Record<SendStatus, string>,
    tooltipLabel: 'Copy to clipboard',
    width: 100,
    IdleIcon: Copy,
}

const SEND_CONFIG = {
    labels: { idle: 'Add to Antigravity', sending: 'Sending…', success: 'Added', error: 'Error' } as Record<SendStatus, string>,
    tooltipLabel: 'Send to Antigravity',
    width: 164,
    IdleIcon: Send,
}

export function Toolbar({ tool, isCropActive, activeColor, copyStatus, sendStatus, hasSelection, canRedo, show, isClosing, onChangeTool, onSetActiveColor, onUndo, onRedo, onClearAll, onDelete, onCopy, onSend, onClose }: {
    tool: ToolId
    isCropActive: boolean
    activeColor: string
    copyStatus: SendStatus
    sendStatus: SendStatus
    hasSelection: boolean
    canRedo: boolean
    show: boolean
    isClosing: boolean
    onChangeTool: (t: ToolId) => void
    onSetActiveColor: (c: string) => void
    onUndo: () => void
    onRedo: () => void
    onClearAll: () => void
    onDelete: () => void
    onCopy: () => void
    onSend: () => void
    onClose: () => void
}) {
    const enterT = 'opacity 0.28s cubic-bezier(0,0,0.2,1), transform 0.34s cubic-bezier(0,0,0.2,1)'
    const exitT = 'opacity 0.22s cubic-bezier(0.4,0,1,1), transform 0.22s cubic-bezier(0.4,0,1,1)'

    return (
        <div style={{
            position: 'fixed', bottom: 28, left: '50%',
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            borderRadius: radii.lg, background: colors.bgSolid,
            boxShadow: shadows.toolbar,
            border: `1px solid ${colors.white15}`, userSelect: 'none',
            opacity: show ? 1 : 0,
            zIndex: zIndex.toolbar,
            transform: `translateX(-50%) translateY(${show ? 0 : 28}px)`,
            transition: isClosing ? exitT : enterT,
        }}>
            {TOOLS.map(({ id, label, shortcut, Icon }) => (
                <IconBtn
                    key={id}
                    active={id === 'crop' ? isCropActive : tool === id}
                    onClick={() => onChangeTool(id)}
                    Icon={Icon}
                    label={label}
                    shortcut={shortcut}
                />
            ))}

            <ColorPicker activeColor={activeColor} onChange={onSetActiveColor} />

            <Sep />
            <IconBtn Icon={Undo2} active={false} onClick={onUndo} label="Undo" shortcut="⌘Z" />
            <IconBtn Icon={Redo2} active={false} onClick={onRedo} disabled={!canRedo} label="Redo" shortcut="⌘⇧Z" />
            <IconBtn Icon={Trash2} active={false} onClick={onDelete} disabled={!hasSelection} label="Delete" shortcut="⌫" />
            <IconBtn Icon={Eraser} active={false} onClick={onClearAll} danger label="Clear all" />
            <Sep />
            <StatusButton status={copyStatus} onClick={onCopy} config={COPY_CONFIG} />
            <StatusButton status={sendStatus} onClick={onSend} config={SEND_CONFIG} />
            <CloseBtn onClick={onClose} />
        </div>
    )
}
