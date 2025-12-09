import * as rot from "rot-js";
import * as constants from "./constants";
import * as ui from "./ui";
import * as msgs from "./msgs";
import * as ecs from "./ecs";
import { getWeapon } from "./weapons";
import { Env, GameMode } from "./env";
import { Component, Position, Weapon } from "./types";
import { sound } from "./sound";
import { TileType } from "./world";
import { Entity } from "./entity";

// SOUND IMPORTS
import ambient2 from 'url:../sounds/amb2.mp3';
import ambient3 from 'url:../sounds/amb3.mp3';
import ambient5 from 'url:../sounds/amb5.mp3';
import wind from 'url:../sounds/wind.mp3';
import itemup from 'url:../sounds/itemup.mp3';
import playerDeath from 'url:../sounds/plrdth.mp3';
import impdeath from 'url:../sounds/impdth.mp3';
import doropn from 'url:../sounds/doropn.mp3';
import gntact from 'url:../sounds/gntact.mp3';


function getPotentialPosition(xinitial: number, yinitial: number, keyCode: number): Position {
    let ppx = xinitial;
    let ppy = yinitial;
    switch (keyCode) {
        case rot.KEYS.VK_UP:
            ppy -= 1;
            break;
        case rot.KEYS.VK_DOWN:
            ppy += 1;
            break;
        case rot.KEYS.VK_LEFT:
            ppx -= 1;
            break;
        case rot.KEYS.VK_RIGHT:
            ppx += 1;
            break;
    }
    return new Position(ppx, ppy);
}

function doLookerMovement(env: Env, keyCode: number) {
    let newPos = getPotentialPosition(env.looker.position.x, env.looker.position.y, keyCode);
    const world = env.world;
    const looker = env.looker;

    if (env.positionInFov(newPos)) {
        looker.position.set(newPos.x, newPos.y);

        // Looker should appear as entity if one at position, otherwise look like the map
        const entitiesAtNewPos = world.getEntitiesAt(newPos);
        const entityAtNewPos = entitiesAtNewPos ? entitiesAtNewPos[0] : undefined;
        if (entityAtNewPos) looker.glyf = entityAtNewPos.glyf;
        else looker.glyf = "";
    }
}

function doTargeterMovement(env: Env, keyCode: number) {
    let newPos = getPotentialPosition(env.targeter.position.x, env.targeter.position.y, keyCode);
    const world = env.world;
    const targeter = env.targeter;
    const player = env.player;

    if (player.position.distanceTo(newPos) <= getWeapon(player.weapon).range
        && world.isMapPassableAt(newPos) && newPos.encoded() in env.fov) {
        targeter.position.set(newPos.x, newPos.y);

        // Targeter should appear as entity if one at position, otherwise look like the map
        const entitiesAtNewPos = world.getEntitiesAt(newPos);
        const entityAtNewPos = entitiesAtNewPos ? entitiesAtNewPos[0] : undefined;
        if (entityAtNewPos) targeter.glyf = entityAtNewPos.glyf;
        else targeter.glyf = "";
    }
}

function doPlayerAttack(env: Env) {
    const target = env.world.getCreatureEntityAt(env.targeter.position);
    if (target) {
        let ammo = env.player.inventory.getAmmo(env.player.weapon);
        if (ammo != 0) {
            sound(getWeapon(env.player.weapon).soundHit);
            let dmg = getWeapon(env.player.weapon).rollDamage();
            target.damage(dmg);
            if (target.health <= 0) {
                sound(impdeath);
                msgs.addMessage(target.name + " dies", env.messages);
            } else {
                msgs.addMessage(`you inflict ${dmg} damage on ${target.name}`, env.messages);
            }
            if (ammo > 0) env.player.inventory.decAmmo(env.player.weapon);
        } else {
            msgs.addMessage("%c{blue}You're out of ammo!", env.messages);
        }
    }
}

function doPickupItem(env: Env, item: Entity): void {
    let pickedUp = false;
    if (item.hasComponent(Component.HEALTH_BONUS) && env.player.health < 100) {
        let healthAdded = 100 - env.player.health;
        if (healthAdded > 10) healthAdded = 10;
        env.player.health += healthAdded;
        msgs.addMessage(`%c{${constants.COL_fg_health}}you gain ${healthAdded} health`, env.messages);
        pickedUp = true;
    } else if (item.hasComponent(Component.ARMOR_BONUS_1) && env.player.armor < 100) {
        env.player.armor = 100;
        msgs.addMessage(`%c{${constants.COL_fg_armor}}equipped ${item.description()}`, env.messages);
        pickedUp = true;
    } else if (item.hasComponent(Component.ARMOR_BONUS_2) && env.player.armor < 200) {
        env.player.armor = 200;
        msgs.addMessage(`%c{${constants.COL_fg_armor}}equipped ${item.description()}`, env.messages);
        pickedUp = true;
    } else if (item.hasComponent(Component.AMMO_WAND) && env.player.inventory.wandAmmo < 100) {
        let ammoAdded = 100 - env.player.inventory.wandAmmo;
        if (ammoAdded > 10) ammoAdded = 10;
        env.player.inventory.addAmmo(Weapon.ELVEN_WAND, ammoAdded);
        msgs.addMessage(`%c{${constants.COL_fg_weapon}}picked up ${item.description()} (+${ammoAdded})`, env.messages);
        pickedUp = true;
    } else if (item.hasComponent(Component.GAUNTLETS) &&
        env.player.inventory.weapons.indexOf(Weapon.GAUNTLETS) < 0) {
        env.player.inventory.weapons.push(Weapon.GAUNTLETS);
        env.player.weapon = Weapon.GAUNTLETS;
        msgs.addMessage(`%c{${constants.COL_fg_armor}}picked up ${item.description()}`, env.messages);
        sound(gntact);
        env.world.removeEntity(item);
    }

    if (pickedUp) {
        env.world.removeEntity(item);
        sound(itemup);
    }
}

