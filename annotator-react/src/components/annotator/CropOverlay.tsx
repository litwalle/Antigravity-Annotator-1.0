import React from 'react'
import type { CropRect } from '../../types'
import { colors, zIndex } from '../../designTokens'

function CropHandle({ pos }: { pos: string }) {
    const isCorner = pos.length === 2
    const color = colors.bgSolid
    const borderColor = colors.textPrimary
    const thickness = 4
    const length = isCorner ? 20 : 26
    const strokeWidth = 1

    const pad = 2
    const svgSize = length + pad * 2

    const halfT = thickness / 2
    const halfS = svgSize / 2

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        width: svgSize,
        height: svgSize,
        zIndex: 10,
        pointerEvents: 'none',
        overflow: 'visible'
    }

    if (pos.includes('n')) {
        containerStyle.top = -halfT - pad
    } else if (pos.includes('s')) {
        if (isCorner) {
            containerStyle.top = `calc(100% + ${halfT - length - pad}px)`
        } else {
            containerStyle.top = `calc(100% - ${halfT + pad}px)`
        }
    } else {
        containerStyle.top = `calc(50% - ${halfS}px)`
    }

    if (pos.includes('w')) {
        containerStyle.left = -halfT - pad
    } else if (pos.includes('e')) {
        if (isCorner) {
            containerStyle.left = `calc(100% + ${halfT - length - pad}px)`
        } else {
            containerStyle.left = `calc(100% - ${halfT + pad}px)`
        }
    } else {
        containerStyle.left = `calc(50% - ${halfS}px)`
    }

    return (
        <svg style={containerStyle} width={svgSize} height={svgSize} viewBox={`-${pad} -${pad} ${svgSize} ${svgSize}`}>
            {isCorner ? (
                <path
                    d={
                        pos === 'nw' ? `M ${length},${thickness} H ${thickness} V ${length} H 0 V 0 H ${length} Z` :
                            pos === 'ne' ? `M 0,${thickness} H ${length - thickness} V ${length} H ${length} V 0 H 0 Z` :
                                pos === 'sw' ? `M ${length},${length - thickness} H ${thickness} V 0 H 0 V ${length} H ${length} Z` :
                        /* se */ `M 0,${length - thickness} H ${length - thickness} V 0 H ${length} V ${length} H 0 Z`
                    }
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="miter"
                />
            ) : (
                <rect
                    x={0} y={0}
                    width={pos === 'n' || pos === 's' ? length : thickness}
                    height={pos === 'n' || pos === 's' ? thickness : length}
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={strokeWidth}
                />
            )}
        </svg>
    )
}

export function CropOverlay({ rect, scale, isCropActive, isCropSelected, isHoveringHandle, isCurrentTool }: {
    rect: CropRect
    scale: number
    isCropActive: boolean
    isCropSelected: boolean
    isHoveringHandle: boolean
    isCurrentTool: boolean
}) {
    const { x: cx, y: cy, w: cw, h: ch } = rect
    const x = cx * scale
    const y = cy * scale
    const w = cw * scale
    const h = ch * scale

    const showHandles = isCropSelected || isHoveringHandle
    const highlightBorder = isCurrentTool || isCropSelected || isHoveringHandle

    return (
        <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: zIndex.cropOverlay,
        }}>
            <div style={{
                position: 'absolute', inset: 0,
                background: colors.bgCropMask,
                clipPath: `polygon(
                    0% 0%, 0% 100%, ${x}px 100%,
                    ${x}px ${y}px, ${x + w}px ${y}px, ${x + w}px ${y + h}px, ${x}px ${y + h}px, ${x}px 100%,
                    100% 100%, 100% 0%
                )`
            }} />

            <div style={{
                position: 'absolute', left: x, top: y, width: w, height: h,
                boxSizing: 'border-box',
                pointerEvents: 'none',
                border: highlightBorder ? `1px dashed ${colors.textDim}` : `1px dashed ${colors.white15}`
            }}>
                {isCropActive && showHandles && w >= 64 && h >= 64 && (
                    <>
                        <CropHandle pos="nw" />
                        <CropHandle pos="ne" />
                        <CropHandle pos="sw" />
                        <CropHandle pos="se" />
                        {w > 100 && (
                            <>
                                <CropHandle pos="n" />
                                <CropHandle pos="s" />
                            </>
                        )}
                        {h > 100 && (
                            <>
                                <CropHandle pos="w" />
                                <CropHandle pos="e" />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
