// AnnotatorApp.tsx — 主标注 UI（React）
import React, { useEffect, useState, useCallback } from 'react'
import type { AnnotatorAppProps, TextAnnotation } from './types'
import { CURSOR_MAP, COLORS } from './constants'
import { useCanvasDrawing } from './hooks/useCanvasDrawing'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useImageExport } from './hooks/useImageExport'
import { Toolbar } from './components/annotator/Toolbar'
import { CropOverlay } from './components/annotator/CropOverlay'
import { CommentInput } from './components/annotator/CommentInput'
import { TextOverlay } from './components/annotator/TextOverlay'
import { TextSizeMenu } from './components/annotator/TextSizeMenu'
import { GuideModal } from './components/annotator/GuideModal'

export function AnnotatorApp({ imgDataUrl, onClose }: AnnotatorAppProps) {
    const [isClosing, setIsClosing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [showGuide, setShowGuide] = useState(false)
    const [activeColor, setActiveColor] = useState(COLORS[5])

    // 入场动画：双 rAF 确保初始 opacity:0 先绘制，再触发 transition
    useEffect(() => {
        let id2: number
        const id1 = requestAnimationFrame(() => {
            id2 = requestAnimationFrame(() => setMounted(true))
        })
        return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2) }
    }, [])

    const {
        canvasRef, scaleRef,
        tool, displaySize, annotations, selectedIds, editingText,
        commentState, commentText, setCommentText,
        cropRect, isCropActive, isCropSelected, isHoveringHandle,
        changeTool, undo, redo, canRedo, clearAll, deleteSelected,
        submitComment, confirmText, cancelText, setEditingText,
        updateAnnotationFontSize,
        handleMouseDown, handleMouseMove, handleMouseUp,
    } = useCanvasDrawing(imgDataUrl, activeColor)

    const { sendStatus, copyStatus, sendToIDE, copyToClipboard } = useImageExport(canvasRef, cropRect, setShowGuide)

    const handleClose = useCallback(() => {
        setIsClosing(true)
        setTimeout(onClose, 300)
    }, [onClose])

    const handleEscape = useCallback(() => {
        if (editingText) {
            cancelText()
        } else if (commentState.visible) {
            undo()
        } else {
            handleClose()
        }
    }, [editingText, commentState.visible, undo, handleClose, cancelText])

    useKeyboardShortcuts({ changeTool, undo, redo, deleteSelected, onEscape: handleEscape })

    const show = mounted && !isClosing

    // 获取选中的文本标注（用于显示 TextSizeMenu）
    const selectedTextAnnotation = tool === 'select' && selectedIds.size === 1
        ? annotations.find(a => selectedIds.has(a.id) && a.type === 'text') as TextAnnotation | undefined
        : undefined

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2147483647, background: '#000',
            opacity: show ? 1 : 0,
            transition: isClosing ? 'opacity 0.26s ease-in' : 'opacity 0.24s ease-out',
        }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes tooltipIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(3px) scale(0.97); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
            `}} />

            <canvas ref={canvasRef}
                style={{
                    display: 'block',
                    cursor: CURSOR_MAP[tool],
                    width: displaySize.w > 0 ? `${displaySize.w}px` : undefined,
                    height: displaySize.h > 0 ? `${displaySize.h}px` : undefined,
                }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />

            {cropRect && (
                <CropOverlay
                    rect={cropRect}
                    scale={scaleRef.current}
                    isCropActive={isCropActive}
                    isCropSelected={isCropSelected}
                    isHoveringHandle={isHoveringHandle}
                    isCurrentTool={tool === 'crop'}
                />
            )}

            {/* 原地文字编辑 */}
            {editingText && (
                <TextOverlay
                    x={editingText.x} y={editingText.y}
                    w={editingText.w} h={editingText.h}
                    content={editingText.content}
                    color={editingText.color}
                    fontSize={editingText.fontSize}
                    scale={scaleRef.current}
                    onChange={updates => setEditingText(prev => prev ? { ...prev, ...updates } : prev)}
                    onConfirm={confirmText}
                    onCancel={cancelText}
                />
            )}

            {/* 选中文本时的字号菜单 */}
            {selectedTextAnnotation && !editingText && (
                <TextSizeMenu
                    fontSize={selectedTextAnnotation.fontSize}
                    x={selectedTextAnnotation.x}
                    y={selectedTextAnnotation.y}
                    scale={scaleRef.current}
                    onChangeSize={delta => updateAnnotationFontSize(selectedTextAnnotation.id, delta)}
                />
            )}

            <Toolbar
                tool={tool}
                isCropActive={isCropActive}
                activeColor={activeColor}
                copyStatus={copyStatus}
                sendStatus={sendStatus}
                hasSelection={selectedIds.size > 0}
                canRedo={canRedo()}
                show={show}
                isClosing={isClosing}
                onChangeTool={changeTool}
                onSetActiveColor={setActiveColor}
                onUndo={undo}
                onRedo={redo}
                onClearAll={clearAll}
                onDelete={deleteSelected}
                onCopy={copyToClipboard}
                onSend={sendToIDE}
                onClose={handleClose}
            />

            {commentState.visible && (
                <CommentInput x={commentState.x} y={commentState.y} mode={commentState.mode}
                    value={commentText} onChange={setCommentText}
                    onConfirm={submitComment} onCancel={undo} />
            )}

            {showGuide && (
                <GuideModal onClose={() => setShowGuide(false)} />
            )}
        </div>
    )
}
