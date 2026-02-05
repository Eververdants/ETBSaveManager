<template>
  <div class="blueprint-create-container">
    <button class="back-button" :class="{ prominent: !blueprintModeEnabled }" @click="goBack">
      <font-awesome-icon :icon="['fas', 'arrow-left']" />
      <span>{{ $t("common.back") }}</span>
    </button>

    <div v-if="!blueprintModeEnabled" class="coming-soon-panel">
      <div class="coming-soon-card">
        <div class="coming-title">{{ $t("blueprintCreate.comingSoon") }}</div>
        <div class="coming-desc">{{ $t("blueprintCreate.comingSoonDesc") }}</div>
      </div>
    </div>

    <div v-else class="blueprint-workspace">
      <aside class="panel library-panel">
        <div class="panel-title">{{ $t("blueprintCreate.library.title") }}</div>
        <p class="panel-desc">{{ $t("blueprintCreate.library.desc") }}</p>

        <div class="library-groups">
          <div v-for="group in nodeLibrary" :key="group.key" class="library-group">
            <div class="group-title">{{ group.title }}</div>
            <button
              v-for="item in group.items"
              :key="item.type"
              class="node-item"
              draggable="true"
              @dragstart="onDragStart($event, item.type)"
            >
              <div class="node-item-title">{{ item.title }}</div>
              <div class="node-item-desc">{{ item.desc }}</div>
            </button>
          </div>
        </div>
      </aside>

      <main class="panel canvas-panel">
        <div class="canvas-toolbar">
          <div class="toolbar-title">{{ $t("blueprintCreate.canvas.title") }}</div>
          <div class="toolbar-actions">
            <button class="toolbar-btn" @click="handleFitView">
              <font-awesome-icon :icon="['fas', 'arrows-up-down']" />
              {{ $t("blueprintCreate.canvas.fit") }}
            </button>
            <button class="toolbar-btn danger" @click="resetGraph">
              <font-awesome-icon :icon="['fas', 'trash']" />
              {{ $t("blueprintCreate.canvas.reset") }}
            </button>
          </div>
        </div>

        <div class="canvas-shell" ref="flowWrapper" @dragover="onDragOver" @drop="onDrop">
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            class="blueprint-flow"
            :node-types="nodeTypes"
            :default-edge-options="{ type: 'smoothstep' }"
            :fit-view-on-init="true"
            :min-zoom="0.2"
            :max-zoom="1.6"
            @connect="onConnect"
            @node-click="onNodeClick"
            @pane-click="onPaneClick"
          >
            <Background
              variant="lines"
              :gap="24"
              :line-width="1"
              pattern-color="var(--bp-grid)"
              bg-color="transparent"
            />
            <Controls position="bottom-left" />
          </VueFlow>
        </div>
      </main>

      <aside class="panel side-panel">
        <section class="panel-block">
          <div class="panel-title">{{ $t("blueprintCreate.properties.title") }}</div>

          <div v-if="!selectedNode" class="empty-hint">
            {{ $t("blueprintCreate.properties.empty") }}
          </div>

          <div v-else class="property-content">
            <div class="property-header">
              <div class="property-name">{{ getNodeLabel(selectedNode.type) }}</div>
              <button class="chip-button" @click="removeNode(selectedNode.id)">
                {{ $t("blueprintCreate.properties.delete") }}
              </button>
            </div>

            <div v-if="selectedNode.type === nodeTypeMap.NAME_LIST" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.namesText") }}</label>
              <textarea
                class="form-input textarea"
                :value="selectedNode.data?.namesText || ''"
                :placeholder="$t('blueprintCreate.fields.namesPlaceholder')"
                @input="updateNodeData(selectedNode.id, { namesText: $event.target.value })"
              ></textarea>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.NAME_SEQUENCE">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.namePrefix") }}</label>
                <input
                  class="form-input"
                  :value="selectedNode.data?.prefix || ''"
                  :placeholder="$t('blueprintCreate.fields.namePrefix')"
                  @input="updateNodeData(selectedNode.id, { prefix: $event.target.value })"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">{{ $t("blueprintCreate.fields.startIndex") }}</label>
                  <input
                    class="form-input"
                    type="number"
                    min="0"
                    :value="selectedNode.data?.start ?? 1"
                    @input="updateNodeData(selectedNode.id, { start: Number($event.target.value) })"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">{{ $t("blueprintCreate.fields.count") }}</label>
                  <input
                    class="form-input"
                    type="number"
                    min="0"
                    :value="selectedNode.data?.count ?? 5"
                    @input="updateNodeData(selectedNode.id, { count: Number($event.target.value) })"
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.padDigits") }}</label>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  :value="selectedNode.data?.pad ?? 0"
                  @input="updateNodeData(selectedNode.id, { pad: Number($event.target.value) })"
                />
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.LEVEL_POOL" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.levelsText") }}</label>
              <textarea
                class="form-input textarea"
                :value="selectedNode.data?.levelsText || ''"
                :placeholder="$t('blueprintCreate.fields.levelsPlaceholder')"
                @input="updateNodeData(selectedNode.id, { levelsText: $event.target.value })"
              ></textarea>
              <div class="quick-levels">
                <div class="quick-levels-title">{{ $t("blueprintCreate.fields.quickLevels") }}</div>
                <div class="chip-row">
                  <button
                    v-for="level in commonLevels"
                    :key="level.key"
                    class="chip-button"
                    @click="appendLevel(level.key)"
                  >
                    {{ level.label }}
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.WEIGHTED_NAME_POOL">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.weightEntries") }}</label>
                <textarea
                  class="form-input textarea"
                  :value="selectedNode.data?.entriesText || ''"
                  :placeholder="$t('blueprintCreate.fields.weightEntriesPlaceholder')"
                  @input="updateNodeData(selectedNode.id, { entriesText: $event.target.value })"
                ></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.randomCount") }}</label>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  :value="selectedNode.data?.count ?? 6"
                  @input="updateNodeData(selectedNode.id, { count: Number($event.target.value) })"
                />
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.WEIGHTED_LEVEL_POOL">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.weightEntries") }}</label>
                <textarea
                  class="form-input textarea"
                  :value="selectedNode.data?.entriesText || ''"
                  :placeholder="$t('blueprintCreate.fields.weightEntriesPlaceholder')"
                  @input="updateNodeData(selectedNode.id, { entriesText: $event.target.value })"
                ></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.randomCount") }}</label>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  :value="selectedNode.data?.count ?? 6"
                  @input="updateNodeData(selectedNode.id, { count: Number($event.target.value) })"
                />
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.FILTER_NAMES" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.keyword") }}</label>
              <input
                class="form-input"
                :value="selectedNode.data?.keyword || ''"
                :placeholder="$t('blueprintCreate.fields.keyword')"
                @input="updateNodeData(selectedNode.id, { keyword: $event.target.value })"
              />
              <label class="form-label">{{ $t("blueprintCreate.fields.filterMode") }}</label>
              <select
                class="form-input"
                :value="selectedNode.data?.mode || 'include'"
                @change="updateNodeData(selectedNode.id, { mode: $event.target.value })"
              >
                <option value="include">{{ $t("blueprintCreate.filterMode.include") }}</option>
                <option value="exclude">{{ $t("blueprintCreate.filterMode.exclude") }}</option>
              </select>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.REPLACE_NAMES" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.searchText") }}</label>
              <input
                class="form-input"
                :value="selectedNode.data?.search || ''"
                :placeholder="$t('blueprintCreate.fields.searchText')"
                @input="updateNodeData(selectedNode.id, { search: $event.target.value })"
              />
              <label class="form-label">{{ $t("blueprintCreate.fields.replaceText") }}</label>
              <input
                class="form-input"
                :value="selectedNode.data?.replace || ''"
                :placeholder="$t('blueprintCreate.fields.replaceText')"
                @input="updateNodeData(selectedNode.id, { replace: $event.target.value })"
              />
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.DEDUPE_NAMES" class="form-group">
              <div class="info-note">{{ $t("blueprintCreate.fields.dedupeHint") }}</div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.SORT_NAMES" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.sortOrder") }}</label>
              <select
                class="form-input"
                :value="selectedNode.data?.order || 'asc'"
                @change="updateNodeData(selectedNode.id, { order: $event.target.value })"
              >
                <option value="asc">{{ $t("blueprintCreate.sortOrder.asc") }}</option>
                <option value="desc">{{ $t("blueprintCreate.sortOrder.desc") }}</option>
              </select>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.SHUFFLE_NAMES" class="form-group">
              <div class="info-note">{{ $t("blueprintCreate.fields.shuffleHint") }}</div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.RANDOM_PICK_NAMES">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.randomCount") }}</label>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  :value="selectedNode.data?.count ?? 5"
                  @input="updateNodeData(selectedNode.id, { count: Number($event.target.value) })"
                />
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.allowDuplicates") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.allowDuplicates ? 'yes' : 'no'"
                  @change="updateNodeData(selectedNode.id, { allowDuplicates: $event.target.value === 'yes' })"
                >
                  <option value="no">{{ $t("blueprintCreate.random.unique") }}</option>
                  <option value="yes">{{ $t("blueprintCreate.random.allowDuplicates") }}</option>
                </select>
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.RENAME_NAMES">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.namePrefix") }}</label>
                <input
                  class="form-input"
                  :value="selectedNode.data?.prefix || ''"
                  :placeholder="$t('blueprintCreate.fields.namePrefix')"
                  @input="updateNodeData(selectedNode.id, { prefix: $event.target.value })"
                />
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.nameSuffix") }}</label>
                <input
                  class="form-input"
                  :value="selectedNode.data?.suffix || ''"
                  :placeholder="$t('blueprintCreate.fields.nameSuffix')"
                  @input="updateNodeData(selectedNode.id, { suffix: $event.target.value })"
                />
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.MERGE_NAMES" class="form-group">
              <div class="info-note">{{ $t("blueprintCreate.fields.mergeHint") }}</div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.SET_LEVEL" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.levelKey") }}</label>
              <input
                class="form-input"
                :value="selectedNode.data?.levelKey || ''"
                :placeholder="$t('blueprintCreate.fields.levelsPlaceholder')"
                @input="updateNodeData(selectedNode.id, { levelKey: $event.target.value })"
              />
              <div class="quick-levels">
                <div class="quick-levels-title">{{ $t("blueprintCreate.fields.quickLevels") }}</div>
                <div class="chip-row">
                  <button
                    v-for="level in commonLevels"
                    :key="level.key"
                    class="chip-button"
                    @click="appendLevel(level.key)"
                  >
                    {{ level.label }}
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.BUILD_ARCHIVES" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.assignMode") }}</label>
              <select
                class="form-input"
                :value="selectedNode.data?.assignMode || 'roundRobin'"
                @change="updateNodeData(selectedNode.id, { assignMode: $event.target.value })"
              >
                <option value="roundRobin">
                  {{ $t("blueprintCreate.assignMode.roundRobin") }}
                </option>
                <option value="random">
                  {{ $t("blueprintCreate.assignMode.random") }}
                </option>
                <option value="first">
                  {{ $t("blueprintCreate.assignMode.first") }}
                </option>
              </select>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.SET_DIFFICULTY">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.difficulty") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.difficulty || 'normal'"
                  @change="updateNodeData(selectedNode.id, { difficulty: $event.target.value })"
                >
                  <option value="easy">{{ $t("blueprintCreate.difficulty.easy") }}</option>
                  <option value="normal">{{ $t("blueprintCreate.difficulty.normal") }}</option>
                  <option value="hard">{{ $t("blueprintCreate.difficulty.hard") }}</option>
                  <option value="nightmare">{{ $t("blueprintCreate.difficulty.nightmare") }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.actualDifficulty") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.actualDifficulty || selectedNode.data?.difficulty || 'normal'"
                  @change="updateNodeData(selectedNode.id, { actualDifficulty: $event.target.value })"
                >
                  <option value="easy">{{ $t("blueprintCreate.difficulty.easy") }}</option>
                  <option value="normal">{{ $t("blueprintCreate.difficulty.normal") }}</option>
                  <option value="hard">{{ $t("blueprintCreate.difficulty.hard") }}</option>
                  <option value="nightmare">{{ $t("blueprintCreate.difficulty.nightmare") }}</option>
                </select>
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.SET_ACTUAL_DIFFICULTY" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.actualDifficulty") }}</label>
              <select
                class="form-input"
                :value="selectedNode.data?.actualDifficulty || 'normal'"
                @change="updateNodeData(selectedNode.id, { actualDifficulty: $event.target.value })"
              >
                <option value="easy">{{ $t("blueprintCreate.difficulty.easy") }}</option>
                <option value="normal">{{ $t("blueprintCreate.difficulty.normal") }}</option>
                <option value="hard">{{ $t("blueprintCreate.difficulty.hard") }}</option>
                <option value="nightmare">{{ $t("blueprintCreate.difficulty.nightmare") }}</option>
              </select>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.PLAYER_SETUP">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">{{ $t("blueprintCreate.fields.playerCount") }}</label>
                  <input
                    class="form-input"
                    type="number"
                    min="1"
                    max="16"
                    :value="selectedNode.data?.playerCount ?? 4"
                    @input="updateNodeData(selectedNode.id, { playerCount: Number($event.target.value) })"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">{{ $t("blueprintCreate.fields.defaultSanity") }}</label>
                  <input
                    class="form-input"
                    type="number"
                    min="0"
                    max="100"
                    :value="selectedNode.data?.sanity ?? 100"
                    @input="updateNodeData(selectedNode.id, { sanity: Number($event.target.value) })"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">{{ $t("blueprintCreate.fields.playerPrefix") }}</label>
                  <input
                    class="form-input"
                    :value="selectedNode.data?.namePrefix || ''"
                    :placeholder="$t('blueprintCreate.fields.playerPrefix')"
                    @input="updateNodeData(selectedNode.id, { namePrefix: $event.target.value })"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">{{ $t("blueprintCreate.fields.playerStartIndex") }}</label>
                  <input
                    class="form-input"
                    type="number"
                    min="1"
                    :value="selectedNode.data?.startIndex ?? 1"
                    @input="updateNodeData(selectedNode.id, { startIndex: Number($event.target.value) })"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">{{ $t("blueprintCreate.fields.playerPadDigits") }}</label>
                  <input
                    class="form-input"
                    type="number"
                    min="0"
                    :value="selectedNode.data?.pad ?? 0"
                    @input="updateNodeData(selectedNode.id, { pad: Number($event.target.value) })"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.inventoryMode") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.inventoryMode || 'preset'"
                  @change="updateNodeData(selectedNode.id, { inventoryMode: $event.target.value })"
                >
                  <option value="empty">{{ $t("blueprintCreate.inventoryMode.empty") }}</option>
                  <option value="preset">{{ $t("blueprintCreate.inventoryMode.preset") }}</option>
                  <option value="custom">{{ $t("blueprintCreate.inventoryMode.custom") }}</option>
                  <option value="random">{{ $t("blueprintCreate.inventoryMode.random") }}</option>
                </select>
              </div>

              <div
                v-if="(selectedNode.data?.inventoryMode || 'preset') === 'preset'"
                class="form-group"
              >
                <label class="form-label">{{ $t("blueprintCreate.fields.inventoryPreset") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.inventoryPreset || 'starter'"
                  @change="updateNodeData(selectedNode.id, { inventoryPreset: $event.target.value })"
                >
                  <option value="starter">{{ $t("blueprintCreate.inventoryPreset.starter") }}</option>
                  <option value="medic">{{ $t("blueprintCreate.inventoryPreset.medic") }}</option>
                  <option value="scout">{{ $t("blueprintCreate.inventoryPreset.scout") }}</option>
                  <option value="survivor">{{ $t("blueprintCreate.inventoryPreset.survivor") }}</option>
                </select>
              </div>

              <div
                v-else-if="selectedNode.data?.inventoryMode === 'custom'"
                class="form-group"
              >
                <label class="form-label">{{ $t("blueprintCreate.fields.inventoryItems") }}</label>
                <textarea
                  class="form-input textarea"
                  :value="selectedNode.data?.inventoryItems || ''"
                  :placeholder="$t('blueprintCreate.fields.inventoryItemsPlaceholder')"
                  @input="updateNodeData(selectedNode.id, { inventoryItems: $event.target.value })"
                ></textarea>
              </div>

              <div
                v-else-if="selectedNode.data?.inventoryMode === 'random'"
                class="form-group"
              >
                <label class="form-label">{{ $t("blueprintCreate.fields.inventoryCount") }}</label>
                <input
                  class="form-input"
                  type="number"
                  min="1"
                  max="12"
                  :value="selectedNode.data?.inventoryCount ?? 3"
                  @input="updateNodeData(selectedNode.id, { inventoryCount: Number($event.target.value) })"
                />
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.FILTER_ARCHIVES" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.keyword") }}</label>
              <input
                class="form-input"
                :value="selectedNode.data?.keyword || ''"
                :placeholder="$t('blueprintCreate.fields.keyword')"
                @input="updateNodeData(selectedNode.id, { keyword: $event.target.value })"
              />
              <label class="form-label">{{ $t("blueprintCreate.fields.filterMode") }}</label>
              <select
                class="form-input"
                :value="selectedNode.data?.mode || 'include'"
                @change="updateNodeData(selectedNode.id, { mode: $event.target.value })"
              >
                <option value="include">{{ $t("blueprintCreate.filterMode.include") }}</option>
                <option value="exclude">{{ $t("blueprintCreate.filterMode.exclude") }}</option>
              </select>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.RENAME_ARCHIVES">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.archivePrefix") }}</label>
                <input
                  class="form-input"
                  :value="selectedNode.data?.prefix || ''"
                  :placeholder="$t('blueprintCreate.fields.archivePrefix')"
                  @input="updateNodeData(selectedNode.id, { prefix: $event.target.value })"
                />
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.archiveSuffix") }}</label>
                <input
                  class="form-input"
                  :value="selectedNode.data?.suffix || ''"
                  :placeholder="$t('blueprintCreate.fields.archiveSuffix')"
                  @input="updateNodeData(selectedNode.id, { suffix: $event.target.value })"
                />
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.LIMIT_ARCHIVES" class="form-group">
              <label class="form-label">{{ $t("blueprintCreate.fields.limitCount") }}</label>
              <input
                class="form-input"
                type="number"
                min="1"
                :value="selectedNode.data?.limit ?? 10"
                @input="updateNodeData(selectedNode.id, { limit: Number($event.target.value) })"
              />
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.RANDOM_PICK_ARCHIVES">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.randomCount") }}</label>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  :value="selectedNode.data?.count ?? 5"
                  @input="updateNodeData(selectedNode.id, { count: Number($event.target.value) })"
                />
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.allowDuplicates") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.allowDuplicates ? 'yes' : 'no'"
                  @change="updateNodeData(selectedNode.id, { allowDuplicates: $event.target.value === 'yes' })"
                >
                  <option value="no">{{ $t("blueprintCreate.random.unique") }}</option>
                  <option value="yes">{{ $t("blueprintCreate.random.allowDuplicates") }}</option>
                </select>
              </div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.MERGE_ARCHIVES" class="form-group">
              <div class="info-note">{{ $t("blueprintCreate.fields.mergeHint") }}</div>
            </div>

            <div v-else-if="selectedNode.type === nodeTypeMap.BRANCH_ARCHIVES">
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.branchField") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.field || 'name'"
                  @change="updateNodeData(selectedNode.id, { field: $event.target.value })"
                >
                  <option value="name">{{ $t("blueprintCreate.branchField.name") }}</option>
                  <option value="level">{{ $t("blueprintCreate.branchField.level") }}</option>
                  <option value="difficulty">{{ $t("blueprintCreate.branchField.difficulty") }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.branchOperator") }}</label>
                <select
                  class="form-input"
                  :value="selectedNode.data?.operator || 'contains'"
                  @change="updateNodeData(selectedNode.id, { operator: $event.target.value })"
                >
                  <option value="contains">{{ $t("blueprintCreate.branchOperator.contains") }}</option>
                  <option value="equals">{{ $t("blueprintCreate.branchOperator.equals") }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t("blueprintCreate.fields.branchValue") }}</label>
                <input
                  class="form-input"
                  :value="selectedNode.data?.value || ''"
                  :placeholder="$t('blueprintCreate.fields.branchValue')"
                  @input="updateNodeData(selectedNode.id, { value: $event.target.value })"
                />
              </div>
            </div>

            <div v-else class="form-group">
              <div class="info-note">{{ $t("blueprintCreate.properties.outputHint") }}</div>
            </div>
          </div>
        </section>

        <section class="panel-block">
          <div class="panel-title">{{ $t("blueprintCreate.preview.title") }}</div>
          <div v-if="previewErrors.length" class="message error">
            <div class="message-title">{{ $t("blueprintCreate.preview.errorTitle") }}</div>
            <ul class="message-list">
              <li v-for="(error, index) in previewErrors" :key="`err-${index}`">
                {{ getErrorMessage(error) }}
              </li>
            </ul>
          </div>

          <div v-else-if="previewArchives.length === 0" class="empty-hint">
            {{ $t("blueprintCreate.preview.empty") }}
          </div>

          <div v-else class="preview-list">
            <div v-if="previewWarnings.length" class="message warning">
              <div class="message-title">{{ $t("blueprintCreate.preview.warningTitle") }}</div>
              <ul class="message-list">
                <li v-for="(warning, index) in previewWarnings" :key="`warn-${index}`">
                  {{ getWarningMessage(warning) }}
                </li>
              </ul>
            </div>
            <div class="preview-summary">
              {{ $t("blueprintCreate.preview.showing", { count: previewArchives.length }) }}
            </div>
            <div v-for="archive in previewArchives" :key="archive.id" class="preview-card">
              <div class="preview-name">{{ archive.name }}</div>
              <div class="preview-meta">
                <span>
                  {{ getLevelName(archive.level || 'Level0') }}
                </span>
                <span>
                  {{ getDifficultyLabel(archive.difficulty || 'normal') }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-block">
          <div class="panel-title">{{ $t("blueprintCreate.templates.title") }}</div>
          <div class="form-group">
            <label class="form-label">{{ $t("blueprintCreate.templates.nameLabel") }}</label>
            <div class="form-row">
              <input
                class="form-input"
                v-model="templateName"
                :placeholder="$t('blueprintCreate.templates.namePlaceholder')"
              />
              <button class="chip-button primary" @click="saveTemplate">
                {{ $t("blueprintCreate.templates.save") }}
              </button>
            </div>
          </div>

          <div v-if="templates.length === 0" class="empty-hint">
            {{ $t("blueprintCreate.templates.empty") }}
          </div>
          <div v-else class="template-list">
            <div v-for="template in templates" :key="template.id" class="template-card">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-meta">{{ formatTemplateDate(template.createdAt) }}</div>
              <div class="template-actions">
                <button class="chip-button" @click="loadTemplate(template)">
                  {{ $t("blueprintCreate.templates.load") }}
                </button>
                <button class="chip-button danger" @click="deleteTemplate(template)">
                  {{ $t("blueprintCreate.templates.delete") }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-block">
          <div class="panel-title">{{ $t("blueprintCreate.actions.title") }}</div>
          <div class="action-row">
            <button class="primary-btn" :disabled="!canCreate" @click="createArchives">
              <font-awesome-icon v-if="isCreating" :icon="['fas', 'spinner']" spin />
              {{ isCreating ? $t("blueprintCreate.actions.creating") : $t("blueprintCreate.actions.create") }}
            </button>
            <div class="action-hint" v-if="!canCreate">
              {{ $t("blueprintCreate.actions.disabledHint") }}
            </div>
          </div>
          <div v-if="isCreating" class="progress-line">
            <div class="progress-fill" :style="{ width: `${createProgress}%` }"></div>
          </div>
          <div v-if="isCreating" class="progress-text">
            {{ $t("blueprintCreate.actions.progress", { count: createdCount, total: totalToCreate }) }}
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, markRaw } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { VueFlow, addEdge, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { notify } from "@/services/notificationService";
import storage from "@/services/storageService";
import NameListNode from "@/components/blueprint/nodes/NameListNode.vue";
import NameSequenceNode from "@/components/blueprint/nodes/NameSequenceNode.vue";
import LevelPoolNode from "@/components/blueprint/nodes/LevelPoolNode.vue";
import WeightedNamePoolNode from "@/components/blueprint/nodes/WeightedNamePoolNode.vue";
import WeightedLevelPoolNode from "@/components/blueprint/nodes/WeightedLevelPoolNode.vue";
import BuildArchivesNode from "@/components/blueprint/nodes/BuildArchivesNode.vue";
import FilterNamesNode from "@/components/blueprint/nodes/FilterNamesNode.vue";
import ReplaceNamesNode from "@/components/blueprint/nodes/ReplaceNamesNode.vue";
import DedupeNamesNode from "@/components/blueprint/nodes/DedupeNamesNode.vue";
import SortNamesNode from "@/components/blueprint/nodes/SortNamesNode.vue";
import ShuffleNamesNode from "@/components/blueprint/nodes/ShuffleNamesNode.vue";
import MergeNamesNode from "@/components/blueprint/nodes/MergeNamesNode.vue";
import RandomPickNamesNode from "@/components/blueprint/nodes/RandomPickNamesNode.vue";
import RenameNamesNode from "@/components/blueprint/nodes/RenameNamesNode.vue";
import SetLevelNode from "@/components/blueprint/nodes/SetLevelNode.vue";
import SetDifficultyNode from "@/components/blueprint/nodes/SetDifficultyNode.vue";
import SetActualDifficultyNode from "@/components/blueprint/nodes/SetActualDifficultyNode.vue";
import FilterArchivesNode from "@/components/blueprint/nodes/FilterArchivesNode.vue";
import RenameArchivesNode from "@/components/blueprint/nodes/RenameArchivesNode.vue";
import LimitArchivesNode from "@/components/blueprint/nodes/LimitArchivesNode.vue";
import MergeArchivesNode from "@/components/blueprint/nodes/MergeArchivesNode.vue";
import RandomPickArchivesNode from "@/components/blueprint/nodes/RandomPickArchivesNode.vue";
import BranchArchivesNode from "@/components/blueprint/nodes/BranchArchivesNode.vue";
import PlayerSetupNode from "@/components/blueprint/nodes/PlayerSetupNode.vue";
import ArchiveOutputNode from "@/components/blueprint/nodes/ArchiveOutputNode.vue";
import {
  runBlueprintGraph,
  MAIN_STORYLINE_LEVELS,
  NODE_TYPES,
} from "@/composables/useBlueprintGraph";

const router = useRouter();
const { t, te } = useI18n({ useScope: "global" });
const { fitView, project } = useVueFlow();

const nodeTypeMap = NODE_TYPES;
const nodeTypes = {
  nameList: markRaw(NameListNode),
  nameSequence: markRaw(NameSequenceNode),
  levelPool: markRaw(LevelPoolNode),
  weightedNamePool: markRaw(WeightedNamePoolNode),
  weightedLevelPool: markRaw(WeightedLevelPoolNode),
  buildArchives: markRaw(BuildArchivesNode),
  filterNames: markRaw(FilterNamesNode),
  replaceNames: markRaw(ReplaceNamesNode),
  dedupeNames: markRaw(DedupeNamesNode),
  sortNames: markRaw(SortNamesNode),
  shuffleNames: markRaw(ShuffleNamesNode),
  mergeNames: markRaw(MergeNamesNode),
  randomPickNames: markRaw(RandomPickNamesNode),
  setLevel: markRaw(SetLevelNode),
  setDifficulty: markRaw(SetDifficultyNode),
  setActualDifficulty: markRaw(SetActualDifficultyNode),
  filterArchives: markRaw(FilterArchivesNode),
  renameArchives: markRaw(RenameArchivesNode),
  renameNames: markRaw(RenameNamesNode),
  limitArchives: markRaw(LimitArchivesNode),
  mergeArchives: markRaw(MergeArchivesNode),
  randomPickArchives: markRaw(RandomPickArchivesNode),
  branchArchives: markRaw(BranchArchivesNode),
  playerSetup: markRaw(PlayerSetupNode),
  archiveOutput: markRaw(ArchiveOutputNode),
};

const nodeLibrary = computed(() => [
  {
    key: "source",
    title: t("blueprintCreate.library.source"),
    items: [
      {
        type: nodeTypeMap.NAME_LIST,
        title: t("blueprintCreate.nodes.nameList"),
        desc: t("blueprintCreate.nodeDesc.nameList"),
      },
      {
        type: nodeTypeMap.NAME_SEQUENCE,
        title: t("blueprintCreate.nodes.nameSequence"),
        desc: t("blueprintCreate.nodeDesc.nameSequence"),
      },
      {
        type: nodeTypeMap.LEVEL_POOL,
        title: t("blueprintCreate.nodes.levelPool"),
        desc: t("blueprintCreate.nodeDesc.levelPool"),
      },
    ],
  },
  {
    key: "randomOps",
    title: t("blueprintCreate.library.randomOps"),
    items: [
      {
        type: nodeTypeMap.WEIGHTED_NAME_POOL,
        title: t("blueprintCreate.nodes.weightedNamePool"),
        desc: t("blueprintCreate.nodeDesc.weightedNamePool"),
      },
      {
        type: nodeTypeMap.WEIGHTED_LEVEL_POOL,
        title: t("blueprintCreate.nodes.weightedLevelPool"),
        desc: t("blueprintCreate.nodeDesc.weightedLevelPool"),
      },
      {
        type: nodeTypeMap.RANDOM_PICK_NAMES,
        title: t("blueprintCreate.nodes.randomPickNames"),
        desc: t("blueprintCreate.nodeDesc.randomPickNames"),
      },
      {
        type: nodeTypeMap.RANDOM_PICK_ARCHIVES,
        title: t("blueprintCreate.nodes.randomPickArchives"),
        desc: t("blueprintCreate.nodeDesc.randomPickArchives"),
      },
    ],
  },
  {
    key: "nameOps",
    title: t("blueprintCreate.library.nameOps"),
    items: [
      {
        type: nodeTypeMap.FILTER_NAMES,
        title: t("blueprintCreate.nodes.filterNames"),
        desc: t("blueprintCreate.nodeDesc.filterNames"),
      },
      {
        type: nodeTypeMap.REPLACE_NAMES,
        title: t("blueprintCreate.nodes.replaceNames"),
        desc: t("blueprintCreate.nodeDesc.replaceNames"),
      },
      {
        type: nodeTypeMap.DEDUPE_NAMES,
        title: t("blueprintCreate.nodes.dedupeNames"),
        desc: t("blueprintCreate.nodeDesc.dedupeNames"),
      },
      {
        type: nodeTypeMap.SORT_NAMES,
        title: t("blueprintCreate.nodes.sortNames"),
        desc: t("blueprintCreate.nodeDesc.sortNames"),
      },
      {
        type: nodeTypeMap.SHUFFLE_NAMES,
        title: t("blueprintCreate.nodes.shuffleNames"),
        desc: t("blueprintCreate.nodeDesc.shuffleNames"),
      },
      {
        type: nodeTypeMap.RENAME_NAMES,
        title: t("blueprintCreate.nodes.renameNames"),
        desc: t("blueprintCreate.nodeDesc.renameNames"),
      },
      {
        type: nodeTypeMap.MERGE_NAMES,
        title: t("blueprintCreate.nodes.mergeNames"),
        desc: t("blueprintCreate.nodeDesc.mergeNames"),
      },
    ],
  },
  {
    key: "archiveOps",
    title: t("blueprintCreate.library.archiveOps"),
    items: [
      {
        type: nodeTypeMap.BUILD_ARCHIVES,
        title: t("blueprintCreate.nodes.buildArchives"),
        desc: t("blueprintCreate.nodeDesc.buildArchives"),
      },
      {
        type: nodeTypeMap.SET_LEVEL,
        title: t("blueprintCreate.nodes.setLevel"),
        desc: t("blueprintCreate.nodeDesc.setLevel"),
      },
      {
        type: nodeTypeMap.SET_DIFFICULTY,
        title: t("blueprintCreate.nodes.setDifficulty"),
        desc: t("blueprintCreate.nodeDesc.setDifficulty"),
      },
      {
        type: nodeTypeMap.SET_ACTUAL_DIFFICULTY,
        title: t("blueprintCreate.nodes.setActualDifficulty"),
        desc: t("blueprintCreate.nodeDesc.setActualDifficulty"),
      },
      {
        type: nodeTypeMap.FILTER_ARCHIVES,
        title: t("blueprintCreate.nodes.filterArchives"),
        desc: t("blueprintCreate.nodeDesc.filterArchives"),
      },
      {
        type: nodeTypeMap.RENAME_ARCHIVES,
        title: t("blueprintCreate.nodes.renameArchives"),
        desc: t("blueprintCreate.nodeDesc.renameArchives"),
      },
      {
        type: nodeTypeMap.LIMIT_ARCHIVES,
        title: t("blueprintCreate.nodes.limitArchives"),
        desc: t("blueprintCreate.nodeDesc.limitArchives"),
      },
      {
        type: nodeTypeMap.MERGE_ARCHIVES,
        title: t("blueprintCreate.nodes.mergeArchives"),
        desc: t("blueprintCreate.nodeDesc.mergeArchives"),
      },
      {
        type: nodeTypeMap.PLAYER_SETUP,
        title: t("blueprintCreate.nodes.playerSetup"),
        desc: t("blueprintCreate.nodeDesc.playerSetup"),
      },
    ],
  },
  {
    key: "logicOps",
    title: t("blueprintCreate.library.logicOps"),
    items: [
      {
        type: nodeTypeMap.BRANCH_ARCHIVES,
        title: t("blueprintCreate.nodes.branchArchives"),
        desc: t("blueprintCreate.nodeDesc.branchArchives"),
      },
    ],
  },
  {
    key: "output",
    title: t("blueprintCreate.library.output"),
    items: [
      {
        type: nodeTypeMap.ARCHIVE_OUTPUT,
        title: t("blueprintCreate.nodes.archiveOutput"),
        desc: t("blueprintCreate.nodeDesc.archiveOutput"),
      },
    ],
  },
]);

const initialNodes = [
  {
    id: "n1",
    type: nodeTypeMap.NAME_LIST,
    position: { x: 40, y: 80 },
    data: {
      namesText: "存档01\n存档02\n存档03",
    },
  },
  {
    id: "n2",
    type: nodeTypeMap.LEVEL_POOL,
    position: { x: 40, y: 250 },
    data: {
      levelsText: "Level0\nTheHub\nPoolrooms",
    },
  },
  {
    id: "n3",
    type: nodeTypeMap.BUILD_ARCHIVES,
    position: { x: 320, y: 160 },
    data: {
      assignMode: "roundRobin",
    },
  },
  {
    id: "n4",
    type: nodeTypeMap.SET_DIFFICULTY,
    position: { x: 600, y: 160 },
    data: {
      difficulty: "normal",
      actualDifficulty: "normal",
    },
  },
  {
    id: "n5",
    type: nodeTypeMap.ARCHIVE_OUTPUT,
    position: { x: 880, y: 160 },
    data: {},
  },
];

const initialEdges = [
  { id: "e1", source: "n1", target: "n3", targetHandle: "names" },
  { id: "e2", source: "n2", target: "n3", targetHandle: "levels" },
  { id: "e3", source: "n3", target: "n4", targetHandle: "in" },
  { id: "e4", source: "n4", target: "n5", targetHandle: "in" },
];

const nodes = ref(initialNodes);
const edges = ref(initialEdges);
const selectedNodeId = ref(null);
const previewArchives = ref([]);
const previewErrors = ref([]);
const previewWarnings = ref([]);
const isCreating = ref(false);
const createProgress = ref(0);
const createdCount = ref(0);
const totalToCreate = ref(0);
const flowWrapper = ref(null);
const blueprintModeEnabled = ref(
  storage.getItem("blueprintModeEnabled", false) === true ||
    storage.getItem("blueprintModeEnabled") === "true"
);
const templates = ref([]);
const templateName = ref("");
const TEMPLATE_STORAGE_KEY = "etb_blueprint_templates";

const selectedNode = computed(() => {
  if (selectedNodeId.value) {
    return nodes.value.find((node) => node.id === selectedNodeId.value) || null;
  }
  return nodes.value.find((node) => node.selected) || null;
});

const nodeCounter = ref(6);
const edgeCounter = ref(5);
const lastAddPos = ref({ x: 120, y: 120 });
const PREVIEW_LIMIT = 8;

const loadTemplates = () => {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    templates.value = raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("加载蓝图模板失败:", error);
    templates.value = [];
  }
};

const persistTemplates = () => {
  try {
    localStorage.setItem(
      TEMPLATE_STORAGE_KEY,
      JSON.stringify(templates.value)
    );
  } catch (error) {
    console.warn("保存蓝图模板失败:", error);
  }
};

const snapshotNodes = () =>
  nodes.value.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: node.position?.x ?? 0, y: node.position?.y ?? 0 },
    data: { ...(node.data || {}) },
  }));

