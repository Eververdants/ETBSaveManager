<template>
  <Transition name="modal" appear>
    <div v-if="show" class="edit-modal-overlay" @mousedown.self="handleOverlayClick">
      <div class="edit-modal" :class="{ 'light-mode': lightMode }" ref="modalRef">
        <div class="modal-header">
          <h2>编辑存档</h2>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-content">
          <!-- 基本信息板块 -->
          <div class="section">
            <div class="section-header">
              <i class="fas fa-info-circle"></i>
              <h3>基本信息</h3>
            </div>
            <div class="section-content scrollable">
              <div class="form-group">
                <label for="archive-name">存档名称</label>
                <div class="input-wrapper">
                  <input 
                    id="archive-name" 
                    type="text" 
                    v-model="editedArchive.name" 
                    :class="{ 'light-mode': lightMode }"
                  >
                </div>
              </div>

              <div class="form-group">
                <label>存档难度</label>
                <CustomSelect 
                  v-model="editedArchive.difficulty"
                  :options="difficultyOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>实际难度</label>
                <CustomSelect 
                  v-model="editedArchive.actualDifficulty"
                  :options="difficultyOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>游戏模式</label>
                <CustomSelect 
                  v-model="editedArchive.mode"
                  :options="modeOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>状态</label>
                <CustomSelect 
                  v-model="editedArchive.hidden"
                  :options="visibilityOptions"
                  :light-mode="lightMode"
                />
              </div>
            </div>
          </div>

          <!-- 具体数据板块 -->
          <div class="section">
            <div class="section-header">
              <i class="fas fa-chart-bar"></i>
              <h3>具体数据</h3>
            </div>
            <div class="section-nav">
              <button 
                :class="{ active: activeDataSection === 'level' }"
                @click="scrollToSection('level')"
              >
                <i class="fas fa-layer-group"></i> 层级修改
              </button>
              <button 
                :class="{ active: activeDataSection === 'inventory' }"
                @click="scrollToSection('inventory')"
              >
                <i class="fas fa-backpack"></i> 玩家背包
              </button>
            </div>
            <div class="section-content scrollable" ref="dataSection" @scroll="handleSectionScroll">
              <!-- 层级修改部分 -->
              <div class="data-section" id="level-section">
                <h4>层级修改</h4>
                <div class="form-group">
                  <label>当前层级</label>
                  <CustomSelect 
                    v-model="editedArchive.currentLevel"
                    :options="levelOptions"
                    :light-mode="lightMode"
                  />
                </div>
              </div>

              <!-- 玩家背包部分 -->
              <div class="data-section" id="inventory-section">
                <h4>玩家背包</h4>
                <div class="player-selector">
                  <label>选择玩家</label>
                  <CustomSelect 
                    v-model="selectedPlayer"
                    :options="playerOptions"
                    :light-mode="lightMode"
                  />
                </div>
                <div class="inventory-grid">
                  <div 
                    v-for="(slot, index) in currentPlayerInventory" 
                    :key="index" 
                    class="inventory-slot"
                    @click="openItemMenu($event, index)"
                  >
                    <template v-if="slot.item">
                      <div class="item-icon" :style="{ backgroundImage: `url(${slot.item.icon})` }"></div>
                    </template>
                    <!-- 空格子不显示任何符号 -->
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 层级信息板块 -->
          <div class="section">
            <div class="section-header">
              <i class="fas fa-map-marked-alt"></i>
              <h3>层级信息</h3>
            </div>
            <div class="section-content scrollable">
              <h3 class="level-name">Level 0</h3>
              <div class="form-group">
                <label>梯子数量</label>
                <div class="input-wrapper">
                  <input 
                    type="number" 
                    v-model="levelInfo.entityCount" 
                    min="0"
                    max="4"
                    :class="{ 'light-mode': lightMode }"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn cancel-btn" @click="closeModal">取消编辑</button>
          <button class="btn confirm-btn" @click="saveChanges">确认编辑</button>
        </div>

        <!-- 物品选择菜单 -->
        <ItemMenu 
          v-if="showItemMenu"
          :position="itemMenuPosition"
          :items="itemOptions"
          @select="selectItem"
          @close="closeItemMenu"
          :light-mode="lightMode"
          ref="itemMenuRef"
        />
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, reactive, watch, onMounted, computed } from 'vue';
import gsap from 'gsap';
import CustomSelect from './LG_CustomSelect.vue';
import ItemMenu from './LG_ItemMenu.vue';

