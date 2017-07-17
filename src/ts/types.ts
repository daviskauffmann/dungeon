export interface Actor extends Entity {
    level: number;
    class: Class;
    sight: number;
    inventory: Item[];
    factions: Faction[];
    hostileFactions: Faction[];
    hostileActorIds: number[];
    disposition: Disposition;
}

export interface ActorContext extends Context {
    actor: Actor;
}

export interface Area {
    width: number;
    height: number;
    cells: Cell[][];
    actors: Actor[];
    chests: Chest[];
    items: Item[];
}

export interface Cell {
    type: CellType;
    discovered: boolean;
}

export interface CellInfo {
    char: string;
    color: string;
    solid: boolean;
}

export enum CellType {
    Empty,
    Floor,
    Grass,
    Wall,
    DoorOpen,
    DoorClosed,
}

export interface Chest extends Entity {
    loot: Item;
}

export interface Chunk extends Area {
    dungeons: Dungeon[];
    stairsDown: Stair[];
}

export interface ChunkOptions {
    width?: number;
    height?: number;
    dungeonAmount?: number;
}

export enum Class {
    Warrior,
    Shaman,
}

export interface Config {
    cellInfo: CellInfo[];
    stairInfo: StairInfo[];
}

export interface Context {
    chunk: Chunk;
    dungeon?: Dungeon;
    level?: Level;
}

export interface Coord {
    x: number;
    y: number;
}

export interface Corpse extends Actor, Item {
    originalChar: string;
}

export enum Disposition {
    Passive,
    Aggressive,
    Cowardly,
}

export interface Dungeon {
    name: string;
    levels: Level[];
    maxLevels: number;
}

export interface DungeonOptions {
    name?: string;
    maxLevels?: number;
}

export interface Entity extends Coord, Glyph {
    id: number;
    name: string;
}

export interface Level extends Area {
    rooms: Rect[];
    litRooms: boolean;
    stairDown: Stair;
    stairUp: Stair;
}

export interface LevelOptions {
    width?: number;
    height?: number;
    roomAttempts?: number;
    minRoomSize?: number;
    maxRoomSize?: number;
    preventOverlap?: boolean;
    litRooms?: boolean;
    doorChance?: number;
    monsterAmount?: number;
    chestAmount?: number;
}

export enum Faction {
    Player,
    Monster,
    Bugbear,
    Orc,
}

export interface Game {
    world: World;
    currentEntityId: number;
    turn: number;
    fontSize: number;
    messages: string[];
    godMode: boolean;
    stopTime: boolean;
    ignoreFov: boolean;
}

export interface Glyph {
    char: string;
    color: string;
    alpha: number;
}

export interface Item extends Entity {
    equipped: boolean;
}

export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface Stair extends Coord {
    id: number;
    direction: StairDirection;
}

export interface StairContext extends Context {
    stair: Stair;
}

export enum StairDirection {
    Down,
    Up,
}

export interface StairInfo {
    char: string;
    color: string;
}

export interface Stats {
    health: number;
    energy: number;
    mana: number;

    stamina: number;
    endurance: number;
    attunement: number;
    resistance: number;
    strength: number;
    intellect: number;
    avoidance: number;
    precision: number;
    charisma: number;
    luck: number;
}

export interface UI {
    mode: UIMode;
    maxMessages: number;
    inventorySwapFirst: number;
    inventorySwapSecond: number;
    target: Coord;
}

export enum UIMode {
    Default,
    Target,
    Inventory,
    InventoryDrop,
    InventoryEquip,
    InventoryUnequip,
    InventorySwapFirst,
    InventorySwapSecond,
    Character,
}

export interface World {
    width: number;
    height: number;
    chunks: Chunk[][];
}

export interface WorldOptions {
    width?: number;
    height?: number;
}
