import { LavalinkNode, LoopType, Manager, Rest, version, name } from "../..";
import { WebSocket } from "ws";


export class Node {
    public manager: Manager;
    public host: string;
    public port: number;
    public password: string;
    public secure: boolean;
    public identifier: string;
    public players: number = 0
    public rest: Rest;
    public connected: boolean = false;
    public sessionId: string;
    public retryAmount: number;
    public retryDelay: number;
    public reconnectTimeout?: NodeJS.Timeout | null;
    public ws!: WebSocket | null;
    public clientId!: string;
    public reconnectAttempts: number = 0;
    public resumed: boolean = false;
    constructor (manager: Manager, node: LavalinkNode) {
     this.manager = manager
     this.host = node.host
     this.port = node.port
     this.password = node.password
     this.secure = node.secure
     this.identifier = node.identifier
     this.sessionId = node.sessionId ? node.sessionId : "";
     this.rest = new Rest(this.manager, this)
     this.retryAmount = node.retryAmount || 0
     this.retryDelay = node.retryDuration || 3000;
      }
    public connect(clientId: string): void {
            this.clientId = clientId
            this.ws = new WebSocket(`ws${this.secure ? "s" : ""}://${this.host}:${this.port}/v4/websocket`, {
              headers: {
                "Authorization": this.password,
                "User-Id": clientId,
                "Client-Name": `${name}/${version}`,
                ...(this.sessionId && {"Session-Id": this.sessionId }),
              }
            })
            this.ws.on("open", () => {
            this.manager.emit("debug", `Node ${this.identifier} has been connected`)
            this.manager.emit("nodeConnect", this)
            })
            this.ws.on("error", (error: any) => {
                if(error.code === "ECONNREFUSED"){
                  throw new Error(`Lavalink server connection failed: Ensure the server is running, check the IP/port, verify network/firewall settings, and confirm server configuration.`)
                }
            })
            this.ws.on("close", (code, reason) => {
              this.connected = false
              this.manager.emit("nodeDisconnect", this, code, reason.toString())
              this.reconnectTimeout = setTimeout(() => {
                if(this.retryAmount > this.reconnectAttempts){
                  this.connect(this.clientId);
                } else {
                  this.ws = null
                  this.reconnectTimeout = null;
                }
              }, this.retryDelay)
            })
            this.ws.on("message", this.message.bind(this))
      }
      protected async message(data: Buffer): Promise<void> {
        if (Array.isArray(data)) data = Buffer.concat(data);
        else if (data instanceof ArrayBuffer) data = Buffer.from(data);
    
        const payload = JSON.parse(data.toString("utf-8"));
        if(payload.op === "stats"){
            delete payload.op
            this.players = payload.players
        } else if(payload.op === "ready"){
          this.connected = true
          this.sessionId = payload.sessionId
          this.resumed = payload.resumed
        } else if(payload.op === "playerUpdate"){
           const player = this.manager.getPlayer(payload.guildID)
           if(!player || !player.current) return
           player.connected = payload.state.connected
           player.current.position = payload.state.position
           player.current.time = payload.state.time
           player.ping = payload.state.ping
           this.manager.emit("playerUpdate", player, player.current)
           this.manager.emit("debug", `The Player for guild ${player.guildId} has been updated`)
        } else if(payload.op === "event"){
          let player = this.manager.getPlayer(payload.guildId)
          if(payload.type === "TrackStartEvent"){
            player.playing = true
            player.paused = false
            this.manager.emit("trackStart", player, player.current)
            this.manager.emit("debug", `Player for guild ${player.guildId} has start playing`)
          } else if(payload.type === "TrackEndEvent"){
            player.playing = false
            player.paused = false
            if(payload.reason === "finished"){
              this.manager.emit("trackFinish", player, player.current)
              this.manager.emit("debug", `Track for guild ${player.guildId} has ended`)
              if(player.loopType === LoopType.Track){
                await this.rest.update({
                  guildId: player.guildId,
                  data: {
                    track: {
                      encoded: player.current.encoded,
                    },
                    volume: player.volume,
                  },
              })
              } else if(player.loopType === LoopType.Queue){
                 player.current.position = 0
                 player.queue.add(player.current)
                 this.manager.emit("debug", `The Player for guild ${player.guildId} is looping track`)
              } else {
                if(player.queue.size() > 0) {
                  await player.play();
                } else {
                    this.manager.emit("queueEnd", player)
                    this.manager.emit("debug", `The queue for the player ${player.guildId} has been ended`)
                    player.queue.clear();
                }
              }
    
            }
            if (["loadFailed", "cleanup"].includes(payload.reason)) {
              if (player.queue.size() > 0) {
                player.play();
              } else {
                this.manager.emit("queueEnd", player)
                  this.manager.emit("debug", `The queue for the player ${player.guildId} has been ended`)
                player.queue.clear();
              }
            }
          }
        }
    }
}
