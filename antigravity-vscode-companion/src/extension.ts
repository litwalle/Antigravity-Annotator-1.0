import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exec } from 'child_process';

let server: http.Server | undefined;
const PORT = 3001;

export function activate(context: vscode.ExtensionContext) {
    console.log('Antigravity Companion is now active!');

    startServer();

    let disposable = vscode.commands.registerCommand('annotator-for-vscode.restartServer', () => {
        startServer();
        vscode.window.showInformationMessage('Antigravity Companion Server restarted!');
    });

    context.subscriptions.push(disposable);
}

function startServer() {
    if (server) {
        server.close();
    }

    server = http.createServer((req, res) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.method === 'POST' && req.url === '/api/send-screenshot') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const includePrompt = payload.includePrompt !== false; // defaults to true if missing

                    // 剪贴板内容（图片 ± 文字）已由浏览器端写入
                    // AppleScript 只负责激活 Antigravity 并执行一次粘贴
                    const script = `
tell application "Antigravity" to activate
delay 0.5
tell application "System Events"
    keystroke "v" using command down
end tell
`;

                    // 写入临时文件再执行，避免命令行转义问题
                    const tmpFile = path.join(os.tmpdir(), `ag_annotate_${Date.now()}.scpt`);
                    fs.writeFile(tmpFile, script, (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'error', message: writeErr.message }));
                            return;
                        }
                        exec(`osascript "${tmpFile}"`, (error) => {
                            fs.unlink(tmpFile, () => { }); // 执行完删除临时文件
                            if (error) {
                                console.error('AppleScript error:', error);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ status: 'error', message: error.message }));
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'success' }));
                        });
                    });



                } catch (e: any) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: e.message || String(e) }));
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(PORT, '127.0.0.1', () => {
        console.log(`Antigravity Companion server listening on port ${PORT}`);
    });

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use.`);
            vscode.window.showErrorMessage(`Antigravity Companion: Port ${PORT} is already in use.`);
        } else {
            console.error('Server error:', err);
        }
    });
}

export function deactivate() {
    if (server) {
        server.close();
    }
}
