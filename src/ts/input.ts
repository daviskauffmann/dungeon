import { dropItem, getInventoryChar, moveToCell, pickUpItem, resurrect } from "./actors";
import { lineOfSight } from "./algorithms";
import { config, game, load, log, save, ui } from "./game";
import { radiansBetween } from "./math";
import { draw } from "./renderer";
import { CellType, Corpse, UIMode } from "./types";
import { findActor, tick } from "./world";

export function input(ev: KeyboardEvent) {
    const playerContext = findActor(0);
    const player = playerContext.actor;
    const playerInfo = config.actorInfo[player.actorType];
    const chunk = playerContext.chunk;
    const dungeon = playerContext.dungeon;
    const level = playerContext.level;
    const area = level || chunk;

    switch (ui.mode) {
        case UIMode.Default: {
            switch (ev.key) {
                case "ArrowUp": {
                    moveToCell(player, { x: player.x, y: player.y - 1 }, chunk, dungeon, level);

                    tick();

                    break;
                }
                case "ArrowRight": {
                    moveToCell(player, { x: player.x + 1, y: player.y }, chunk, dungeon, level);

                    tick();

                    break;
                }
                case "ArrowDown": {
                    moveToCell(player, { x: player.x, y: player.y + 1 }, chunk, dungeon, level);

                    tick();

                    break;
                }
                case "ArrowLeft": {
                    moveToCell(player, { x: player.x - 1, y: player.y }, chunk, dungeon, level);

                    tick();

                    break;
                }
                case ".": {
                    tick();

                    break;
                }
                case "g": {
                    const items = area.items.filter((item) => item.x === player.x && item.y === player.y);

                    if (items.length) {
                        const item = items[0]; // pick an item

                        pickUpItem(player, item, area);

                        tick();
                    }

                    break;
                }
                case "s": {
                    const targets = area.actors.filter((target) => target !== player
                        && lineOfSight(area, player, radiansBetween(player, target), playerInfo.sight)
                            .some((coord) => coord.x === target.x && coord.y === target.y));

                    if (targets.length) {
                        log(area, player,
                            `${player.name} spots ${targets.map((target) => target.name).join(", ")}`);
                    } else {
                        log(area, player, `${player.name} doesn't see anything`);
                    }

                    break;
                }
                case "r": {
                    area.items.filter((item) => "actorType" in item
                        && lineOfSight(area, player, radiansBetween(player, item), playerInfo.sight)
                            .some((coord) => coord.x === item.x && coord.y === item.y))
                        .map((item) => (item as Corpse))
                        .forEach((corpse) => resurrect(player, corpse, area));

                    tick();

                    break;
                }
                case "c": {
                    if (area.cells[player.x][player.y].type === CellType.DoorOpen) {
                        log(area, player, `${player.name} closes the door`);

                        area.cells[player.x][player.y].type = CellType.DoorClosed;
                    }

                    tick();

                    break;
                }
                case "t": {
                    ui.mode = UIMode.Target;
                    ui.target.x = player.x;
                    ui.target.y = player.y;

                    break;
                }
                case "i": {
                    if (player.inventory.length > 0) {
                        ui.mode = UIMode.Inventory;
                    }

                    break;
                }
                case "o": {
                    ui.mode = UIMode.Character;

                    break;
                }
            }

            break;
        }
        case UIMode.Target: {
            switch (ev.key) {
                case "ArrowUp": {
                    ui.target.y--;

                    break;
                }
                case "ArrowRight": {
                    ui.target.x++;

                    break;
                }
                case "ArrowDown": {
                    ui.target.y++;

                    break;
                }
                case "ArrowLeft": {
                    ui.target.x--;

                    break;
                }
                case "t": {
                    ui.mode = UIMode.Default;

                    break;
                }
            }

            break;
        }
        case UIMode.Inventory: {
            switch (ev.key) {
                case "i": {
                    ui.mode = UIMode.Default;

                    break;
                }
                case "d": {
                    log(area, player, "select item to drop");
                    log(area, player, "press space to cancel");

                    ui.mode = UIMode.InventoryDrop;

                    break;
                }
                case "e": {
                    log(area, player, "select item to equip");
                    log(area, player, "press space to cancel");

                    ui.mode = UIMode.InventoryEquip;

                    break;
                }
                case "u": {
                    log(area, player, "select item to unequip");
                    log(area, player, "press space to cancel");

                    ui.mode = UIMode.InventoryUnequip;

                    break;
                }
                case "s": {
                    log(area, player, "select first item to swap");
                    log(area, player, "press space to cancel");

                    ui.mode = UIMode.InventorySwapFirst;

                    break;
                }
            }

            break;
        }
        case UIMode.InventoryDrop: {
            const selectedItem = player.inventory.find((item) => ev.key === getInventoryChar(player, item));

            if (selectedItem) {
                dropItem(player, selectedItem, area);

                ui.mode = UIMode.Default;
            }

            switch (ev.key) {
                case " ": {
                    ui.mode = UIMode.Default;

                    break;
                }
            }

            break;
        }
        case UIMode.InventoryEquip: {
            const selectedItem = player.inventory.find((item) => ev.key === getInventoryChar(player, item));

            if (selectedItem) {
                log(area, player, `${player.name} equips a ${selectedItem.name}`);

                selectedItem.equipped = true;

                ui.mode = UIMode.Default;
            }

            switch (ev.key) {
                case " ":
                    ui.mode = UIMode.Default;

                    break;
            }

            break;
        }
        case UIMode.InventoryUnequip: {
            const selectedItem = player.inventory.find((item) => ev.key === getInventoryChar(player, item));

            if (selectedItem) {
                log(area, player, `${player.name} unequips a ${selectedItem.name}`);

                selectedItem.equipped = false;

                ui.mode = UIMode.Default;
            }

            switch (ev.key) {
                case " ":
                    ui.mode = UIMode.Default;

                    break;
            }

            break;
        }
        case UIMode.InventorySwapFirst: {
            const selectedItem = player.inventory.find((item) => ev.key === getInventoryChar(player, item));

            if (selectedItem) {
                ui.inventorySwapFirst = player.inventory.indexOf(selectedItem);

                log(area, player, "select second item to swap");
                log(area, player, "press space to cancel");

                ui.mode = UIMode.InventorySwapSecond;
            }

            switch (ev.key) {
                case " ":
                    ui.mode = UIMode.Default;

                    break;
            }

            break;
        }
        case UIMode.InventorySwapSecond: {
            const selectedItem = player.inventory.find((item) => ev.key === getInventoryChar(player, item));

            if (selectedItem) {
                ui.inventorySwapSecond = player.inventory.indexOf(selectedItem);

                log(area, player, `${player.name} swaps the ${player.inventory[ui.inventorySwapFirst].name} with the ${player.inventory[ui.inventorySwapSecond].name}`);

                const t = player.inventory[ui.inventorySwapFirst];
                player.inventory[ui.inventorySwapFirst] = player.inventory[ui.inventorySwapSecond];
                player.inventory[ui.inventorySwapSecond] = t;

                ui.mode = UIMode.Default;
            }

            switch (ev.key) {
                case " ":
                    ui.mode = UIMode.Default;

                    break;
            }

            break;
        }
        case UIMode.Character: {
            switch (ev.key) {
                case "o":
                    ui.mode = UIMode.Default;

                    break;
            }

            break;
        }
    }

    switch (ev.key) {
        case "[": {
            log(area, player, "game saved");

            save();

            break;
        }
        case "]": {
            log(area, player, "game loaded");

            load();

            break;
        }
        case "\\": {
            console.log(game);

            break;
        }
        case "-": {
            game.fontSize--;

            break;
        }
        case "=": {
            game.fontSize++;

            break;
        }
        case "1": {
            game.godMode = !game.godMode;

            break;
        }
        case "2": {
            game.stopTime = !game.stopTime;

            break;
        }
        case "3": {
            game.ignoreFov = !game.ignoreFov;

            break;
        }
    }

    draw();
}
