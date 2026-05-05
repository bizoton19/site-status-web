<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">
        <i class="bi bi-link-45deg"></i>
        Managed URLs
      </h3>
      <button 
        class="btn btn-primary"
        data-bs-toggle="modal" 
        data-bs-target="#urlModal"
        @click="openAddModal"
      >
        <i class="bi bi-plus-lg me-2"></i>
        Add URL
      </button>
    </div>
    <div class="dashboard-card-body">
      <div v-if="urls.length === 0" class="empty-state">
        <i class="bi bi-link"></i>
        <h4>No URLs Added</h4>
        <p>Click "Add URL" to start monitoring a website.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th style="width: 120px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="url in urls" :key="url.UrlName">
            <td>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="bi bi-globe2" style="color: #667eea;"></i>
                <strong>{{ url.UrlName }}</strong>
              </div>
            </td>
            <td>
              <a :href="url.Url" target="_blank" style="color: #4facfe; text-decoration: none;">
                {{ url.Url }}
                <i class="bi bi-box-arrow-up-right" style="font-size: 0.75rem; margin-left: 0.25rem;"></i>
              </a>
            </td>
            <td>
              <div class="actions">
                <button 
                  class="btn-icon" 
                  title="Edit"
                  data-bs-toggle="modal" 
                  data-bs-target="#urlModal"
                  @click="openEditModal(url)"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button 
                  class="btn-icon danger" 
                  title="Delete"
                  @click="handleDelete(url.UrlName)"
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- URL Modal -->
  <div class="modal fade" id="urlModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-link-45deg me-2"></i>
            {{ isEditing ? 'Edit URL' : 'Add New URL' }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Site Name</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="formData.urlName"
              :readonly="isEditing"
              placeholder="e.g., My Website"
            >
          </div>
          <div class="mb-3">
            <label class="form-label">URL</label>
            <input 
              type="url" 
              class="form-control" 
              v-model="formData.url"
              placeholder="https://example.com"
            >
          </div>
          <div v-if="formMessage" class="alert" :class="formSuccess ? 'alert-success' : 'alert-danger'" style="background: rgba(102, 126, 234, 0.1); border: none; color: var(--text-primary);">
            <i :class="formSuccess ? 'bi bi-check-circle me-2' : 'bi bi-exclamation-circle me-2'"></i>
            {{ formMessage }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button 
            type="button" 
            class="btn btn-primary"
            @click="handleSave"
            :disabled="saving"
          >
            <i class="bi bi-check-lg me-2"></i>
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const emit = defineEmits(['urlUpdated'])

const { fetchUrls, addUrl, updateUrl, deleteUrl, loading } = useApi()

const urls = ref([])
const isEditing = ref(false)
const saving = ref(false)
const formMessage = ref('')
const formSuccess = ref(false)
const formData = ref({
  urlName: '',
  url: ''
})

async function loadUrls() {
  const data = await fetchUrls()
  urls.value = data
}

function openAddModal() {
  isEditing.value = false
  formData.value = { urlName: '', url: '' }
  formMessage.value = ''
}

function openEditModal(url) {
  isEditing.value = true
  formData.value = { urlName: url.UrlName, url: url.Url }
  formMessage.value = ''
}

async function handleSave() {
  if (!formData.value.urlName || !formData.value.url) {
    formMessage.value = 'Please fill in all fields'
    formSuccess.value = false
    return
  }

  saving.value = true
  formMessage.value = ''
  
  let result
  if (isEditing.value) {
    result = await updateUrl(formData.value)
  } else {
    result = await addUrl(formData.value)
  }
  
  if (result.success) {
    formMessage.value = isEditing.value ? 'URL updated successfully!' : 'URL added successfully!'
    formSuccess.value = true
    await loadUrls()
    emit('urlUpdated')
    
    setTimeout(() => {
      const modal = document.getElementById('urlModal')
      const bsModal = bootstrap.Modal.getInstance(modal)
      if (bsModal) bsModal.hide()
    }, 1000)
  } else {
    formMessage.value = result.error || 'An error occurred'
    formSuccess.value = false
  }
  
  saving.value = false
}

async function handleDelete(urlName) {
  if (!confirm(`Are you sure you want to delete "${urlName}"?`)) {
    return
  }
  
  const result = await deleteUrl(urlName)
  if (result.success) {
    await loadUrls()
    emit('urlUpdated')
  }
}

onMounted(loadUrls)
</script>
