import { raycast } from './algorithms';
import { Cell, CellType } from './dungeon';
import { calcStats, Entity, getDungeon, getInventoryChar, getLevel } from './entity';
import { game } from './game';
import { isInside, Rect } from './math';
import { ui } from './ui';

export interface Glyph {
    char: string;
    color: string;
    alpha: number;
}

export interface Graphics {
    fontSize: number;
    cellTypes: Array<Glyph>;
}

const canvas = <HTMLCanvasElement>document.getElementById('game');
const ctx = canvas.getContext('2d');
export const graphics: Graphics = {
    fontSize: 24,
    cellTypes: [
        { char: ' ', color: '#ffffff', alpha: 1 },
        { char: '.', color: '#ffffff', alpha: 1 },
        { char: '^', color: '#50ff50', alpha: 1 },
        { char: '#', color: '#ffffff', alpha: 1 },
        { char: '-', color: '#ffffff', alpha: 1 },
        { char: '+', color: '#ffffff', alpha: 1 },
        { char: '<', color: '#ffffff', alpha: 1 },
        { char: '>', color: '#ffffff', alpha: 1 }
    ]
}

export function draw(ev: UIEvent, entity: Entity) {
    const dungeon = getDungeon(entity);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const view: Rect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    view.width = Math.round(canvas.width / graphics.fontSize);
    view.height = Math.round(canvas.height / graphics.fontSize);
    view.x = entity.x - Math.round(view.width / 2);
    view.y = entity.y - Math.round(view.height / 2);
    if (view.x < 0) {
        view.x = 0;
    }
    if (view.x + view.width > dungeon.width) {
        view.x = dungeon.width - view.width;
    }
    if (view.y < 0) {
        view.y = 0;
    }
    if (view.y + view.height > dungeon.height) {
        view.y = dungeon.height - view.height;
    }

    const cellVisibility: Array<Cell> = [];
    if (game.ignoreFov) {
        for (let x = view.x; x < view.x + view.width; x++) {
            for (let y = view.y; y < view.y + view.height; y++) {
                if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) {
                    continue;
                }

                if (cellVisibility.indexOf(dungeon.cells[x][y]) > -1) {
                    continue;
                }

                cellVisibility.push(dungeon.cells[x][y]);
            }
        }
    }
    for (let dir = 0; dir < 360; dir += 0.5) {
        raycast(dungeon, { x: entity.x, y: entity.y }, entity.sight, dir, [
            CellType.Wall,
            CellType.DoorClosed
        ], (x, y) => {
            dungeon.cells[x][y].discovered = true;

            if (cellVisibility.indexOf(dungeon.cells[x][y]) > -1) {
                return;
            }

            cellVisibility.push(dungeon.cells[x][y]);
        });
    }
    if (dungeon.litRooms) {
        dungeon.rooms.forEach(room => {
            if (!isInside({ x: entity.x, y: entity.y }, room)) {
                return;
            }

            for (let x = room.x - 1; x < room.x + room.width + 1; x++) {
                for (let y = room.y - 1; y < room.y + room.height + 1; y++) {
                    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) {
                        continue;
                    }

                    dungeon.cells[x][y].discovered = true;
                    
                    if (cellVisibility.indexOf(dungeon.cells[x][y]) > -1) {
                        continue;
                    }

                    cellVisibility.push(dungeon.cells[x][y]);
                }
            }
        });
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = graphics.fontSize + 'px mono';

    for (let x = view.x; x < view.x + view.width; x++) {
        for (let y = view.y; y < view.y + view.height; y++) {
            if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) {
                continue;
            }

            const screenX = (x - view.x) * graphics.fontSize;
            const screenY = (y - view.y + 1) * graphics.fontSize;

            if (ui.mode === 'target') {
                if (ui.target.x + 1 === x && ui.target.y === y) {
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 1;
                    ctx.fillText(']', screenX, screenY);

                    continue;
                }
                if (ui.target.x - 1 === x && ui.target.y === y) {
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 1;
                    ctx.fillText('[', screenX, screenY);

                    continue;
                }
            }

            if (cellVisibility.indexOf(dungeon.cells[x][y]) > -1) {
                if (dungeon.entities.some(entity => {
                    if (entity.x !== x || entity.y !== y) {
                        return false;
                    }

                    ctx.fillStyle = entity.color;
                    ctx.globalAlpha = entity.alpha;
                    ctx.fillText(entity.char, screenX, screenY);

                    return true;
                }) || dungeon.chests.some(chest => {
                    if (chest.x !== x || chest.y !== y) {
                        return false;
                    }

                    ctx.fillStyle = chest.color;
                    ctx.globalAlpha = chest.alpha;
                    ctx.fillText(chest.char, screenX, screenY);

                    return true;
                }) || dungeon.items.sort((a, b) => {
                    return 0;
                }).some(item => {
                    if (item.x !== x || item.y !== y) {
                        return false;
                    }

                    ctx.fillStyle = item.color;
                    ctx.globalAlpha = item.alpha;
                    ctx.fillText(item.char, screenX, screenY);

                    return true;
                })) {
                    continue;
                }
            }

            let cellType = graphics.cellTypes[dungeon.cells[x][y].type];
            ctx.fillStyle = cellType.color;
            ctx.globalAlpha = cellVisibility.indexOf(dungeon.cells[x][y]) > -1 ? cellType.alpha : dungeon.cells[x][y].discovered ? cellType.alpha * 0.25 : 0;
            ctx.fillText(cellType.char, screenX, screenY);
        }
    }

    for (let i = 0; i < ui.messages.length; i++) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.fillText(ui.messages[i], 0, graphics.fontSize * (i + 1));
    }

    ctx.fillStyle = '#ffffff';

    ctx.fillText(`Level: ${getLevel(entity)} Turn: ${game.turn}`, 0, canvas.height);

    if (ui.mode.includes('inventory')) {
        ctx.fillStyle = '#ffffff';
        entity.inventory.forEach((item, index) => {
            ctx.fillText(`${getInventoryChar(entity, item)}) ${item.name}${item.equipped ? ' (equipped)' : ''}`, canvas.width - (graphics.fontSize * 10), (index + 1) * graphics.fontSize);
        });
    }

    if (ui.mode === 'character') {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Health: ${calcStats(entity).health}`, canvas.width - (graphics.fontSize * 10), graphics.fontSize);
        ctx.fillText(`Mana: ${calcStats(entity).mana}`, canvas.width - (graphics.fontSize * 10), graphics.fontSize * 2);
    }
}
