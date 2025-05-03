<template>
  <v-app>
    <v-app-bar color="primary" density="compact" v-if="isAuthenticated">
      <v-app-bar-title>SMS Gateway API Tester</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn variant="text" to="/single">
        <v-icon left>mdi-message</v-icon>
        Single Message
      </v-btn>
      <v-btn variant="text" to="/bulk">
        <v-icon left>mdi-file-upload</v-icon>
        Bulk Messages
      </v-btn>
      <v-btn variant="text" to="/templates">
        <v-icon left>mdi-file-document-outline</v-icon>
        Templates
      </v-btn>
      <v-btn icon @click="showApiSettings = true">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view @authenticated="setAuthenticated" :environment="environment"></router-view>
      </v-container>
    </v-main>

    <v-dialog v-model="showApiSettings" max-width="500px">
      <v-card>
        <v-card-title>API Settings</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveApiSettings">
            <v-text-field
              v-model="apiSettings.baseUrl"
              label="API Base URL"
              hint="e.g., https://api.example.com"
              persistent-hint
            ></v-text-field>
            
            <v-text-field
              v-model="apiSettings.bearerToken"
              label="Bearer Token"
              class="mt-4"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showApiSettings = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveApiSettings">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'App',
  setup() {
    const router = useRouter()
    const isAuthenticated = ref(false)
    const showApiSettings = ref(false)
    
    const apiSettings = reactive({
      baseUrl: localStorage.getItem('sms_gateway_base_url') || '',
      bearerToken: localStorage.getItem('sms_gateway_bearer_token') || ''
    })

    const defaultEnvironment = {
      name: 'Default',
      baseUrl: '',
      endpoints: {
        single: '/messages/single',
        bulk: '/messages/bulk'
      }
    }
    
    onMounted(() => {
      if (apiSettings.baseUrl && apiSettings.bearerToken) {
        isAuthenticated.value = true
      } else {
        router.push('/')
      }
    })
    
    const setAuthenticated = () => {
      isAuthenticated.value = true
    }
    
    const saveApiSettings = () => {
      localStorage.setItem('sms_gateway_base_url', apiSettings.baseUrl)
      localStorage.setItem('sms_gateway_bearer_token', apiSettings.bearerToken)
      isAuthenticated.value = true
      showApiSettings.value = false
      
      if (router.currentRoute.value.path === '/') {
        router.push('/single')
      }
    }
    
    return {
      isAuthenticated,
      showApiSettings,
      apiSettings,
      setAuthenticated,
      saveApiSettings,
      environment: defaultEnvironment,
    }
  }
})
</script>