// 物品选项定义在组件外部
const itemOptions = [
  { id: 1, name: '浓缩杏仁水', icon: './icons/ETB_UI/T_UI_Inv_Icon_AlmondConcentrate.png' },
  { id: 2, name: '杀虫剂', icon: './icons/ETB_UI/T_UI_Inv_Icon_BugSpray.png' },
  { id: 3, name: '摄像机', icon: './icons/ETB_UI/T_UI_Inv_Icon_Camera.png' },
  { id: 4, name: '杏仁水', icon: './icons/ETB_UI/T_UI_Inv_Icon_Can.png' },
  { id: 5, name: '电锯', icon: './icons/ETB_UI/T_UI_Inv_Icon_Chainsaw.png' },
  { id: 6, name: '潜水头盔', icon: './icons/ETB_UI/T_UI_Inv_Icon_DivingHelmet.png' },
  { id: 7, name: '能量棒', icon: './icons/ETB_UI/T_UI_Inv_Icon_EnergyBar.png' },
  { id: 8, name: '烟花', icon: './icons/ETB_UI/T_UI_Inv_Icon_Firework.png' },
  { id: 9, name: '信号枪', icon: './icons/ETB_UI/T_UI_Inv_Icon_FlareGun.png' },
  { id: 10, name: '手电筒', icon: './icons/ETB_UI/T_UI_Inv_Icon_Flashlight.png' },
  { id: 11, name: '蓝色荧光棒', icon: './icons/ETB_UI/T_UI_Inv_Icon_GlowStick__Blue.png' },
  { id: 12, name: '绿色荧光棒', icon: './icons/ETB_UI/T_UI_Inv_Icon_GlowStick_Green.png' },
  { id: 13, name: '红色荧光棒', icon: './icons/ETB_UI/T_UI_Inv_Icon_GlowStick_Red.png' },
  { id: 14, name: '黄色荧光棒', icon: './icons/ETB_UI/T_UI_Inv_Icon_GlowStick_Yellow.png' },
  { id: 15, name: '果汁', icon: './icons/ETB_UI/T_UI_Inv_Icon_Juice_v2png.png' },
  { id: 16, name: '液体痛苦', icon: './icons/ETB_UI/T_UI_Inv_Icon_Juice.png' },
  { id: 17, name: '绳索', icon: './icons/ETB_UI/T_UI_Inv_Icon_Rope.png' },
  { id: 18, name: '扫描仪', icon: './icons/ETB_UI/T_UI_Inv_Icon_Scanner.png' },
  { id: 19, name: '温度计', icon: './icons/ETB_UI/T_UI_Inv_Icon_Thermometer.png' },
  { id: 20, name: '票', icon: './icons/ETB_UI/T_UI_Inv_Icon_Ticket.png' },
  { id: 21, name: '对讲机', icon: './icons/ETB_UI/T_UI_Inv_Icon_WalkieTalkie.png' },
  { id: 22, name: '飞蛾果冻', icon: './icons/ETB_UI/T_UI_Inv_Icon_WaxBar.png' },
  { id: 23, name: '撬棍', icon: './icons/ETB_UI/T_UI_Inv_Icon_Crowbar.png' }
];

