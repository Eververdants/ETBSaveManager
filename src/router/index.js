import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue"),
  },
  {
    path: "/how2use",
    name: "HowToUse",
    component: () => import("../views/How2Use.vue"),
  },
  {
    path: "/additionalcontent",
    name: "AdditionalContent",
    component: () => import("../views/AdditionalContent.vue"),
  },
  {
    path: "/createarchive",
    name: "CreateArchive",
    component: () => import("../views/CreateArchive.vue"),
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/settings.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0, left: 0, behavior: "auto" };
  },
});

export default router;
