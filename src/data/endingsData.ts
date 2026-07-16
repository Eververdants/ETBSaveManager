/**
 * Game ending route definitions and level data
 * Shared between classic mode (CreateArchive) and quick mode (QuickCreateArchive)
 */

/** Level keys for each ending (0 = main, 1-3 = branches) */
export const ENDING_LEVELS: Record<number, string[]> = {
  0: [
    "Level0",
    "TopFloor",
    "MiddleFloor",
    "GarageLevel2",
    "BottomFloor",
    "TheHub",
    "Pipes1",
    "ElectricalStation",
    "Office",
    "Hotel",
    "Floor3",
    "BoilerRoom",
    "Pipes2",
    "LevelFun",
    "Poolrooms",
    "LevelRun",
    "TheEnd",
    "Level94",
    "AnimatedKingdom",
    "LightsOut",
    "OceanMap",
    "CaveLevel",
    "Level05",
    "Level9",
    "AbandonedBase",
    "Level10",
    "Level3999",
    "Level07",
    "Snackrooms",
    "LevelDash",
    "Level188_Expanded",
    "Poolrooms_Expanded",
    "WaterPark_Level01_P",
    "WaterPark_Level02_P",
    "WaterPark_Level03_P",
    "LevelFun_Expanded",
    "Zone1_Modified",
    "Zone2_Modified",
    "Zone3_Baked",
    "Zone4",
    "Level52",
    "TunnelLevel",
  ],
  1: ["Bunker", "GraffitiLevel", "Grassrooms_Expanded"],
  2: ["Bunker", "TheHub", "BottomFloor", "Level922"],
  3: ["Bunker", "TheHub", "OceanMap", "LightsOut", "Level974"],
};

/** Ending configuration — `labelKey` maps to `createArchive.endings.*` in i18n */
export const ENDINGS_CONFIG = [
  { id: 0, labelKey: "main" },
  { id: 1, labelKey: "branch1" },
  { id: 2, labelKey: "branch2" },
  { id: 3, labelKey: "branch3" },
];