export default {
  components: {
    CustomSelect,
    ItemMenu
  },
  props: {
    show: Boolean,
    archive: Object,
    lightMode: Boolean
  },
  emits: ['update:show', 'save'],
  setup(props, { emit }) {
    const modalRef = ref(null);
    const itemMenuRef = ref(null);
    
    // 编辑的存档数据 - 深拷贝
    const editedArchive = ref(JSON.parse(JSON.stringify(props.archive)));
    
    // 下拉框选项
    const difficultyOptions = ref([
      { value: '简单难度', label: '简单难度' },
      { value: '普通难度', label: '普通难度' },
      { value: '困难难度', label: '困难难度' },
      { value: '噩梦难度', label: '噩梦难度' }
    ]);
    
    const modeOptions = ref([
      { value: '单人模式', label: '单人模式' },
      { value: '多人模式', label: '多人模式' }
    ]);
    
    const visibilityOptions = ref([
      { value: false, label: '可见' },
      { value: true, label: '隐藏' }
    ]);
    
    const levelOptions = ref([
      { value: 'level-0', label: 'Level 0 - 教学关卡' },
      { value: 'level-1', label: 'Level 1 - 起始之地' },
      { value: 'level-2', label: 'Level 2 - 管道迷宫' },
      { value: 'level-3', label: 'Level 3 - 电气室' },
      { value: 'level-4', label: 'Level 4 - 废弃办公室' },
      { value: 'level-5', label: 'Level 5 - 旅馆' }
    ]);
    
    const playerOptions = ref([
      { value: 'player1', label: '玩家1' },
      { value: 'player2', label: '玩家2' },
      { value: 'player3', label: '玩家3' },
      { value: 'player4', label: '玩家4' }
    ]);
    
    const levelInfoOptions = ref([
      { value: 'level-0', label: 'Level 0' },
      { value: 'level-1', label: 'Level 1' },
      { value: 'level-2', label: 'Level 2' },
      { value: 'level-3', label: 'Level 3' },
      { value: 'level-4', label: 'Level 4' },
      { value: 'level-5', label: 'Level 5' }
    ]);
    
    const safetyOptions = ref([
      { value: '安全', label: '安全' },
      { value: '中等', label: '中等' },
      { value: '危险', label: '危险' },
      { value: '致命', label: '致命' }
    ]);
    
    // 玩家背包状态
    const playerInventory = reactive({
      player1: Array(12).fill().map((_, i) => ({ 
        id: i, 
        item: i % 3 === 0 ? itemOptions[i % itemOptions.length] : null
      })),
      player2: Array(12).fill().map(() => ({ item: null })),
      player3: Array(12).fill().map(() => ({ item: null })),
      player4: Array(12).fill().map(() => ({ item: null }))
    });
    
    const selectedPlayer = ref('player1');
    const currentPlayerInventory = computed(() => {
      return playerInventory[selectedPlayer.value];
    });
    
    // 物品菜单状态
    const showItemMenu = ref(false);
    const itemMenuPosition = ref({ x: 0, y: 0 });
    const currentSlotIndex = ref(null);
    
    // 具体数据板块导航
    const activeDataSection = ref('level');
    const dataSection = ref(null);
    
    // 层级信息
    const selectedLevelInfo = ref('level-0');
    const levelInfo = reactive({
      name: 'Level 0 - 教学关卡',
      safetyLevel: '安全',
      entityCount: 0,
      exploration: 45
    });
    
    // 监听层级信息选择变化
    watch(selectedLevelInfo, (newValue) => {
      const levelData = {
        'level-0': { name: 'Level 0 - 教学关卡', safetyLevel: '安全', entityCount: 0, exploration: 45 },
        'level-1': { name: 'Level 1 - 起始之地', safetyLevel: '中等', entityCount: 3, exploration: 30 },
        'level-2': { name: 'Level 2 - 管道迷宫', safetyLevel: '危险', entityCount: 8, exploration: 15 },
        'level-3': { name: 'Level 3 - 电气室', safetyLevel: '致命', entityCount: 12, exploration: 5 },
        'level-4': { name: 'Level 4 - 废弃办公室', safetyLevel: '中等', entityCount: 5, exploration: 25 },
        'level-5': { name: 'Level 5 - 旅馆', safetyLevel: '危险', entityCount: 10, exploration: 10 }
      };
      
      Object.assign(levelInfo, levelData[newValue]);
    });
    
    // 修复：打开物品菜单
    const openItemMenu = (event, slotIndex) => {
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      
      const slotElement = event.currentTarget;
      const rect = slotElement.getBoundingClientRect();
      const modalRect = modalRef.value.getBoundingClientRect();
      
      // 计算菜单位置（在格子下方）
      let menuX = rect.left;
      let menuY = rect.bottom + 5;
      
      // 菜单尺寸
      const menuWidth = 240;
      const menuHeight = 300;
      
      // 检查是否会超出弹窗底部
      if (menuY + menuHeight > modalRect.bottom) {
        // 如果超出，则在格子上方显示
        menuY = rect.top - menuHeight - 5;
      }
      
      // 检查是否会超出弹窗右侧
      if (menuX + menuWidth > modalRect.right) {
        menuX = modalRect.right - menuWidth - 15;
      }
      
      // 检查是否会超出弹窗左侧
      if (menuX < modalRect.left) {
        menuX = modalRect.left + 10;
      }
      
      // 如果菜单已经打开，则使用动画移动到新位置
      if (showItemMenu.value && itemMenuRef.value) {
        gsap.to(itemMenuRef.value.$el, {
          left: `${menuX}px`,
          top: `${menuY}px`,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        itemMenuPosition.value = { x: menuX, y: menuY };
      }
      
      currentSlotIndex.value = slotIndex;
      showItemMenu.value = true;
    };
    
    // 选择物品
    const selectItem = (item) => {
      if (currentSlotIndex.value !== null) {
        currentPlayerInventory.value[currentSlotIndex.value].item = item;
      }
      closeItemMenu();
    };
    
    // 关闭物品菜单
    const closeItemMenu = () => {
      showItemMenu.value = false;
      currentSlotIndex.value = null;
    };
    
    // 处理板块滚动事件
    const handleSectionScroll = () => {
      if (showItemMenu.value) {
        closeItemMenu();
      }
    };
    
    // 滚动到具体数据板块
    const scrollToSection = (section) => {
      if (!dataSection.value) return;
      
      let targetElement;
      if (section === 'level') {
        targetElement = document.getElementById('level-section');
      } else {
        targetElement = document.getElementById('inventory-section');
      }
      
      if (targetElement) {
        gsap.to(dataSection.value, {
          scrollTop: targetElement.offsetTop,
          duration: 0.5,
          ease: 'power2.out'
        });
      }
    };
    
    // 关闭弹窗动画
    const closeModal = () => {
      gsap.to(modalRef.value, {
        opacity: 0,
        scale: 0.9,
        y: 30,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          emit('update:show', false);
        }
      });
    };
    
    // 保存修改
    const saveChanges = () => {
      // 添加背包数据到存档
      editedArchive.value.inventory = {};
      Object.keys(playerInventory).forEach(player => {
        editedArchive.value.inventory[player] = playerInventory[player]
          .filter(slot => slot.item)
          .map(slot => slot.item.name);
      });
      
      emit('save', editedArchive.value);
      closeModal();
    };
    
    // 监听弹窗显示状态 - 添加进场动画
    watch(() => props.show, (newVal) => {
      if (newVal && modalRef.value) {
        // 设置初始状态
        gsap.set(modalRef.value, {
          opacity: 0,
          scale: 0.9,
          y: 30
        });
        
        // 动画效果
        gsap.to(modalRef.value, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: 'back.out(1.7)'
        });
      }
    });
    
    return {
      modalRef,
      itemMenuRef,
      editedArchive,
      difficultyOptions,
      modeOptions,
      visibilityOptions,
      levelOptions,
      playerOptions,
      levelInfoOptions,
      safetyOptions,
      selectedLevelInfo,
      levelInfo,
      playerInventory,
      selectedPlayer,
      currentPlayerInventory,
      showItemMenu,
      activeDataSection,
      dataSection,
      openItemMenu,
      selectItem,
      closeItemMenu,
      handleSectionScroll,
      scrollToSection,
      closeModal,
      saveChanges,
      itemOptions
    };
  }
};
</script>

