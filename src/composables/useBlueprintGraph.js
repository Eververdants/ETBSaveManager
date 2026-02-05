const NODE_TYPES = {
  NAME_LIST: "nameList",
  NAME_SEQUENCE: "nameSequence",
  LEVEL_POOL: "levelPool",
  WEIGHTED_NAME_POOL: "weightedNamePool",
  WEIGHTED_LEVEL_POOL: "weightedLevelPool",
  BUILD_ARCHIVES: "buildArchives",
  FILTER_NAMES: "filterNames",
  RENAME_NAMES: "renameNames",
  REPLACE_NAMES: "replaceNames",
  DEDUPE_NAMES: "dedupeNames",
  SORT_NAMES: "sortNames",
  SHUFFLE_NAMES: "shuffleNames",
  MERGE_NAMES: "mergeNames",
  RANDOM_PICK_NAMES: "randomPickNames",
  SET_LEVEL: "setLevel",
  SET_DIFFICULTY: "setDifficulty",
  SET_ACTUAL_DIFFICULTY: "setActualDifficulty",
  LIMIT_ARCHIVES: "limitArchives",
  FILTER_ARCHIVES: "filterArchives",
  RENAME_ARCHIVES: "renameArchives",
  MERGE_ARCHIVES: "mergeArchives",
  RANDOM_PICK_ARCHIVES: "randomPickArchives",
  BRANCH_ARCHIVES: "branchArchives",
  PLAYER_SETUP: "playerSetup",
  ARCHIVE_OUTPUT: "archiveOutput",
};

const MAIN_STORYLINE_LEVELS = [
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
];

const ALL_LEVELS = [
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
  "Bunker",
  "GraffitiLevel",
  "Grassrooms_Expanded",
  "Level922",
  "Level974",
  "LevelCheat",
];

const ITEM_ID_MAP = new Map(
  Object.entries({
    almondconcentrate: 1,
    bugspray: 2,
    camera: 3,
    almondwater: 4,
    chainsaw: 5,
    divinghelmet: 6,
    energybar: 7,
    firework: 8,
    flaregun: 9,
    flashlight: 10,
    glowstickblue: 11,
    glowstick: 12,
    glowstickred: 13,
    glowstickyellow: 14,
    juice: 15,
    liquidpain: 16,
    rope: 17,
    lidar: 18,
    thermometer: 19,
    ticket: 20,
    walkietalkie: 21,
    mothjelly: 22,
    crowbar: 23,
    knife: 24,
    toy: 25,
  })
);

const INVENTORY_PRESETS = {
  starter: ["Flashlight", "AlmondWater", "EnergyBar", "GlowstickBlue", "Rope"],
  medic: ["AlmondConcentrate", "Juice", "Thermometer", "MothJelly"],
  scout: ["Flashlight", "GlowstickYellow", "Rope", "Crowbar", "Thermometer"],
  survivor: ["Knife", "Flashlight", "AlmondWater", "EnergyBar", "GlowstickRed"],
};

const parseList = (text = "") => {
  return text
    .split(/\r?\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const parseWeightedEntries = (text = "") => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines
    .map((line) => {
      let value = line;
      let weight = 1;
      const pipeMatch = line.split("|");
      if (pipeMatch.length > 1) {
        value = pipeMatch[0].trim();
        weight = Number(pipeMatch[1]);
      } else {
        const colonMatch = line.split(":");
        if (colonMatch.length > 1) {
          value = colonMatch[0].trim();
          weight = Number(colonMatch[1]);
        } else {
          const commaMatch = line.split(",");
          if (commaMatch.length > 1) {
            const possibleWeight = Number(commaMatch[commaMatch.length - 1]);
            if (Number.isFinite(possibleWeight)) {
              weight = possibleWeight;
              value = commaMatch.slice(0, -1).join(",").trim();
            }
          }
        }
      }
      if (!value) return null;
      if (!Number.isFinite(weight) || weight <= 0) weight = 1;
      return { value, weight };
    })
    .filter(Boolean);
};

const toNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const assignLevel = (levels, index, mode = "roundRobin") => {
  if (!levels || levels.length === 0) return null;
  if (mode === "random") {
    return levels[Math.floor(Math.random() * levels.length)];
  }
  if (mode === "first") {
    return levels[0];
  }
  return levels[index % levels.length];
};

const toArchiveList = (names, levels, assignMode) => {
  const safeNames = names.filter(Boolean);
  return safeNames.map((name, index) => ({
    id: `bp_${index + 1}`,
    name,
    level: assignLevel(levels, index, assignMode),
    difficulty: null,
    actualDifficulty: null,
    players: [],
  }));
};

const dedupeList = (items) => {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    if (seen.has(item)) return;
    seen.add(item);
    result.push(item);
  });
  return result;
};

