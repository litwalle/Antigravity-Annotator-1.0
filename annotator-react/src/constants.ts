import { MousePointer2, Pencil, Square, MoveUpRight, MessageSquare, Type, Crop } from 'lucide-react'
import type { ToolId } from './types'

export const TOOLS: { id: ToolId; label: string; shortcut?: string; Icon: React.ElementType }[] = [
    { id: 'select', label: 'Select', shortcut: 'V', Icon: MousePointer2 },
    { id: 'draw', label: 'Freehand pen', shortcut: 'P', Icon: Pencil },
    { id: 'rect', label: 'Highlight area', shortcut: 'H', Icon: Square },
    { id: 'arrow', label: 'Arrow', shortcut: 'A', Icon: MoveUpRight },
    { id: 'comment', label: 'Add comment', shortcut: 'C', Icon: MessageSquare },
    { id: 'text', label: 'Add text', shortcut: 'T', Icon: Type },
    { id: 'crop', label: 'Crop image', shortcut: 'K', Icon: Crop },
]

export const COLORS = [
    '#CCFF00', // 荧光黄
    '#39FF14', // 荧光绿
    '#00FFFF', // 荧光青
    '#1F51FF', // 荧光蓝
    '#BC13FE', // 荧光紫
    '#FF44CC', // 荧光粉
    '#FF073A', // 荧光红
    '#FF6700', // 荧光橙
]

export const TEXT_PROMPT = "Please modify based on the information in the screenshot."

export const CURSOR_MAP: Record<ToolId, string> = {
    select: 'default', draw: 'crosshair', rect: 'crosshair',
    arrow: 'crosshair', comment: 'cell', text: 'text', crop: 'crosshair'
}

export const MAX_HISTORY = 30

export const DEFAULT_TEXT_FONT_SIZE = 20
export const TEXT_FONT_SIZE_MIN = 12
export const TEXT_FONT_SIZE_MAX = 72
export const TEXT_FONT_SIZE_STEP = 4
export const DEFAULT_TEXT_WIDTH = 200
export const MIN_TEXT_WIDTH = 80
export const MIN_TEXT_HEIGHT = 30
