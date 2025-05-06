<template>
  <v-card>
    <v-card-title>Send Single Message</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="submitForm" ref="form">
        <v-text-field
          v-model="formData.sender_code"
          label="Sender Code"
          placeholder="Enter sender code"
          :rules="[rules.required]"
          :disabled="formDisabled"
        ></v-text-field>

        <v-text-field
          v-model="formData.phone"
          label="Phone Number"
          placeholder="Enter phone number (11-13 digits)"
          :rules="[rules.required, rules.phone]"
          :disabled="formDisabled"
        ></v-text-field>

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

        <v-radio-group 
          v-model="formData.message_type" 
          label="Message Type" 
          row
          :disabled="formDisabled"
        >
          <v-radio label="Text Message" value="text"></v-radio>
          <v-radio label="Template" value="template"></v-radio>
        </v-radio-group>

        <v-card v-if="formData.message_type === 'template'" class="mb-4 pa-4">
          <v-select
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
          
          <div v-if="selectedTemplate">
            <div class="text-subtitle-1 mt-4">Template Text:</div>
            <div class="text-body-2 mb-4">{{ selectedTemplate.text }}</div>
            
            <div class="text-subtitle-1">Template Data:</div>
            <v-row>
              <v-col v-for="field in selectedTemplate.data" :key="field" cols="12" sm="6">
                <v-text-field
                  v-model="templateData[field]"
                  :label="field"
                  :placeholder="`Enter ${field}`"
                  :rules="[rules.required]"
                  :disabled="formDisabled"
                ></v-text-field>
              </v-col>
            </v-row>
          </div>
        </v-card>
        
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
          v-model="formData.channel"
          label="Channel"
          :items="channelOptions"
          item-title="text"
          item-value="value"
          :disabled="formDisabled"
        ></v-select>

        <v-select
          v-model="formData.lang"
          label="Language (Optional)"
          :items="languageOptions"
          item-title="text"
          item-value="value"
          clearable
          :disabled="formDisabled"
        ></v-select>

        <v-alert
          v-if="status"
          :type="status.success ? 'success' : 'error'"
          class="mt-4"
        >
          {{ status.message }}
          <div v-if="status.success && lastMessageId" class="mt-2 d-flex gap-2">
            <v-btn 
              color="info" 
              size="small" 
              @click="verifyMessageStatus" 
              :loading="verifying"
              :disabled="verifying"
            >
              Verify Message Status
            </v-btn>
            <v-btn 
              color="secondary" 
              size="small" 
              @click="clearForm"
            >
              Clear Form
            </v-btn>
          </div>
        </v-alert>

        <v-card v-if="verificationResult" class="mt-4 pa-4">
          <v-card-title class="text-h6">Message Verification</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Status</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="getStatusColor(verificationResult.status)"
                    size="small"
                    class="mt-1"
                  >
                    {{ verificationResult.status }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Phone</v-list-item-title>
                <v-list-item-subtitle>{{ verificationResult.phone }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Message ID</v-list-item-title>
                <v-list-item-subtitle>{{ verificationResult.message_id }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Created At</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(verificationResult.created_at) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <div class="d-flex gap-2 mt-4">
          <v-btn
            type="submit"
            color="primary"
            block
            :loading="isLoading"
            :disabled="isLoading || formDisabled"
          >
            {{ isLoading ? 'Sending...' : 'Send Message' }}
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
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, computed } from 'vue'
import { MessageChannelEnum, FormStatus, Template, MessageGateway, MessageVerification } from '../types'
import { fetchMessageGateways, fetchTemplates, sendSingleMessage, verifyMessage } from '../api'

export default defineComponent({
  name: 'SingleMessage',
  props: {
    environment: {
      type: Object,
      required: true,
      default: () => ({
        name: 'Default',
        baseUrl: '',
        endpoints: {
          single: '/messages/single',
          bulk: '/messages/bulk'
        }
      })
    }
  },
  setup(props) {
    const form = ref(null)
    const isLoading = ref(false)
    const status = ref<FormStatus | null>(null)
    const messageGateways = ref<MessageGateway[]>([])
    const templates = ref<Template[]>([])
    const loadingGateways = ref(false)
    const loadingTemplates = ref(false)
    const templateData = reactive<Record<string, string>>({})
    const lastMessageId = ref<string | null>(null)
    const verifying = ref(false)
    const verificationResult = ref<MessageVerification | null>(null)
    const formDisabled = ref(false)
    
    const formData = reactive({
      sender_code: '',
      phone: '',
      message_type: 'text',
      template_code: '',
      text: '',
      message_gateway_code: '',
      channel: MessageChannelEnum.SMS,
      lang: ''
    })
    
    const channelOptions = [
      { text: 'SMS', value: MessageChannelEnum.SMS },
      { text: 'WhatsApp', value: MessageChannelEnum.WHATSAPP },
      { text: 'Email', value: MessageChannelEnum.EMAIL }
    ]

    const languageOptions = [
      { text: 'English', value: 'en' },
      { text: 'Spanish', value: 'es' },
      { text: 'French', value: 'fr' },
      { text: 'Arabic', value: 'ar' }
    ]
    
    const selectedTemplate = computed(() => {
      if (!formData.template_code) return null
      return templates.value.find(t => t.code === formData.template_code) || null
    })
    
    const rules = {
      required: (v: string) => !!v || 'This field is required',
      phone: (v: string) => /^\d{11,13}$/.test(v) || 'Phone number must be between 11 and 13 digits'
    }
    
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    }
    
    const getStatusColor = (status: string) => {
      const statusMap: Record<string, string> = {
        'sent': 'success',
        'delivered': 'success',
        'queued': 'warning',
        'processing': 'info',
        'failed': 'error'
      };
      
      return statusMap[status.toLowerCase()] || 'grey';
    }
    
    const clearForm = () => {
      formData.sender_code = '';
      formData.phone = '';
      formData.message_type = 'text';
      formData.template_code = '';
      formData.text = '';
      formData.lang = '';
      
      Object.keys(templateData).forEach(key => {
        delete templateData[key];
      });
      
      status.value = null;
      verificationResult.value = null;
      lastMessageId.value = null;
      
      formDisabled.value = false;
    }
    
    const verifyMessageStatus = async () => {
      if (!lastMessageId.value) return;
      
      verifying.value = true;
      verificationResult.value = null;
      
      try {
        const result = await verifyMessage(lastMessageId.value);
        verificationResult.value = result;
      } catch (error) {
        status.value = {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to verify message status'
        };
      } finally {
        verifying.value = false;
      }
    }
    
    onMounted(async () => {
      try {
        loadingGateways.value = true
        messageGateways.value = await fetchMessageGateways()
      } catch (error) {
        console.error('Failed to load message gateways:', error)
        status.value = {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to load message gateways'
        }
      } finally {
        loadingGateways.value = false
      }
      
      try {
        loadingTemplates.value = true
        templates.value = await fetchTemplates()
      } catch (error) {
        console.error('Failed to load templates:', error)
      } finally {
        loadingTemplates.value = false
      }
    })
    
    const handleTemplateChange = () => {
      Object.keys(templateData).forEach(key => {
        delete templateData[key]
      })
      
      if (selectedTemplate.value) {
        selectedTemplate.value.data.forEach(field => {
          templateData[field] = ''
        })
      }
    }
    
    const submitForm = async () => {
      // @ts-ignore - Vuetify's form validation
      const { valid } = await form.value.validate()
      
      if (!valid) return
      
      isLoading.value = true
      status.value = null
      verificationResult.value = null
      lastMessageId.value = null
      
      try {
        const payload: any = {
          sender_code: formData.sender_code,
          phone: formData.phone,
          message_gateway_code: formData.message_gateway_code,
          channel: formData.channel
        }

        if (formData.lang) {
          payload.lang = formData.lang
        }
        
        if (formData.message_type === 'template') {
          payload.template = {
            code: formData.template_code,
            data: { ...templateData }
          }
        } else {
          payload.text = formData.text
        }
        
        const response = await sendSingleMessage(payload)
        
        lastMessageId.value = response.message_id || response.id || null
        
        status.value = {
          success: true,
          message: `Message sent successfully! ID: ${lastMessageId.value || 'N/A'}`
        }
        
        formDisabled.value = true;
        
      } catch (error) {
        status.value = {
          success: false,
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      } finally {
        isLoading.value = false
      }
    }
    
    return {
      form,
      formData,
      isLoading,
      status,
      messageGateways,
      templates,
      loadingGateways,
      loadingTemplates,
      channelOptions,
      languageOptions,
      rules,
      selectedTemplate,
      templateData,
      handleTemplateChange,
      submitForm,
      props,
      lastMessageId,
      verifying,
      verifyMessageStatus,
      verificationResult,
      formatDate,
      getStatusColor,
      formDisabled,
      clearForm
    }
  }
})
</script>
