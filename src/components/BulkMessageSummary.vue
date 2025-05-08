<template>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Message Distribution Summary</span>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!loading && !summary.length"
          color="primary"
          size="small"
          @click="loadSummary"
        >
          <v-icon left>mdi-refresh</v-icon>
          Load Summary
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          class="ma-4"
        ></v-progress-circular>
        
        <div v-else-if="error" class="text-center pa-4">
          <p class="text-subtitle-1 text-error">{{ error }}</p>
          <v-btn color="primary" @click="loadSummary" class="mt-2">Try Again</v-btn>
        </div>
        
        <div v-else-if="!summary.length" class="text-center pa-4">
          <p class="text-subtitle-1">No summary data available</p>
          <p class="text-caption">Summary data may be available after processing is complete</p>
        </div>
        
        <v-expansion-panels v-else>
          <v-expansion-panel
            v-for="country in summary"
            :key="`country-${country.id}`"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-earth</v-icon>
                <span>{{ country.name }} ({{ country.code }})</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="operator in country.operators"
                  :key="`operator-${operator.id}`"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon class="mr-2">mdi-cellphone-wireless</v-icon>
                      <span>{{ operator.name }} ({{ operator.code }})</span>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="provider in operator.providers"
                        :key="`provider-${provider.id}`"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center">
                            <v-icon class="mr-2">mdi-server-network</v-icon>
                            <span>{{ provider.name }} ({{ provider.code }})</span>
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-list>
                            <v-list-subheader>Sender Countries</v-list-subheader>
                            <v-list-item
                              v-for="senderCountry in provider.sender_countries"
                              :key="`sender-country-${senderCountry.id}`"
                            >
                              <v-list-item-title>
                                {{ senderCountry.name }} ({{ senderCountry.code }})
                              </v-list-item-title>
                              <v-list-item-subtitle>
                                <v-chip color="primary" size="small" class="ml-2">
                                  {{ senderCountry.COUNT }} messages
                                </v-chip>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, PropType } from 'vue'
  import { getBulkMessageCsvSummary } from '../api'
  import type { BulkMessageCsvSummary } from '../types'
  
  export default defineComponent({
    name: 'BulkMessageSummary',
    props: {
      bulkMessageCsvId: {
        type: [String, Number] as PropType<string | number>,
        required: true
      },
      autoLoad: {
        type: Boolean,
        default: true
      }
    },
    setup(props) {
      const summary = ref<BulkMessageCsvSummary[]>([])
      const loading = ref(false)
      const error = ref<string | null>(null)
      
      const loadSummary = async () => {
        loading.value = true
        error.value = null
        
        try {
          summary.value = await getBulkMessageCsvSummary(props.bulkMessageCsvId)
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Failed to load summary'
          console.error('Failed to load bulk message CSV summary:', err)
        } finally {
          loading.value = false
        }
      }
      
      onMounted(() => {
        if (props.autoLoad) {
          loadSummary()
        }
      })
      
      return {
        summary,
        loading,
        error,
        loadSummary
      }
    }
  })
  </script>
  