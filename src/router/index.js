import { createRouter, createWebHistory } from "vue-router";

// 路由配置 - 全部使用懒加载
const routes = [
  {
    path: "/",
    name: "Home",
    // 首页使用魔法注释优化
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue"),
    meta: { keepAlive: true, priority: 1 },
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
    meta: { keepAlive: false, priority: 2 },
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
    meta: { keepAlive: false },
  },
  {
    path: "/create-archive",
    name: "CreateArchive",
    component: () => import("../views/CreateArchive/index.vue"),
    meta: { keepAlive: true, priority: 2 },
  },
  {
    path: "/quick-create-archive",
    name: "QuickCreateArchive",
    component: () => import("../views/QuickCreateArchive.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/blueprint-create-archive",
    name: "BlueprintCreateArchive",
    component: () => import("../views/BlueprintCreateArchive.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/test-archive",
    name: "TestArchive",
    component: () => import("../views/TestArchive.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/edit-archive/:archiveData?",
    name: "EditArchive",
    component: () => import("../views/EditArchive.vue"),
    props: true,
    meta: { keepAlive: false },
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
    path: "/feedback",
    name: "Feedback",
    component: () => import("../views/Feedback.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/theme-editor",
    name: "ThemeEditor",
    component: () => import("../views/ThemeEditor.vue"),
    meta: { keepAlive: false },
  },
  {
    path: "/theme-editor/:themeId",
    name: "ThemeEditorEdit",
    component: () => import("../views/ThemeEditor.vue"),
    meta: { keepAlive: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return false; // 让 App.vue 处理滚动
  },
});

// 智能预加载 - 基于用户行为预测
const preloadedRoutes = new Set();

// 预加载高优先级路由（空闲时执行）
const preloadPriorityRoutes = () => {
  if (preloadedRoutes.has("priority")) return;
  preloadedRoutes.add("priority");
  
  const priorityRoutes = routes.filter(r => r.meta?.priority && r.meta.priority <= 2);
  
  requestIdleCallback(() => {
    priorityRoutes.forEach(route => {
      if (typeof route.component === "function" && !preloadedRoutes.has(route.name)) {
        route.component();
        preloadedRoutes.add(route.name);
      }
    });
  }, { timeout: 3000 });
};

// 首次导航后触发预加载
router.afterEach((to, from) => {
  // 首次导航完成后，预加载高优先级路由
  if (!from.name) {
    preloadPriorityRoutes();
  }
});

export default router;
