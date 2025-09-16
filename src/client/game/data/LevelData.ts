import { LevelData } from "../core/GameTypes";
import { LEVEL_THEMES } from "../data/CollectiblePresets";

export const LEVELS: { [key: string]: LevelData } = {
  LEVEL_1: {
    gridWidth: 12,
    gridHeight: 12,
    waterSource: { x: 5, y: 1 },
    drain: { x: 6, y: 10 },
    collectibles: [
      { position: { x: 3, y: 7 }, type: "DUCKY", id: "ducky1" },
      { position: { x: 8, y: 8 }, type: "BUBBLE", id: "bubble1" }
    ],
    theme: LEVEL_THEMES.BATHTIME!
  },
  LEVEL_2: {
    gridWidth: 12,
    gridHeight: 12,
    waterSource: { x: 2, y: 1 },
    drain: { x: 9, y: 9 },
    collectibles: [
      { position: { x: 5, y: 5 }, type: "FLOWER", id: "flower1" },
      { position: { x: 8, y: 3 }, type: "LEAF", id: "leaf1" },
      { position: { x: 4, y: 8 }, type: "POT", id: "pot1" }
    ],
    theme: LEVEL_THEMES.GARDEN!
  }
};
