import * as rot from "rot-js";
import { Message, Position, Component, Weapon, Inventory } from "./types";
import { Entity } from "./entity";
import { World, TileType } from "./world";
import { getWeapon } from "./weapons";
import * as constants from "./constants";

export enum GameMode {
    NORMAL,
    LOOK,
    TARGET,
    HELP,
    INVENTORY
}

function factoryCrystalVial(): Entity {
    let healthBonus = new Entity('Crystal Vial', 'v', [Component.HEALTH_BONUS]);
    healthBonus.passable = true;
    healthBonus.fg = constants.COL_fg_health;
    return healthBonus;
}

function factorySilverShield(): Entity {
    let ent = new Entity('Silver Shield', 'â', [Component.ARMOR_BONUS_1]);
    ent.passable = true;
    ent.fg = constants.COL_fg_armor;
    return ent;
}

function factoryEnchantedShield(): Entity {
    let ent = new Entity('Enchanted Shield', 'Â', [Component.ARMOR_BONUS_2]);
    ent.passable = true;
    ent.fg = constants.COL_fg_armor;
    return ent;
}

function factoryGargoyle(): Entity {
    let g = new Entity('Gargoyle', 'G', [Component.CREATURE, Component.AI]);
    g.health = 40;
    g.fg = "#f00";
    return g;
}

function factoryAmmoWand(): Entity {
    let a = new Entity('Wand Crystal', 'ẇ', [Component.AMMO_WAND]);
    a.passable = true;
    a.fg = constants.COL_fg_weapon;
    return a;
}

function factoryGauntlets(): Entity {
    let a = new Entity('Gauntlets of the Necromancer', 'g', [Component.GAUNTLETS]);
    a.passable = true;
    a.fg = constants.COL_fg_armor;
    return a;
}

export class Env {
    public display: rot.Display;
    public turn: number = 0;
    public messages: Message[] = []
    public player: Entity;
    public looker: Entity;
    public targeter: Entity;
    public world: World;
    public mode: GameMode = GameMode.NORMAL;
    public fov: Map<string, Position>;
    public floorsDescended = 0;

    initLooker() {
        let looker = new Entity('Looker', '@', []);
        looker.passable = false;
        looker.glyf = "@";
        looker.fg = "#000";
        looker.bg = "#fff";
        looker.position = new Position(this.player.position.x, this.player.position.y);
        this.looker = looker;
    }

    findNearestTarget(): Entity {
        let playerPosition = this.player.position;
        let distanceToPlayer = 9999;
        let ent = undefined;
        if (this.fov) {
            Object.values(this.fov).forEach((pos) => {
                let entAtPos = this.world.getCreatureEntityAt(pos);
                if (entAtPos && playerPosition.distanceTo(pos) < distanceToPlayer) {
                    distanceToPlayer = playerPosition.distanceTo(pos);
                    ent = entAtPos;
                }
            });
        }
        return ent;
    }

    initTargeter() {
        let targeter = new Entity('Targeter', '@', []);
        this.targeter = targeter;
        targeter.passable = false;
        targeter.fg = "#000";
        targeter.bg = "#fff";
        let nearestTarget = this.findNearestTarget();
        if (nearestTarget) {
            let distance = this.player.position.distanceTo(nearestTarget.position);
            if (getWeapon(this.player.weapon).range >= distance) {
                targeter.position = new Position(nearestTarget.position.x, nearestTarget.position.y);
                targeter.glyf = nearestTarget.glyf;
                return;
            }
        }
        targeter.position = new Position(this.player.position.x, this.player.position.y);

    }

    computePlayerFov() {
        this.fov = this.world.computeFovAt(this.player.position);
    }

    positionInFov(target: Position): boolean {
        return target.encoded() in this.fov;
    }

    isPlayerOnStairs() {
        return this.world.getTileAt(this.player.position).type == TileType.STAIRS;
    }

    initNewMap(): void {
        console.log("initNewMap");
        this.world = new World(constants.MAP_width, constants.MAP_height);
        this.player.position = this.world.getRandomPassablePosition();
        this.initTargeter();
        this.world.entities.push(this.player);

        // Init mobs
        this.initRandomlyPlacedEntities(2, 4, factoryGargoyle);

        // Init bonuses
        this.initRandomlyPlacedEntities(0, 2, factoryCrystalVial);
        this.initRandomlyPlacedEntities(1, 1, factorySilverShield);
        this.initRandomlyPlacedEntities(0, 1, factoryEnchantedShield);
        this.initRandomlyPlacedEntities(1, 1, factoryAmmoWand);
        this.initRandomlyPlacedEntities(1, 1, factoryGauntlets);
    }

    initNewPlayer(): void {
        let player = new Entity('Player', '@', [Component.PLAYER]);
        player.health = 100;
        player.weapon = Weapon.ELVEN_WAND;
        player.inventory.wandAmmo = 10;
        this.player = player;
    }

    initRandomlyPlacedEntities(min: number, max: number, factory: () => Entity): void {
        for (let i = 0; i < rot.RNG.getUniformInt(min, max); i++) {
            let ent = factory();
            ent.position = this.world.getRandomEmptyPosition();
            this.world.entities.push(ent);
        }
    }
}

export function initEnv(): Env {
    let env = new Env();
    rot.RNG.setSeed(1234);
    env.display = new rot.Display({ width: constants.WIN_width, height: constants.WIN_height, fontSize: 32 });
    env.initNewPlayer();
    env.initNewMap();
    return env;
}
