import { createApp, ref, h } from "vue";
import GlassNotification from "../components/LG_Notification.vue";

const notificationId = ref(0);
const notifications = ref({});
const positions = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "top-center",
  "bottom-center",
  "center-left",
  "center-right",
];

// 初始化通知容器
positions.forEach((pos) => {
  notifications.value[pos] = [];
});

// 创建全局通知容器
const createNotificationContainer = () => {
  positions.forEach((pos) => {
    const container = document.createElement("div");
    container.className = `notification-container ${pos}`;
    container.style.cssText = `
      position: fixed;
      padding: 20px;
      pointer-events: none;
      z-index: 10000;
      display: flex;
    `;

    // 位置样式
    if (pos === "top-left")
      container.style.cssText += "top:0;left:0;flex-direction:column;";
    else if (pos === "top-right")
      container.style.cssText += "top:0;right:0;flex-direction:column;";
    else if (pos === "bottom-left")
      container.style.cssText +=
        "bottom:0;left:0;flex-direction:column-reverse;";
    else if (pos === "bottom-right")
      container.style.cssText +=
        "bottom:0;right:0;flex-direction:column-reverse;";
    else if (pos === "top-center")
      container.style.cssText +=
        "top:0;left:50%;transform:translateX(-50%);flex-direction:column;";
    else if (pos === "bottom-center")
      container.style.cssText +=
        "bottom:0;left:50%;transform:translateX(-50%);flex-direction:column-reverse;";
    else if (pos === "center-left")
      container.style.cssText +=
        "top:50%;left:0;transform:translateY(-50%);flex-direction:column;";
    else if (pos === "center-right")
      container.style.cssText +=
        "top:50%;right:0;transform:translateY(-50%);flex-direction:column;";

    const stack = document.createElement("div");
    stack.className = "notification-stack";
    stack.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      pointer-events: none;
    `;

    container.appendChild(stack);
    document.body.appendChild(container);
  });
};

// 显示通知
export const showNotification = (options) => {
  const id = ++notificationId.value;
  const position = options.position || "top-right";

  const newNotification = {
    id,
    title: options.title || "系统通知",
    message: options.message || "这是一条通知消息",
    theme: options.theme || "info",
    duration: options.duration || 5000,
    darkMode: options.darkMode || false,
    position,
  };

  notifications.value[position].push(newNotification);

  // 渲染通知
  const container = document.querySelector(
    `.notification-container.${position} .notification-stack`
  );
  const app = createApp({
    render() {
      return h(GlassNotification, {
        notification: newNotification,
        position: position,
        index: notifications.value[position].length - 1,
        "stack-size": notifications.value[position].length,
        onClose: () => removeNotification(id, position),
      });
    },
  });

  const div = document.createElement("div");
  container.appendChild(div);
  app.mount(div);

  return id;
};

// 移除通知
export const removeNotification = (id, position) => {
  const removeIndex = notifications.value[position].findIndex(
    (n) => n.id === id
  );

  if (removeIndex >= 0) {
    notifications.value[position] = notifications.value[position].filter(
      (n) => n.id !== id
    );

    // 移除DOM元素
    const notificationEl = document.getElementById(`notification-${id}`);
    if (notificationEl) {
      notificationEl.parentNode.remove();
    }

    // 为剩余的通知应用堆叠动画
    setTimeout(() => {
      notifications.value[position].forEach((notification, index) => {
        if (index >= removeIndex) {
          const el = document.getElementById(`notification-${notification.id}`);
          if (el) {
            gsap.to(el, {
              y: 0,
              duration: 0.4,
              ease: "power2.out",
              delay: index * 0.05,
            });
          }
        }
      });
    }, 50);
  }
};

// 快捷方法
export const notify = {
  info: (options) => showNotification({ theme: "info", ...options }),
  success: (options) => showNotification({ theme: "success", ...options }),
  warning: (options) => showNotification({ theme: "warning", ...options }),
  error: (options) => showNotification({ theme: "error", ...options }),
};

// 初始化通知系统
createNotificationContainer();
