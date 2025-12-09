import * as rot from "rot-js";
import { Weapon } from "./types";

import impattack1 from 'url:../sounds/impat1.mp3';
import wandhit from 'url:../sounds/gldhit.mp3';
import staffhit from 'url:../sounds/stfhit.mp3';
import gnthit from 'url:../sounds/gnthit.mp3';

class GameWeapon {
    public range: number;
    public damageMin: number;
    public damageMax: number;
    public soundHit: any;
    public type: Weapon;
    public description: string;

    constructor(range: number, damageMin: number, damageMax: number, soundHit: any, type: Weapon, 
        description: string) {
        this.range = range;
        this.damageMin = damageMin;
        this.damageMax = damageMax;
        this.soundHit = soundHit;
        this.type = type;
        this.description = description;
    }

    rollDamage(): number {
        return rot.RNG.getUniformInt(this.damageMin, this.damageMax);
    }
}

const NoneWeapon = new GameWeapon(1, 5, 12, impattack1, Weapon.NONE, 'claws');
const StaffWeapon = new GameWeapon(1, 5, 20, staffhit, Weapon.STAFF, 'staff');
const GauntletsWeapon = new GameWeapon(2, 15, 60, gnthit, Weapon.GAUNTLETS, 'gauntlets');
const WandWeapon = new GameWeapon(10, 7, 14, wandhit, Weapon.ELVEN_WAND, 'elven wand');

export function getWeapon(weapon: Weapon): GameWeapon {
    switch (weapon) {
        case Weapon.NONE:
            return NoneWeapon;
        case Weapon.STAFF:
            return StaffWeapon;
        case Weapon.GAUNTLETS:
            return GauntletsWeapon;
        case Weapon.ELVEN_WAND:
            return WandWeapon;
        default:
            throw("Unknown weapon");
    }
}
