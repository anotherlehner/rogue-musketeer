
export enum Component {
    AI,
    PLAYER,
    CREATURE,
    HEALTH_BONUS,
    ARMOR_BONUS_1,
    ARMOR_BONUS_2,
    AMMO_WAND,
    GAUNTLETS,
}

export enum Weapon {
    NONE, // entity default
    STAFF,
    GAUNTLETS,
    ELVEN_WAND
}

export class Distance {
    static between(a: Position, b: Position): number {
        return Distance.betweenCoordinates(a.x, a.y, b.x, b.y);
    }

    static betweenCoordinates(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
}

export class Position {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(pos: Position) {
        return pos && this.x === pos.x && this.y === pos.y;
    }

    equalsCoords(x: number, y: number) {
        return this.x === x && this.y === y;
    }

    set(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    encoded() {
        return Position.encode(this.x, this.y);
    }

    distanceTo(target: Position): number {
        return Distance.between(this, target);
    }

    static encode(x: number, y: number) {
        return x + "," + y;
    }
}

export class Message {
    public age: number = 0;
    public content: string;
    constructor(content: string) {
        this.content = content;
    }
}

export class Inventory {
    public wandAmmo: number = 0;
    public weapons: Weapon[] = [];

    addAmmo(type: Weapon, amount: number): void {
        switch (type) {
            case Weapon.ELVEN_WAND:
                this.wandAmmo += amount;
        }
    }

    decAmmo(type: Weapon): void {
        switch (type) {
            case Weapon.ELVEN_WAND:
                this.wandAmmo -= 1;
        }
    }

    getAmmo(type: Weapon): number {
        switch (type) {
            case Weapon.STAFF:
            case Weapon.NONE:
            case Weapon.GAUNTLETS:
                return -1;
            case Weapon.ELVEN_WAND:
                return this.wandAmmo;
        }
    }
}
