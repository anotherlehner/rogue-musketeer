import * as rot from "rot-js";
import { Component, Position } from "./types";
import { Path } from "rot-js";
import { addMessage } from "./msgs";
import { Env } from "./env";
import { sound } from "./sound";
import impattack1 from 'url:../sounds/impat1.mp3';
import { COL_fg_health } from "./constants";

export function aiSystem(env: Env) {
    // for now, move toward the player and try to stay standing close
    let player = env.player;
    let pather = new Path.Dijkstra(player.position.x, player.position.y,
        (x, y) => env.world.isMapPassableAt(new Position(x, y)), {});

    env.world.eachEntityWithComponent(Component.AI, (ent) => {
        if (ent.isPlayer() || !ent.isAlive() || !ent.hasAi()) return;
        // comput path to the player and move 1 position step toward it
        let pathtoplayer = [];
        pather.compute(ent.position.x, ent.position.y, (x, y) => {
            // env.display.draw(x, y, "", "", "#800"); // draw the path for debugging
            // if we haven't set the new position yet then set it but only when we are NOT touching the player
            pathtoplayer.push(new Position(x, y));
        });
        if (pathtoplayer.length === 2) {
            // attack player
            let dmg = rot.RNG.getUniformInt(5, 12);
            player.damage(dmg);
            sound(impattack1);
            addMessage(`%c{${COL_fg_health}}${ent.name} scrapes you for ${dmg} damage!`, env.messages);
        } else if ((pathtoplayer.length > 2 && pathtoplayer.length < 6) || ent.angered) {
            // Dont chase the player until within a short distance
            if (rot.RNG.getUniform() > 0.25) {
                pathtoplayer = pathtoplayer.reverse();
                pathtoplayer.pop(); // entity's current position
                ent.position = pathtoplayer.pop(); // next space that is not equal to the player's position
            }
        }
    });
}