<!-- src/components/PromptPopup.vue -->
<template>
    <transition :css="false" @enter="enterAnimation" @leave="leaveAnimation">
        <div v-if="isVisible" class="prompt-popup" :class="popupClass" :style="popupStyle" ref="popupRef"
            @mouseenter="pauseAutoClose" @mouseleave="resumeAutoClose">
            <div class="popup-content">
                <div class="popup-icon-container" v-if="computedIcon">
                    <div class="popup-icon-wrapper" :class="iconClass">
                        <font-awesome-icon :icon="computedIcon" class="popup-icon" />
                    </div>
                </div>
                <div class="popup-text-container">
                    <span class="popup-message">{{ message }}</span>
                </div>
                <button class="close-btn" @click="closePopup" @mouseenter="hoverClose = true" @mouseleave="hoverClose = false">
                    <font-awesome-icon :icon="['fas', 'times']" class="close-icon" />
                </button>
            </div>
            <div v-if="props.duration > 0" class="progress-bar-container">
                <div class="progress-bar" ref="progressRef"></div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
    message: { type: String, required: true },
    direction: {
        type: String,
        default: 'top',
        validator: (value) => [
            'top', 'bottom', 'left', 'right',
            'top-left', 'top-right', 'bottom-left', 'bottom-right'
        ].includes(value)
    },
    icon: { type: Array, default: null }, // e.g., ['fas', 'heart']
    duration: { type: Number, default: 3000 }, // auto-close after ms, 0 for no auto-close
    type: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'success', 'error', 'warning', 'info'].includes(value)
    }
});

const emit = defineEmits(['close']);

const isVisible = ref(false);
const popupRef = ref(null);
const progressRef = ref(null);
const progressTimeline = ref(null);
const autoCloseTimeout = ref(null);
const remainingTime = ref(props.duration);
const isPaused = ref(false);
const hoverClose = ref(false);

const popupClass = computed(() => [`popup-${props.direction}`, `popup-${props.type}`]);

// 根据类型自动设置图标
const computedIcon = computed(() => {
    if (props.icon) return props.icon;
    
    const typeIcons = {
        success: ['fas', 'check-circle'],
        error: ['fas', 'times-circle'],
        warning: ['fas', 'exclamation-triangle'],
        info: ['fas', 'info-circle'],
        default: null
    };
    
    return typeIcons[props.type] || typeIcons.default;
});

// 图标样式类
const iconClass = computed(() => `icon-${props.type}`);
const popupStyle = ref({}); // Dynamic styles for positioning

onMounted(() => {
    isVisible.value = true;
    if (props.duration > 0) {
        startProgress();
    }
});

onUnmounted(() => {
    if (progressTimeline.value) progressTimeline.value.kill();
    if (autoCloseTimeout.value) clearTimeout(autoCloseTimeout.value);
});

// Calculate starting position based on direction for animation
const getStartPosition = () => {
    const positions = {
        top: { y: '-100%' },
        bottom: { y: '100%' },
        left: { x: '-100%' },
        right: { x: '100%' },
        'top-left': { x: '-50%', y: '-100%' },
        'top-right': { x: '50%', y: '-100%' },
        'bottom-left': { x: '-50%', y: '100%' },
        'bottom-right': { x: '50%', y: '100%' },
    };
    return positions[props.direction] || { y: '-100%' };
};

// GSAP enter animation - elegant and smooth
const enterAnimation = (el, done) => {
    const startPos = getStartPosition();
    gsap.fromTo(
        el,
        { opacity: 0, ...startPos, scale: 0.9, rotation: 0, filter: 'blur(4px)' },
        {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            filter: 'blur(0px)',
            duration: 0.4,
            ease: 'power3.out',
            onComplete: done,
        }
    );
};

// GSAP leave animation - elegant and smooth
const leaveAnimation = (el, done) => {
    const endPos = getStartPosition();
    gsap.to(el, {
        opacity: 0,
        ...endPos,
        scale: 0.9,
        filter: 'blur(4px)',
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
            done();
            emit('close');
        },
    });
};

