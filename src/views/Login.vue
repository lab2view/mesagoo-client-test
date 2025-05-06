<template>
    <v-card class="mx-auto my-12" max-width="500">
      <v-card-title class="text-h5">
        Login to SMS Gateway API Tester
      </v-card-title>
      <v-card-text>
        <p class="mb-4">Please enter your email and password to access the API.</p>
        <v-form @submit.prevent="handleLogin" ref="form">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            placeholder="your.email@example.com"
            :rules="[rules.required, rules.email]"
            autocomplete="email"
          ></v-text-field>
          
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            :rules="[rules.required]"
            autocomplete="current-password"
          ></v-text-field>
          
          <v-alert
            v-if="error"
            type="error"
            class="mt-4"
          >
            {{ error }}
          </v-alert>
          
          <v-btn
            type="submit"
            color="primary"
            block
            class="mt-6"
            :loading="isLoading"
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { login } from '../api'
  
  export default defineComponent({
    name: 'Login',
    emits: ['authenticated'],
    setup(props, { emit }) {
      const router = useRouter()
      const form = ref(null)
      const email = ref('')
      const password = ref('')
      const isLoading = ref(false)
      const error = ref('')
      
      const rules = {
        required: (v: string) => !!v || 'This field is required',
        email: (v: string) => /.+@.+\..+/.test(v) || 'Please enter a valid email'
      }
      
      const handleLogin = async () => {
        // @ts-ignore - Vuetify's form validation
        const { valid } = await form.value.validate()
        
        if (!valid) return
        
        isLoading.value = true
        error.value = ''
        
        try {
          await login(email.value, password.value)
          
          emit('authenticated')
          
          router.push('/single')
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Login failed'
        } finally {
          isLoading.value = false
        }
      }
      
      return {
        form,
        email,
        password,
        isLoading,
        error,
        rules,
        handleLogin
      }
    }
  })
  </script>
  