import { RestRequest, SearchResult, version } from "../..";
import { Manager, Player, Node, request, sources } from "../..";
import { WebSocket } from "ws";


export class Rest {
    public manager: Manager;
    public node: Node;
    public ws: WebSocket | undefined;
    public url: string;
    constructor (manager: Manager, node: Node){
      this.manager = manager
      this.node = node
      this.url = `http${this.node.secure ? "s" : ""}://${node.host}:${node.port}/v4`
    }
  public async update(data: RestRequest): Promise<any> {
    const response = await request(
      `${this.url}/sessions/${this.node.sessionId}/players/${data.guildId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data.data) as any,
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.node.password
        }
      }
    )
    return response
  }
  public async loadTracks(query: string, source: string): Promise<SearchResult> {
    return new Promise(async (resolve, reject) => {
      let identifier;
      if(query.startsWith("http://") || query.startsWith("https://")){
        identifier = query
      } else {
        identifier = `${sources[source as keyof typeof sources] ?? source}:${query}`
      }
      const response = await request(`${this.url}/loadtracks?identifier=${encodeURIComponent(identifier)}`, { headers: {
        "Authorization": this.node.password,
        "Content-Type": "application/json",
        "User-Agent": `Lavalink-Node/${this.node.manager.version}`,
        "Accept": "application/json",
      } })
      const data = new SearchResult(response)
      resolve(data)
    })
  }
  public async destroy(guildId: string): Promise<void> {
    await request(`${this.url}/sessions/${this.node.sessionId}/players/${guildId}`, {
      method: "DELETE",
      headers: {
        "Authorization": this.node.password
      }
    })
  }
}