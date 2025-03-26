"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const __1 = require("../..");
const ws_1 = require("ws");
class Node {
    constructor(manager, node) {
        this.players = 0;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.resumed = false;
        this.manager = manager;
        this.host = node.host;
        this.port = node.port;
        this.password = node.password;
        this.secure = node.secure;
        this.identifier = node.identifier;
        this.sessionId = node.sessionId ? node.sessionId : "";
        this.rest = new __1.Rest(this.manager, this);
        this.retryAmount = node.retryAmount || 0;
        this.retryDelay = node.retryDuration || 3000;
    }
    connect(clientId) {
        this.clientId = clientId;
        this.ws = new ws_1.WebSocket(`ws${this.secure ? "s" : ""}://${this.host}:${this.port}/v4/websocket`, {
            headers: Object.assign({ "Authorization": this.password, "User-Id": clientId, "Client-Name": `${__1.name}/${__1.version}` }, (this.sessionId && { "Session-Id": this.sessionId }))
        });
        this.ws.on("open", () => {
            this.manager.emit("debug", `Node ${this.identifier} has been connected`);
            this.manager.emit("nodeConnect", this);
        });
        this.ws.on("error", (error) => {
            if (error.code === "ECONNREFUSED") {
                throw new Error(`Lavalink server connection failed: Ensure the server is running, check the IP/port, verify network/firewall settings, and confirm server configuration.`);
            }
        });
        this.ws.on("close", (code, reason) => {
            this.connected = false;
            this.manager.emit("nodeDisconnect", this, code, reason.toString());
            this.reconnectTimeout = setTimeout(() => {
                if (this.retryAmount > this.reconnectAttempts) {
                    this.connect(this.clientId);
                }
                else {
                    this.ws = null;
                    this.reconnectTimeout = null;
                }
            }, this.retryDelay);
        });
        this.ws.on("message", this.message.bind(this));
    }
    message(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(data))
                data = Buffer.concat(data);
            else if (data instanceof ArrayBuffer)
                data = Buffer.from(data);
            const payload = JSON.parse(data.toString("utf-8"));
            if (payload.op === "stats") {
                delete payload.op;
                this.players = payload.players;
            }
            else if (payload.op === "ready") {
                this.connected = true;
                this.sessionId = payload.sessionId;
                this.resumed = payload.resumed;
            }
            else if (payload.op === "playerUpdate") {
                const player = this.manager.getPlayer(payload.guildID);
                if (!player || !player.current)
                    return;
                player.connected = payload.state.connected;
                player.current.position = payload.state.position;
                player.current.time = payload.state.time;
                player.ping = payload.state.ping;
                this.manager.emit("playerUpdate", player, player.current);
                this.manager.emit("debug", `The Player for guild ${player.guildId} has been updated`);
            }
            else if (payload.op === "event") {
                let player = this.manager.getPlayer(payload.guildId);
                if (payload.type === "TrackStartEvent") {
                    player.playing = true;
                    player.paused = false;
                    this.manager.emit("trackStart", player, player.current);
                    this.manager.emit("debug", `Player for guild ${player.guildId} has start playing`);
                }
                else if (payload.type === "TrackEndEvent") {
                    player.playing = false;
                    player.paused = false;
                    if (payload.reason === "finished") {
                        this.manager.emit("trackFinish", player, player.current);
                        this.manager.emit("debug", `Track for guild ${player.guildId} has ended`);
                        if (player.loopType === __1.LoopType.Track) {
                            yield this.rest.update({
                                guildId: player.guildId,
                                data: {
                                    track: {
                                        encoded: player.current.encoded,
                                    },
                                    volume: player.volume,
                                },
                            });
                        }
                        else if (player.loopType === __1.LoopType.Queue) {
                            player.current.position = 0;
                            player.queue.add(player.current);
                            this.manager.emit("debug", `The Player for guild ${player.guildId} is looping track`);
                        }
                        else {
                            if (player.queue.size() > 0) {
                                yield player.play();
                            }
                            else {
                                this.manager.emit("queueEnd", player);
                                this.manager.emit("debug", `The queue for the player ${player.guildId} has been ended`);
                                player.queue.clear();
                            }
                        }
                    }
                    if (["loadFailed", "cleanup"].includes(payload.reason)) {
                        if (player.queue.size() > 0) {
                            player.play();
                        }
                        else {
                            this.manager.emit("queueEnd", player);
                            this.manager.emit("debug", `The queue for the player ${player.guildId} has been ended`);
                            player.queue.clear();
                        }
                    }
                }
            }
        });
    }
}
exports.Node = Node;
