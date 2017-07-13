import { Class, Disposition, Entity, Faction } from './entity';
import { game } from './game';
import { Coord, randomFloat, randomInt, Rect, Size } from './math';
import { Glyph } from './renderer';

export interface Dungeon extends Size {
    cells: Array<Array<Cell>>;
    rooms: Array<Rect>;
    litRooms: boolean;
    entities: Array<Entity>;
    chests: Array<Chest>;
    items: Array<Item>;
}

export interface Cell {
    type: CellType;
    discovered: boolean;
}

export enum CellType {
    Empty,
    Floor,
    Grass,
    Wall,
    DoorOpen,
    DoorClosed,
    StairsUp,
    StairsDown
}

export interface Chest extends Coord, Glyph {
    loot: Item;
}

export interface Item extends Coord, Glyph {
    name: string;
    equipped: boolean;
}

export interface Corpse extends Entity, Item {
    originalChar: string;
}

export function createTown() {
    const town: Dungeon = {
        width: 25,
        height: 25,
        cells: [],
        rooms: [],
        litRooms: false,
        entities: [],
        chests: [],
        items: []
    };

    for (let x = 0; x < town.width; x++) {
        town.cells[x] = [];
        for (let y = 0; y < town.height; y++) {
            town.cells[x][y] = {
                type: CellType.Grass,
                discovered: false
            }
        }
    }

    town.rooms.push({
        x: 0,
        y: 0,
        width: town.width,
        height: town.height
    });

    const x = Math.round(town.width / 2);
    const y = Math.round(town.height / 2);
    town.cells[x][y].type = CellType.StairsDown;

    town.entities.push({
        x: x,
        y: y,
        char: '@',
        color: '#ffffff',
        alpha: 1,
        id: game.currentId++,
        name: 'player',
        level: 1,
        class: Class.Warrior,
        sight: 5,
        inventory: [],
        factions: [
            Faction.Player
        ],
        hostileFactions: [
            Faction.Monster
        ],
        hostileEntityIds: [],
        disposition: Disposition.Aggressive
    });

    return town;
}

