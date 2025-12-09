import { Position, Component } from "./types";
import { Entity } from "./entity";
import * as rot from "rot-js";
import * as constants from "./constants";
import Uniform from "rot-js/lib/map/uniform";
import Tile from "rot-js/lib/display/tile";

export enum TileType {
    FLOOR,
    WALL,
    STAIRS,
    DOOR
}

const ITEM_COMPONENTS = [Component.HEALTH_BONUS, Component.ARMOR_BONUS_1, Component.ARMOR_BONUS_2, 
    Component.AMMO_WAND, Component.GAUNTLETS];

function getTileDescription(type: TileType): string {
    switch (type) {
        case TileType.FLOOR:
            return "floor";
        case TileType.WALL:
            return "wall";
        case TileType.STAIRS:
            return "stairs leading down";
    }
}

export class MapTile {
    public x: number;
    public y: number;
    public passable: boolean;
    public seen: boolean;
    public type: TileType;
    // TODO: fg and bg color type by content or material of map tile?
    // TODO: glyphs for tiles? grass vs fountain?

    constructor(x: number, y: number, passable: boolean, seen: boolean) {
        this.x = x;
        this.y = y;
        this.passable = passable;
        this.seen = seen;
        this.type = passable ? TileType.FLOOR : TileType.WALL;
    }

    description(): string {
        return getTileDescription(this.type);
    }

    glyf(): string {
        switch (this.type) {
            case TileType.STAIRS:
                return ">";
            case TileType.DOOR:
                return this.passable ? "-" : "+"
            default:
                return "";
        }
    }
}

export class World {
    public tiles: Map<string, MapTile>;
    public entities: Entity[] = [];
    public map: Uniform;

    constructor(width: number, height: number) {
        this.tiles = new Map();
        this.map = new Uniform(width, height, {});

        // Create the map tiles
        this.map.create((x, y, type) => {
            let isPassable = (type == 1) ? false : true;
            this.tiles[x + "," + y] = new MapTile(x, y, isPassable, false);
        });

        // Attach doors
        this.map.getRooms().forEach((room) => {
            console.log(room);
            room.getDoors((x, y) => {
                let chance = rot.RNG.getUniform();
                if (chance > 0.75) {
                    // Don't make ALL doors into actual doors, otherwise it's just too many
                    let tile = this.tiles[Position.encode(x, y)];
                    tile.type = TileType.DOOR;
                    tile.passable = false;
                }
            });
        });

        const stairsPosition = this.getRandomPassablePosition();
        this.tiles[stairsPosition.encoded()].type = TileType.STAIRS;
    }

    getTileAt(pos: Position): MapTile {
        return this.tiles[pos.encoded()];
    }

    isMapPassableAt(pos: Position): boolean {
        if (pos) {
            let key = pos.encoded();
            return key in this.tiles && this.tiles[key].passable;
        } else {
            return false;
        }

    }

    isEntitiesPassableAt(pos: Position): boolean {
        for (let i = 0; i < this.entities.length; i++) {
            let e = this.entities[i];
            if (e.position.equals(pos) && !e.passable) {
                return false;
            }
        }
        return true;
    }

    isPassableEmptyAt(pos: Position): boolean {
        return this.isMapPassableAt(pos) && this.getEntitiesAt(pos).length == 0;
    }

    isPassableAt(pos: Position): boolean {
        return this.isMapPassableAt(pos) && this.isEntitiesPassableAt(pos);
    }

    getRandomPassablePosition(): Position {
        let position: Position = undefined
        for (let i = 0; i < 100; i++) {
            let potential = rot.RNG.getItem(Object.values(this.tiles));
            if (this.isPassableAt(new Position(potential.x, potential.y)))
                position = new Position(potential.x, potential.y);
        }
        if (position) return position;
        else {
            throw ("ERROR: couldnt find random passable map position!");
        }
    }

    getRandomEmptyPosition(): Position {
        let position: Position = undefined
        for (let i = 0; i < 50; i++) {
            let potential = rot.RNG.getItem(Object.values(this.tiles));
            if (this.isPassableEmptyAt(new Position(potential.x, potential.y)))
                position = new Position(potential.x, potential.y);
        }
        if (position) return position;
        else {
            throw ("ERROR: couldnt find random passable empty map position!");
        }
    }

    getEntitiesAt(pos: Position): Entity[] {
        let ents = [];
        for (let i = 0; i < this.entities.length; i++) {
            let e = this.entities[i];
            if (e.position.equals(pos)) ents.push(e);
        }
        return ents;
    }

    getFirstEntityAt(pos: Position): Entity {
        const entitiesAt = this.getEntitiesAt(pos);
        if (entitiesAt) return entitiesAt[0];
        else return undefined;
    }

    getCreatureEntityAt(pos: Position): Entity {
        let creature = undefined;
        this.getEntitiesAt(pos).forEach((e) => {
            if (e.components.indexOf(Component.CREATURE) >= 0) creature = e;
        });
        return creature;
    }

    getItemEntityAt(pos: Position): Entity {
        for (let i = 0; i < this.entities.length; i++) {
            let e = this.entities[i];
            if (e.position.equals(pos) && e.hasAnyComponent(ITEM_COMPONENTS)) return e;
        }
        return undefined;
    }

    removeDeadCreatures(): void {
        let toDelete = [];
        this.eachEntity((e, i) => {
            if (e.hasComponent(Component.CREATURE) && !e.isAlive())
                toDelete.push(i);
        });
        toDelete.forEach(i => this.entities.splice(i, 1));
    }

    removeEntity(ent: Entity): void {
        this.entities.splice(this.entities.indexOf(ent), 1);
    }

    eachEntity(consumer: (e: Entity, i: number) => void) {
        this.entities.forEach(consumer);
    }

    eachEntityWithComponent(comp: Component, consumer: (e: Entity, i: number) => void) {
        this.entities.filter(e => e.hasComponent(comp)).forEach(consumer);
    }

    computeFovAt(target: Position): Map<string, Position> {
        let lightPasses = (x: number, y: number) => {
            let key = x + "," + y;
            if (key in this.tiles) {
                return this.tiles[key].passable;
            }
            return false;
        };
        const fov = new rot.FOV.PreciseShadowcasting(lightPasses, {});
        const fovCoordinates = new Map();
        const fovCallback = (x: number, y: number, r, visibility) =>
            fovCoordinates[Position.encode(x, y)] = new Position(x, y);
        fov.compute(target.x, target.y, constants.FOV_RANGE, fovCallback);
        return fovCoordinates;
    }
}