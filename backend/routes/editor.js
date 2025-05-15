"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEditorWebSocket = initEditorWebSocket;
// editor.ts
var ws_1 = require("ws");
var fs = require("fs");
var path = require("path");
function initEditorWebSocket(server, wsPath) {
    if (wsPath === void 0) { wsPath = '/editor'; }
    var wssEditor = new ws_1.WebSocketServer({ server: server, path: wsPath });
    var clients = [];
    var messages = [];
    var currentEditor = null;
    wssEditor.on('connection', function (ws) {
        var clientId = Math.random().toString(36).substr(2, 9); // Generar un clientId único
        clients.push({ ws: ws, clientId: clientId });
        console.log('[Editor] Cliente conectado en /editor');
        // Enviar el estado de bloqueo inicial al cliente
        ws.send(JSON.stringify({ type: 'lock', locked: currentEditor !== null }));
        ws.on('message', function (data) {
            try {
                var msg_1 = JSON.parse(data.toString());
                messages.push(msg_1);
                console.log('[Editor] Mensaje recibido:', msg_1);
                // Guardar el contenido en un archivo .txt
                if (msg_1.fileName && msg_1.content) {
                    var filePath = path.join(__dirname, '../uploads', msg_1.fileName);
                    fs.writeFileSync(filePath, msg_1.content, 'utf8');
                    console.log("[Editor] Archivo guardado en: ".concat(filePath));
                    // Guardar datos del mensaje (autor, contenido añadido, hora) en un JSON en la carpeta historial
                    var historialPath = path.join(__dirname, '../historial', msg_1.fileName.replace('.txt', '.json'));
                    var historialData = [];
                    // Leer el archivo existente si ya existe
                    if (fs.existsSync(historialPath)) {
                        try {
                            var existingData = fs.readFileSync(historialPath, 'utf8');
                            historialData = JSON.parse(existingData);
                        }
                        catch (err) {
                            console.error("[Editor] Error al leer el historial existente: ".concat(err));
                        }
                    }
                    // Asegurarse de que historialData sea un array
                    if (!Array.isArray(historialData)) {
                        console.warn("[Editor] El historial existente no es un array. Se inicializar\u00E1 como un array vac\u00EDo.");
                        historialData = [];
                    }
                    // Agregar el nuevo cambio al historial
                    historialData.push({
                        fileName: msg_1.fileName,
                        content: msg_1.content,
                        author: msg_1.author,
                        date: msg_1.date,
                    });
                    // Guardar el historial actualizado
                    try {
                        fs.writeFileSync(historialPath, JSON.stringify(historialData, null, 2), 'utf8');
                        console.log("[Editor] Historial actualizado en: ".concat(historialPath));
                    }
                    catch (err) {
                        console.error("[Editor] Error al guardar el historial: ".concat(err));
                    }
                    clients.forEach(function (_a) {
                        var clientWs = _a.ws;
                        if (clientWs !== ws && clientWs.readyState === ws_1.WebSocket.OPEN) {
                            clientWs.send(JSON.stringify(msg_1));
                        }
                    });
                }
                else if (msg_1.fileName && msg_1.editorFocus !== undefined) {
                    console.log('[Editor] Estan editando el archivo', msg_1);
                    if (msg_1.editorFocus && currentEditor === null) {
                        currentEditor = msg_1.author;
                        clients.forEach(function (_a) {
                            var clientWs = _a.ws;
                            if (clientWs !== ws && clientWs.readyState === ws_1.WebSocket.OPEN) {
                                clientWs.send(JSON.stringify({ type: 'lock', locked: true, author: msg_1.author }));
                            }
                        });
                    }
                    else if (!msg_1.editorFocus && currentEditor === msg_1.author) {
                        currentEditor = null;
                        clients.forEach(function (_a) {
                            var clientWs = _a.ws;
                            if (clientWs !== ws && clientWs.readyState === ws_1.WebSocket.OPEN) {
                                clientWs.send(JSON.stringify({ type: 'lock', locked: false }));
                            }
                        });
                    }
                }
            }
            catch (err) {
                console.error('[Editor] Error al procesar mensaje:', err);
            }
        });
        ws.on('close', function () {
            var clientIndex = clients.findIndex(function (client) { return client.ws === ws; });
            if (clientIndex !== -1) {
                var clientId_1 = clients[clientIndex].clientId;
                if (currentEditor === clientId_1) {
                    currentEditor = null;
                    clients.forEach(function (_a) {
                        var clientWs = _a.ws;
                        if (clientWs !== ws && clientWs.readyState === ws_1.WebSocket.OPEN) {
                            clientWs.send(JSON.stringify({ type: 'lock', locked: false }));
                        }
                    });
                }
                clients.splice(clientIndex, 1);
                console.log('[Editor] Cliente desconectado de /editor');
            }
        });
    });
    console.log('WebSocket del editor inicializado en /editor');
}
