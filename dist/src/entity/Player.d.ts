import { Manager, PlayerConfig, VoiceStats, Node, Queue, LoopType } from "../..";
export declare class Player {
    manager: Manager;
    guildId: string;
    node: Node;
    loopType: number;
    connected: boolean;
    joined: boolean;
    playing: boolean;
    paused: boolean;
    voiceChannelId: string;
    textChannelId: string;
    volume: number;
    voiceStats: VoiceStats;
    queue: Queue;
    current: any;
    ping: number;
    constructor(manager: Manager, config: PlayerConfig, node: Node);
    join(): void;
    leave(): void;
    play(): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    delete(): Promise<void>;
    setVolume(volume: number): Promise<void>;
    shuffle(): void;
    setLoopType(type: LoopType): void;
    skip(): Promise<void>;
    transferNode(node: Node): Promise<void>;
}
//# sourceMappingURL=Player.d.ts.map