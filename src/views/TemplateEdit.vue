<template>
  <div>
    <v-card>
      <v-card-title>Edit Template</v-card-title>
      <v-card-text>
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          class="ma-4"
        ></v-progress-circular>

        <v-form v-else @submit.prevent="submitForm" ref="form">
          <v-text-field
            v-model="formData.code"
            label="Template Code"
            placeholder="Enter template code"
            :rules="[rules.required]"
          ></v-text-field>

          <v-text-field
            v-model="formData.label"
            label="Template Label"
            placeholder="Enter template label"
            :rules="[rules.required]"
          ></v-text-field>

          <v-select
            v-model="formData.sender_id"
            label="Sender (Optional)"
            :items="senders"
            item-title="label"
            item-value="id"
            :loading="loadingSenders"
            :disabled="loadingSenders"
            clearable
          ></v-select>

          <v-textarea
            v-model="formData.text"
            label="Template Text"
            placeholder="Enter template text with placeholders like {name}, {code}, etc."
            :rules="[rules.required]"
            rows="4"
            hint="Use curly braces for variables, e.g., {name}"
            persistent-hint
          ></v-textarea>

          <div class="mt-4">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-1">Data Fields</div>
              <v-spacer></v-spacer>
              <v-btn size="small" color="primary" @click="addDataField">
                <v-icon left>mdi-plus</v-icon>
                Add Field
              </v-btn>
            </div>

            <v-alert v-if="!formData.data.length" type="info" variant="tonal">
              Add data fields that will be used in the template text.
            </v-alert>

            <v-row>
              <v-col
                v-for="(field, index) in formData.data"
                :key="index"
                cols="12"
                sm="6"
              >
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="formData.data[index]"
                    label="Field Name"
                    placeholder="e.g., name, code"
                    :rules="[rules.required]"
                  ></v-text-field>
                  <v-btn
                    icon
                    variant="text"
                    color="error"
                    class="ml-2"
                    @click="removeDataField(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </div>

          <v-alert
            v-if="status"
            :type="status.success ? 'success' : 'error'"
            class="mt-4"
          >
            {{ status.message }}
          </v-alert>

          <div class="d-flex mt-4">
            <v-btn color="grey" variant="text" to="/templates"> Cancel </v-btn>
            <v-spacer></v-spacer>
            <v-btn type="submit" color="primary" :loading="isLoading">
              Update Template
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { FormStatus, Template } from "../types";
import { fetchSenders, fetchTemplate, updateTemplate } from "../api";

export default defineComponent({
  name: "TemplateEdit",
  props: {
    environment: {
      type: Object,
      required: true,
      default: () => ({
        name: "Default",
        baseUrl: "",
        endpoints: {
          single: "/messages/single",
          bulk: "/messages/bulk",
        },
      }),
    },
    id: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const form = ref(null);
    const isLoading = ref(false);
    const loading = ref(true);
    const status = ref<FormStatus | null>(null);
    const senders = ref<any[]>([]);
    const loadingSenders = ref(false);

    const formData = reactive({
      code: "",
      label: "",
      sender_id: null as number | null,
      text: "",
      data: [] as string[],
    });

    const rules = {
      required: (v: string) => !!v || "This field is required",
    };

    onMounted(async () => {
      const templateId = route.params.id as string;

      try {
        const template = await fetchTemplate(templateId);

        formData.code = template.code;
        formData.label = template.label;
        formData.sender_id = template.sender_id;
        formData.text = template.text;
        formData.data = [...template.data];

        loadingSenders.value = true;
        senders.value = await fetchSenders();
      } catch (error) {
        console.error("Failed to load data:", error);
        status.value = {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to load template",
        };
      } finally {
        loading.value = false;
        loadingSenders.value = false;
      }
    });

    const addDataField = () => {
      formData.data.push("");
    };

    const removeDataField = (index: number) => {
      formData.data.splice(index, 1);
    };

    const submitForm = async () => {
      // @ts-ignore - Vuetify's form validation
      const { valid } = await form.value.validate();

      if (!valid) return;

      isLoading.value = true;
      status.value = null;

      try {
        const templateId = route.params.id as string;

        const filteredData = formData.data.filter(
          (field) => field.trim() !== ""
        );

        const payload = {
          code: formData.code,
          label: formData.label,
          sender_id: formData.sender_id,
          text: formData.text,
          data: filteredData,
        };

        await updateTemplate(templateId, payload);

        status.value = {
          success: true,
          message: "Template updated successfully!",
        };

        setTimeout(() => {
          router.push("/templates");
        }, 1500);
      } catch (error) {
        status.value = {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      } finally {
        isLoading.value = false;
      }
    };

    return {
      form,
      formData,
      isLoading,
      loading,
      status,
      senders,
      loadingSenders,
      rules,
      addDataField,
      removeDataField,
      submitForm,
      props,
    };
  },
});
</script>
