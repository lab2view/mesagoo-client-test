<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">Templates</h2>
      <v-spacer></v-spacer>
      <v-btn color="primary" to="/templates/create">
        <v-icon left>mdi-plus</v-icon>
        Create Template
      </v-btn>
    </div>
    
    <v-card>
      <v-data-table
        :headers="headers"
        :items="templates"
        :loading="loading"
        :items-per-page="10"
        class="elevation-1"
      >
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            :to="`/templates/${item.id}`"
            color="primary"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        
        <template v-slot:item.data="{ item }">
          <v-chip
            v-for="field in item.data"
            :key="field"
            class="ma-1"
            size="small"
          >
            {{ field }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
    
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the template "{{ selectedTemplate?.label }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteTemplate" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-snackbar
      v-model="showAlert"
      :color="alertType"
      timeout="3000"
    >
      {{ alertMessage }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { Template } from '../types'
import { fetchTemplates, deleteTemplate as apiDeleteTemplate } from '../api'

export default defineComponent({
  name: 'TemplateList',
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
    const templates = ref<Template[]>([])
    const loading = ref(true)
    const deleteDialog = ref(false)
    const selectedTemplate = ref<Template | null>(null)
    const deleting = ref(false)
    const showAlert = ref(false)
    const alertMessage = ref('')
    const alertType = ref('success')
    
    const headers = [
      { title: 'Code', key: 'code', sortable: true },
      { title: 'Label', key: 'label', sortable: true },
      { title: 'Text', key: 'text' },
      { title: 'Data Fields', key: 'data' },
      { title: 'Actions', key: 'actions', sortable: false }
    ]
    
    const loadTemplates = async () => {
      loading.value = true
      try {
        templates.value = await fetchTemplates()
      } catch (error) {
        showAlert.value = true
        alertMessage.value = error instanceof Error ? error.message : 'Failed to load templates'
        alertType.value = 'error'
      } finally {
        loading.value = false
      }
    }
    
    const confirmDelete = (template: Template) => {
      selectedTemplate.value = template
      deleteDialog.value = true
    }
    
    const deleteTemplate = async () => {
      if (!selectedTemplate.value) return
      
      deleting.value = true
      try {
        await apiDeleteTemplate(selectedTemplate.value.id.toString())
        
        templates.value = templates.value.filter(t => t.id !== selectedTemplate.value?.id)
        
        showAlert.value = true
        alertMessage.value = `Template "${selectedTemplate.value.label}" deleted successfully`
        alertType.value = 'success'
        
        deleteDialog.value = false
      } catch (error) {
        showAlert.value = true
        alertMessage.value = error instanceof Error ? error.message : 'Failed to delete template'
        alertType.value = 'error'
      } finally {
        deleting.value = false
      }
    }
    
    onMounted(loadTemplates)
    
    return {
      templates,
      loading,
      headers,
      deleteDialog,
      selectedTemplate,
      deleting,
      showAlert,
      alertMessage,
      alertType,
      confirmDelete,
      deleteTemplate,
      props
    }
  }
})
</script>
