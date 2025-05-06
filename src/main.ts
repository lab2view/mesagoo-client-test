import { createApp } from "vue";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createRouter, createWebHashHistory } from "vue-router";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { isAuthenticated } from "./api";

import Login from "./views/Login.vue";
import SingleMessage from "./views/SingleMessage.vue";
import BulkMessage from "./views/BulkMessage.vue";
import TemplateList from "./views/TemplateList.vue";
import TemplateCreate from "./views/TemplateCreate.vue";
import TemplateEdit from "./views/TemplateEdit.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: Login,
      meta: { requiresAuth: false },
    },
    {
      path: "/single",
      component: SingleMessage,
      meta: { requiresAuth: true },
    },
    {
      path: "/bulk",
      component: BulkMessage,
      meta: { requiresAuth: true },
    },
    {
      path: "/templates",
      component: TemplateList,
      meta: { requiresAuth: true },
    },
    {
      path: "/templates/create",
      component: TemplateCreate,
      meta: { requiresAuth: true },
    },
    {
      path: "/templates/:id",
      component: TemplateEdit,
      props: (route) => ({
        id: route.params.id,
      }),
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

router.beforeEach((to, _, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const authenticated = isAuthenticated();

  if (requiresAuth && !authenticated) {
    next("/");
  } else {
    next();
  }
});

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
  },
});

const app = createApp(App);
app.use(vuetify);
app.use(router);
app.mount("#app");
