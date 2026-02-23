import { useEffect } from 'react'
import type { ToolId } from '../types'

export function useKeyboardShortcuts({
    changeTool,
    undo,
    redo,
    deleteSelected,
    onEscape,
}: {
    changeTool: (t: ToolId) => void
    undo: () => void
    redo: () => void
    deleteSelected: () => void
    onEscape: () => void
}) {
    useEffect(() => {
        function handler(e: KeyboardEvent) {
            const path = e.composedPath()
            if (path.some(el => el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement)) return
            if (!e.metaKey && !e.ctrlKey && !e.altKey) {
                if (e.key.toLowerCase() === 'v') changeTool('select')
                if (e.key.toLowerCase() === 'p') changeTool('draw')
                if (e.key.toLowerCase() === 'h') changeTool('rect')
                if (e.key.toLowerCase() === 'a') changeTool('arrow')
                if (e.key.toLowerCase() === 'c') changeTool('comment')
                if (e.key.toLowerCase() === 't') changeTool('text')
                if (e.key.toLowerCase() === 'k') changeTool('crop')
                if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') { redo(); return }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') undo()
            if (e.key === 'Escape') onEscape()
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [changeTool, undo, redo, deleteSelected, onEscape])
}
