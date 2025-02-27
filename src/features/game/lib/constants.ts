import Decimal from "decimal.js-light";
import { fromWei } from "web3-utils";
import { GameState, Inventory } from "../types/game";

export const GRID_WIDTH_PX = 42;

export const INITIAL_STOCK: Inventory = {
  "Sunflower Seed": new Decimal(1000),
  "Potato Seed": new Decimal(300),
  "Pumpkin Seed": new Decimal(200),
  "Carrot Seed": new Decimal(100),
  "Cabbage Seed": new Decimal(90),
  "Beetroot Seed": new Decimal(80),
  "Cauliflower Seed": new Decimal(70),
  "Parsnip Seed": new Decimal(50),
  "Radish Seed": new Decimal(40),
  "Wheat Seed": new Decimal(0),

  Axe: new Decimal(50),
  Pickaxe: new Decimal(50),
  "Stone Pickaxe": new Decimal(50),
  "Iron Pickaxe": new Decimal(50),

  // One off items
  "Pumpkin Soup": new Decimal(1),
  Sauerkraut: new Decimal(1),
  "Roasted Cauliflower": new Decimal(1),
};

export const INITIAL_FARM: GameState = {
  id: 1,
  balance: new Decimal(fromWei("2999999999999999990")),
  fields: {
    0: {
      name: "Sunflower",
      plantedAt: 0,
    },
    1: {
      name: "Sunflower",
      plantedAt: 0,
    },
    2: {
      name: "Sunflower",
      plantedAt: 0,
    },
    5: {
      name: "Carrot",
      plantedAt: 0,
    },
    6: {
      name: "Cabbage",
      plantedAt: 0,
    },
    10: {
      name: "Cauliflower",
      plantedAt: 0,
    },
    11: {
      name: "Beetroot",
      plantedAt: 0,
    },
    16: {
      name: "Parsnip",
      plantedAt: 0,
    },
    17: {
      name: "Radish",
      plantedAt: 0,
    },
  },
  inventory: {
    "Sunflower Seed": new Decimal(3),
    "Pumpkin Soup": new Decimal(1),
    "Sunflower Tombstone": new Decimal(1),
    "Sunflower Rock": new Decimal(1),
    "Chicken Coop": new Decimal(1),
    "Carrot Seed": new Decimal(2),
    "Cabbage Seed": new Decimal(3),
    "Beetroot Seed": new Decimal(2),
    "Cauliflower Seed": new Decimal(100),
    "Sunflower Statue": new Decimal(1),
    "Christmas Tree": new Decimal(1),
    Scarecrow: new Decimal(1),
    "Farm Cat": new Decimal(1),
    "Farm Dog": new Decimal(1),
    Gnome: new Decimal(1),
    "Gold Egg": new Decimal(1),
    "Roasted Cauliflower": new Decimal(2),
  },
  stock: INITIAL_STOCK,
};
