import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";
import How2Use from "../views/How2Use.vue";

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
