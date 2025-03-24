"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue {
    constructor() {
        this.queue = [];
    }
    add(track) {
        this.queue.push(track);
    }
    clear() {
        this.queue = [];
    }
    size() {
        return this.queue.length;
    }
    shift() {
        return this.queue.shift();
    }
    shuffle() {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
    }
}
exports.Queue = Queue;
