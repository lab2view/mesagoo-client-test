<template>
  <v-card>
    <v-card-title>Send Bulk Messages</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="submitForm" ref="form">
        <v-file-input
          v-model="formData.file"
          label="CSV File"
          placeholder="Click to upload CSV file"
          prepend-icon="mdi-file-upload"
          :rules="[rules.required, rules.csvFile]"
          @update:model-value="handleFileChange"
        ></v-file-input>

        <v-chip-group v-if="csvHeaders.length > 0" class="mb-4">
          <v-chip
            v-for="header in csvHeaders"
            :key="header"
            color="primary"
            variant="outlined"
          >
            {{ header }}
          </v-chip>
        </v-chip-group>

        <v-select
          v-model="formData.channel"
          label="Channel"
          :items="channelOptions"
          item-title="text"
          item-value="value"
          :rules="[rules.required]"
        ></v-select>

        <v-select
          v-model="formData.message_gateway_id"
          label="Message Gateway"
          :items="messageGateways"
          item-title="label"
          item-value="id"
          :rules="[rules.required]"
          :loading="loadingGateways"
          :disabled="loadingGateways"
        ></v-select>

        <v-select
          v-model="formData.sender_id"
          label="Sender"
          :items="senders"
          item-title="label"
          item-value="id"
          :rules="[rules.required]"
          :loading="loadingSenders"
          :disabled="loadingSenders"
        ></v-select>

        <v-radio-group v-model="formData.message_type" label="Message Type" row>
          <v-radio label="Text Message" value="text"></v-radio>
          <v-radio label="Template" value="template"></v-radio>
        </v-radio-group>

        <v-select
          v-if="formData.message_type === 'template'"
          v-model="formData.template_id"
          label="Template"
          :items="templates"
          item-title="label"
          item-value="id"
          :rules="[rules.required]"
          :loading="loadingTemplates"
          :disabled="loadingTemplates"
          @update:model-value="handleTemplateChange"
        ></v-select>

        <v-textarea
          v-else
          v-model="formData.text"
          label="Message Text"
          placeholder="Enter your message text"
          :rules="[rules.required]"
          rows="3"
        ></v-textarea>

        <v-card
          class="mb-4 pa-4"
          v-if="formData.message_type === 'template' && selectedTemplate"
        >
          <v-card-title>CSV Column Mapping</v-card-title>
          <v-card-subtitle
            >Map template variables to CSV columns. Must include 'phone'
            mapping.</v-card-subtitle
          >

          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="mapping.phone"
                label="Phone Column"
                :items="csvHeaders"
                :rules="[rules.required]"
                placeholder="Select the CSV column for phone numbers"
              ></v-text-field>
            </v-col>

            <v-col
              v-for="field in selectedTemplate.data"
              :key="field"
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="mapping[field]"
                :label="`${field} Column`"
                :items="csvHeaders"
                :rules="[rules.required]"
                :placeholder="`Select the CSV column for ${field}`"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card>

        <v-card class="mb-4 pa-4" v-if="formData.message_type === 'text'">
          <v-card-title>Phone Column Mapping</v-card-title>
          <v-card-subtitle
            >Select the CSV column containing phone numbers</v-card-subtitle
          >

          <v-text-field
            v-model="mapping.phone"
            label="Phone Column"
            :items="csvHeaders"
            :rules="[rules.required]"
            placeholder="Select the CSV column for phone numbers"
          ></v-text-field>
        </v-card>

        <v-alert
          v-if="status"
          :type="status.success ? 'success' : 'error'"
          class="mt-4"
        >
          {{ status.message }}
          <div v-if="status.success && lastBulkCsvId" class="mt-2">
            <v-btn
              color="info"
              size="small"
              @click="processBulkCsv"
              :loading="processing"
              :disabled="processing || csvProcessed"
            >
              Process CSV
            </v-btn>
            <v-btn
              color="secondary"
              size="small"
              class="ml-2"
              @click="checkCsvStatus"
              :loading="checking"
              :disabled="checking || !csvProcessed"
            >
              Check Status
            </v-btn>
          </div>
        </v-alert>

        <v-card v-if="csvStatus" class="mt-4 pa-4">
          <v-card-title class="text-h6">CSV Processing Status</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Status</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="getStatusColor(csvStatus.status)"
                    size="small"
                    class="mt-1"
                  >
                    {{ csvStatus.status }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>File</v-list-item-title>
                <v-list-item-subtitle>{{
                  csvStatus.original_filename
                }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Progress</v-list-item-title>
                <v-list-item-subtitle>
                  <v-progress-linear
                    :model-value="calculateProgress(csvStatus)"
                    color="primary"
                    height="20"
                    striped
                  >
                    <template v-slot:default="{ value }">
                      <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                  </v-progress-linear>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Rows</v-list-item-title>
                <v-list-item-subtitle>
                  Total: {{ csvStatus.total_rows }} | Processed:
                  {{ csvStatus.processed_rows }} | Failed:
                  {{ csvStatus.failed_rows }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Created At</v-list-item-title>
                <v-list-item-subtitle>{{
                  formatDate(csvStatus.created_at)
                }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Updated At</v-list-item-title>
                <v-list-item-subtitle>{{
                  formatDate(csvStatus.updated_at)
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-btn
          type="submit"
          color="primary"
          block
          class="mt-4"
          :loading="isLoading"
        >
          {{ isLoading ? "Processing..." : "Send Bulk Messages" }}
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, computed } from "vue";
import {
  MessageChannelEnum,
  FormStatus,
  Template,
  MessageGateway,
  BulkMessageCsv,
  BulkMessageCsvStatusEnum,
} from "../types";
import {
  fetchMessageGateways,
  fetchTemplates,
  fetchSenders,
  sendBulkMessages,
  processBulkMessageCsv,
  getBulkMessageCsvStatus,
} from "../api";

export default defineComponent({
  name: "BulkMessage",
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
  },
  setup(props) {
    const form = ref(null);
    const isLoading = ref(false);
    const status = ref<FormStatus | null>(null);
    const messageGateways = ref<MessageGateway[]>([]);
    const templates = ref<Template[]>([]);
    const senders = ref<any[]>([]);
    const loadingGateways = ref(false);
    const loadingTemplates = ref(false);
    const loadingSenders = ref(false);
    const csvHeaders = ref<string[]>([]);
    const lastBulkCsvId = ref<string | null>(null);
    const processing = ref(false);
    const checking = ref(false);
    const csvProcessed = ref(false);
    const csvStatus = ref<BulkMessageCsv | null>(null);

    const formData = reactive({
      file: null as File | null,
      channel: MessageChannelEnum.SMS,
      message_gateway_id: "",
      sender_id: "",
      message_type: "text",
      template_id: "",
      text: "",
    });

    const mapping = reactive<Record<string, string>>({
      phone: "",
    });

    const channelOptions = [
      { text: "SMS", value: MessageChannelEnum.SMS },
      { text: "WhatsApp", value: MessageChannelEnum.WHATSAPP },
      { text: "Email", value: MessageChannelEnum.EMAIL },
    ];

    const selectedTemplate = computed(() => {
      if (!formData.template_id) return null;
      return (
        templates.value.find(
          (t) => t.id.toString() === formData.template_id.toString()
        ) || null
      );
    });

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    const getStatusColor = (status: string) => {
      const statusMap: Record<string, string> = {
        [BulkMessageCsvStatusEnum.INITIATED]: "info",
        [BulkMessageCsvStatusEnum.PROCESSING]: "warning",
        [BulkMessageCsvStatusEnum.COMPLETED]: "success",
        [BulkMessageCsvStatusEnum.FAILED]: "error",
      };

      return statusMap[status.toLowerCase()] || "grey";
    };

    const calculateProgress = (csv: BulkMessageCsv) => {
      if (!csv || csv.total_rows === 0) return 0;
      return (csv.processed_rows / csv.total_rows) * 100;
    };

    const processBulkCsv = async () => {
      if (!lastBulkCsvId.value) return;

      processing.value = true;

      try {
        await processBulkMessageCsv(lastBulkCsvId.value);
        csvProcessed.value = true;

        await checkCsvStatus();

        status.value = {
          success: true,
          message: "CSV processing started successfully!",
        };
      } catch (error) {
        status.value = {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to process CSV",
        };
      } finally {
        processing.value = false;
      }
    };

    const checkCsvStatus = async () => {
      if (!lastBulkCsvId.value) return;

      checking.value = true;

      try {
        const result = await getBulkMessageCsvStatus(lastBulkCsvId.value);
        csvStatus.value = result;

        if (result.status === BulkMessageCsvStatusEnum.PROCESSING) {
          setTimeout(checkCsvStatus, 5000);
        }
      } catch (error) {
        status.value = {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to check CSV status",
        };
      } finally {
        checking.value = false;
      }
    };

    const rules = {
      required: (v: any) => {
        if (v instanceof FileList) {
          return v.length > 0 || "This field is required";
        }

        return !!v || "This field is required";
      },
      csvFile: (v: any) => {
        if (!v) return "CSV file is required";

        const file = v instanceof File ? v : v[0];
        if (!file) return "CSV file is required";

        const isCsvType =
          file.type === "text/csv" ||
          file.type === "application/csv" ||
          file.type === "text/plain";
        const hasCsvExtension = file.name.toLowerCase().endsWith(".csv");

        if (!isCsvType && !hasCsvExtension) {
          return "File must be a CSV";
        }

        return true;
      },
    };

    onMounted(async () => {
      try {
        loadingGateways.value = true;
        messageGateways.value = await fetchMessageGateways();
      } catch (error) {
        console.error("Failed to load message gateways:", error);
        status.value = {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to load message gateways",
        };
      } finally {
        loadingGateways.value = false;
      }

      try {
        loadingTemplates.value = true;
        templates.value = await fetchTemplates();
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        loadingTemplates.value = false;
      }

      try {
        loadingSenders.value = true;
        senders.value = await fetchSenders();
      } catch (error) {
        console.error("Failed to load senders:", error);
      } finally {
        loadingSenders.value = false;
      }
    });

    const handleFileChange = (files: File | File[]) => {
      csvHeaders.value = [];

      if (!files) {
        formData.file = null;
        return;
      }

      const fileToProcess = Array.isArray(files)
        ? files.length > 0
          ? files[0]
          : null
        : files;

      if (!fileToProcess) {
        formData.file = null;
        return;
      }

      formData.file = fileToProcess;

      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) return;

        const content = e.target.result as string;
        const firstLine = content.split("\n")[0];
        const headers = firstLine.split(",").map((h) => h.trim());

        csvHeaders.value = headers;

        if (headers.includes("phone")) {
          mapping.phone = "phone";
        }
      };

      reader.readAsText(fileToProcess);
    };

    const handleTemplateChange = () => {
      Object.keys(mapping).forEach((key) => {
        if (key !== "phone") {
          delete mapping[key];
        }
      });

      if (selectedTemplate.value) {
        selectedTemplate.value.data.forEach((field) => {
          mapping[field] = "";
        });
      }

      if (!mapping.phone && csvHeaders.value.includes("phone")) {
        mapping.phone = "phone";
      } else if (!mapping.phone) {
        mapping.phone = "";
      }
    };

    const submitForm = async () => {
      // @ts-ignore - Vuetify's form validation
      const { valid } = await form.value.validate();

      if (!valid) return;

      isLoading.value = true;
      status.value = null;
      csvStatus.value = null;
      lastBulkCsvId.value = null;
      csvProcessed.value = false;

      try {
        const payload = new FormData();

        if (formData.file) {
          payload.append("file", formData.file);
        }

        payload.append("channel", formData.channel);
        payload.append("message_gateway_id", formData.message_gateway_id);
        payload.append("sender_id", formData.sender_id);

        if (formData.message_type === "template") {
          payload.append("template_id", formData.template_id);
        } else {
          payload.append("text", formData.text);
        }

        const mappingObj = {};
        Object.keys(mapping).forEach((key) => {
          if (mapping[key]) {
            mappingObj[key] = mapping[key];
          }
        });

        payload.append("mapping", JSON.stringify(mappingObj));

        const response = await sendBulkMessages(payload);

        lastBulkCsvId.value =
          response.bulk_message_csv_id || response.id || null;

        status.value = {
          success: true,
          message: `Bulk messages queued successfully! Click "Process CSV" to start processing.`,
        };

        const channel = formData.channel;
        const messageGatewayId = formData.message_gateway_id;
        const senderId = formData.sender_id;

        formData.file = null;
        formData.message_type = "text";
        formData.template_id = "";
        formData.text = "";

        formData.channel = channel;
        formData.message_gateway_id = messageGatewayId;
        formData.sender_id = senderId;

        const phoneMapping = mapping.phone;
        Object.keys(mapping).forEach((key) => {
          delete mapping[key];
        });
        mapping.phone = phoneMapping;

        csvHeaders.value = [];
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
      status,
      messageGateways,
      templates,
      senders,
      loadingGateways,
      loadingTemplates,
      loadingSenders,
      csvHeaders,
      channelOptions,
      rules,
      selectedTemplate,
      mapping,
      handleFileChange,
      handleTemplateChange,
      submitForm,
      props,
      lastBulkCsvId,
      processing,
      checking,
      csvProcessed,
      csvStatus,
      processBulkCsv,
      checkCsvStatus,
      formatDate,
      getStatusColor,
      calculateProgress,
    };
  },
});
</script>
