import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

interface RouteMeta {
  keepAlive: boolean;
  priority?: number;
}

// Route configuration - all using lazy loading
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    // Home page uses magic comments for optimization
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
    component: () => import("../views/settings.vue"),
    meta: { keepAlive: false, priority: 2 },
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return false; // Let App.vue handle scrolling
  },
});

// Smart preloading - based on user behavior prediction
const preloadedRoutes = new Set<string | symbol | null | undefined>();

// Preload high-priority routes (executed during idle time)
const preloadPriorityRoutes = (): void => {
  if (preloadedRoutes.has("priority")) return;
  preloadedRoutes.add("priority");

  const priorityRoutes = routes.filter(
    (r) => (r.meta as unknown as RouteMeta)?.priority && (r.meta as unknown as RouteMeta).priority! <= 2,
  );

  requestIdleCallback(
    () => {
      priorityRoutes.forEach((route) => {
        if (typeof route.component === "function" && !preloadedRoutes.has(route.name)) {
          (route.component as () => Promise<unknown>)();
          preloadedRoutes.add(route.name);
        }
      });
    },
    { timeout: 3000 },
  );
};

// Trigger preloading after first navigation
router.afterEach((_to, from) => {
  // After first navigation completes, preload high-priority routes
  if (!from.name) {
    preloadPriorityRoutes();
  }
});

export default router;