const closePopup = () => {
    isVisible.value = false;
};

const startProgress = () => {
    if (progressRef.value) {
        progressTimeline.value = gsap.fromTo(
            progressRef.value,
            { width: '100%' },
            {
                width: '0%',
                duration: remainingTime.value / 1000,
                ease: 'linear',
                onComplete: closePopup,
            }
        );
    }
    // No separate timeout; timeline handles completion
};

const pauseAutoClose = () => {
    if (props.duration > 0 && progressTimeline.value) {
        isPaused.value = true;
        remainingTime.value = progressTimeline.value.time() * 1000; // Save remaining time
        progressTimeline.value.pause();
    }
};

const resumeAutoClose = () => {
    if (props.duration > 0 && progressTimeline.value && isPaused.value) {
        isPaused.value = false;
        progressTimeline.value = gsap.fromTo(
            progressRef.value,
            { width: `${(remainingTime.value / props.duration) * 100}%` },
            {
                width: '0%',
                duration: remainingTime.value / 1000,
                ease: 'linear',
                onComplete: closePopup,
            }
        );
    }
};
</script>

<style scoped>
.prompt-popup {
    position: fixed;
    z-index: 9999;
    padding: 20px 24px;
    border-radius: 20px;
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset,
        0 0 0 1px rgba(0, 0, 0, 0.05) inset;
    background: var(--card-bg, #ffffff);
    color: var(--text, #1c1c1e);
    font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
    max-width: 400px;
    min-width: 320px;
    text-align: left;
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
}

.prompt-popup::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    z-index: 1;
}

.popup-content {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    position: relative;
    padding-right: 32px;
    z-index: 2;
}

.popup-icon-container {
    flex-shrink: 0;
    position: relative;
}

.popup-icon-wrapper {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--primary, #007aff) 0%, rgba(0, 122, 255, 0.95) 100%);
    box-shadow: 
        0 6px 16px rgba(0, 122, 255, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.popup-icon-wrapper:hover {
    transform: scale(1.08) rotate(2deg);
    box-shadow: 
        0 8px 20px rgba(0, 122, 255, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

.popup-icon {
    font-size: 20px;
    color: #ffffff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    transition: transform 0.2s ease;
}

.popup-icon-wrapper:hover .popup-icon {
    transform: scale(1.1);
}

.popup-text-container {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
}

.popup-message {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.6;
    color: var(--text, #1c1c1e);
    word-wrap: break-word;
    letter-spacing: -0.3px;
}

.close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.04);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary, #8e8e93);
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    backdrop-filter: blur(20px);
    z-index: 3;
}

.close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text, #1c1c1e);
    transform: scale(1.15) rotate(90deg);
}

.close-btn:active {
    transform: scale(0.9);
}

.close-icon {
    font-size: 16px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.close-btn:hover .close-icon {
    transform: rotate(-90deg);
}

/* Positioning classes */
.popup-top {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
}

.popup-bottom {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
}

.popup-left {
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
}

.popup-right {
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
}

.popup-top-left {
    top: 20px;
    left: 20px;
}

.popup-top-right {
    top: 20px;
    right: 20px;
}

.popup-bottom-left {
    bottom: 20px;
    left: 20px;
}

.popup-bottom-right {
    bottom: 20px;
    right: 20px;
}

/* Progress bar */
.progress-bar-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 0 0 20px 20px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary, #007aff) 0%, rgba(0, 122, 255, 0.8) 100%);
    border-radius: 0 0 20px 20px;
    transition: width 0.1s ease;
    box-shadow: 0 0 12px rgba(0, 122, 255, 0.5);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .prompt-popup {
        background: var(--card-bg, #1c1c1e);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.08) inset;
    }
    
    .prompt-popup::before {
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
    }
    
    .popup-message {
        color: var(--text, #f2f2f7);
    }
    
    .close-btn {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary, #8e8e93);
    }
    
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: var(--text, #f2f2f7);
    }
    
    .popup-success {
        border: 1px solid rgba(52, 199, 89, 0.35);
    }
    
    .popup-error {
        border: 1px solid rgba(255, 59, 48, 0.35);
    }
    
    .popup-warning {
        border: 1px solid rgba(255, 149, 0, 0.35);
    }
    
    .popup-info {
        border: 1px solid rgba(0, 122, 255, 0.35);
    }
    
    .progress-bar-container {
        background: rgba(255, 255, 255, 0.05);
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .prompt-popup {
        max-width: calc(100vw - 32px);
        min-width: 240px;
        margin: 0 16px;
    }
    
    .popup-content {
        gap: 10px;
        padding-right: 20px;
    }
    
    .popup-icon-wrapper {
        width: 28px;
        height: 28px;
    }
    
    .popup-icon {
        font-size: 14px;
    }
    
    .popup-message {
        font-size: 13px;
    }
}

/* 动画效果增强 */
.prompt-popup {
    animation: popupGlow 0.6s ease-out;
}

@keyframes popupGlow {
    0% {
        box-shadow: 0 0 0 rgba(0, 122, 255, 0);
    }
    50% {
        box-shadow: 0 0 20px rgba(0, 122, 255, 0.2);
    }
    100% {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }
}

/* Type-specific styles */
.popup-success {
    background: var(--card-bg, #ffffff);
    border: 1px solid rgba(52, 199, 89, 0.3);
    box-shadow: 
        0 20px 60px rgba(52, 199, 89, 0.12),
        0 0 0 1px rgba(52, 199, 89, 0.1) inset;
    animation: subtlePulse 2s ease-in-out infinite;
}

.popup-success .popup-icon-wrapper {
    background: linear-gradient(135deg, #34c759 0%, #28a745 100%);
    box-shadow: 
        0 6px 16px rgba(52, 199, 89, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

.popup-error {
    background: var(--card-bg, #ffffff);
    border: 1px solid rgba(255, 59, 48, 0.3);
    box-shadow: 
        0 20px 60px rgba(255, 59, 48, 0.12),
        0 0 0 1px rgba(255, 59, 48, 0.1) inset;
    animation: subtleShake 0.5s ease-in-out infinite;
}

.popup-error .popup-icon-wrapper {
    background: linear-gradient(135deg, #ff3b30 0%, #dc3545 100%);
    box-shadow: 
        0 6px 16px rgba(255, 59, 48, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

.popup-warning {
    background: var(--card-bg, #ffffff);
    border: 1px solid rgba(255, 149, 0, 0.3);
    box-shadow: 
        0 20px 60px rgba(255, 149, 0, 0.12),
        0 0 0 1px rgba(255, 149, 0, 0.1) inset;
    animation: subtleGlow 1.5s ease-in-out infinite alternate;
}

.popup-warning .popup-icon-wrapper {
    background: linear-gradient(135deg, #ff9500 0%, #fd7e14 100%);
    box-shadow: 
        0 6px 16px rgba(255, 149, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

.popup-info {
    background: var(--card-bg, #ffffff);
    border: 1px solid rgba(0, 122, 255, 0.3);
    box-shadow: 
        0 20px 60px rgba(0, 122, 255, 0.12),
        0 0 0 1px rgba(0, 122, 255, 0.1) inset;
}

.popup-info .popup-icon-wrapper {
    background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
    box-shadow: 
        0 6px 16px rgba(0, 122, 255, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

/* Subtle animations */
@keyframes subtlePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.01); }
}

@keyframes subtleShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-1px); }
    75% { transform: translateX(1px); }
}

@keyframes subtleGlow {
    0% { box-shadow: 0 20px 60px rgba(255, 149, 0, 0.12), 0 0 0 1px rgba(255, 149, 0, 0.1) inset; }
    100% { box-shadow: 0 20px 60px rgba(255, 149, 0, 0.18), 0 0 0 1px rgba(255, 149, 0, 0.15) inset; }
}
</style>