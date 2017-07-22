import { lineOfSight } from "./algorithms";
import { radiansBetween } from "./math";
import { Area, Config, Coord, Disposition, Faction, Game, UI, UIMode } from "./types";
import { findActor } from "./world";

export const config: Config = {
    actorInfo: [
        {
            char: "@",
            disposition: Disposition.Aggressive,
            factions: [
                Faction.Player,
            ],
            hostileFactions: [
                Faction.Monster,
            ],
            sight: 5,
        },
        {
            char: "s",
            disposition: Disposition.Aggressive,
            factions: [
                Faction.Monster,
            ],
            hostileFactions: [],
            sight: 10,
        },
        {
            char: "r",
            disposition: Disposition.Aggressive,
            factions: [
                Faction.Monster,
            ],
            hostileFactions: [],
            sight: 10,
        },
        {
            char: "o",
            disposition: Disposition.Aggressive,
            factions: [
                Faction.Monster,
                Faction.Orc,
            ],
            hostileFactions: [
                Faction.Player,
                Faction.Bugbear,
            ],
            sight: 10,
        },
        {
            char: "b",
            disposition: Disposition.Aggressive,
            factions: [
                Faction.Monster,
                Faction.Bugbear,
            ],
            hostileFactions: [
                Faction.Player,
                Faction.Orc,
            ],
            sight: 10,
        },
    ],
    cellInfo: [
        {
            char: " ",
            color: "#ffffff",
            solid: false,
        },
        {
            char: ".",
            color: "#ffffff",
            solid: false,
        },
        {
            char: "^",
            color: "#50ff50",
            solid: false,
        },
        {
            char: "#",
            color: "#ffffff",
            solid: true,
        },
        {
            char: "-",
            color: "#ffffff",
            solid: false,
        },
        {
            char: "+",
            color: "#ffffff",
            solid: true,
        },
    ],
    classInfo: [
        {
            color: "#ffffff",
        },
        {
            color: "#ffffff",
        },
        {
            color: "#ffff00",
        },
    ],
    itemInfo: [
        {
            char: "%",
        },
        {
            char: "|",
        },
        {
            char: "/",
        },
        {
            char: ")",
        },
        {
            char: "}",
        },
    ],
    stairInfo: [
        {
            char: ">",
            color: "#ffffff",
        },
        {
            char: "<",
            color: "#ffffff",
        },
    ],
};

export let game: Game = {
    currentActorId: 1,
    currentStairId: 0,
    fontSize: 24,
    godMode: true,
    ignoreFov: false,
    messages: [],
    stopTime: false,
    turn: 0,
    world: undefined,
};

export function load() {
    game = JSON.parse(localStorage.getItem("game"));
    console.log(game);
}

export function log(area: Area, location: Coord, message: string) {
    const playerContext = findActor(0);
    const player = playerContext.actor;
    const playerInfo = config.actorInfo[player.actorType];

    if ((area === playerContext.level || area === playerContext.chunk)
        && lineOfSight(area, player, radiansBetween(player, location), playerInfo.sight)
            .find((coord) => coord.x === location.x && coord.y === location.y)) {
        game.messages.push(message);

        if (game.messages.length > ui.maxMessages) {
            game.messages.shift();
        }
    }
}

export function save() {
    localStorage.setItem("game", JSON.stringify(game));
    console.log(JSON.stringify(game));
}

export const ui: UI = {
    inventorySwapFirst: -1,
    inventorySwapSecond: -1,
    maxMessages: 10,
    mode: UIMode.Default,
    target: { x: 0, y: 0 },
};
