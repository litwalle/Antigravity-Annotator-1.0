import { useState } from 'react'
import type { SendStatus, CropRect } from '../types'
import { TEXT_PROMPT } from '../constants'

// 模块级变量：在同一页面生命周期内持久跟踪是否已发送过提示语
let _pagePromptSent = false

async function getExportBlob(canvas: HTMLCanvasElement, cropRect: CropRect | null): Promise<Blob> {
    if (cropRect) {
        const tempCanvas = document.createElement('canvas')
        const { x, y, w, h } = cropRect
        tempCanvas.width = w
        tempCanvas.height = h
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h)
        return new Promise((resolve, reject) => {
            tempCanvas.toBlob(b => b ? resolve(b) : reject(new Error("Cropped toBlob failed")), 'image/png')
        })
    }
    return new Promise((resolve, reject) => {
        canvas.toBlob((b: Blob | null) => {
            if (b) resolve(b)
            else reject(new Error("Canvas toBlob failed"))
        }, 'image/png')
    })
}

export function useImageExport(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    cropRect: CropRect | null,
    setShowGuide: (v: boolean) => void,
) {
    const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
    const [copyStatus, setCopyStatus] = useState<SendStatus>('idle')
    const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false)

    async function sendToIDE() {
        setSendStatus('sending')
        try {
            const canvas = canvasRef.current
            if (!canvas) throw new Error("Canvas not ready")

            const blob = await getExportBlob(canvas, cropRect)

            const clipItems: Record<string, Blob> = { 'image/png': blob }
            if (!_pagePromptSent) {
                clipItems['text/plain'] = new Blob([TEXT_PROMPT], { type: 'text/plain' })
            }
            await navigator.clipboard.write([new ClipboardItem(clipItems)])

            try {
                const resp = await new Promise<{ success?: boolean }>((resolve) => {
                    if (typeof chrome !== 'undefined' && chrome.runtime) {
                        chrome.runtime.sendMessage(
                            { action: 'TRIGGER_LOCAL_DAEMON', url: window.location.href, includePrompt: !_pagePromptSent },
                            (response) => resolve(response || { success: false })
                        )
                    } else {
                        resolve({ success: false })
                    }
                })

                if (!resp || !resp.success) {
                    throw new Error('Daemon returned error or not reachable')
                }

                if (!_pagePromptSent) {
                    _pagePromptSent = true
                    setHasCopiedPrompt(true)
                }
            } catch (err) {
                console.warn("未能连接到后台伴侣脚本，尝试退回 Deep Link 唤醒模式", err)
                setShowGuide(true)
                window.location.href = `antigravity://`
            }
            setSendStatus('success')
            setTimeout(() => setSendStatus('idle'), 2000)
        } catch (error) {
            console.error("Failed to send to IDE via Clipboard/DeepLink:", error)
            setSendStatus('error')
            setTimeout(() => setSendStatus('idle'), 3000)
        }
    }

    async function copyToClipboard() {
        setCopyStatus('sending')
        try {
            const canvas = canvasRef.current
            if (!canvas) throw new Error("Canvas not ready")

            const blob = await getExportBlob(canvas, cropRect)

            const shouldIncludeText = !hasCopiedPrompt && !_pagePromptSent
            const items: Record<string, Blob> = { 'image/png': blob }

            if (shouldIncludeText) {
                items['text/plain'] = new Blob([TEXT_PROMPT], { type: 'text/plain' })
            }

            await navigator.clipboard.write([new ClipboardItem(items)])

            if (shouldIncludeText) {
                setHasCopiedPrompt(true)
            }

            setCopyStatus('success')
            setTimeout(() => setCopyStatus('idle'), 2000)
        } catch (error) {
            console.error("Failed to copy to clipboard:", error)
            setCopyStatus('error')
            setTimeout(() => setCopyStatus('idle'), 3000)
        }
    }

    return { sendStatus, copyStatus, sendToIDE, copyToClipboard }
}
