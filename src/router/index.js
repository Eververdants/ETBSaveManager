import { createRouter, createWebHistory } from "vue-router";

// 预加载策略：定义常用路由进行预加载
const PRELOAD_ROUTES = ["Home", "CreateArchive", "Settings"];

// 预加载函数
const preloadRoute = (routeName) => {
  const route = routes.find((r) => r.name === routeName);
  if (route && typeof route.component === "function") {
    route.component();
  }
};

// 延迟预加载实现
const delayedPreload = (delay = 1000) => {
  setTimeout(() => {
    PRELOAD_ROUTES.forEach((routeName) => {
      if (routeName !== "Home") {
        // 首页已经预加载
        preloadRoute(routeName);
      }
    });
  }, delay);
};

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue"),
    // 首页预加载，提升用户体验
    meta: {
      preload: true,
      keepAlive: true, // 缓存首页
      priority: 1,
    },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/Settings.vue"),
    meta: {
      keepAlive: false,
      priority: 6,
    },
  },
  {
    path: "/plugins",
    name: "PluginMarket",
    component: () => import("../views/PluginMarket.vue"),
    meta: { keepAlive: true },
  },
  {
    path: "/select-create-mode",
    name: "SelectCreateMode",
    component: () => import("../views/SelectCreateMode.vue"),
    meta: { keepAlive: false, priority: 2 },
  },
  {
    path: "/create-archive",
    name: "CreateArchive",
    component: () => import("../views/CreateArchive/index.vue"),
    meta: {
      keepAlive: true,
      priority: 2,
    },
  },

  {
    path: "/quick-create-archive",
    name: "QuickCreateArchive",
    component: () => import("../views/QuickCreateArchive.vue"),
    meta: { keepAlive: false, priority: 3 },
  },
  {
    path: "/blueprint-create-archive",
    name: "BlueprintCreateArchive",
    component: () => import("../views/BlueprintCreateArchive.vue"),
    meta: { keepAlive: false, priority: 3 },
  },
  {
    path: "/test-archive",
    name: "TestArchive",
    component: () => import("../views/TestArchive.vue"),
    meta: { keepAlive: false, priority: 5 },
  },
  {
    path: "/edit-archive/:archiveData?",
    name: "EditArchive",
    component: () => import("../views/EditArchive.vue"),
    props: true,
    meta: { keepAlive: false },
  },
  {
    path: "/core-archive",
    name: "CoreArchive",
    component: () => import("../views/CoreArchive.vue"),
    meta: { keepAlive: true },
  },
  {
    path: "/logs",
    name: "Log",
    component: () => import("../views/Log.vue"),
    meta: { keepAlive: true },
  },
  {
    path: "/steam-cache",
    name: "SteamCache",
    component: () => import("../views/SteamCache.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/release-notes",
    name: "ReleaseNotes",
    component: () => import("../views/ReleaseNotes.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/feedback",
    name: "Feedback",
    component: () => import("../views/Feedback.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/theme-editor",
    name: "ThemeEditor",
    component: () => import("../views/ThemeEditor.vue"),
    meta: {
      keepAlive: false,
      title: "主题编辑器",
    },
  },
  {
    path: "/theme-editor/:themeId",
    name: "ThemeEditorEdit",
    component: () => import("../views/ThemeEditor.vue"),
    meta: {
      keepAlive: false,
      title: "编辑主题",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 对于自定义滚动容器，返回 false 让 App.vue 中的 afterEach 处理
    return false;
  },
});

// 优化后的路由预加载逻辑
router.beforeEach((to, from, next) => {
  // 预加载标记为preload的路由
  if (to.meta.preload) {
    const component = to.matched.find((record) => record.meta.preload)
      ?.components?.default;
    if (component && typeof component === "function") {
      component();
    }
  }

  // 预加载高优先级路由
  if (to.meta.priority && to.meta.priority <= 2) {
    const matchedRoute = to.matched.find((record) => record.meta.priority);
    if (
      matchedRoute &&
      typeof matchedRoute.components?.default === "function"
    ) {
      matchedRoute.components.default();
    }
  }

  next();
});

// 路由后置处理 - 触发延迟预加载
router.afterEach(() => {
  // 只在用户首次访问时触发延迟预加载
  if (!window.__routesPreloaded) {
    delayedPreload();
    window.__routesPreloaded = true;
  }
});

export default router;
