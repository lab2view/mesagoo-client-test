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
          :disabled="formDisabled"
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
          :disabled="formDisabled"
        ></v-select>

        <v-select
          v-model="formData.message_gateway_code"
          label="Message Gateway"
          :items="messageGateways"
          item-title="label"
          item-value="code"
          :rules="[rules.required]"
          :loading="loadingGateways"
          :disabled="loadingGateways || formDisabled"
        ></v-select>

        <v-select
          v-model="formData.sender_id"
          label="Sender"
          :items="senders"
          item-title="label"
          item-value="id"
          :rules="[rules.required]"
          :loading="loadingSenders"
          :disabled="loadingSenders || formDisabled"
        ></v-select>

        <v-radio-group 
          v-model="formData.message_type" 
          label="Message Type" 
          row
          :disabled="formDisabled"
        >
          <v-radio label="Text Message" value="text"></v-radio>
          <v-radio label="Template" value="template"></v-radio>
        </v-radio-group>

        <v-select
          v-if="formData.message_type === 'template'"
          v-model="formData.template_code"
          label="Template"
          :items="templates"
          item-title="label"
          item-value="code"
          :rules="[rules.required]"
          :loading="loadingTemplates"
          :disabled="loadingTemplates || formDisabled"
          @update:model-value="handleTemplateChange"
        ></v-select>

        <v-textarea
          v-else
          v-model="formData.text"
          label="Message Text"
          placeholder="Enter your message text"
          :rules="[rules.required]"
          rows="3"
          :disabled="formDisabled"
        ></v-textarea>

        <v-select
          v-if="formData.message_type === 'template'"
          v-model="formData.lang"
          label="Language (Optional)"
          :items="languageOptions"
          item-title="text"
          item-value="value"
          clearable
          :disabled="formDisabled"
        ></v-select>

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
                v-model="mapping._l2v_phone"
                label="Phone Column"
                :items="csvHeaders"
                :rules="[rules.required]"
                placeholder="Select the CSV column for phone numbers"
                :disabled="formDisabled"
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
                :disabled="formDisabled"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card>

        <v-alert
          v-if="status"
          :type="status.success ? 'success' : 'error'"
          class="mt-4"
        >
          {{ status.message }}
          <div v-if="status.success && lastBulkCsvId" class="mt-2">
            <v-btn
              color="primary"
              size="small"
              @click="getCsvDetails"
              :loading="loadingDetails"
              :disabled="loadingDetails"
              class="mr-2"
            >
              View Details
            </v-btn>
            <v-btn
              color="warning"
              size="small"
              @click="validateBulkCsv"
              :loading="validating"
              :disabled="validating || csvValidated"
              class="mr-2"
            >
              Validate CSV
            </v-btn>
            <v-btn
              color="info"
              size="small"
              @click="processBulkCsv"
              :loading="processing"
              :disabled="processing || !csvValidated || csvProcessed"
              class="mr-2"
            >
              Process CSV
            </v-btn>
            <v-btn
              color="secondary"
              size="small"
              @click="checkCsvStatus"
              :loading="checking"
              :disabled="checking || !csvProcessed"
              class="mr-2"
            >
              Check Status
            </v-btn>
            <v-btn
              color="error"
              size="small"
              @click="clearForm"
            >
              Clear Form
            </v-btn>
          </div>
        </v-alert>

        <v-card v-if="csvDetails" class="mt-4 pa-4">
          <v-card-title class="text-h6">CSV Details</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <v-list-item-title>ID</v-list-item-title>
                    <v-list-item-subtitle>{{ csvDetails.id }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Status</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getStatusColor(csvDetails.status)"
                        size="small"
                        class="mt-1"
                      >
                        {{ csvDetails.status }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Channel</v-list-item-title>
                    <v-list-item-subtitle>{{ csvDetails.channel }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Type</v-list-item-title>
                    <v-list-item-subtitle>{{ csvDetails.type }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="csvDetails.text">
                    <v-list-item-title>Text</v-list-item-title>
                    <v-list-item-subtitle>{{ csvDetails.text }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item v-if="csvDetails.message_gateway">
                    <v-list-item-title>Message Gateway</v-list-item-title>
                    <v-list-item-subtitle>{{ csvDetails.message_gateway.label }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="csvDetails.sender">
                    <v-list-item-title>Sender</v-list-item-title>
                    <v-list-item-subtitle>{{ csvDetails.sender.label }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="csvDetails.template">
                    <v-list-item-title>Template</v-list-item-title>
                    <v-list-item-subtitle>{{ csvDetails.template.label }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Created At</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(csvDetails.created_at) }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Updated At</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(csvDetails.updated_at) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <v-expansion-panels class="mt-4">
              <v-expansion-panel>
                <v-expansion-panel-title>Mapping</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <pre>{{ JSON.stringify(csvDetails.mapping, null, 2) }}</pre>
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel v-if="csvDetails.summary">
                <v-expansion-panel-title>Summary</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <pre>{{ JSON.stringify(csvDetails.summary, null, 2) }}</pre>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div v-if="csvDetails.initial_url || csvDetails.formated_url" class="mt-4">
              <div class="text-subtitle-1 mb-2">File URLs:</div>
              <v-list>
                <v-list-item v-if="csvDetails.initial_url">
                  <v-list-item-title>Initial CSV</v-list-item-title>
                  <v-list-item-subtitle>
                    <a :href="csvDetails.initial_url" target="_blank">{{ csvDetails.initial_url }}</a>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="csvDetails.formated_url">
                  <v-list-item-title>Formatted CSV</v-list-item-title>
                  <v-list-item-subtitle>
                    <a :href="csvDetails.formated_url" target="_blank">{{ csvDetails.formated_url }}</a>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>

        <v-card v-if="validationResult" class="mt-4 pa-4">
          <v-card-title class="text-h6">CSV Validation Results</v-card-title>
          <v-card-text>
            <v-alert
              :type="validationResult.valid ? 'success' : 'error'"
              class="mb-4"
            >
              {{
                validationResult.valid
                  ? "CSV is valid and ready for processing"
                  : "CSV validation failed"
              }}
            </v-alert>

            <div
              v-if="
                validationResult.errors && validationResult.errors.length > 0
              "
            >
              <div class="text-subtitle-1 mb-2">Validation Errors:</div>
              <v-list>
                <v-list-item
                  v-for="(error, index) in validationResult.errors"
                  :key="index"
                >
                  <v-list-item-title>{{ error }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>

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

        <BulkMessageSummary 
          v-if="lastBulkCsvId && csvProcessed" 
          :bulkMessageCsvId="lastBulkCsvId" 
          class="mt-4"
        />

        <div class="d-flex gap-2 mt-4">
          <v-btn
            type="submit"
            color="primary"
            block
            :loading="isLoading"
            :disabled="isLoading || formDisabled"
          >
            {{ isLoading ? "Processing..." : "Send Bulk Messages" }}
          </v-btn>
          
          <v-btn
            v-if="formDisabled"
            color="secondary"
            @click="clearForm"
          >
            Clear
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>

  <v-card class="mt-6">
    <v-card-title class="d-flex align-center">
      <span>Previous Bulk Messages</span>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        size="small"
        @click="loadBulkMessageCsvs"
        :loading="loadingBulkCsvs"
      >
        <v-icon left>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </v-card-title>

    <v-card-text v-if="selected.length > 0">
      <div class="d-flex align-center mb-4">
        <span class="text-subtitle-2 mr-4">{{ selected.length }} items selected</span>
        <v-btn
          color="warning"
          size="small"
          class="mr-2"
          @click="bulkValidate"
          :loading="bulkValidating"
          :disabled="bulkValidating || !canBulkValidate"
        >
          <v-icon left>mdi-check-all</v-icon>
          Validate Selected
        </v-btn>
        <v-btn
          color="info"
          size="small"
          class="mr-2"
          @click="bulkProcess"
          :loading="bulkProcessing"
          :disabled="bulkProcessing || !canBulkProcess"
        >
          <v-icon left>mdi-play-network</v-icon>
          Process Selected
        </v-btn>
        <v-btn
          color="success"
          size="small"
          class="mr-2"
          @click="viewBulkSummary"
          :disabled="!canViewBulkSummary"
        >
          <v-icon left>mdi-chart-box-outline</v-icon>
          View Summaries
        </v-btn>
        <v-btn
          color="error"
          size="small"
          @click="clearSelection"
        >
          <v-icon left>mdi-close</v-icon>
          Clear Selection
        </v-btn>
      </div>
    </v-card-text>
    
    <v-data-table
      v-model="selected"
      :headers="bulkCsvHeaders"
      :items="bulkCsvs"
      :loading="loadingBulkCsvs"
      :items-per-page="10"
      item-value="id"
      show-select
      class="elevation-1"
    >
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
        >
          {{ item.status }}
        </v-chip>
      </template>
      
      <template v-slot:item.channel="{ item }">
        <v-chip
          size="small"
          :color="getChannelColor(item.channel)"
        >
          {{ item.channel }}
        </v-chip>
      </template>
      
      <template v-slot:item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>
      
      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          size="small"
          color="primary"
          @click="viewBulkCsvDetails(item.id)"
          :loading="loadingDetails && selectedBulkCsvId === item.id"
          :disabled="loadingDetails && selectedBulkCsvId === item.id"
        >
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        
        <v-btn
          icon
          size="small"
          color="warning"
          @click="validateBulkCsvById(item.id)"
          :disabled="item.status.toLowerCase() !== BulkMessageCsvStatusEnum.INITIATED.toLowerCase() || (validating && selectedBulkCsvId === item.id)"
          :loading="validating && selectedBulkCsvId === item.id"
        >
          <v-icon>mdi-check-circle</v-icon>
        </v-btn>
        
        <v-btn
          icon
          size="small"
          color="info"
          @click="processBulkCsvById(item.id)"
          :disabled="item.status.toLowerCase() !== BulkMessageCsvStatusEnum.INITIATED.toLowerCase() || (processing && selectedBulkCsvId === item.id)"
          :loading="processing && selectedBulkCsvId === item.id"
        >
          <v-icon>mdi-play</v-icon>
        </v-btn>
        
        <v-btn
          icon
          size="small"
          color="success"
          @click="viewBulkCsvSummary(item.id)"
          :disabled="item.status.toLowerCase() !== BulkMessageCsvStatusEnum.COMPLETED.toLowerCase() && item.status.toLowerCase() !== BulkMessageCsvStatusEnum.PROCESSED.toLowerCase()"
        >
          <v-icon>mdi-chart-bar</v-icon>
        </v-btn>
        
        <v-btn
          icon
          size="small"
          color="secondary"
          @click="downloadCsvFile(item)"
          :disabled="!item.formated_url && !item.initial_url"
        >
          <v-icon>mdi-download</v-icon>
        </v-btn>
      </template>
      
      <template v-slot:no-data>
        <div class="text-center pa-4">
          <p class="text-subtitle-1">No bulk messages found</p>
          <v-btn color="primary" @click="loadBulkMessageCsvs">Refresh</v-btn>
        </div>
      </template>
    </v-data-table>
  </v-card>
  
  <v-dialog v-model="showSummaryDialog" max-width="800px">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Message Distribution Summary</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="showSummaryDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <BulkMessageSummary 
          v-if="selectedBulkCsvId" 
          :bulkMessageCsvId="selectedBulkCsvId" 
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showBulkSummaryDialog" fullscreen>
    <v-card>
      <v-toolbar dark color="primary">
        <v-btn icon dark @click="showBulkSummaryDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Bulk Message Summaries</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-tabs v-model="activeTab">
          <v-tab v-for="item in selectedCompletedItems" :key="item.id" :value="item.id">
            CSV #{{ item.id }}
          </v-tab>
        </v-tabs>
        <v-window v-model="activeTab">
          <v-window-item
            v-for="item in selectedCompletedItems"
            :key="item.id"
            :value="item.id"
          >
            <v-card flat>
              <v-card-title>
                Summary for CSV #{{ item.id }}
                <v-chip class="ml-2" :color="getStatusColor(item.status)" size="small">
                  {{ item.status }}
                </v-chip>
              </v-card-title>
              <v-card-subtitle>
                {{ item.type === 'template' ? `Template: ${item.template?.label || 'N/A'}` : `Text message` }}
                | Channel: {{ item.channel }}
                | Created: {{ formatDate(item.created_at) }}
              </v-card-subtitle>
              <v-card-text>
                <BulkMessageSummary :bulkMessageCsvId="item.id" />
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-snackbar
    v-model="showSnackbar"
    :color="snackbarColor"
    :timeout="3000"
  >
    {{ snackbarText }}
    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="showSnackbar = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
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
  BulkMessageCsvDetails,
} from "../types";
import {
  fetchMessageGateways,
  fetchTemplates,
  fetchSenders,
  sendBulkMessages,
  processBulkMessageCsv,
  getBulkMessageCsvStatus,
  validateBulkMessageCsv,
  getBulkMessageCsvDetails,
  fetchBulkMessageCsvs,
} from "../api";
import BulkMessageSummary from "../components/BulkMessageSummary.vue";

export default defineComponent({
  name: "BulkMessage",
  components: {
    BulkMessageSummary
  },
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
    const validating = ref(false);
    const loadingDetails = ref(false);
    const csvProcessed = ref(false);
    const csvValidated = ref(false);
    const csvStatus = ref<BulkMessageCsv | null>(null);
    const csvDetails = ref<BulkMessageCsvDetails | null>(null);
    const validationResult = ref<any | null>(null);
    const formDisabled = ref(false);
    
    const bulkCsvs = ref<BulkMessageCsvDetails[]>([]);
    const loadingBulkCsvs = ref(false);
    const selectedBulkCsvId = ref<number | null>(null);
    const showSummaryDialog = ref(false);

    const selected = ref<BulkMessageCsvDetails[]>([]);
    const bulkValidating = ref(false);
    const bulkProcessing = ref(false);
    const showBulkSummaryDialog = ref(false);
    const activeTab = ref<number | null>(null);
    
    const showSnackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');
    
    const bulkCsvHeaders = [
      { title: 'ID', key: 'id', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Channel', key: 'channel', sortable: true },
      { title: 'Type', key: 'type', sortable: true },
      { title: 'Created At', key: 'created_at', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false },
    ];

    const formData = reactive({
      file: null as File | null,
      channel: MessageChannelEnum.SMS,
      message_gateway_code: "",
      sender_id: "",
      message_type: "text",
      template_code: "",
      text: "",
      lang: "",
    });

    const mapping = reactive<Record<string, string>>({
      _l2v_phone: "",
    });

    const channelOptions = [
      { text: "SMS", value: MessageChannelEnum.SMS },
      { text: "WhatsApp", value: MessageChannelEnum.WHATSAPP },
      { text: "Email", value: MessageChannelEnum.EMAIL },
    ];

    const languageOptions = [
      { text: "English", value: "en" },
      { text: "Spanish", value: "es" },
      { text: "French", value: "fr" },
      { text: "Arabic", value: "ar" },
    ];

    const selectedTemplate = computed(() => {
      if (!formData.template_code) return null;
      return (
        templates.value.find((t) => t.code === formData.template_code) || null
      );
    });

    const canBulkValidate = computed(() => {
      return selected.value.some(
        (item) => item.status.toLowerCase() === BulkMessageCsvStatusEnum.INITIATED.toLowerCase()
      );
    });

    const canBulkProcess = computed(() => {
      return selected.value.some(
        (item) => item.status.toLowerCase() === BulkMessageCsvStatusEnum.INITIATED.toLowerCase()
      );
    });

    const canViewBulkSummary = computed(() => {
      return selectedCompletedItems.value.length > 0;
    });

    const selectedCompletedItems = computed(() => {
      return selected.value.filter(
        (item) => item.status.toLowerCase() === BulkMessageCsvStatusEnum.COMPLETED.toLowerCase()
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
    
    const getChannelColor = (channel: string) => {
      const channelMap: Record<string, string> = {
        [MessageChannelEnum.SMS]: "primary",
        [MessageChannelEnum.WHATSAPP]: "success",
        [MessageChannelEnum.EMAIL]: "info",
      };
      
      return channelMap[channel.toLowerCase()] || "grey";
    };

    const calculateProgress = (csv: BulkMessageCsv) => {
      if (!csv || csv.total_rows === 0) return 0;
      return (csv.processed_rows / csv.total_rows) * 100;
    };
    
    const clearForm = () => {
      formData.file = null;
      formData.message_type = 'text';
      formData.template_code = '';
      formData.text = '';
      formData.lang = '';
      
      const phoneMapping = mapping._l2v_phone;
      Object.keys(mapping).forEach(key => {
        delete mapping[key];
      });
      mapping._l2v_phone = phoneMapping;
      
      csvHeaders.value = [];
      
      status.value = null;
      csvStatus.value = null;
      csvDetails.value = null;
      lastBulkCsvId.value = null;
      csvProcessed.value = false;
      csvValidated.value = false;
      validationResult.value = null;
      
      formDisabled.value = false;
    };

    const getCsvDetails = async () => {
      if (!lastBulkCsvId.value) return;

      loadingDetails.value = true;
      csvDetails.value = null;

      try {
        const result = await getBulkMessageCsvDetails(lastBulkCsvId.value);
        csvDetails.value = result;
      } catch (error) {
        status.value = {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to get CSV details",
        };
      } finally {
        loadingDetails.value = false;
      }
    };
    
    const viewBulkCsvDetails = async (id: number) => {
      selectedBulkCsvId.value = id;
      lastBulkCsvId.value = id.toString();
      await getCsvDetails();
    };
    
    const viewBulkCsvSummary = (id: number) => {
      selectedBulkCsvId.value = id;
      showSummaryDialog.value = true;
    };
    
    const validateBulkCsvById = async (id: number) => {
      selectedBulkCsvId.value = id;
      lastBulkCsvId.value = id.toString();
      await validateBulkCsv();
      await loadBulkMessageCsvs();
    };
    
    const processBulkCsvById = async (id: number) => {
      selectedBulkCsvId.value = id;
      lastBulkCsvId.value = id.toString();
      
      csvValidated.value = true;
      
      await processBulkCsv();
      await loadBulkMessageCsvs();
    };

    const validateBulkCsv = async () => {
      if (!lastBulkCsvId.value) return;

      validating.value = true;
      validationResult.value = null;

      try {
        const result = await validateBulkMessageCsv(lastBulkCsvId.value);
        validationResult.value = {
          valid: true,
          message: "CSV validation successful",
        };
        csvValidated.value = true;

        status.value = {
          success: true,
          message: "CSV validated successfully! You can now process the CSV.",
        };
      } catch (error) {
        validationResult.value = {
          valid: false,
          errors: [
            error instanceof Error ? error.message : "Failed to validate CSV",
          ],
        };

        status.value = {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to validate CSV",
        };
      } finally {
        validating.value = false;
      }
    };

    const processBulkCsv = async () => {
      if (!lastBulkCsvId.value || !csvValidated.value) return;

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
    
    const loadBulkMessageCsvs = async () => {
      loadingBulkCsvs.value = true;
      
      try {
        bulkCsvs.value = await fetchBulkMessageCsvs();
      } catch (error) {
        console.error('Failed to load bulk message CSVs:', error);
      } finally {
        loadingBulkCsvs.value = false;
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
      
      await loadBulkMessageCsvs();
    });

    const handleFileChange = (files: File | File[]) => {
      csvHeaders.value = [];

      if (!files) return;

      const fileToProcess = Array.isArray(files)
        ? files.length > 0
          ? files[0]
          : null
        : files;

      if (!fileToProcess) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) return;

        const content = e.target.result as string;
        const firstLine = content.split("\n")[0];
        const headers = firstLine.split(",").map((h) => h.trim());

        csvHeaders.value = headers;

        if (headers.includes("phone")) {
          mapping._l2v_phone = "phone";
        }
      };

      reader.readAsText(fileToProcess);
    };

    const handleTemplateChange = () => {
      Object.keys(mapping).forEach((key) => {
        if (key !== "_l2v_phone") {
          delete mapping[key];
        }
      });

      if (selectedTemplate.value) {
        selectedTemplate.value.data.forEach((field) => {
          mapping[field] = "";
        });
      }
    };

    const submitForm = async () => {
      // @ts-ignore - Vuetify's form validation
      const { valid } = await form.value.validate();

      if (!valid) return;

      isLoading.value = true;
      status.value = null;
      csvStatus.value = null;
      csvDetails.value = null;
      lastBulkCsvId.value = null;
      csvProcessed.value = false;
      csvValidated.value = false;
      validationResult.value = null;

      try {
        const payload = new FormData();

        if (formData.file) {
          payload.append("file", formData.file);
        }

        payload.append("channel", formData.channel);
        payload.append("message_gateway_code", formData.message_gateway_code);
        payload.append("sender_id", formData.sender_id);

        if (formData.message_type === "template") {
          payload.append("template_code", formData.template_code);
          payload.append("mapping", JSON.stringify(mapping));

          if (formData.lang) {
            payload.append("lang", formData.lang);
          }
        } else {
          payload.append("text", formData.text);
          payload.append("mapping", JSON.stringify({ _l2v_phone: mapping._l2v_phone }));
        }

        const response = await sendBulkMessages(payload);

        lastBulkCsvId.value =
          response.bulk_message_csv_id || response.id || null;

        status.value = {
          success: true,
          message: `Bulk messages queued successfully! Click "View Details" to see CSV information or "Validate CSV" to validate before processing.`,
        };
        
        formDisabled.value = true;
        
        await loadBulkMessageCsvs();
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

    const downloadCsvFile = (item: BulkMessageCsvDetails) => {
      const url = item.formated_url || item.initial_url;
      if (url) {
        window.open(url, '_blank');
      }
    };

    const clearSelection = () => {
      selected.value = [];
    };

    const bulkValidate = async () => {
      if (selected.value.length === 0) return;

      bulkValidating.value = true;
      let successCount = 0;
      let failCount = 0;

      try {
        const initiatedItems = selected.value.filter(
          item => item.status.toLowerCase() === BulkMessageCsvStatusEnum.INITIATED.toLowerCase()
        );

        for (const item of initiatedItems) {
          try {
            await validateBulkMessageCsv(item.id);
            successCount++;
          } catch (error) {
            failCount++;
            console.error(`Failed to validate CSV #${item.id}:`, error);
          }
        }

        showSnackbar.value = true;
        if (failCount === 0) {
          snackbarColor.value = 'success';
          snackbarText.value = `Successfully validated ${successCount} CSV files.`;
        } else {
          snackbarColor.value = 'warning';
          snackbarText.value = `Validated ${successCount} CSV files. Failed to validate ${failCount} CSV files.`;
        }

        await loadBulkMessageCsvs();
      } catch (error) {
        showSnackbar.value = true;
        snackbarColor.value = 'error';
        snackbarText.value = error instanceof Error ? error.message : 'An error occurred during bulk validation';
      } finally {
        bulkValidating.value = false;
      }
    };

    const bulkProcess = async () => {
      if (selected.value.length === 0) return;

      bulkProcessing.value = true;
      let successCount = 0;
      let failCount = 0;

      try {
        const initiatedItems = selected.value.filter(
          item => item.status.toLowerCase() === BulkMessageCsvStatusEnum.INITIATED.toLowerCase()
        );

        for (const item of initiatedItems) {
          try {
            await processBulkMessageCsv(item.id);
            successCount++;
          } catch (error) {
            failCount++;
            console.error(`Failed to process CSV #${item.id}:`, error);
          }
        }

        showSnackbar.value = true;
        if (failCount === 0) {
          snackbarColor.value = 'success';
          snackbarText.value = `Successfully started processing ${successCount} CSV files.`;
        } else {
          snackbarColor.value = 'warning';
          snackbarText.value = `Started processing ${successCount} CSV files. Failed to process ${failCount} CSV files.`;
        }

        await loadBulkMessageCsvs();
      } catch (error) {
        showSnackbar.value = true;
        snackbarColor.value = 'error';
        snackbarText.value = error instanceof Error ? error.message : 'An error occurred during bulk processing';
      } finally {
        bulkProcessing.value = false;
      }
    };

    const viewBulkSummary = () => {
      if (selectedCompletedItems.value.length === 0) return;
      
      activeTab.value = selectedCompletedItems.value[0].id;
      showBulkSummaryDialog.value = true;
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
      languageOptions,
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
      validating,
      loadingDetails,
      csvProcessed,
      csvValidated,
      csvStatus,
      csvDetails,
      validationResult,
      processBulkCsv,
      validateBulkCsv,
      checkCsvStatus,
      getCsvDetails,
      formatDate,
      getStatusColor,
      getChannelColor,
      calculateProgress,
      formDisabled,
      clearForm,
      bulkCsvs,
      bulkCsvHeaders,
      loadingBulkCsvs,
      loadBulkMessageCsvs,
      viewBulkCsvDetails,
      validateBulkCsvById,
      processBulkCsvById,
      selectedBulkCsvId,
      BulkMessageCsvStatusEnum,
      showSummaryDialog,
      viewBulkCsvSummary,
      downloadCsvFile,
      selected,
      clearSelection,
      bulkValidate,
      bulkProcess,
      viewBulkSummary,
      bulkValidating,
      bulkProcessing,
      canBulkValidate,
      canBulkProcess,
      canViewBulkSummary,
      showBulkSummaryDialog,
      activeTab,
      selectedCompletedItems,
      showSnackbar,
      snackbarText,
      snackbarColor,
    };
  },
});
</script>
