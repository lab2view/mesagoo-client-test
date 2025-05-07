<template>
  <v-card class="mx-auto my-12" max-width="500">
    <v-card-title class="text-h5"> Mesagoo Client Test Setup </v-card-title>
    <v-card-text>
      <p class="mb-4">
        Please enter your API base URL.
      </p>
      <v-form @submit.prevent="saveSettings" ref="form">
        <v-text-field
          v-model="apiSettings.baseUrl"
          label="API Base URL"
          placeholder="https://api.example.com"
          :rules="[rules.required]"
          hint="The base URL of your SMS gateway API"
          persistent-hint
        ></v-text-field>

        <v-text-field
          v-model="apiSettings.bearerToken"
          label="Bearer Token"
          :rules="[rules.required]"
          hint="Your API authentication token"
          persistent-hint
          class="mt-4"
        ></v-text-field>

        <v-alert v-if="error" type="error" class="mt-4">
          {{ error }}
        </v-alert>

        <v-btn
          type="submit"
          color="primary"
          block
          class="mt-6"
          :loading="isLoading"
        >
          Connect to API
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { fetchMessageGateways } from "../api";

export default defineComponent({
  name: "ApiSetup",
  emits: ["authenticated"],
  setup(_props, { emit }) {
    const router = useRouter();
    const form = ref(null);
    const isLoading = ref(false);
    const error = ref("");

    // const defaultEnvironment = {
    //   name: "Default",
    //   baseUrl: "",
    //   endpoints: {
    //     single: "/messages/single",
    //     bulk: "/messages/bulk",
    //   },
    // };

    const apiSettings = reactive({
      baseUrl: localStorage.getItem("sms_gateway_base_url") || "",
      bearerToken: localStorage.getItem("sms_gateway_bearer_token") || "",
    });

    const rules = {
      required: (v: string) => !!v || "This field is required",
    };

    const saveSettings = async () => {
      // @ts-ignore - Vuetify's form validation
      const { valid } = await form.value.validate();

      if (!valid) return;

      isLoading.value = true;
      error.value = "";

      try {
        apiSettings.baseUrl = apiSettings.baseUrl.replace(/\/+$/, "");

        localStorage.setItem("sms_gateway_base_url", apiSettings.baseUrl);
        localStorage.setItem(
          "sms_gateway_bearer_token",
          apiSettings.bearerToken
        );

        await fetchMessageGateways();

        emit("authenticated");

        router.push("/single");
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to connect to API";

        localStorage.removeItem("sms_gateway_base_url");
        localStorage.removeItem("sms_gateway_bearer_token");
      } finally {
        isLoading.value = false;
      }
    };

    return {
      form,
      apiSettings,
      isLoading,
      error,
      rules,
      saveSettings,
    };
  },
});
</script>
