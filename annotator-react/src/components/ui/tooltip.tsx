// shadcn/ui 风格的 Tooltip 组件（基于 @radix-ui/react-tooltip）
import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
    React.ComponentRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 12, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(className)}
            style={{
                zIndex: 2147483647,
                background: '#111111',
                color: 'rgba(255,255,255,0.88)',
                fontSize: 11.5,
                fontWeight: 400,
                letterSpacing: 0.1,
                lineHeight: 1.4,
                padding: '5px 9px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                userSelect: 'none',
                pointerEvents: 'none',
                fontFamily: '-apple-system, "Inter", sans-serif',
                maxWidth: 180,
                textAlign: 'center',
                whiteSpace: 'pre-line',
                animationDuration: '0.2s',
                animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
                animationFillMode: 'forwards',
            }}
            {...props}
        />
        <style dangerouslySetInnerHTML={{
            __html: `
            [data-side='top'] { animation-name: slideUpIn; }
            [data-side='bottom'] { animation-name: slideDownIn; }
            [data-side='left'] { animation-name: slideLeftIn; }
            [data-side='right'] { animation-name: slideRightIn; }

            @keyframes slideUpIn {
                from { opacity: 0; transform: translateY(4px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes slideDownIn {
                from { opacity: 0; transform: translateY(-4px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes slideLeftIn {
                from { opacity: 0; transform: translateX(4px) scale(0.98); }
                to { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes slideRightIn {
                from { opacity: 0; transform: translateX(-4px) scale(0.98); }
                to { opacity: 1; transform: translateX(0) scale(1); }
            }
        `}} />
    </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
