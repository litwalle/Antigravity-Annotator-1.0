import { useRef, useCallback } from 'react'
import type { Annotation } from '../types'
import { MAX_HISTORY } from '../constants'

function deepCopy(annotations: Annotation[]): Annotation[] {
    return annotations.map(a => {
        if (a.type === 'freehand') return { ...a, points: a.points.map(p => ({ ...p })) }
        if (a.type === 'comment') return { ...a, rect: { ...a.rect } }
        return { ...a }
    })
}

export function useAnnotatorHistory() {
    const historyRef = useRef<Annotation[][]>([[]])
    const redoRef = useRef<Annotation[][]>([])

    const saveState = useCallback((annotations: Annotation[]) => {
        historyRef.current.push(deepCopy(annotations))
        if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
        // 新操作清空 redo 栈
        redoRef.current = []
    }, [])

    const undoState = useCallback((): Annotation[] | null => {
        const stack = historyRef.current
        if (stack.length > 1) {
            const popped = stack.pop()!
            redoRef.current.push(popped)
            return deepCopy(stack[stack.length - 1])
        }
        return null
    }, [])

    const redoState = useCallback((): Annotation[] | null => {
        const redoStack = redoRef.current
        if (redoStack.length > 0) {
            const restored = redoStack.pop()!
            historyRef.current.push(restored)
            return deepCopy(restored)
        }
        return null
    }, [])

    const canRedo = useCallback((): boolean => {
        return redoRef.current.length > 0
    }, [])

    const clearToEmpty = useCallback((): Annotation[] => {
        historyRef.current = [[]]
        redoRef.current = []
        return []
    }, [])

    return { saveState, undoState, redoState, canRedo, clearToEmpty, historyRef, redoRef }
}