<style scoped>
.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
}

.edit-modal {
  position: relative;
  width: 1000px;
  height: 590px;
  background: rgba(25, 25, 35, 0.85);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform-origin: center;
}

.edit-modal.light-mode {
  background: rgba(240, 242, 245, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-modal.light-mode .modal-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #e0e0ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.edit-modal.light-mode .modal-header h2 {
  color: #2c3e50;
  text-shadow: none;
}

.close-btn {
  background: none;
  border: none;
  color: #a0a0c0;
  font-size: 20px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: rotate(90deg);
}

.edit-modal.light-mode .close-btn {
  color: #7f8c8d;
}

.edit-modal.light-mode .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.modal-content {
  display: flex;
  flex: 1;
  padding: 0 10px 10px;
  /* 修复滚动问题：确保内容区域可以扩展 */
  min-height: 0;
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 10px;
  /* 修复滚动问题：确保内容区域可以扩展 */
  min-height: 0;
}

.section-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  margin: 0 10px 10px;
  /* 修复滚动问题：固定头部 */
  flex-shrink: 0;
}

.edit-modal.light-mode .section-header {
  background: rgba(0, 0, 0, 0.03);
}

.section-header i {
  margin-right: 10px;
  font-size: 18px;
  color: #7a89c9;
}

.edit-modal.light-mode .section-header i {
  color: #5a6da8;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #d0d0ff;
}

