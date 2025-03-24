import { Player, Track } from "../..";

export class Queue {
    public queue: Track[] = [];

    public add(track: Track): void {
       this.queue.push(track)
    }
    public clear(): void {
        this.queue = []
    }
    public size(): number {
        return this.queue.length
    }
    public shift(): any {
        return this.queue.shift()
    }
    public shuffle(): void {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
          }
    }
}