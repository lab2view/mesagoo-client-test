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
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-if="currentUser">
            <v-list-item-title>{{ currentUser.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ currentUser.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="showApiSettings = true">
            <v-list-item-title>API Settings</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleLogout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view @authenticated="setAuthenticated"></router-view>
      </v-container>
    </v-main>

    <v-dialog v-model="showApiSettings" max-width="500px">
      <v-card>
        <v-card-title>API Settings</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveApiSettings">
            <v-text-field
              v-model="apiBaseUrl"
              label="API Base URL"
              hint="Default: https://mesagoo-api.onrender.com/api/v1"
              persistent-hint
              :placeholder="DEFAULT_BASE_URL"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" variant="text" @click="resetApiBaseUrl">Reset to Default</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showApiSettings = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveApiSettings">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated, getCurrentUser, logout, setApiBaseUrl, getApiSettings, DEFAULT_BASE_URL } from './api'
import type { User } from './types'

export default defineComponent({
  name: 'App',
  setup() {
    const router = useRouter()
    const isAuthenticatedState = ref(isAuthenticated())
    const showApiSettings = ref(false)
    const apiBaseUrl = ref(getApiSettings().baseUrl)
    
    const currentUser = computed<User | null>(() => {
      return getCurrentUser()
    })
    
    watch(() => router.currentRoute.value, () => {
      isAuthenticatedState.value = isAuthenticated()
    }, { immediate: true })
    
    onMounted(() => {
      checkAuthentication()
    })
    
    const checkAuthentication = () => {
      isAuthenticatedState.value = isAuthenticated()
      
      if (!isAuthenticatedState.value && router.currentRoute.value.path !== '/') {
        router.push('/')
      }
    }
    
    const setAuthenticated = () => {
      isAuthenticatedState.value = true
    }
    
    const handleLogout = () => {
      logout()
      isAuthenticatedState.value = false
      router.push('/')
    }

    const saveApiSettings = () => {
      setApiBaseUrl(apiBaseUrl.value)
      showApiSettings.value = false
    }

    const resetApiBaseUrl = () => {
      apiBaseUrl.value = DEFAULT_BASE_URL
      setApiBaseUrl(DEFAULT_BASE_URL)
    }
    
    return {
      isAuthenticated: isAuthenticatedState,
      currentUser,
      setAuthenticated,
      handleLogout,
      showApiSettings,
      apiBaseUrl,
      saveApiSettings,
      resetApiBaseUrl,
      DEFAULT_BASE_URL
    }
  }
})
</script>