.edit-modal.light-mode .section-header h3 {
  color: #34495e;
}

.section-nav {
  display: flex;
  padding: 0 10px 10px;
  gap: 10px;
  /* 修复滚动问题：固定导航 */
  flex-shrink: 0;
}

.section-nav button {
  flex: 1;
  padding: 10px;
  background: rgba(60, 65, 90, 0.4);
  border: none;
  border-radius: 10px;
  color: #b0b0e0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.section-nav button:hover {
  background: rgba(80, 85, 120, 0.5);
  color: #e0e0ff;
}

.section-nav button.active {
  background: rgba(100, 110, 180, 0.6);
  color: white;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.3);
}

.edit-modal.light-mode .section-nav button {
  background: rgba(200, 205, 220, 0.5);
  color: #5a6da8;
}

.edit-modal.light-mode .section-nav button:hover {
  background: rgba(180, 190, 220, 0.7);
  color: #3a4a8a;
}

.edit-modal.light-mode .section-nav button.active {
  background: rgba(120, 140, 220, 0.7);
  color: white;
  box-shadow: 0 4px 12px rgba(120, 140, 220, 0.3);
}

.level-selector {
  padding: 0 10px 10px;
  /* 修复滚动问题：固定选择器 */
  flex-shrink: 0;
}

.section-content {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
  background: rgba(20, 22, 30, 0.5);
  padding: 15px;
  position: relative;
  /* 修复滚动问题：关键设置 */
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.edit-modal.light-mode .section-content {
  background: rgba(245, 247, 250, 0.7);
}

.scrollable {
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
}

.scrollable::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #a0a0d0;
}

.edit-modal.light-mode .form-group label {
  color: #5a6da8;
}

.input-wrapper {
  position: relative;
}

.input-wrapper i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a89c9;
  font-size: 16px;
}

input {
  width: 90%;
  padding: 12px 15px;
  background: rgba(30, 32, 45, 0.7);
  border: 1px solid rgba(100, 110, 180, 0.3);
  border-radius: 10px;
  color: #e0e0ff;
  font-size: 14px;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #7a89c9;
  box-shadow: 0 0 0 2px rgba(100, 110, 180, 0.3);
}

.edit-modal.light-mode input {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(120, 140, 220, 0.3);
  color: #2c3e50;
}

.edit-modal.light-mode input:focus {
  border-color: #5a6da8;
  box-shadow: 0 0 0 2px rgba(120, 140, 220, 0.3);
}

