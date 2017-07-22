import { game } from "./game";
import { randomFloat, randomInt } from "./math";
import { Actor, ActorType, CellType, Chunk, ChunkOptions, Class, Coord, Disposition, Dungeon, DungeonOptions, Faction, Item, ItemType, Level, LevelOptions, Rect, Stair, StairContext, StairDirection, World, WorldOptions } from "./types";

export function createChunk(opts?: ChunkOptions) {
    const width = opts && opts.width || 100;
    const height = opts && opts.height || 100;
    const dungeonAmount = opts && opts.dungeonAmount || 100;

    const chunk: Chunk = {
        actors: [],
        cells: [[]],
        chests: [],
        dungeons: [],
        height,
        items: [],
        stairsDown: [],
        width,
    };

    for (let x = 0; x < chunk.width; x++) {
        chunk.cells[x] = [];
        for (let y = 0; y < chunk.height; y++) {
            chunk.cells[x][y] = {
                discovered: false,
                type: CellType.Grass,
            };
        }
    }

    for (let i = 0; i < dungeonAmount; i++) {
        chunk.stairsDown.push({
            direction: StairDirection.Down,
            id: game.currentStairId++,
            x: randomInt(0, chunk.width),
            y: randomInt(0, chunk.height),
        });
    }

    return chunk;
}

export function createDungeon(opts?: DungeonOptions) {
    const name = opts && opts.name;
    const maxLevels = opts && opts.maxLevels || 1;

    const dungeon: Dungeon = {
        levels: [],
        maxLevels,
        name,
    };

    if (!dungeon.name) {
        const roll = randomFloat(0, 1);
        if (roll < 0.25) {
            dungeon.name = "cool dungeon";
        } else if (roll < 0.5) {
            dungeon.name = "awesome dungeon";
        } else if (roll < 0.75) {
            dungeon.name = "terrible dungeon";
        } else {
            dungeon.name = "low effort dungeon";
        }
    }

    return dungeon;
}

