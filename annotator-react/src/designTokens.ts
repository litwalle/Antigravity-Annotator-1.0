// ── Design Tokens ──────────────────────────────────────────────
// 统一管理所有 UI 设计值，修改一处即全局生效

// ── 颜色 ──
export const colors = {
    // 背景
    bgSolid: '#000000',
    bgOverlay: 'rgba(0,0,0,0.6)',
    bgCropMask: 'rgba(0,0,0,0.88)',
    bgCard: '#111',

    // 白色系（按透明度从低到高）
    white4: 'rgba(255,255,255,0.04)',
    white5: 'rgba(255,255,255,0.05)',
    white8: 'rgba(255,255,255,0.08)',
    white10: 'rgba(255,255,255,0.1)',
    white12: 'rgba(255,255,255,0.12)',
    white14: 'rgba(255,255,255,0.14)',
    white15: 'rgba(255,255,255,0.15)',
    white18: 'rgba(255,255,255,0.18)',
    white22: 'rgba(255,255,255,0.22)',

    // 文字 & 图标
    textPrimary: '#ffffff',
    textHigh: 'rgba(255,255,255,0.9)',
    textMedium: 'rgba(255,255,255,0.85)',
    textBody: 'rgba(255,255,255,0.7)',
    textSecondary: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.6)',
    textDim: 'rgba(255,255,255,0.45)',
    textFaint: 'rgba(255,255,255,0.4)',
    textGhost: 'rgba(255,255,255,0.35)',
    textSubtle: 'rgba(255,255,255,0.3)',
    textLabel: 'rgba(255,255,255,0.88)',
    textDisabled: 'rgba(255,255,255,0.4)',

    // 强调 / 错误
    error: '#f87171',
    errorBg: 'rgba(248,113,113,0.15)',
    dangerHover: 'rgba(239,68,68,0.15)',

    // 选中态
    selectionBorder: '#3B82F6',
    selectionBorderInner: '#FFFFFF',
} as const

// ── 圆角 ──
export const radii = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 16,
    full: '50%',
} as const

// ── 间距 ──
export const spacing = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    '2xl': 14,
    '3xl': 16,
    '4xl': 20,
    '5xl': 24,
    '6xl': 28,
} as const

// ── 字体 ──
export const typography = {
    fontFamily: '-apple-system, "Inter", sans-serif',
    size: {
        xs: 10,
        sm: 11.5,
        md: 12,
        base: 13,
        lg: 13.5,
        xl: 14,
        '2xl': 17,
    },
    weight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tight: 1.2,
        snug: 1.4,
        normal: 1.55,
        relaxed: 1.6,
        loose: 1.65,
    },
} as const

// ── 阴影 ──
export const shadows = {
    tooltip: '0 4px 12px rgba(0,0,0,0.5)',
    dropdown: '0 8px 32px rgba(0,0,0,0.8)',
    popover: '0 8px 32px rgba(0,0,0,0.7)',
    modal: '0 20px 40px rgba(0,0,0,0.5)',
    toolbar: '0 4px 24px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06) inset',
} as const

// ── 过渡 ──
export const transitions = {
    fast: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 0.2s',
    enterEase: 'cubic-bezier(0, 0, 0.2, 1)',
    exitEase: 'cubic-bezier(0.4, 0, 1, 1)',
} as const

// ── 交互变换 ──
export const transforms = {
    pressed: 'scale(0.95)',
    pressedSm: 'scale(0.96)',
    normal: 'scale(1)',
} as const

// ── Z-Index ──
export const zIndex = {
    cropOverlay: 5,
    popover: 10,
    toolbar: 100,
    hoverBtn: 200,
    tooltip: 999,
    modal: 2147483647,
} as const

// ── 按钮尺寸 ──
export const buttonSize = {
    icon: 40,
} as const

// ── 边框 ──
export const borders = {
    subtle: `1px solid ${colors.white15}`,
    faint: `1px solid ${colors.white10}`,
    ghost: `1px solid ${colors.white8}`,
} as const
