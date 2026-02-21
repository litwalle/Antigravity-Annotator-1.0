// content.tsx — 主入口，注入 Shadow DOM 并渲染 React 标注工具 UI
import { createRoot } from 'react-dom/client'
import './index.css'
import { AnnotatorApp } from './AnnotatorApp'

// 追踪标注器是否已打开，供 background.js 查询
let annotatorOpen = false

// 监听来自 background.js 的初始化消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'PING') {
        sendResponse({ action: 'PONG', isOpen: annotatorOpen })
        return
    }

    if (request.action === 'INIT_ANNOTATOR') {
        try {
            initAnnotator(request.image)
        } catch (e) {
            console.error('Failed to init annotator:', e)
        }
    }
})

// 通知 background.js content script 已就绪（解决注入后立刻发消息的时序问题）
chrome.runtime.sendMessage({ action: 'CONTENT_READY' })

function cleanupZombieNodes() {
    // 查找并移除可能存在的旧宿主元素（由于 Reload 导致的 context invalidated）
    const existingHost = document.getElementById('antigravity-annotator-host')
    if (existingHost) {
        existingHost.remove()
    }
}


function initAnnotator(imgDataUrl: string) {
    cleanupZombieNodes()
    // 创建宿主元素
    const host = document.createElement('div')
    host.id = 'antigravity-annotator-host'
    host.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100vw; height: 100vh;
    z-index: 2147483647; pointer-events: none;
  `
    document.body.appendChild(host)

    // 挂载 Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' })
    const mountPoint = document.createElement('div')
    mountPoint.style.cssText = 'width:100%;height:100%;pointer-events:auto;'
    shadow.appendChild(mountPoint)

    annotatorOpen = true
    const root = createRoot(mountPoint)
    root.render(
        <AnnotatorApp
            imgDataUrl={imgDataUrl}
            onClose={() => {
                annotatorOpen = false
                root.unmount()
                host.remove()
            }}
        />
    )
}

export { }
