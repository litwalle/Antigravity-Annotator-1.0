export type ToolId = 'select' | 'draw' | 'rect' | 'arrow' | 'comment' | 'text' | 'crop'
export type SendStatus = 'idle' | 'sending' | 'success' | 'error'

export interface CommentState {
    visible: boolean; x: number; y: number; mode: 'comment' | 'text'
}

export interface AnnotatorAppProps {
    imgDataUrl: string
    onClose: () => void
}

export interface CropRect {
    x: number; y: number; w: number; h: number
}

// ── Annotation 对象模型 ──

export interface BaseAnnotation {
    id: string
    type: string
    color: string
}

export interface FreehandAnnotation extends BaseAnnotation {
    type: 'freehand'
    points: { x: number; y: number }[]
    lineWidth: number
}

export interface RectAnnotation extends BaseAnnotation {
    type: 'rect'
    x: number; y: number; w: number; h: number
}

export interface ArrowAnnotation extends BaseAnnotation {
    type: 'arrow'
    x1: number; y1: number; x2: number; y2: number
    lineWidth: number
}

export interface TextAnnotation extends BaseAnnotation {
    type: 'text'
    x: number; y: number; w: number; h: number
    content: string
    fontSize: number
}

export interface CommentAnnotation extends BaseAnnotation {
    type: 'comment'
    rect: { x: number; y: number; w: number; h: number }
    content: string
    textX: number; textY: number
}

export type Annotation = FreehandAnnotation | RectAnnotation | ArrowAnnotation | TextAnnotation | CommentAnnotation
