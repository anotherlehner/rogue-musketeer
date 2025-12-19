import {KEYS} from "rot-js";

// DIMENSIONS

export const STATUS_AREA_size = 5;

export const WIN_width = 80;
export const WIN_height = 35;

export const MAP_width = WIN_width;
export const MAP_height = WIN_height - STATUS_AREA_size;

// COLORS

export const COL_player_fg = "#ccc";
export const COL_player_bg = "#333";

export const COL_map_unlit = "#080604";
export const COL_map_seen_passable = "#111";
export const COL_map_seen_blocked = "#222";
export const COL_lit_blocked = "#666";
export const COL_lit_passable = "#333";
export const COL_lit_doorclosed = "#333";

export const COL_fg_door = "#aaa";
export const COL_fg_stairs = "#aaa";
export const COL_fg_health = "#e6928c";
export const COL_fg_armor = "#8cb5e6";
export const COL_fg_weapon = "#f2bf27";

// KEYS

export const HELP_KEY = KEYS.VK_H;
export const ATTACK_KEY = KEYS.VK_A;
export const WAIT_KEY = KEYS.VK_PERIOD;
export const LOOK_KEY = KEYS.VK_L;
export const CONFIRM_KEY = KEYS.VK_RETURN;
export const CANCEL_KEY = KEYS.VK_ESCAPE;
export const STAIRS_KEY = KEYS.VK_D;
export const MOVEMENT_KEYS = [KEYS.VK_DOWN, KEYS.VK_UP, KEYS.VK_LEFT, KEYS.VK_RIGHT];
export const WEAPON1_KEY = KEYS.VK_1;
export const WEAPON2_KEY = KEYS.VK_2;
export const WEAPON3_KEY = KEYS.VK_3;

// GAME

export const STATUS_ROW_y = WIN_height - STATUS_AREA_size;
export const LOG_AREA_y = STATUS_AREA_size - 1;
export const LOG_MSG_max_age = 5;

export const FOV_RANGE = 10;
