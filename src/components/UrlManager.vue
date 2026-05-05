<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Monitored URLs</h3>
      <button
        class="btn btn-primary"
        type="button"
        data-bs-toggle="modal"
        data-bs-target="#urlModal"
        @click="openAddModal"
      >
        Add URL
      </button>
    </div>
    <div class="dashboard-card-body">
      <div v-if="urls.length === 0" class="empty-state">
        <h4>No URLs configured</h4>
        <p>Use Add URL to register endpoints.</p>
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
              <strong>{{ url.UrlName }}</strong>
            </td>
            <td>
              <a class="link-dashboard" :href="url.Url" target="_blank" rel="noopener noreferrer">
                {{ url.Url }}
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
            {{ isEditing ? 'Edit URL' : 'Add URL' }}
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
          <div
            v-if="formMessage"
            class="small"
            :style="{
              marginTop: '0.5rem',
              color: formSuccess ? 'var(--success)' : 'var(--danger)'
            }"
          >
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
            {{ saving ? 'Saving…' : 'Save' }}
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
