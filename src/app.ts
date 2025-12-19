import * as ui from "./ui";
import * as game from "./game";
import { initEnv } from "./env";
import { addMessage } from "./msgs";

window.onload = () => {
  // Initialize game
  let env = initEnv();

  // ATTACH TO BROWSER
  document.getElementById('canvas-container').appendChild(env.display.getContainer());

  // KEYBOARD HANDLING
  document.addEventListener("keydown", e => game.turn(env, e.keyCode));

  // Initial messages
  addMessage("press 'h' for help", env.messages);

  // Draw the initial view
  env.computePlayerFov();
  ui.draw(env);
};
