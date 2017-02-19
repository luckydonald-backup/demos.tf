import {
	Demo, Header, Packet, Player, UserInfo,
	Match
} from 'tf2-demo/build/es6';
import {PositionCache, Point} from './PositionCache';
import {getMapBoundaries} from "../MapBoundries";
import {HealthCache} from "./HealthCache";
import {PlayerMetaCache} from "./PlayerMetaCache";

export class CachedPlayer {
	position: Point;
	user: UserInfo;
	health: number;
	teamId: number;
	classId: number;
}

export class Parser {
	demo: Demo;
	header: Header;
	positionCache: PositionCache;
	healthCache: HealthCache;
	metaCache: PlayerMetaCache;
	entityPlayerReverseMap: {[entityId: string]: number} = {};
	nextMappedPlayer = 0;
	entityPlayerMap: {[playerId: string]: Player} = {};
	ticks: number;
	match: Match;
	startTick = 0;

	constructor(demo: Demo, head: Header) {
		this.demo = demo;
		this.header = head;
		const parser = this.demo.getParser();
		this.match = parser.match;
		while (this.match.world.boundaryMin.x === 0) {
			parser.tick();
		}
		const boundaryOverWrite = getMapBoundaries(this.header.map);
		if (boundaryOverWrite) {
			this.match.world.boundaryMax.x = boundaryOverWrite.boundaryMax.x;
			this.match.world.boundaryMax.y = boundaryOverWrite.boundaryMax.y;
			this.match.world.boundaryMin.x = boundaryOverWrite.boundaryMin.x;
			this.match.world.boundaryMax.y = boundaryOverWrite.boundaryMax.y;
		}
		this.startTick = this.match.tick;
		this.ticks = Math.ceil((head.ticks) / 2); // scale down to 30fps
		this.positionCache = new PositionCache(20, this.ticks, this.match.world.boundaryMin); // 20 players "should work in most cases"
		this.healthCache = new HealthCache(20, this.ticks);
		this.metaCache = new PlayerMetaCache(20, this.ticks);
	}

	cacheData() {
		let lastTick = 0;
		const demoParser = this.demo.getParser();
		const match = demoParser.match;
		let index = 0;
		demoParser.on('packet', (packet: Packet) => {
			const tick = Math.floor((match.tick - this.startTick) / 2);
			if (tick > lastTick) {
				for (const player of match.players) {
					const playerId = this.getPlayerId(player);
					this.positionCache.setPostion(playerId, tick, player.position);
					this.healthCache.setHealth(playerId, tick, player.health);
					this.metaCache.setMeta(playerId, tick, {
						classId: player.classId,
						teamId: player.team
					});
				}
				if (tick > lastTick + 1) {
					// demo skipped ticks, copy/interpolote
					for (let i = lastTick; i < tick; i++) {
						for (const player of match.players) {
							const playerId = this.getPlayerId(player);
							this.positionCache.setPostion(playerId, i, player.position);
							this.healthCache.setHealth(playerId, i, player.health);
							this.metaCache.setMeta(playerId, i, {
								classId: player.classId,
								teamId: player.team
							});
						}
					}
				}
				lastTick = tick;
			}
		});
		demoParser.parseBody();
	}

	private getPlayerId(player: Player) {
		if (!this.entityPlayerReverseMap[player.user.entityId]) {
			this.entityPlayerMap[this.nextMappedPlayer] = player;
			this.entityPlayerReverseMap[player.user.entityId] = this.nextMappedPlayer;
			this.nextMappedPlayer++;
		}
		return this.entityPlayerReverseMap[player.user.entityId];
	}

	getPlayersAtTick(tick: number) {
		const players: CachedPlayer[] = [];
		for (let i = 0; i < this.nextMappedPlayer; i++) {
			const meta = this.metaCache.getMeta(i, tick);
			players.push({
				position: this.positionCache.getPosition(i, tick),
				user: this.entityPlayerMap[i].user,
				health: this.healthCache.getHealth(i, tick),
				teamId: meta.teamId,
				classId: meta.classId
			});
		}
		return players;
	}
}
