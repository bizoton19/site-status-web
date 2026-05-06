<template>
  <div v-if="authState.account" class="user-menu">
    <img
      v-if="photoUrl"
      :src="photoUrl"
      alt=""
      class="user-avatar"
      width="36"
      height="36"
    />
    <div v-else class="user-avatar user-avatar-placeholder" aria-hidden="true">
      {{ initials }}
    </div>
    <div class="user-meta">
      <div class="user-name text-truncate" :title="displayName">{{ displayName }}</div>
      <button type="button" class="btn-signout" @click="onLogout">Sign out</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { msalInstance, authState, signOut } from '../auth/msalClient.js'
import { loginRequest } from '../auth/authConfig.js'

const photoUrl = ref(null)
let photoObjectUrl = null

const displayName = computed(
  () =>
    authState.account?.name ||
    authState.account?.username ||
    authState.account?.idTokenClaims?.preferred_username ||
    'Signed in'
)

const initials = computed(() => {
  const n = displayName.value || ''
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return n.slice(0, 2).toUpperCase() || '?'
})

function revokePhoto() {
  if (photoObjectUrl) {
    URL.revokeObjectURL(photoObjectUrl)
    photoObjectUrl = null
  }
  photoUrl.value = null
}

async function loadPhoto(account) {
  revokePhoto()
  if (!account) return
  try {
    const token = await msalInstance.acquireTokenSilent({
      scopes: loginRequest.scopes,
      account,
    })
    const res = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    photoObjectUrl = URL.createObjectURL(blob)
    photoUrl.value = photoObjectUrl
  } catch {
    /* Photo optional — placeholder initials suffice */
  }
}

watch(
  () => authState.account?.localAccountId,
  (id) => {
    if (id) loadPhoto(authState.account)
    else revokePhoto()
  },
  { immediate: true }
)

async function onLogout() {
  revokePhoto()
  await signOut()
}

onUnmounted(() => {
  revokePhoto()
})
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.user-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-muted);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
}

.user-meta {
  display: none;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

@media (min-width: 768px) {
  .user-meta {
    display: flex;
  }
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text);
  max-width: 10rem;
}

.btn-signout {
  border: none;
  background: none;
  padding: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-decoration: underline;
  cursor: pointer;
}

.btn-signout:hover {
  color: var(--accent);
}
</style>