function doPlayerMovement(env: Env, keyCode: number) {
    let ppos = getPotentialPosition(env.player.position.x, env.player.position.y, keyCode);
    let ptile = env.world.getTileAt(ppos);
    if (env.world.isPassableAt(ppos)) {
        env.player.position.set(ppos.x, ppos.y);
        let item = env.world.getItemEntityAt(ppos);
        if (item) doPickupItem(env, item);
        if (rot.RNG.getUniform() < 0.004) {
            // TODO: make this only able to happen X turns after the last ambient sound
            let soundobj = rot.RNG.getItem([ambient2, ambient3, ambient5, wind])
            sound(soundobj);
        }
    } else if (ptile.type == TileType.DOOR && !ptile.passable) {
        // door here is closed
        ptile.passable = true;
        sound(doropn, 0.25);
    } else if (!env.world.isEntitiesPassableAt(ppos)) {
        let target = env.world.getCreatureEntityAt(ppos);
        if (!target.isPlayer()) {
            if (env.player.inventory.getAmmo(env.player.weapon) == 0) {
                msgs.addMessage("%c{blue}out of ammo! attacking with staff instead", env.messages);
                env.player.weapon = Weapon.STAFF;
            }
            env.targeter.position.set(target.position.x, target.position.y);
            doPlayerAttack(env);
        }
    }
}

function playerMove(env: Env, keyCode: number): boolean {
    if (constants.WAIT_KEY == keyCode) {
        return true; // waiting expends a turn
    } else if (constants.ATTACK_KEY == keyCode) {
        env.mode = GameMode.TARGET;
        env.initTargeter();
    } else if (constants.CONFIRM_KEY == keyCode && env.mode == GameMode.TARGET) {
        doPlayerAttack(env);
        env.mode = GameMode.NORMAL;
        return true;
    } else if (constants.LOOK_KEY == keyCode) {
        env.mode = GameMode.LOOK;
        env.initLooker();
    } else if (constants.CANCEL_KEY == keyCode) {
        env.mode = GameMode.NORMAL;
    } else if (constants.STAIRS_KEY == keyCode && env.isPlayerOnStairs()) {
        env.floorsDescended++;
        env.initNewMap();
    } else if (env.mode == GameMode.NORMAL && constants.MOVEMENT_KEYS.includes(keyCode)) {
        doPlayerMovement(env, keyCode);
        return true;
    } else if (env.mode == GameMode.LOOK && constants.MOVEMENT_KEYS.includes(keyCode)) {
        doLookerMovement(env, keyCode);
    } else if (env.mode == GameMode.TARGET && constants.MOVEMENT_KEYS.includes(keyCode)) {
        doTargeterMovement(env, keyCode);
    } else if (constants.WEAPON1_KEY == keyCode) {
        env.player.weapon = Weapon.STAFF;
        msgs.addMessage(`%c{${constants.COL_fg_weapon}}equipped Staff`, env.messages);
    } else if (constants.WEAPON2_KEY == keyCode) {
        if (env.player.inventory.weapons.indexOf(Weapon.GAUNTLETS) >= 0) {
            env.player.weapon = Weapon.GAUNTLETS;
            msgs.addMessage(`%c{${constants.COL_fg_weapon}}equipped Gauntlets of the Necromancer`, env.messages);
            sound(gntact);
        } else {
            msgs.addMessage("you don't have that weapon yet", env.messages);
        }
    } else if (constants.WEAPON3_KEY == keyCode) {
        env.player.weapon = Weapon.ELVEN_WAND;
        msgs.addMessage(`%c{${constants.COL_fg_weapon}}equipped Elven Wand`, env.messages);
    } else if (constants.HELP_KEY == keyCode) {
        env.mode = GameMode.HELP;
    }
    return false;
}

export function turn(env: Env, keyCode: number) {
    msgs.ageMessages(env.messages);
    ui.clearMessageRows(env.display);

    if (!env.player.isAlive()) {
        msgs.addMessage("%c{blue}Reload the page to start over", env.messages);
        ui.drawMessages(env.display, env.messages);
        return;
    }

    if (playerMove(env, keyCode)) {
        env.turn++;
        env.world.removeDeadCreatures();
        ecs.aiSystem(env);
        if (!env.player.isAlive()) {
            env.messages = [];
            sound(playerDeath);
            msgs.addMessage(`%c{red}You died after descending ${env.floorsDescended} floors.`, env.messages);
        }
    }

    env.computePlayerFov();
    ui.draw(env);
}