.data-section {
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.data-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.data-section h4 {
  margin: 0 0 15px;
  font-size: 16px;
  font-weight: 500;
  color: #d0d0ff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-modal.light-mode .data-section h4 {
  color: #34495e;
}

.player-selector {
  margin-bottom: 20px;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 10px;
}

.inventory-slot {
  aspect-ratio: 1/1;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 110, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.inventory-slot:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(100, 110, 180, 0.3);
  border-color: rgba(140, 150, 220, 0.5);
}

.edit-modal.light-mode .inventory-slot {
  background: rgba(220, 225, 240, 0.7);
  border: 1px solid rgba(120, 140, 220, 0.3);
}

.edit-modal.light-mode .inventory-slot:hover {
  border-color: rgba(100, 120, 200, 0.5);
}

.item-icon {
  width: 70%;
  height: 70%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.item-count {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.progress-bar {
  height: 24px;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.edit-modal.light-mode .progress-bar {
  background: rgba(220, 225, 240, 0.7);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7a89c9, #5a6da8);
  border-radius: 12px;
  transition: width 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.modal-footer {
  padding: 10px 30px 20px; /* 下边距20px */
  display: flex;
  justify-content: center;
  gap: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  /* 修复按钮位置：确保固定在底部 */
  margin-top: auto;
  flex-shrink: 0;
}

.edit-modal.light-mode .modal-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.btn {
  padding: 12px 35px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cancel-btn {
  background: rgba(80, 85, 120, 0.3);
  color: #b0b0e0;
}

.cancel-btn:hover {
  background: rgba(100, 105, 140, 0.5);
  color: #e0e0ff;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.confirm-btn {
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
  color: white;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.4);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #8a99d9, #6a7db8);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(100, 110, 180, 0.5);
}

/* 动画效果 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.4s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .edit-modal,
.modal-leave-active .edit-modal {
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.modal-enter-from .edit-modal,
.modal-leave-to .edit-modal {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* 修复滚动问题的关键CSS */
.modal-content {
  flex: 1;
  display: flex;
  min-height: 0; /* 允许内容收缩 */
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许内容收缩 */
}

.section-content {
  flex: 1;
  min-height: 0; /* 允许内容收缩 */
  display: flex;
  flex-direction: column;
}

.inventory-slot {
  aspect-ratio: 1/1;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 110, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.inventory-slot:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(100, 110, 180, 0.3);
  border-color: rgba(140, 150, 220, 0.5);
}

.slot-placeholder {
  color: rgba(180, 190, 220, 0.5);
  font-size: 16px;
}

.item-icon {
  width: 70%;
  height: 70%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.item-count {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

/* 修复物品菜单位置 */
.item-menu {
  position: fixed;
  z-index: 2000;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

/* 调整输入框宽度 */
.input-wrapper,
.custom-select {
  width: 100%;
}

/* 调整取消按钮样式 */
.cancel-btn {
  background: rgba(100, 105, 140, 0.3) !important;
  color: #b0b0e0;
}

.cancel-btn:hover {
  background: rgba(120, 125, 160, 0.5) !important;
  color: #e0e0ff;
}

/* 弹窗动画 */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.4s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .edit-modal,
.modal-leave-active .edit-modal {
  transition: all 0.4s cubic-bezier(0.47, 0, 0.75, 0.72);
}

.modal-enter-from .edit-modal,
.modal-leave-to .edit-modal {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}

/* 取消按钮样式优化 */
.cancel-btn {
  background: rgba(120, 130, 150, 0.25) !important;
  color: #c0c0e0 !important;
  border: 1px solid rgba(150, 160, 180, 0.15);
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(140, 150, 170, 0.4) !important;
  color: #ffffff !important;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 确认按钮样式优化 */
.confirm-btn {
  background: linear-gradient(135deg, #7a89c9, #5a6da8) !important;
  color: white !important;
  border: none;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.4);
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #8a99d9, #6a7db8) !important;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 18px rgba(100, 110, 180, 0.6);
}

/* 表单组样式 - 恢复原始布局 */
.form-group {
  margin-bottom: 20px;
  width: 100%;
}

/* 输入框和下拉框居中 */
.input-wrapper, .custom-select {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

/* 背包格子样式 */
.inventory-slot {
  aspect-ratio: 1/1;
  background: rgba(40, 45, 60, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 110, 180, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.inventory-slot:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(100, 110, 180, 0.3);
  border-color: rgba(140, 150, 220, 0.5);
}

.item-icon {
  width: 70%;
  height: 70%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
