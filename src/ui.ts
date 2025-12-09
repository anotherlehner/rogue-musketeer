import * as constants from "./constants";
import { Message, Position, Weapon } from "./types";
import { Entity } from "./entity";
import { World, MapTile, TileType } from "./world";
import { Env, GameMode } from "./env";
import { Display } from "rot-js";
import { getWeapon } from "./weapons";

function drawMap(display: Display, map: World) {
    for (const [key, value] of Object.entries(map.tiles)) {
        let passable = map.isMapPassableAt(new Position(value.x, value.y));
        let color = constants.COL_map_unlit;
        if (value.seen && passable) {
            color = constants.COL_map_seen_passable;
        } else if (value.seen && !passable) {
            color = constants.COL_map_seen_blocked;
        }
        display.draw(value.x, value.y, value.type == 1 ? "#" : " ", color, color);
    }
}

function drawHelp(display: Display) {
    display.clear();
    display.drawText(0, 0, "Help");
    display.drawText(0, 1, "====");
    display.drawText(0, 3, "Stats: Hp=health, Ar=armor, Eq=equipped weapon (ammo range damage)");
    display.drawText(0, 5, "Movement: (arrow keys) (Moving into an enemy attacks with the staff)");
    display.drawText(0, 7, "Attack: a");
    display.drawText(0, 9, "Descend stairs: d");
    display.drawText(0, 11, "Cancel: ESC key");
    display.drawText(0, 13, "Confirm: RETURN key (or ENTER)");
}

function drawStats(env: Env) {
    let display = env.display;
    let player = env.player;
    clearRow(display, constants.STATS_ROW);
    let healthDescr = `%c{${constants.COL_fg_health}}Hp: ${player.health} %c{grey}ǂ`;
    let armorDescr = `%c{${constants.COL_fg_armor}}Ar: ${player.armor} %c{grey}ǂ`;
    let weapon = getWeapon(player.weapon);

    let shots = "";
    if ([Weapon.NONE, Weapon.STAFF, Weapon.GAUNTLETS].indexOf(weapon.type) < 0) {
        shots = `: %c{${constants.COL_fg_weapon}}${env.player.inventory.getAmmo(player.weapon)}`;
    }
    let range = `range: ${weapon.range} `;
    let damage = `damage: ${weapon.damageMin}-${weapon.damageMax}`;
    let weaponDescr = `%c{${constants.COL_fg_weapon}}${weapon.description}${shots} %c{grey}(${range}${damage})`;
    display.drawText(0, constants.STATS_ROW, `${healthDescr} ${armorDescr} ${weaponDescr}`, constants.WIN_width);
}

function drawLookDescription(display: Display, env: Env) {
    clearRow(display, constants.STATS_ROW);
    let world = env.world;
    let lookerPos = env.looker.position;
    let xyEnt: Entity = world.getFirstEntityAt(lookerPos);
    let xyMap: MapTile = world.getTileAt(lookerPos);
    let descr = "unknown";
    if (xyEnt) descr = xyEnt.description();
    else descr = xyMap.description();
    display.drawText(0, constants.STATS_ROW, `: ${descr}`, constants.WIN_width);
}

function clearRow(display: Display, r: number) {
    for (let j = 0; j < constants.WIN_width; j++) {
        display.draw(j, r, " ", "#000", "#000");
    }
}

function drawEntity(display: Display, e: Entity) {
    display.draw(e.position.x, e.position.y, e.glyf, e.fg, e.bg);
}

function getTileLitBgColor(tile: MapTile): string {
    switch (tile.type) {
        case TileType.DOOR:
            return constants.COL_lit_passable;
        case TileType.FLOOR:
        case TileType.STAIRS:
            return constants.COL_lit_passable;
        case TileType.WALL:
            return constants.COL_lit_blocked;
    }
}

function getTileLitFgColor(tile: MapTile): string {
    switch (tile.type) {
        case TileType.DOOR:
            return constants.COL_fg_door;
        case TileType.FLOOR:
        case TileType.STAIRS:
            return constants.COL_fg_stairs;
        case TileType.WALL:
            return constants.COL_lit_blocked;
    }
}

function drawFov(env: Env) {
    Object.values(env.fov).forEach((position: Position) => {
        let tile = env.world.getTileAt(position);
        tile.seen = true;
        let bgcolor = getTileLitBgColor(tile);
        let fgcolor = getTileLitFgColor(tile);
        env.display.draw(position.x, position.y, tile.glyf(), fgcolor, bgcolor);

        // entities (only drawing entities within the current field of view)
        let ent = env.world.getFirstEntityAt(position);
        if (ent) {
            drawEntity(env.display, ent);
        }
    });
}

export function drawMessages(display: Display, messages: Message[]) {
    for (let i = -3; i + 3 < messages.length; i++) {
        display.drawText(0, constants.WIN_height + i, messages[i + 3].content);
    }
}

export function clearMessageRows(display: Display) {
    for (let i = -3; i < 0; i++) {
        clearRow(display, constants.WIN_height + i);
    }
}

export function draw(env: Env) {
    if (env.mode == GameMode.HELP) {
        drawHelp(env.display);
    } else {
        drawMessages(env.display, env.messages);
        drawMap(env.display, env.world);
        drawFov(env);

        switch (env.mode) {
            case GameMode.LOOK:
                drawEntity(env.display, env.looker);
                drawLookDescription(env.display, env);
                break;
            case GameMode.TARGET:
                drawEntity(env.display, env.targeter);
                // TODO: draw path to targeter
                break;
            case GameMode.NORMAL:
                drawStats(env);
                break;
        }
    }
}