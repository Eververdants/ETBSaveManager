import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";
import Settings from "../views/Settings.vue";
import PluginMarket from "../views/PluginMarket.vue";
import CreateArchive from "../views/CreateArchive.vue";
import EditArchive from "../views/EditArchive.vue";
import Log from "../views/Log.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
  },
  {
    path: "/plugins",
    name: "PluginMarket",
    component: PluginMarket,
  },
  {
    path: "/create-archive",
    name: "CreateArchive",
    component: CreateArchive,
  },
  {
    path: "/edit-archive/:archiveData?",
    name: "EditArchive",
    component: EditArchive,
    props: true,
  },
  {
    path: "/logs",
    name: "Log",
    component: Log,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 对于自定义滚动容器，返回 false 让 App.vue 中的 afterEach 处理
    return false;
  }
});

export default router;