export function createDungeon(
    width: number,
    height: number,
    roomAttempts: number,
    minRoomSize: number,
    maxRoomSize: number,
    preventOverlap: boolean,
    litRooms: boolean,
    doorChance: number,
    trapAmount: number,
    monsterAmount: number,
    chestAmount: number) {

    const dungeon: Dungeon = {
        width: width,
        height: height,
        cells: [],
        rooms: [],
        litRooms: litRooms,
        entities: [],
        chests: [],
        items: []
    };

    for (let x = 0; x < dungeon.width; x++) {
        dungeon.cells[x] = [];
        for (let y = 0; y < dungeon.height; y++) {
            dungeon.cells[x][y] = {
                type: CellType.Empty,
                discovered: false
            }
        }
    }

    for (let i = 0; i < roomAttempts || dungeon.rooms.length < 2; i++) {
        const room: Rect = {
            x: randomInt(0, dungeon.width),
            y: randomInt(0, dungeon.height),
            width: randomInt(minRoomSize, maxRoomSize),
            height: randomInt(minRoomSize, maxRoomSize)
        }

        if (room.x < 1 || room.x + room.width > dungeon.width - 1 || room.y < 1 || room.y + room.height > dungeon.height - 1) {
            continue;
        }

        if (preventOverlap && (() => {
            for (let x = room.x; x < room.x + room.width; x++) {
                for (let y = room.y; y < room.y + room.height; y++) {
                    if (dungeon.cells[x][y].type === CellType.Floor) {
                        return true;
                    }
                    if (dungeon.cells[x][y - 1].type === CellType.Floor) {
                        return true;
                    }
                    if (dungeon.cells[x + 1][y].type === CellType.Floor) {
                        return true;
                    }
                    if (dungeon.cells[x][y + 1].type === CellType.Floor) {
                        return true;
                    }
                    if (dungeon.cells[x - 1][y].type === CellType.Floor) {
                        return true;
                    }
                }
            }
        })()) {
            continue;
        }

        for (let x = room.x; x < room.x + room.width; x++) {
            for (let y = room.y; y < room.y + room.height; y++) {
                dungeon.cells[x][y].type = CellType.Floor;
            }
        }

        dungeon.rooms.push(room);
    }

    for (let i = 0; i < dungeon.rooms.length - 1; i++) {
        let x1 = randomInt(dungeon.rooms[i].x, dungeon.rooms[i].x + dungeon.rooms[i].width);
        let y1 = randomInt(dungeon.rooms[i].y, dungeon.rooms[i].y + dungeon.rooms[i].height);
        let x2 = randomInt(dungeon.rooms[i + 1].x, dungeon.rooms[i + 1].x + dungeon.rooms[i + 1].width);
        let y2 = randomInt(dungeon.rooms[i + 1].y, dungeon.rooms[i + 1].y + dungeon.rooms[i + 1].height);

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
                    dungeon.cells[x][y].type = CellType.Floor;
                }
            }
        }
    }

    for (let x = 0; x < dungeon.width; x++) {
        for (let y = 0; y < dungeon.height; y++) {
            if (dungeon.cells[x][y].type === CellType.Floor) {
                if (dungeon.cells[x][y - 1].type === CellType.Empty) {
                    dungeon.cells[x][y - 1].type = CellType.Wall;
                }
                if (dungeon.cells[x + 1][y - 1].type === CellType.Empty) {
                    dungeon.cells[x + 1][y - 1].type = CellType.Wall;
                }
                if (dungeon.cells[x + 1][y].type === CellType.Empty) {
                    dungeon.cells[x + 1][y].type = CellType.Wall;
                }
                if (dungeon.cells[x + 1][y + 1].type === CellType.Empty) {
                    dungeon.cells[x + 1][y + 1].type = CellType.Wall;
                }
                if (dungeon.cells[x][y + 1].type === CellType.Empty) {
                    dungeon.cells[x][y + 1].type = CellType.Wall;
                }
                if (dungeon.cells[x - 1][y - 1].type === CellType.Empty) {
                    dungeon.cells[x - 1][y - 1].type = CellType.Wall;
                }
                if (dungeon.cells[x - 1][y].type === CellType.Empty) {
                    dungeon.cells[x - 1][y].type = CellType.Wall;
                }
                if (dungeon.cells[x - 1][y + 1].type === CellType.Empty) {
                    dungeon.cells[x - 1][y + 1].type = CellType.Wall;
                }
            }
        }
    }

    for (let x = 0; x < dungeon.width; x++) {
        for (let y = 0; y < dungeon.height; y++) {
            if (randomFloat(0, 1) < doorChance &&
                dungeon.cells[x][y].type === CellType.Floor) {

                if (dungeon.cells[x][y - 1].type === CellType.Floor && dungeon.cells[x + 1][y - 1].type === CellType.Floor && dungeon.cells[x - 1][y - 1].type === CellType.Floor) {
                    if (dungeon.cells[x - 1][y].type === CellType.Wall && dungeon.cells[x + 1][y].type === CellType.Wall) {
                        dungeon.cells[x][y].type = CellType.DoorClosed;
                    }
                }
                if (dungeon.cells[x + 1][y].type === CellType.Floor && dungeon.cells[x + 1][y - 1].type === CellType.Floor && dungeon.cells[x + 1][y + 1].type === CellType.Floor) {
                    if (dungeon.cells[x][y + 1].type === CellType.Wall && dungeon.cells[x][y - 1].type === CellType.Wall) {
                        dungeon.cells[x][y].type = CellType.DoorClosed;
                    }
                }
                if (dungeon.cells[x][y + 1].type === CellType.Floor && dungeon.cells[x + 1][y + 1].type === CellType.Floor && dungeon.cells[x - 1][y + 1].type === CellType.Floor) {
                    if (dungeon.cells[x - 1][y].type === CellType.Wall && dungeon.cells[x + 1][y].type === CellType.Wall) {
                        dungeon.cells[x][y].type = CellType.DoorClosed;
                    }
                }
                if (dungeon.cells[x - 1][y].type === CellType.Floor && dungeon.cells[x - 1][y - 1].type === CellType.Floor && dungeon.cells[x - 1][y + 1].type === CellType.Floor) {
                    if (dungeon.cells[x][y + 1].type === CellType.Wall && dungeon.cells[x][y - 1].type === CellType.Wall) {
                        dungeon.cells[x][y].type = CellType.DoorClosed;
                    }
                }
            }
        }
    }

    {
        const x = randomInt(dungeon.rooms[0].x, dungeon.rooms[0].x + dungeon.rooms[0].width);
        const y = randomInt(dungeon.rooms[0].y, dungeon.rooms[0].y + dungeon.rooms[0].height);
        dungeon.cells[x][y].type = CellType.StairsUp;
    }

    {
        const x = randomInt(dungeon.rooms[dungeon.rooms.length - 1].x, dungeon.rooms[dungeon.rooms.length - 1].x + dungeon.rooms[dungeon.rooms.length - 1].width);
        const y = randomInt(dungeon.rooms[dungeon.rooms.length - 1].y, dungeon.rooms[dungeon.rooms.length - 1].y + dungeon.rooms[dungeon.rooms.length - 1].height);
        dungeon.cells[x][y].type = CellType.StairsDown;
    }

    for (let i = 0; i < monsterAmount; i++) {
        const roomIndex = randomInt(1, dungeon.rooms.length);

        const x = randomInt(dungeon.rooms[roomIndex].x, dungeon.rooms[roomIndex].x + dungeon.rooms[roomIndex].width);
        const y = randomInt(dungeon.rooms[roomIndex].y, dungeon.rooms[roomIndex].y + dungeon.rooms[roomIndex].height);

        const monster: Entity = {
            x: x,
            y: y,
            char: '',
            color: '#ffffff',
            alpha: 1,
            id: game.currentId++,
            name: '',
            level: 1,
            class: Class.Warrior,
            sight: 10,
            inventory: [],
            factions: [],
            hostileFactions: [],
            hostileEntityIds: [],
            disposition: Disposition.Aggressive
        };

        const roll = randomFloat(0, 1);
        if (roll < 0.25) {
            monster.name = 'rat';
            monster.char = 'r';
            monster.factions = [
                Faction.Monster
            ];
            monster.hostileFactions = [];
            monster.disposition = Disposition.Cowardly;
        } else if (roll < 0.50) {
            monster.name = 'slime';
            monster.char = 's';
            monster.factions = [
                Faction.Monster
            ];
            monster.disposition = Disposition.Passive;
        } else if (roll < 0.75) {
            monster.name = 'orc';
            monster.char = 'o';
            monster.factions = [
                Faction.Monster,
                Faction.Orc
            ];
            monster.hostileFactions = [
                Faction.Player,
                Faction.Bugbear
            ];
            if (randomFloat(0, 1) < 0.5) {
                monster.color = '#ffff00';
                monster.name += ' shaman';
                monster.class = Class.Shaman;
            }
        } else {
            monster.name = 'bugbear';
            monster.char = 'b';
            monster.factions = [
                Faction.Monster,
                Faction.Bugbear
            ];
            monster.hostileFactions = [
                Faction.Player,
                Faction.Orc
            ];
            if (randomFloat(0, 1) < 0.5) {
                monster.color = '#ffff00';
                monster.name += ' shaman';
                monster.class = Class.Shaman;
            }
        }

        dungeon.entities.push(monster);
    }

    for (let i = 0; i < chestAmount; i++) {
        const roomIndex = randomInt(0, dungeon.rooms.length);

        const x = randomInt(dungeon.rooms[roomIndex].x, dungeon.rooms[roomIndex].x + dungeon.rooms[roomIndex].width);
        const y = randomInt(dungeon.rooms[roomIndex].y, dungeon.rooms[roomIndex].y + dungeon.rooms[roomIndex].height);

        dungeon.chests.push({
            x: x,
            y: y,
            char: '~',
            color: '#ffffff',
            alpha: 1,
            loot: (() => {
                if (randomFloat(0, 1) < 0.5) {
                    const item: Item = {
                        x: -1,
                        y: -1,
                        char: '',
                        color: '#ffffff',
                        alpha: 1,
                        name: '',
                        equipped: false
                    }
                    const roll = randomFloat(0, 1);
                    if (roll < 0.25) {
                        item.name = 'sword';
                        item.char = '|';
                    } else if (roll < 0.50) {
                        item.name = 'spear';
                        item.char = '/';
                    } else if (roll < 0.75) {
                        item.name = 'shield';
                        item.char = ')';
                    } else {
                        item.name = 'bow';
                        item.char = '}';
                    }

                    return item;
                }
            })()
        });
    }

    return dungeon;
}
