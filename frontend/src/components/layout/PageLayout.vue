<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="page-layout">
    <header class="page-heading">
      <div>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>

<style scoped>
.page-layout {
  width: min(1100px, calc(100% - 40px));
  margin: 0 auto;
  padding: 48px 0 72px;
}

.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

h1 {
  margin: 0;
  color: #172033;
  font-size: 30px;
  line-height: 1.3;
}

p {
  margin: 10px 0 0;
  color: #647085;
  line-height: 1.6;
}

.page-actions {
  flex: 0 0 auto;
}

@media (max-width: 640px) {
  .page-layout {
    width: min(100% - 24px, 1100px);
    padding: 32px 0 56px;
  }

  .page-heading {
    flex-direction: column;
  }
}
</style>