export function createLevel(stairDownId: number, opts?: LevelOptions) {
    const width = opts && opts.width || 50;
    const height = opts && opts.height || 50;
    const roomAttempts = opts && opts.roomAttempts || 20;
    const minRoomSize = opts && opts.minRoomSize || 5;
    const maxRoomSize = opts && opts.maxRoomSize || 15;
    const preventOverlap = opts && opts.preventOverlap || true;
    const litRooms = opts && opts.litRooms || false;
    const doorChance = opts && opts.doorChance || 0.5;
    const monsterAmount = opts && opts.monsterAmount || 5;
    const chestAmount = opts && opts.chestAmount || 5;

    const level: Level = {
        actors: [],
        cells: [[]],
        chests: [],
        height,
        items: [],
        litRooms,
        rooms: [],
        stairDown: undefined,
        stairUp: undefined,
        width,
    };

    for (let x = 0; x < level.width; x++) {
        level.cells[x] = [];
        for (let y = 0; y < level.height; y++) {
            level.cells[x][y] = {
                discovered: false,
                type: CellType.Empty,
            };
        }
    }

    for (let i = 0; i < roomAttempts || level.rooms.length < 2; i++) {
        const room: Rect = {
            height: randomInt(minRoomSize, maxRoomSize),
            left: randomInt(0, level.width),
            top: randomInt(0, level.height),
            width: randomInt(minRoomSize, maxRoomSize),
        };

        if (room.left < 1 || room.left + room.width > level.width - 1 || room.top < 1
            || room.top + room.height > level.height - 1) {
            continue;
        }

        if (preventOverlap && (() => {
            for (let x = room.left; x < room.left + room.width; x++) {
                for (let y = room.top; y < room.top + room.height; y++) {
                    if (level.cells[x][y].type === CellType.Floor) {
                        return true;
                    }
                    if (level.cells[x][y - 1].type === CellType.Floor) {
                        return true;
                    }
                    if (level.cells[x + 1][y].type === CellType.Floor) {
                        return true;
                    }
                    if (level.cells[x][y + 1].type === CellType.Floor) {
                        return true;
                    }
                    if (level.cells[x - 1][y].type === CellType.Floor) {
                        return true;
                    }
                }
            }
        })()) {
            continue;
        }

        for (let x = room.left; x < room.left + room.width; x++) {
            for (let y = room.top; y < room.top + room.height; y++) {
                level.cells[x][y].type = CellType.Floor;
            }
        }

        level.rooms.push(room);
    }

    for (let i = 0; i < level.rooms.length - 1; i++) {
        let x1 = randomInt(level.rooms[i].left, level.rooms[i].left + level.rooms[i].width);
        let y1 = randomInt(level.rooms[i].top, level.rooms[i].top + level.rooms[i].height);
        let x2 = randomInt(level.rooms[i + 1].left, level.rooms[i + 1].left + level.rooms[i + 1].width);
        let y2 = randomInt(level.rooms[i + 1].top, level.rooms[i + 1].top + level.rooms[i + 1].height);

        if (x1 > x2) {
            const t = x1;
            x1 = x2;
            x2 = t;
        }
        if (y1 > y2) {
            const t = y1;
            y1 = y2;
            y2 = t;
        }

        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                if (x === x1 || x === x2 || y === y1 || y === y2) {
                    level.cells[x][y].type = CellType.Floor;
                }
            }
        }
    }

    for (let x = 0; x < level.width; x++) {
        for (let y = 0; y < level.height; y++) {
            if (level.cells[x][y].type === CellType.Floor) {
                if (level.cells[x][y - 1].type === CellType.Empty) {
                    level.cells[x][y - 1].type = CellType.Wall;
                }
                if (level.cells[x + 1][y - 1].type === CellType.Empty) {
                    level.cells[x + 1][y - 1].type = CellType.Wall;
                }
                if (level.cells[x + 1][y].type === CellType.Empty) {
                    level.cells[x + 1][y].type = CellType.Wall;
                }
                if (level.cells[x + 1][y + 1].type === CellType.Empty) {
                    level.cells[x + 1][y + 1].type = CellType.Wall;
                }
                if (level.cells[x][y + 1].type === CellType.Empty) {
                    level.cells[x][y + 1].type = CellType.Wall;
                }
                if (level.cells[x - 1][y - 1].type === CellType.Empty) {
                    level.cells[x - 1][y - 1].type = CellType.Wall;
                }
                if (level.cells[x - 1][y].type === CellType.Empty) {
                    level.cells[x - 1][y].type = CellType.Wall;
                }
                if (level.cells[x - 1][y + 1].type === CellType.Empty) {
                    level.cells[x - 1][y + 1].type = CellType.Wall;
                }
            }
        }
    }

    for (let x = 0; x < level.width; x++) {
        for (let y = 0; y < level.height; y++) {
            if (level.cells[x][y].type === CellType.Floor
                && randomFloat(0, 1) < doorChance) {

                if (level.cells[x][y - 1].type === CellType.Floor
                    && level.cells[x + 1][y - 1].type === CellType.Floor
                    && level.cells[x - 1][y - 1].type === CellType.Floor) {
                    if (level.cells[x - 1][y].type === CellType.Wall
                        && level.cells[x + 1][y].type === CellType.Wall) {
                        level.cells[x][y].type = CellType.DoorClosed;
                    }
                }
                if (level.cells[x + 1][y].type === CellType.Floor
                    && level.cells[x + 1][y - 1].type === CellType.Floor
                    && level.cells[x + 1][y + 1].type === CellType.Floor) {
                    if (level.cells[x][y + 1].type === CellType.Wall
                        && level.cells[x][y - 1].type === CellType.Wall) {
                        level.cells[x][y].type = CellType.DoorClosed;
                    }
                }
                if (level.cells[x][y + 1].type === CellType.Floor
                    && level.cells[x + 1][y + 1].type === CellType.Floor
                    && level.cells[x - 1][y + 1].type === CellType.Floor) {
                    if (level.cells[x - 1][y].type === CellType.Wall
                        && level.cells[x + 1][y].type === CellType.Wall) {
                        level.cells[x][y].type = CellType.DoorClosed;
                    }
                }
                if (level.cells[x - 1][y].type === CellType.Floor
                    && level.cells[x - 1][y - 1].type === CellType.Floor
                    && level.cells[x - 1][y + 1].type === CellType.Floor) {
                    if (level.cells[x][y + 1].type === CellType.Wall
                        && level.cells[x][y - 1].type === CellType.Wall) {
                        level.cells[x][y].type = CellType.DoorClosed;
                    }
                }
            }
        }
    }

    level.stairDown = {
        direction: StairDirection.Down,
        id: game.currentStairId++,
        x: randomInt(level.rooms[0].left, level.rooms[0].left + level.rooms[0].width),
        y: randomInt(level.rooms[0].top, level.rooms[0].top + level.rooms[0].height),
    };

    level.stairUp = {
        direction: StairDirection.Up,
        id: stairDownId,
        x: randomInt(level.rooms[level.rooms.length - 1].left, level.rooms[level.rooms.length - 1].left + level.rooms[level.rooms.length - 1].width),
        y: randomInt(level.rooms[level.rooms.length - 1].top, level.rooms[level.rooms.length - 1].top + level.rooms[level.rooms.length - 1].height),
    };

    for (let i = 0; i < monsterAmount; i++) {
        const roomIndex = randomInt(1, level.rooms.length);

        const monster: Actor = {
            actorType: undefined,
            class: Class.None,
            energy: 100,
            experience: 0,
            health: 100,
            hostileActorIds: [],
            id: game.currentActorId++,
            inventory: [],
            level: 1,
            mana: 100,
            name: undefined,
            x: randomInt(level.rooms[roomIndex].left, level.rooms[roomIndex].left + level.rooms[roomIndex].width),
            y: randomInt(level.rooms[roomIndex].top, level.rooms[roomIndex].top + level.rooms[roomIndex].height),
        };

        const roll = randomFloat(0, 1);
        if (roll < 0.25) {
            monster.name = "rat";
            monster.actorType = ActorType.Rat;
        } else if (roll < 0.50) {
            monster.name = "slime";
            monster.actorType = ActorType.Slime;
        } else if (roll < 0.75) {
            monster.name = "orc";
            monster.actorType = ActorType.Orc;
            if (randomFloat(0, 1) < 0.5) {
                monster.name += " shaman";
                monster.class = Class.Shaman;
            }
        } else {
            monster.name = "bugbear";
            monster.actorType = ActorType.Bugbear;
            if (randomFloat(0, 1) < 0.5) {
                monster.name += " shaman";
                monster.class = Class.Shaman;
            }
        }

        level.actors.push(monster);
    }

    for (let i = 0; i < chestAmount; i++) {
        const roomIndex = randomInt(0, level.rooms.length);

        level.chests.push({
            loot: (() => {
                if (randomFloat(0, 1) < 0.5) {
                    const item: Item = {
                        equipped: false,
                        itemType: undefined,
                        name: undefined,
                        x: undefined,
                        y: undefined,
                    };

                    const roll = randomFloat(0, 1);
                    if (roll < 0.25) {
                        item.name = "sword";
                        item.itemType = ItemType.Sword;
                    } else if (roll < 0.50) {
                        item.name = "spear";
                        item.itemType = ItemType.Spear;
                    } else if (roll < 0.75) {
                        item.name = "shield";
                        item.itemType = ItemType.Shield;
                    } else {
                        item.name = "bow";
                        item.itemType = ItemType.Bow;
                    }

                    return item;
                }
            })(),
            x: randomInt(level.rooms[roomIndex].left, level.rooms[roomIndex].left + level.rooms[roomIndex].width),
            y: randomInt(level.rooms[roomIndex].top, level.rooms[roomIndex].top + level.rooms[roomIndex].height),
        });
    }

    return level;
}

export function createWorld(opts?: WorldOptions) {
    const width = opts && opts.width || 0;
    const height = opts && opts.height || 0;

    const world: World = {
        chunks: [[]],
        height,
        width,
    };

    for (let x = 0; x < world.width; x++) {
        // world.chunks[x] = [];
        for (let y = 0; y < world.height; y++) {
            // world.chunks[x][y] = createChunk();
        }
    }

    {
        const playerChunk = world.chunks[0][0] = createChunk();

        const player: Actor = {
            actorType: ActorType.Player,
            class: Class.Warrior,
            energy: 100,
            experience: 0,
            health: 100,
            hostileActorIds: [],
            id: 0,
            inventory: [],
            level: 1,
            mana: 100,
            name: "player",
            x: Math.round(playerChunk.width / 2),
            y: Math.round(playerChunk.height / 2),
        };

        playerChunk.actors.push(player);
    }

    return world;
}