const shuffleList = (items) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const weightedSample = (entries, count, unique = false) => {
  const pool = entries.map((entry) => ({ ...entry }));
  const result = [];
  const pickOne = () => {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0) return null;
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= pool[i].weight;
      if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1] || null;
  };

  for (let i = 0; i < count; i += 1) {
    if (pool.length === 0) break;
    const picked = pickOne();
    if (!picked) break;
    result.push(picked.value);
    if (unique) {
      const index = pool.indexOf(picked);
      if (index >= 0) pool.splice(index, 1);
    }
  }
  return result;
};

const pickRandom = (items, count, allowDuplicates = false) => {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) return [];
  if (allowDuplicates) {
    return Array.from({ length: count }, () => {
      const index = Math.floor(Math.random() * items.length);
      return items[index];
    });
  }
  const shuffled = shuffleList(items);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const normalizeToken = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const resolveItemId = (token) => {
  if (!token) return null;
  const num = Number(token);
  if (Number.isFinite(num) && num > 0) return num;
  return ITEM_ID_MAP.get(normalizeToken(token)) || null;
};

const buildInventoryItems = (data) => {
  const mode = data?.inventoryMode || "empty";
  if (mode === "empty") return [];
  if (mode === "preset") {
    const presetKey = data?.inventoryPreset || "starter";
    const preset = INVENTORY_PRESETS[presetKey] || INVENTORY_PRESETS.starter;
    return preset.map(resolveItemId).filter((id) => id !== null);
  }
  if (mode === "custom") {
    return parseList(data?.inventoryItems || "")
      .map(resolveItemId)
      .filter((id) => id !== null);
  }
  if (mode === "random") {
    const count = Math.max(1, toNumber(data?.inventoryCount, 3));
    const ids = Array.from(ITEM_ID_MAP.values());
    return pickRandom(ids, count, false);
  }
  return [];
};

const buildPlayers = (data) => {
  const count = clamp(toNumber(data?.playerCount, 1), 1, 16);
  const prefix = data?.namePrefix ?? "Player";
  const startIndex = Math.max(1, toNumber(data?.startIndex, 1));
  const pad = Math.max(0, toNumber(data?.pad, 0));
  const sanity = clamp(toNumber(data?.sanity, 100), 0, 100);
  const inventory = buildInventoryItems(data);
  return Array.from({ length: count }, (_, index) => {
    const value = startIndex + index;
    const suffix = pad > 0 ? String(value).padStart(pad, "0") : String(value);
    return {
      steam_id: `${prefix}${suffix}`,
      inventory: [...inventory],
      sanity,
    };
  });
};

const createIncomingMap = (edges) => {
  const incoming = new Map();
  edges.forEach((edge) => {
    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target).push(edge);
  });
  return incoming;
};

const getEdgeForHandle = (edges, handleId) => {
  if (!handleId) return edges[0] || null;
  return edges.find((edge) => (edge.targetHandle || "in") === handleId) || null;
};

