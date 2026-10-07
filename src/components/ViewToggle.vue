<template>
  <div
    class="view-toggle"
    role="radiogroup"
    :aria-label="label"
    @keydown="onKeydown"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      ref="buttons"
      type="button"
      role="radio"
      class="view-toggle-btn"
      :class="{ active: opt.value === modelValue }"
      :aria-checked="opt.value === modelValue ? 'true' : 'false'"
      :tabindex="opt.value === focusValue ? 0 : -1"
      :data-value="opt.value"
      @click="select(opt.value)"
    >
      <i v-if="opt.icon" :class="['bi', opt.icon]" aria-hidden="true"></i>
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

/**
 * Accessible segmented control (WAI-ARIA radio group):
 * one tab stop, Arrow keys / Home / End move + select, Space/Enter select.
 */
const props = defineProps({
  modelValue: { type: String, required: true },
  /** [{ value, label, icon? }] */
  options: { type: Array, required: true },
  label: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])
const buttons = ref([])

const focusValue = computed(() =>
  props.options.some((o) => o.value === props.modelValue) ? props.modelValue : props.options[0]?.value
)

function select(value) {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

function onKeydown(event) {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()
  const count = props.options.length
  let index = props.options.findIndex((o) => o.value === focusValue.value)
  if (event.key === 'Home') index = 0
  else if (event.key === 'End') index = count - 1
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index = (index - 1 + count) % count
  else index = (index + 1) % count
  const value = props.options[index].value
  select(value)
  nextTick(() => {
    buttons.value.find((b) => b?.dataset.value === value)?.focus()
  })
}
</script>

<style scoped>
.view-toggle {
  display: inline-flex;
  align-items: stretch;
  padding: 3px;
  gap: 2px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  max-width: 100%;
}

.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 34px;
  padding: 0.3rem 0.75rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

.view-toggle-btn:hover {
  color: var(--text-main);
  background: var(--bg-surface-hover);
}

.view-toggle-btn.active {
  background: rgba(255, 51, 102, 0.12);
  color: var(--text-accent);
  box-shadow: inset 0 0 0 1px rgba(255, 51, 102, 0.45);
}

.view-toggle-btn:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
}

.view-toggle-btn i {
  font-size: 0.95rem;
}

@media (max-width: 640px) {
  .view-toggle {
    display: flex;
    width: 100%;
  }

  .view-toggle-btn {
    flex: 1 1 0;
    padding: 0.3rem 0.4rem;
  }
}
</style>