const snapshotEdges = () =>
  edges.value.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    type: edge.type || "smoothstep",
  }));

const syncCounters = () => {
  const maxNodeId = nodes.value.reduce((max, node) => {
    const match = String(node.id || "").match(/\d+/);
    const value = match ? Number(match[0]) : 0;
    return Math.max(max, Number.isFinite(value) ? value : 0);
  }, 0);
  const maxEdgeId = edges.value.reduce((max, edge) => {
    const match = String(edge.id || "").match(/\d+/);
    const value = match ? Number(match[0]) : 0;
    return Math.max(max, Number.isFinite(value) ? value : 0);
  }, 0);
  nodeCounter.value = maxNodeId + 1;
  edgeCounter.value = maxEdgeId + 1;

  const maxPos = nodes.value.reduce(
    (acc, node) => ({
      x: Math.max(acc.x, node.position?.x ?? 0),
      y: Math.max(acc.y, node.position?.y ?? 0),
    }),
    { x: 120, y: 120 }
  );
  lastAddPos.value = { x: maxPos.x + 40, y: maxPos.y + 40 };
};

const formatTemplateDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

const saveTemplate = () => {
  const name = templateName.value.trim();
  const finalName =
    name || t("blueprintCreate.templates.untitled", { index: templates.value.length + 1 });
  const template = {
    id: `tpl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: finalName,
    createdAt: Date.now(),
    nodes: snapshotNodes(),
    edges: snapshotEdges(),
  };
  templates.value = [template, ...templates.value];
  persistTemplates();
  templateName.value = "";
  notify.success(t("blueprintCreate.templates.saved"));
};

const loadTemplate = (template) => {
  if (!template) return;
  nodes.value = (template.nodes || []).map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...(node.data || {}) },
  }));
  edges.value = (template.edges || []).map((edge) => ({ ...edge }));
  selectedNodeId.value = null;
  syncCounters();
  runPreview();
  notify.success(t("blueprintCreate.templates.loaded", { name: template.name }));
};

const deleteTemplate = (template) => {
  if (!template) return;
  const ok = window.confirm(
    t("blueprintCreate.templates.deleteConfirm", { name: template.name })
  );
  if (!ok) return;
  templates.value = templates.value.filter((item) => item.id !== template.id);
  persistTemplates();
  notify.success(t("blueprintCreate.templates.deleted", { name: template.name }));
};

const getNodeLabel = (type) => {
  switch (type) {
    case nodeTypeMap.NAME_LIST:
      return t("blueprintCreate.nodes.nameList");
    case nodeTypeMap.NAME_SEQUENCE:
      return t("blueprintCreate.nodes.nameSequence");
    case nodeTypeMap.LEVEL_POOL:
      return t("blueprintCreate.nodes.levelPool");
    case nodeTypeMap.WEIGHTED_NAME_POOL:
      return t("blueprintCreate.nodes.weightedNamePool");
    case nodeTypeMap.WEIGHTED_LEVEL_POOL:
      return t("blueprintCreate.nodes.weightedLevelPool");
    case nodeTypeMap.BUILD_ARCHIVES:
      return t("blueprintCreate.nodes.buildArchives");
    case nodeTypeMap.FILTER_NAMES:
      return t("blueprintCreate.nodes.filterNames");
    case nodeTypeMap.RENAME_NAMES:
      return t("blueprintCreate.nodes.renameNames");
    case nodeTypeMap.REPLACE_NAMES:
      return t("blueprintCreate.nodes.replaceNames");
    case nodeTypeMap.DEDUPE_NAMES:
      return t("blueprintCreate.nodes.dedupeNames");
    case nodeTypeMap.SORT_NAMES:
      return t("blueprintCreate.nodes.sortNames");
    case nodeTypeMap.SHUFFLE_NAMES:
      return t("blueprintCreate.nodes.shuffleNames");
    case nodeTypeMap.MERGE_NAMES:
      return t("blueprintCreate.nodes.mergeNames");
    case nodeTypeMap.RANDOM_PICK_NAMES:
      return t("blueprintCreate.nodes.randomPickNames");
    case nodeTypeMap.SET_LEVEL:
      return t("blueprintCreate.nodes.setLevel");
    case nodeTypeMap.SET_DIFFICULTY:
      return t("blueprintCreate.nodes.setDifficulty");
    case nodeTypeMap.SET_ACTUAL_DIFFICULTY:
      return t("blueprintCreate.nodes.setActualDifficulty");
    case nodeTypeMap.FILTER_ARCHIVES:
      return t("blueprintCreate.nodes.filterArchives");
    case nodeTypeMap.RENAME_ARCHIVES:
      return t("blueprintCreate.nodes.renameArchives");
    case nodeTypeMap.LIMIT_ARCHIVES:
      return t("blueprintCreate.nodes.limitArchives");
    case nodeTypeMap.MERGE_ARCHIVES:
      return t("blueprintCreate.nodes.mergeArchives");
    case nodeTypeMap.RANDOM_PICK_ARCHIVES:
      return t("blueprintCreate.nodes.randomPickArchives");
    case nodeTypeMap.BRANCH_ARCHIVES:
      return t("blueprintCreate.nodes.branchArchives");
    case nodeTypeMap.PLAYER_SETUP:
      return t("blueprintCreate.nodes.playerSetup");
    case nodeTypeMap.ARCHIVE_OUTPUT:
      return t("blueprintCreate.nodes.archiveOutput");
    default:
      return type;
  }
};

const getLevelName = (levelKey) => {
  const translationKey = `LevelName_Display.${levelKey}`;
  return te(translationKey) ? t(translationKey) : levelKey;
};

const commonLevels = computed(() =>
  MAIN_STORYLINE_LEVELS.map((key) => ({ key, label: getLevelName(key) }))
);

const addNode = (type, positionOverride) => {
  const id = `n${nodeCounter.value++}`;
  const position = positionOverride || { ...lastAddPos.value };
  lastAddPos.value = {
    x: lastAddPos.value.x + 40,
    y: lastAddPos.value.y + 40,
  };

  const defaultDataMap = {
    [nodeTypeMap.NAME_LIST]: { namesText: "" },
    [nodeTypeMap.NAME_SEQUENCE]: {
      prefix: "存档",
      start: 1,
      count: 5,
      pad: 2,
    },
    [nodeTypeMap.LEVEL_POOL]: { levelsText: "" },
    [nodeTypeMap.WEIGHTED_NAME_POOL]: { entriesText: "", count: 6 },
    [nodeTypeMap.WEIGHTED_LEVEL_POOL]: { entriesText: "", count: 6 },
    [nodeTypeMap.BUILD_ARCHIVES]: { assignMode: "roundRobin" },
    [nodeTypeMap.FILTER_NAMES]: { keyword: "", mode: "include" },
    [nodeTypeMap.REPLACE_NAMES]: { search: "", replace: "" },
    [nodeTypeMap.DEDUPE_NAMES]: {},
    [nodeTypeMap.SORT_NAMES]: { order: "asc" },
    [nodeTypeMap.SHUFFLE_NAMES]: {},
    [nodeTypeMap.RENAME_NAMES]: { prefix: "", suffix: "" },
    [nodeTypeMap.MERGE_NAMES]: {},
    [nodeTypeMap.RANDOM_PICK_NAMES]: { count: 5, allowDuplicates: false },
    [nodeTypeMap.SET_LEVEL]: { levelKey: "" },
    [nodeTypeMap.SET_DIFFICULTY]: {
      difficulty: "normal",
      actualDifficulty: "normal",
    },
    [nodeTypeMap.SET_ACTUAL_DIFFICULTY]: { actualDifficulty: "normal" },
    [nodeTypeMap.FILTER_ARCHIVES]: { keyword: "", mode: "include" },
    [nodeTypeMap.RENAME_ARCHIVES]: { prefix: "", suffix: "" },
    [nodeTypeMap.LIMIT_ARCHIVES]: { limit: 10 },
    [nodeTypeMap.MERGE_ARCHIVES]: {},
    [nodeTypeMap.RANDOM_PICK_ARCHIVES]: { count: 5, allowDuplicates: false },
    [nodeTypeMap.BRANCH_ARCHIVES]: {
      field: "name",
      operator: "contains",
      value: "",
    },
    [nodeTypeMap.PLAYER_SETUP]: {
      playerCount: 4,
      namePrefix: "Player",
      startIndex: 1,
      pad: 0,
      sanity: 100,
      inventoryMode: "preset",
      inventoryPreset: "starter",
      inventoryItems: "",
      inventoryCount: 3,
    },
    [nodeTypeMap.ARCHIVE_OUTPUT]: {},
  };

  nodes.value.push({
    id,
    type,
    position,
    data: { ...(defaultDataMap[type] || {}) },
  });
};

const updateNodeData = (nodeId, patch) => {
  nodes.value = nodes.value.map((node) =>
    node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node
  );
};

const onDragStart = (event, nodeType) => {
  event.dataTransfer?.setData("application/vueflow", nodeType);
  event.dataTransfer?.setData("text/plain", nodeType);
  event.dataTransfer.effectAllowed = "move";
};

const onDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

const onDrop = (event) => {
  event.preventDefault();
  const nodeType = event.dataTransfer?.getData("application/vueflow");
  if (!nodeType || !flowWrapper.value) return;
  const bounds = flowWrapper.value.getBoundingClientRect();
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  });
  addNode(nodeType, position);
};

const removeNode = (nodeId) => {
  nodes.value = nodes.value.filter((node) => node.id !== nodeId);
  edges.value = edges.value.filter(
    (edge) => edge.source !== nodeId && edge.target !== nodeId
  );
  if (selectedNodeId.value === nodeId) selectedNodeId.value = null;
};

const onConnect = (params) => {
  edges.value = addEdge(
    { ...params, id: `e${edgeCounter.value++}` },
    edges.value
  );
};

const onNodeClick = ({ node }) => {
  selectedNodeId.value = node.id;
};

const onPaneClick = () => {
  selectedNodeId.value = null;
};

const resetGraph = () => {
  nodes.value = initialNodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  }));
  edges.value = [...initialEdges];
  selectedNodeId.value = null;
  lastAddPos.value = { x: 120, y: 120 };
};

const handleFitView = () => {
  fitView({ padding: 0.2, duration: 300 });
};

const parseList = (text = "") =>
  text
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

const appendLevel = (levelKey) => {
  if (!selectedNode.value) return;
  if (selectedNode.value.type === nodeTypeMap.LEVEL_POOL) {
    const current = selectedNode.value.data?.levelsText || "";
    const set = new Set(parseList(current));
    set.add(levelKey);
    updateNodeData(selectedNode.value.id, {
      levelsText: Array.from(set).join("\n"),
    });
    return;
  }
  if (selectedNode.value.type === nodeTypeMap.SET_LEVEL) {
    updateNodeData(selectedNode.value.id, {
      levelKey,
    });
  }
};

const selectedNodes = computed(() => nodes.value.filter((node) => node.selected));
const selectedEdges = computed(() => edges.value.filter((edge) => edge.selected));

const isEditableTarget = (event) => {
  const target = event.target;
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
};

const removeSelection = () => {
  if (selectedNodes.value.length === 0 && selectedEdges.value.length === 0) return;
  const nodeIds = new Set(selectedNodes.value.map((node) => node.id));
  const edgeIds = new Set(selectedEdges.value.map((edge) => edge.id));
  nodes.value = nodes.value.filter((node) => !nodeIds.has(node.id));
  edges.value = edges.value.filter(
    (edge) =>
      !edgeIds.has(edge.id) &&
      !nodeIds.has(edge.source) &&
      !nodeIds.has(edge.target)
  );
  selectedNodeId.value = null;
};

const duplicateSelection = () => {
  if (selectedNodes.value.length === 0) return;
  const nodeIdMap = new Map();
  const newNodes = selectedNodes.value.map((node) => {
    const newId = `n${nodeCounter.value++}`;
    nodeIdMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
      position: {
        x: node.position.x + 40,
        y: node.position.y + 40,
      },
      data: { ...(node.data || {}) },
      selected: false,
    };
  });
  const newEdges = edges.value
    .filter((edge) => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
    .map((edge) => ({
      ...edge,
      id: `e${edgeCounter.value++}`,
      source: nodeIdMap.get(edge.source),
      target: nodeIdMap.get(edge.target),
      selected: false,
    }));
  nodes.value = [...nodes.value, ...newNodes];
  edges.value = [...edges.value, ...newEdges];
};

const nudgeSelection = (dx, dy) => {
  if (selectedNodes.value.length === 0) return;
  nodes.value = nodes.value.map((node) => {
    if (!node.selected) return node;
    return {
      ...node,
      position: {
        x: node.position.x + dx,
        y: node.position.y + dy,
      },
    };
  });
};

const handleKeyDown = (event) => {
  if (isEditableTarget(event)) return;

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    removeSelection();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
    event.preventDefault();
    duplicateSelection();
    return;
  }

  const step = event.shiftKey ? 1 : 10;
  if (event.key === "ArrowUp") {
    event.preventDefault();
    nudgeSelection(0, -step);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    nudgeSelection(0, step);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    nudgeSelection(-step, 0);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    nudgeSelection(step, 0);
  }
};

const runPreview = () => {
  const result = runBlueprintGraph({
    nodes: nodes.value,
    edges: edges.value,
    limit: PREVIEW_LIMIT,
  });
  previewArchives.value = result.archives || [];
  previewErrors.value = result.errors || [];
  previewWarnings.value = result.warnings || [];
};

const handleBlueprintModeToggle = (event) => {
  if (event?.detail && typeof event.detail.enabled === "boolean") {
    blueprintModeEnabled.value = event.detail.enabled;
    return;
  }
  blueprintModeEnabled.value =
    storage.getItem("blueprintModeEnabled", false) === true ||
    storage.getItem("blueprintModeEnabled") === "true";
};

let previewTimer = null;
watch(
  [nodes, edges],
  () => {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(runPreview, 160);
  },
  { deep: true }
);

onMounted(runPreview);
onMounted(loadTemplates);
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("blueprint-mode-toggle", handleBlueprintModeToggle);
});
onUnmounted(() => {
  if (previewTimer) clearTimeout(previewTimer);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("blueprint-mode-toggle", handleBlueprintModeToggle);
});

const getErrorMessage = (error) => {
  switch (error.code) {
    case "missing_output":
      return t("blueprintCreate.errors.missingOutput");
    case "multiple_outputs":
      return t("blueprintCreate.errors.multipleOutputs");
    case "cycle_detected":
      return t("blueprintCreate.errors.cycleDetected");
    case "missing_names_input":
      return t("blueprintCreate.errors.missingNamesInput");
    case "missing_filter_input":
      return t("blueprintCreate.errors.missingFilterInput");
    case "missing_branch_input":
      return t("blueprintCreate.errors.missingBranchInput");
    case "missing_archive_input":
      return t("blueprintCreate.errors.missingArchiveInput");
    case "missing_archive_output_input":
      return t("blueprintCreate.errors.missingArchiveOutputInput");
    case "unknown_node_type":
      return t("blueprintCreate.errors.unknownNodeType");
    default:
      return t("blueprintCreate.errors.unknownNodeType");
  }
};

const getWarningMessage = (warning) => {
  switch (warning.code) {
    case "unknown_node_type":
      return t("blueprintCreate.warnings.unknownNodeType");
    default:
      return t("blueprintCreate.warnings.unknownNodeType");
  }
};

const getDifficultyLabel = (difficulty) => {
  switch (difficulty) {
    case "easy":
      return t("blueprintCreate.difficulty.easy");
    case "hard":
      return t("blueprintCreate.difficulty.hard");
    case "nightmare":
      return t("blueprintCreate.difficulty.nightmare");
    default:
      return t("blueprintCreate.difficulty.normal");
  }
};

const canCreate = computed(() => {
  return (
    !isCreating.value &&
    previewErrors.value.length === 0 &&
    previewArchives.value.length > 0
  );
});

const formatDifficulty = (difficulty) => {
  if (!difficulty) return "Normal";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
};

const loadBasicArchive = async () => {
  try {
    const response = await fetch("/BasicArchive.json");
    if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("读取 BasicArchive.json 失败:", error);
    return null;
  }
};

const createSingleArchive = async (archive, basicArchive) => {
  const { invoke } = await import("@tauri-apps/api/core");

  const level = archive.level || "Level0";
  const isSideStoryline = !MAIN_STORYLINE_LEVELS.includes(level);
  const megLevels = [
    "Level0",
    "TopFloor",
    "MiddleFloor",
    "GarageLevel2",
    "BottomFloor",
    "TheHub",
  ];
  const isMEGUnlocked = !megLevels.includes(level);

  const saveData = {
    archive_name: archive.name,
    level,
    game_mode: "multiplayer",
    difficulty: formatDifficulty(archive.difficulty),
    actual_difficulty: formatDifficulty(
      archive.actualDifficulty || archive.difficulty
    ),
    players: archive.players || [],
    basic_archive: basicArchive,
    main_ending: isSideStoryline,
    meg_unlocked: isMEGUnlocked,
  };

  await invoke("handle_new_save", { saveData });
};

const createArchives = async () => {
  if (isCreating.value) return;
  const result = runBlueprintGraph({
    nodes: nodes.value,
    edges: edges.value,
  });

  if (result.errors.length > 0) {
    notify.error(t("blueprintCreate.messages.fixErrors"));
    return;
  }

  if (!result.archives.length) {
    notify.warning(t("blueprintCreate.messages.noArchives"));
    return;
  }

  const invalidNames = result.archives.filter((archive) => {
    const name = archive.name || "";
    return name.trim() === "" || name.includes("_");
  });
  if (invalidNames.length > 0) {
    notify.error(
      t("blueprintCreate.messages.invalidNames", {
        count: invalidNames.length,
      })
    );
    return;
  }

  const basicArchive = await loadBasicArchive();
  if (!basicArchive) {
    notify.error(t("blueprintCreate.messages.templateMissing"));
    return;
  }

  isCreating.value = true;
  createdCount.value = 0;
  totalToCreate.value = result.archives.length;
  createProgress.value = 0;

  try {
    for (const archive of result.archives) {
      await createSingleArchive(
        { ...archive, name: archive.name.trim() },
        basicArchive
      );
      createdCount.value += 1;
      createProgress.value = Math.round(
        (createdCount.value / totalToCreate.value) * 100
      );
    }
    notify.success(
      t("blueprintCreate.messages.createSuccess", {
        count: createdCount.value,
      })
    );
  } catch (error) {
    notify.error(
      t("blueprintCreate.messages.createFailed", {
        error: error.message || String(error),
      })
    );
  } finally {
    isCreating.value = false;
  }
};

const goBack = () => {
  router.push("/select-create-mode");
};
</script>

<style scoped>
.blueprint-create-container {
  --bp-bg: color-mix(in srgb, var(--bg) 18%, #0b0f15 82%);
  --bp-panel: color-mix(in srgb, var(--bg-secondary) 20%, #121826 80%);
  --bp-panel-border: rgba(120, 150, 220, 0.22);
  --bp-panel-highlight: rgba(70, 110, 200, 0.22);
  --bp-canvas: color-mix(in srgb, var(--bg) 12%, #0a0f17 88%);
  --bp-grid: rgba(90, 130, 220, 0.22);
  --bp-node-bg: color-mix(in srgb, var(--bg-tertiary) 20%, #121a28 80%);
  --bp-node-border: rgba(120, 160, 255, 0.25);
  height: calc(100vh - 38px);
  padding: 56px 24px 24px;
  background: radial-gradient(circle at 20% 0%, rgba(70, 110, 200, 0.12), transparent 55%),
    radial-gradient(circle at 80% 10%, rgba(30, 60, 140, 0.12), transparent 50%),
    var(--bp-bg);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(10, 14, 22, 0.85);
  border: 1px solid var(--bp-panel-border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.back-button:hover {
  background: rgba(20, 28, 40, 0.9);
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.back-button.prominent {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35),
    0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
}

.back-button.prominent:hover {
  transform: translateY(-1px);
  color: #fff;
  background: linear-gradient(135deg, var(--accent-hover), var(--accent-color));
}

.blueprint-workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 320px;
  gap: 16px;
  min-height: 0;
}

.coming-soon-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.coming-soon-card {
  max-width: 480px;
  text-align: center;
  padding: 24px 28px;
  border-radius: 18px;
  border: 1px solid var(--bp-panel-border);
  background: linear-gradient(160deg, rgba(10, 14, 22, 0.9), rgba(18, 24, 38, 0.88));
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
}

.coming-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.coming-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.panel {
  background: linear-gradient(165deg,
      var(--bp-panel) 0%,
      rgba(8, 12, 18, 0.85) 100%);
  border-radius: 18px;
  border: 1px solid var(--bp-panel-border);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.library-panel {
  padding: 16px;
  overflow-y: auto;
}

.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(220, 230, 255, 0.95);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.panel-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 14px 0;
}

.library-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(150, 175, 220, 0.9);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.node-item {
  text-align: left;
  border: 1px solid rgba(120, 150, 220, 0.25);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(10, 14, 22, 0.7);
  cursor: grab;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.node-item:last-child {
  margin-bottom: 0;
}

.node-item:hover {
  border-color: rgba(var(--accent-color-rgb), 0.6);
  box-shadow: 0 0 0 1px rgba(var(--accent-color-rgb), 0.4),
    0 6px 14px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}

.node-item:active {
  cursor: grabbing;
}

.node-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.node-item-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.canvas-panel {
  padding: 0;
  overflow: hidden;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(120, 150, 220, 0.2);
  background: rgba(8, 12, 18, 0.7);
}

.toolbar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(120, 150, 220, 0.3);
  background: rgba(10, 14, 22, 0.8);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  color: var(--accent-color);
  border-color: var(--accent-color);
}

.toolbar-btn.danger:hover {
  color: var(--error-color);
  border-color: var(--error-color);
}

.canvas-shell {
  flex: 1;
  min-height: 0;
}

.blueprint-flow {
  height: 100%;
  background: radial-gradient(circle at 20% 0%, rgba(70, 110, 200, 0.12), transparent 55%),
    var(--bp-canvas);
}

:deep(.vue-flow__edge-path) {
  stroke: rgba(120, 160, 255, 0.55);
  stroke-width: 2px;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: var(--accent-color);
}

:deep(.vue-flow__controls) {
  background: rgba(10, 14, 22, 0.9);
  border: 1px solid rgba(120, 150, 220, 0.3);
  border-radius: 10px;
  padding: 4px;
}

:deep(.vue-flow__controls-button) {
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
}

:deep(.vue-flow__controls-button:hover) {
  color: var(--accent-color);
}

.side-panel {
  padding: 16px;
  overflow-y: auto;
  gap: 14px;
}

.panel-block {
  background: rgba(8, 12, 18, 0.7);
  border-radius: 14px;
  padding: 12px;
  border: 1px solid rgba(120, 150, 220, 0.2);
}

.empty-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.property-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.property-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 13px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(120, 150, 220, 0.2);
  background: rgba(10, 14, 22, 0.85);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.15);
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-row .form-input {
  flex: 1;
}

.form-row .form-group {
  flex: 1;
}

.quick-levels {
  margin-top: 6px;
}

.quick-levels-title {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-button {
  border: 1px solid rgba(120, 150, 220, 0.28);
  background: rgba(8, 12, 18, 0.7);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip-button:hover {
  color: var(--accent-color);
  border-color: rgba(var(--accent-color-rgb), 0.4);
}

.chip-button.primary {
  color: white;
  background: var(--accent-color);
  border-color: transparent;
}

.chip-button.primary:hover {
  background: var(--accent-hover);
  color: white;
}

.chip-button.danger:hover {
  color: var(--error-color);
  border-color: rgba(239, 68, 68, 0.6);
}

.info-note {
  font-size: 12px;
  color: var(--text-tertiary);
}

.message {
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
}

.message.error {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

.message.warning {
  background: rgba(245, 158, 11, 0.12);
  color: #fcd34d;
}

.message-title {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 12px;
}

.message-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-summary {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-card {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(120, 150, 220, 0.2);
  background: rgba(10, 14, 22, 0.7);
}

.preview-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.preview-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary);
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-card {
  border-radius: 10px;
  padding: 10px;
  border: 1px solid rgba(120, 150, 220, 0.2);
  background: rgba(10, 14, 22, 0.7);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.template-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.template-meta {
  font-size: 11px;
  color: var(--text-tertiary);
}

.template-actions {
  display: flex;
  gap: 6px;
}

.action-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  background: var(--accent-color);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}

.progress-line {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-hover));
}

.progress-text {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
}

@media (max-width: 1280px) {
  .blueprint-workspace {
    grid-template-columns: 220px minmax(0, 1fr) 300px;
  }
}

@media (max-width: 1100px) {
  .blueprint-workspace {
    grid-template-columns: 1fr;
  }

  .library-panel,
  .side-panel {
    display: none;
  }
}
</style>
