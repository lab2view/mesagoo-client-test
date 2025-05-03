import { createApp } from "vue";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createRouter, createWebHashHistory } from "vue-router";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import ApiSetup from "./views/ApiSetup.vue";
import SingleMessage from "./views/SingleMessage.vue";
import BulkMessage from "./views/BulkMessage.vue";
import TemplateList from "./views/TemplateList.vue";
import TemplateCreate from "./views/TemplateCreate.vue";
import TemplateEdit from "./views/TemplateEdit.vue";

const defaultEnvironment = {
  name: "Default",
  baseUrl: "",
  endpoints: {
    single: "/messages/single",
    bulk: "/messages/bulk",
  },
};

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: ApiSetup,
      props: { environment: defaultEnvironment },
    },
    {
      path: "/single",
      component: SingleMessage,
      props: { environment: defaultEnvironment },
    },
    {
      path: "/bulk",
      component: BulkMessage,
      props: { environment: defaultEnvironment },
    },
    {
      path: "/templates",
      component: TemplateList,
      props: { environment: defaultEnvironment },
    },
    {
      path: "/templates/create",
      component: TemplateCreate,
      props: { environment: defaultEnvironment },
    },
    {
      path: "/templates/:id",
      component: TemplateEdit,
      props: (route) => ({
        environment: defaultEnvironment,
        id: route.params.id,
      }),
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
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
