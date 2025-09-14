<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal">
      <div class="modal-body">
        <div class="flex">
          <div class="flex-shrink-0">
            <div 
              :class="[
                'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
                iconBgClass
              ]"
            >
              <svg 
                :class="['h-6 w-6', iconClass]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  v-if="type === 'warning'"
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
                <path 
                  v-else-if="type === 'danger'"
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
                <path 
                  v-else-if="type === 'info'"
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
                <path 
                  v-else
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
          <div class="ml-4 mt-0 text-left">
            <h3 class="text-lg font-medium text-gray-900">
              {{ title }}
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                {{ message }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button
          type="button"
          @click="$emit('cancel')"
          class="btn-secondary btn-md"
          :disabled="loading"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="$emit('confirm')"
          :disabled="loading"
          :class="[
            'btn-md',
            confirmClass || 'btn-primary'
          ]"
        >
          <span v-if="loading">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement...
          </span>
          <span v-else>
            {{ confirmText }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  title: string
  message: string
  type?: 'warning' | 'danger' | 'info' | 'question'
  confirmText?: string
  cancelText?: string
  confirmClass?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'warning',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  loading: false
})

defineEmits<{
  confirm: []
  cancel: []
}>()

// Computed
const iconBgClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-100'
    case 'warning':
      return 'bg-yellow-100'
    case 'info':
      return 'bg-blue-100'
    case 'question':
      return 'bg-gray-100'
    default:
      return 'bg-yellow-100'
  }
})

const iconClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'text-red-600'
    case 'warning':
      return 'text-yellow-600'
    case 'info':
      return 'text-blue-600'
    case 'question':
      return 'text-gray-600'
    default:
      return 'text-yellow-600'
  }
})
</script>