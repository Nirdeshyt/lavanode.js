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
exports.Player = void 0;
const __1 = require("../..");
class Player {
    constructor(manager, config, node) {
        this.connected = false;
        this.joined = false;
        this.playing = false;
        this.paused = false;
        this.volume = 100;
        this.voiceStats = {};
        this.queue = new __1.Queue();
        this.ping = 0;
        this.manager = manager;
        this.guildId = config.guildId;
        this.voiceChannelId = config.voiceChannelId;
        this.textChannelId = config.textChannelId;
        this.node = node;
        this.loopType = config.loopType || __1.LoopType.None;
    }
    join() {
        this.manager.sendPayload(this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: this.voiceChannelId,
                self_mute: false,
                self_deaf: true
            }
        });
        this.joined = true;
    }
    leave() {
        this.manager.sendPayload(this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: null,
                self_mute: false,
                self_deaf: true
            }
        });
        this.joined = false;
    }
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.joined) {
                    if (!this.queue.size())
                        return;
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        this.current = this.queue.shift();
                        const response = yield this.node.rest.update({
                            guildId: this.guildId,
                            data: {
                                track: {
                                    encoded: this.current.encoded,
                                },
                                volume: this.volume,
                            },
                        });
                        this.playing = true;
                    }), 4000);
                    resolve();
                }
                else {
                    reject("No voice channel connected");
                }
            }));
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this.node.rest.update({
                    guildId: this.guildId,
                    data: {
                        track: {
                            encoded: null,
                        }
                    }
                });
                this.queue.clear();
                this.playing = false;
                resolve();
            }));
        });
    }
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.paused)
                    return;
                yield this.node.rest.update({
                    guildId: this.guildId,
                    data: {
                        pause: true
                    }
                });
                this.paused = true;
                resolve();
            }));
        });
    }
    resume() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.paused)
                    return;
                yield this.node.rest.update({
                    guildId: this.guildId,
                    data: {
                        pause: false
                    }
                });
                this.paused = false;
                resolve();
            }));
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this.node.rest.destroy(this.guildId);
                this.connected = false;
                this.playing = false;
                resolve();
            }));
        });
    }
    setVolume(volume) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (volume < 0 || volume > 1000) {
                    reject("Volume must be greater than 0 and less than 1000");
                }
                yield this.node.rest.update({
                    guildId: this.guildId,
                    data: {
                        volume: volume,
                    }
                });
                resolve();
            }));
        });
    }
    shuffle() {
        this.queue.shuffle();
    }
    setLoopType(type) {
        if (type === __1.LoopType.None || type === __1.LoopType.Track || type === __1.LoopType.Queue) {
            this.loopType = type;
        }
        else {
            throw new Error("Invalid Loop Type received");
        }
    }
    skip() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const data = yield this.node.rest.update({
                    guildId: this.guildId,
                    data: {
                        track: {
                            encoded: null,
                        }
                    }
                });
                yield this.play();
                resolve();
            }));
        });
    }
    transferNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (node.connected) {
                    const track = this.current;
                    const lastNode = this.node;
                    this.node = node;
                    yield node.rest.update({
                        guildId: this.guildId,
                        data: {
                            track: {
                                encoded: track.encoded,
                            },
                            volume: this.volume,
                            paused: this.paused,
                            position: this.current.position,
                            voice: {
                                token: this.voiceStats.token,
                                endpoint: this.voiceStats.endpoint,
                                sessionId: this.voiceStats.sessionId,
                            }
                        },
                    });
                    yield lastNode.rest.destroy(this.guildId);
                    resolve();
                }
            }));
        });
    }
}
exports.Player = Player;