export function runBlueprintGraph({ nodes, edges, limit }) {
  const errors = [];
  const warnings = [];

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const incoming = createIncomingMap(edges);
  const cache = new Map();
  const visiting = new Set();

  const makeCacheKey = (nodeId, handleId) =>
    `${nodeId}::${handleId || "out"}`;

  const evalNode = (nodeId, outputHandle = "out") => {
    const cacheKey = makeCacheKey(nodeId, outputHandle);
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    if (visiting.has(cacheKey)) {
      errors.push({ code: "cycle_detected" });
      return null;
    }
    visiting.add(cacheKey);

    const node = nodeMap.get(nodeId);
    if (!node) {
      errors.push({ code: "missing_node", nodeId });
      visiting.delete(cacheKey);
      return null;
    }

    const incomingEdges = incoming.get(nodeId) || [];
    const getInput = (handleId) => {
      const edge = getEdgeForHandle(incomingEdges, handleId);
      if (!edge) return null;
      return evalNode(edge.source, edge.sourceHandle || "out");
    };

    let result = null;
    switch (node.type) {
      case NODE_TYPES.NAME_LIST: {
        const names = parseList(node.data?.namesText || "");
        result = { kind: "NameList", data: names };
        break;
      }
      case NODE_TYPES.NAME_SEQUENCE: {
        const prefix = node.data?.prefix ?? "存档";
        const start = Math.max(0, toNumber(node.data?.start, 1));
        const count = Math.max(0, toNumber(node.data?.count, 10));
        const pad = Math.max(0, toNumber(node.data?.pad, 0));
        const names = Array.from({ length: count }, (_, index) => {
          const value = start + index;
          const suffix =
            pad > 0 ? String(value).padStart(pad, "0") : String(value);
          return `${prefix}${suffix}`;
        });
        result = { kind: "NameList", data: names };
        break;
      }
      case NODE_TYPES.LEVEL_POOL: {
        const levels = parseList(node.data?.levelsText || "");
        result = { kind: "LevelList", data: levels };
        break;
      }
      case NODE_TYPES.WEIGHTED_NAME_POOL: {
        const entries = parseWeightedEntries(node.data?.entriesText || "");
        const count = Math.max(0, toNumber(node.data?.count, entries.length));
        const names = entries.length
          ? weightedSample(entries, count, false)
          : [];
        result = { kind: "NameList", data: names };
        break;
      }
      case NODE_TYPES.WEIGHTED_LEVEL_POOL: {
        const entries = parseWeightedEntries(node.data?.entriesText || "");
        const count = Math.max(0, toNumber(node.data?.count, entries.length));
        const levels = entries.length
          ? weightedSample(entries, count, false)
          : [];
        result = { kind: "LevelList", data: levels };
        break;
      }
      case NODE_TYPES.BUILD_ARCHIVES: {
        const namesInput = getInput("names");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        const levelsInput = getInput("levels");
        const levels =
          levelsInput && levelsInput.kind === "LevelList"
            ? levelsInput.data
            : [];
        const assignMode = node.data?.assignMode || "roundRobin";
        const archives = toArchiveList(namesInput.data, levels, assignMode);
        result = { kind: "ArchiveList", data: archives };
        break;
      }
      case NODE_TYPES.FILTER_NAMES: {
        const namesInput = getInput("in");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_filter_input", nodeId });
          break;
        }
        const keyword = (node.data?.keyword || "").trim();
        const mode = node.data?.mode || "include";
        const filtered = keyword
          ? namesInput.data.filter((name) =>
              mode === "exclude"
                ? !name.includes(keyword)
                : name.includes(keyword)
            )
          : namesInput.data;
        result = { kind: "NameList", data: filtered };
        break;
      }
      case NODE_TYPES.RENAME_NAMES: {
        const namesInput = getInput("in");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        const prefix = node.data?.prefix || "";
        const suffix = node.data?.suffix || "";
        const renamed = namesInput.data.map(
          (name) => `${prefix}${name}${suffix}`
        );
        result = { kind: "NameList", data: renamed };
        break;
      }
      case NODE_TYPES.REPLACE_NAMES: {
        const namesInput = getInput("in");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        const search = node.data?.search || "";
        const replace = node.data?.replace || "";
        if (!search) {
          result = { kind: "NameList", data: namesInput.data };
          break;
        }
        const replaced = namesInput.data.map((name) =>
          name.split(search).join(replace)
        );
        result = { kind: "NameList", data: replaced };
        break;
      }
      case NODE_TYPES.DEDUPE_NAMES: {
        const namesInput = getInput("in");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        result = { kind: "NameList", data: dedupeList(namesInput.data) };
        break;
      }
      case NODE_TYPES.SORT_NAMES: {
        const namesInput = getInput("in");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        const order = node.data?.order || "asc";
        const sorted = [...namesInput.data].sort((a, b) =>
          a.localeCompare(b, "zh-Hans-CN", { numeric: true })
        );
        result = {
          kind: "NameList",
          data: order === "desc" ? sorted.reverse() : sorted,
        };
        break;
      }
      case NODE_TYPES.SHUFFLE_NAMES: {
        const namesInput = getInput("in");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        result = { kind: "NameList", data: shuffleList(namesInput.data) };
        break;
      }
      case NODE_TYPES.MERGE_NAMES: {
        const inputA = getInput("a");
        const inputB = getInput("b");
        const listA =
          inputA && inputA.kind === "NameList" ? inputA.data : null;
        const listB =
          inputB && inputB.kind === "NameList" ? inputB.data : null;
        if (!listA && !listB) {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        result = {
          kind: "NameList",
          data: [...(listA || []), ...(listB || [])],
        };
        break;
      }
      case NODE_TYPES.RANDOM_PICK_NAMES: {
        const namesInput = getInput("in");
        if (!namesInput || namesInput.kind !== "NameList") {
          errors.push({ code: "missing_names_input", nodeId });
          break;
        }
        const count = Math.max(0, toNumber(node.data?.count, 5));
        const allowDuplicates = Boolean(node.data?.allowDuplicates);
        result = {
          kind: "NameList",
          data: pickRandom(namesInput.data, count, allowDuplicates),
        };
        break;
      }
      case NODE_TYPES.SET_LEVEL: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const levelKey = (node.data?.levelKey || "").trim();
        const archives = archiveInput.data.map((archive) =>
          levelKey ? { ...archive, level: levelKey } : archive
        );
        result = { kind: "ArchiveList", data: archives };
        break;
      }
      case NODE_TYPES.SET_DIFFICULTY: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const difficulty = node.data?.difficulty || "normal";
        const actualDifficulty = node.data?.actualDifficulty || difficulty;
        const archives = archiveInput.data.map((archive) => ({
          ...archive,
          difficulty,
          actualDifficulty,
        }));
        result = { kind: "ArchiveList", data: archives };
        break;
      }
      case NODE_TYPES.SET_ACTUAL_DIFFICULTY: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const actualDifficulty = node.data?.actualDifficulty || "normal";
        const archives = archiveInput.data.map((archive) => ({
          ...archive,
          actualDifficulty,
        }));
        result = { kind: "ArchiveList", data: archives };
        break;
      }
      case NODE_TYPES.LIMIT_ARCHIVES: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const limitCount = Math.max(1, toNumber(node.data?.limit, 10));
        result = {
          kind: "ArchiveList",
          data: archiveInput.data.slice(0, limitCount),
        };
        break;
      }
      case NODE_TYPES.FILTER_ARCHIVES: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const keyword = (node.data?.keyword || "").trim();
        const mode = node.data?.mode || "include";
        const filtered = keyword
          ? archiveInput.data.filter((archive) =>
              mode === "exclude"
                ? !archive.name.includes(keyword)
                : archive.name.includes(keyword)
            )
          : archiveInput.data;
        result = { kind: "ArchiveList", data: filtered };
        break;
      }
      case NODE_TYPES.RENAME_ARCHIVES: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const prefix = node.data?.prefix || "";
        const suffix = node.data?.suffix || "";
        const renamed = archiveInput.data.map((archive) => ({
          ...archive,
          name: `${prefix}${archive.name}${suffix}`,
        }));
        result = { kind: "ArchiveList", data: renamed };
        break;
      }
      case NODE_TYPES.MERGE_ARCHIVES: {
        const inputA = getInput("a");
        const inputB = getInput("b");
        const listA =
          inputA && inputA.kind === "ArchiveList" ? inputA.data : null;
        const listB =
          inputB && inputB.kind === "ArchiveList" ? inputB.data : null;
        if (!listA && !listB) {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        result = {
          kind: "ArchiveList",
          data: [...(listA || []), ...(listB || [])],
        };
        break;
      }
      case NODE_TYPES.RANDOM_PICK_ARCHIVES: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const count = Math.max(0, toNumber(node.data?.count, 5));
        const allowDuplicates = Boolean(node.data?.allowDuplicates);
        result = {
          kind: "ArchiveList",
          data: pickRandom(archiveInput.data, count, allowDuplicates),
        };
        break;
      }
      case NODE_TYPES.BRANCH_ARCHIVES: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_branch_input", nodeId });
          break;
        }
        const field = node.data?.field || "name";
        const operator = node.data?.operator || "contains";
        const value = (node.data?.value || "").trim().toLowerCase();
        const pass = [];
        const fail = [];
        archiveInput.data.forEach((archive) => {
          const raw =
            field === "level"
              ? archive.level
              : field === "difficulty"
                ? archive.difficulty
                : archive.name;
          const subject = String(raw || "").toLowerCase();
          const matched = value
            ? operator === "equals"
              ? subject === value
              : subject.includes(value)
            : true;
          (matched ? pass : fail).push(archive);
        });
        const trueResult = { kind: "ArchiveList", data: pass };
        const falseResult = { kind: "ArchiveList", data: fail };
        cache.set(makeCacheKey(nodeId, "true"), trueResult);
        cache.set(makeCacheKey(nodeId, "false"), falseResult);
        result = outputHandle === "false" ? falseResult : trueResult;
        break;
      }
      case NODE_TYPES.PLAYER_SETUP: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_input", nodeId });
          break;
        }
        const basePlayers = buildPlayers(node.data);
        const archives = archiveInput.data.map((archive) => ({
          ...archive,
          players: basePlayers.map((player) => ({
            ...player,
            inventory: [...(player.inventory || [])],
          })),
        }));
        result = { kind: "ArchiveList", data: archives };
        break;
      }
      case NODE_TYPES.ARCHIVE_OUTPUT: {
        const archiveInput = getInput("in");
        if (!archiveInput || archiveInput.kind !== "ArchiveList") {
          errors.push({ code: "missing_archive_output_input", nodeId });
          break;
        }
        result = archiveInput;
        break;
      }
      default:
        warnings.push({ code: "unknown_node_type", nodeId });
        break;
    }

    visiting.delete(cacheKey);
    if (result) cache.set(cacheKey, result);
    return result;
  };

  const outputNodes = nodes.filter(
    (node) => node.type === NODE_TYPES.ARCHIVE_OUTPUT
  );
  if (outputNodes.length === 0) {
    errors.push({ code: "missing_output" });
    return { archives: [], errors, warnings };
  }
  if (outputNodes.length > 1) {
    errors.push({ code: "multiple_outputs" });
    return { archives: [], errors, warnings };
  }

  const output = evalNode(outputNodes[0].id);
  if (!output || output.kind !== "ArchiveList") {
    return { archives: [], errors, warnings };
  }

  const archives =
    typeof limit === "number" && limit > 0
      ? output.data.slice(0, limit)
      : output.data;
  return { archives, errors, warnings };
}

export { ALL_LEVELS, MAIN_STORYLINE_LEVELS, NODE_TYPES };
