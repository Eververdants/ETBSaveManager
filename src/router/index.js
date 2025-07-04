import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";
import How2Use from "../views/How2Use.vue";
import AdditionalContent from "../views/AdditionalContent.vue";
import CreateArchive from "../views/CreateArchive.vue";
import settings from "../views/settings.vue";

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
    path: "/how2use",
    name: "HowToUse",
    component: () => How2Use,
  },
  {
    path: "/additionalcontent",
    name: "AdditionalContent",
    component: () => AdditionalContent,
  },
  {
    path: "/createarchive",
    name: "CreateArchive",
    component: () => CreateArchive,
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => settings,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
