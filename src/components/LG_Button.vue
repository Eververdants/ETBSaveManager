<template>
  <button
    :class="['living-glass-btn', type, { dark: isDark, disabled }]"
    :style="btnStyle"
    :disabled="disabled"
    @mouseenter="onHover"
    @mouseleave="onLeave"
    @mousedown="onActive"
    @mouseup="onRelease"
    @focus="onFocus"
    @blur="onBlur"
    ref="btnRef"
  >
    <span class="icon" v-if="$slots.icon">
      <slot name="icon" />
    </span>
    <span class="label">
      <slot />
    </span>
    <span class="icon-placeholder"></span>
    <span class="halo" :style="haloStyle"></span>
  </button>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  type: {
    type: String,
    default: 'default', // default, primary, accent, success, warning, danger
  },
  size: {
    type: [Number, String],
    default: 48, // px
  },
  radius: {
    type: [Number, String],
    default: 16, // px
  },
  disabled: Boolean,
  dark: Boolean,
})

const btnRef = ref(null)
const isDark = computed(() => props.dark)
const disabled = computed(() => props.disabled)

const lightColors = {
  default:  { bg: 'rgba(255,255,255,0.13)', halo: '#8a9eff' },
  primary:  { bg: 'rgba(70,130,255,0.18)', halo: '#4682ff' },
  accent:   { bg: 'rgba(180,70,255,0.18)', halo: '#b446ff' },
  success:  { bg: 'rgba(70,200,120,0.18)', halo: '#46c878' },
  warning:  { bg: 'rgba(255,180,70,0.18)', halo: '#ffb446' },
  danger:   { bg: 'rgba(255,80,100,0.18)', halo: '#ff5064' },
}
const darkColors = {
  default:  { bg: 'rgba(30,32,40,0.22)', halo: '#6b7aff' },
  primary:  { bg: 'rgba(70,130,255,0.22)', halo: '#3a6cff' },
  accent:   { bg: 'rgba(180,70,255,0.22)', halo: '#a03cff' },
  success:  { bg: 'rgba(70,200,120,0.22)', halo: '#36b86a' },
  warning:  { bg: 'rgba(255,180,70,0.22)', halo: '#ff9c1a' },
  danger:   { bg: 'rgba(255,80,100,0.22)', halo: '#ff3850' },
}
const colorMap = computed(() => isDark.value ? darkColors : lightColors)

const btnStyle = computed(() => ({
  '--btn-size': typeof props.size === 'number' ? `${props.size}px` : props.size,
  '--btn-radius': typeof props.radius === 'number' ? `${props.radius}px` : props.radius,
  '--btn-bg': colorMap.value[props.type]?.bg || colorMap.value.default.bg,
  '--halo-color': colorMap.value[props.type]?.halo || colorMap.value.default.halo,
}))

const haloOpacity = ref(0.18)
const haloScale = ref(1)
const focusShadow = ref('')

const haloStyle = computed(() => ({
  opacity: disabled.value ? 0 : haloOpacity.value,
  transform: `scale(${haloScale.value})`,
  background: `radial-gradient(circle, var(--halo-color) 0%, transparent 70%)`,
}))

