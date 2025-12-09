import * as constants from "./constants";
import { Component, Inventory, Position, Weapon } from "./types";
import { getWeapon } from "./weapons";


export class Entity {
    public name: string;
    public components: Component[];
    public glyf: string;
    public fg: string = constants.COL_player_fg;
    public bg: string = constants.COL_player_bg;
    public health: number = 10;
    public armor: number = 0;
    public passable: boolean = false;
    public position: Position;
    public weapon: Weapon = Weapon.NONE;
    public angered: boolean = false;
    public inventory: Inventory = new Inventory();

    constructor(name: string, glyf: string, components: Component[]) {
        this.name = name;
        this.components = components;
        this.glyf = glyf;
    }

    isAlive(): boolean {
        return this.health > 0;
    }

    description(): string {
        return this.name; // TODO
    }

    hasComponent(comp: Component): boolean {
        return this.components.indexOf(comp) >= 0;
    }

    hasAnyComponent(comps: Component[]): boolean {
        let has = false;
        comps.forEach(element => {
            if (this.components.indexOf(element) >= 0) has = true;
        });
        return has;
    }

    hasAi(): boolean {
        return this.hasComponent(Component.AI);
    }

    isPlayer(): boolean {
        return this.hasComponent(Component.PLAYER);
    }

    damage(dmg: number) {
        if (this.armor > 0) {
            let armorDmg = Math.floor(dmg / 2);
            this.armor -= armorDmg;
            dmg -= armorDmg;
            if (this.armor < 0) this.armor = 0;
        }
        this.health -= dmg;
        if (this.health < 0) this.health = 0;
        this.angered = true;
    }

    weaponDescription(): string {
        return getWeapon(this.weapon).description;
    }
}