function onHover() {
  if (disabled.value) return
  gsap.to(haloOpacity, { value: 0.32, duration: 0.25, overwrite: true })
  gsap.to(haloScale, { value: 1.12, duration: 0.25, overwrite: true })
  gsap.to(btnRef.value, { scale: 1.02, duration: 0.18, overwrite: true })
}
function onLeave() {
  if (disabled.value) return
  gsap.to(haloOpacity, { value: 0.18, duration: 0.25, overwrite: true })
  gsap.to(haloScale, { value: 1, duration: 0.25, overwrite: true })
  gsap.to(btnRef.value, { scale: 1, duration: 0.18, overwrite: true })
  focusShadow.value = ''
}
function onActive() {
  if (disabled.value) return
  gsap.to(btnRef.value, { scale: 0.98, duration: 0.12, overwrite: true })
  gsap.to(haloScale, { value: 0.92, duration: 0.12, overwrite: true })
  gsap.to(haloOpacity, { value: 0.38, duration: 0.12, overwrite: true })
}
function onRelease() {
  if (disabled.value) return
  gsap.to(btnRef.value, { scale: 1.02, duration: 0.18, overwrite: true })
  gsap.to(haloScale, { value: 1.12, duration: 0.18, overwrite: true })
  gsap.to(haloOpacity, { value: 0.32, duration: 0.18, overwrite: true })
}
function onFocus() {
  if (disabled.value) return
  focusShadow.value = '0 0 0 2px rgba(138,158,255,0.5)'
}
function onBlur() {
  focusShadow.value = ''
}

onMounted(() => {
  if (disabled.value) {
    gsap.set(btnRef.value, { clearProps: 'all' })
  }
})

watch(disabled, (val) => {
  if (val) {
    gsap.set(btnRef.value, { clearProps: 'all' })
  }
})
</script>
<style scoped>
.living-glass-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--btn-size, 48px);
  height: var(--btn-size, 48px);
  padding: 0 1.5em;
  border-radius: var(--btn-radius, 16px);
  background: var(--btn-bg);
  border: 1px solid rgba(255,255,255,0.22);
  box-shadow:
    0 2px 8px 0 rgba(70,130,255,0.10), /* 外层投影 */
    0 1.5px 0 0 rgba(255,255,255,0.18) inset, /* 内层高光 */
    0 0 0 1px rgba(255,255,255,0.18) inset; /* 内发光 */
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  transition: background 0.2s, box-shadow 0.2s, border 0.2s;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  user-select: none;
  font-weight: 600;
  font-size: calc(var(--btn-size, 48px) * 0.38);
  color: rgba(255,255,255,0.9);
  text-shadow: 0 1px 4px rgba(0,0,0,0.18), 0 0.5px 0 rgba(255,255,255,0.25);
  box-sizing: border-box;
  z-index: 1;
  will-change: transform;
  backface-visibility: hidden;
}
.label {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  position: relative;
  top: 25%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 0;
}
.icon {
  margin-right: 0.6em;
}
.icon-placeholder {
  width: calc(var(--btn-size, 48px) * 0.52);
  display: inline-block;
  visibility: hidden;
}
.living-glass-btn .icon {
  display: flex;
  align-items: center;
  margin-right: 0.6em;
  font-size: calc(var(--btn-size, 48px) * 0.52);
  line-height: 1;
}
.living-glass-btn .icon {
  display: flex;
  align-items: center;
  margin-right: 0.6em;
  font-size: calc(var(--btn-size, 48px) * 0.52);
  line-height: 1;
}
.living-glass-btn .label {
  display: flex;
  align-items: center;
  white-space: nowrap;
  font-weight: 500;
}
.living-glass-btn .halo {
  pointer-events: none;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120%;
  height: 120%;
  transform: translate(-50%,-50%) scale(1);
  border-radius: inherit;
  z-index: 0;
  transition: opacity 0.18s, transform 0.18s;
}
.living-glass-btn.dark {
  background: rgba(30,32,40,0.22);
  color: rgba(255,255,255,0.92);
  border: 1px solid rgba(255,255,255,0.13);
}
.living-glass-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(138,158,255,0.5), 0 2px 8px 0 rgba(70,130,255,0.10);
}
.living-glass-btn.disabled,
.living-glass-btn:disabled {
  opacity: 0.6;
  pointer-events: none;
  filter: grayscale(0.18);
  box-shadow: none;
  transition: none;
}
.living-glass-btn,
.living-glass-btn:hover,
.living-glass-btn:active,
.living-glass-btn:focus-visible {
  font-weight: 600;
}
</style>
