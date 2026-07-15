<script setup>
import AppHeader from './components/layout/AppHeader.vue'
import ChatbotWidget from './components/chat/ChatbotWidget.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main>
      <RouterView />
    </main>
    <ChatbotWidget />
  </div>
</template>

<style>
:root {
  color: #283347;
  background: #f7f9fb;
  font-family:
    Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #bdc6d4;
  border-radius: 6px;
  background: #ffffff;
  color: #283347;
}

input:focus,
select:focus,
textarea:focus,
button:focus-visible,
a:focus-visible {
  outline: 3px solid rgba(23, 107, 77, 0.22);
  outline-offset: 2px;
}

.app-shell {
  min-height: 100vh;
}

.primary-button,
.secondary-button,
.danger-button {
  min-height: 40px;
  padding: 9px 14px;
  border-radius: 6px;
  font-weight: 700;
}

.primary-button {
  border: 1px solid #176b4d;
  background: #176b4d;
  color: #ffffff;
}

.secondary-button {
  border: 1px solid #aeb8c7;
  background: #ffffff;
  color: #354157;
}

.danger-button {
  border: 1px solid #a13d3d;
  background: #ffffff;
  color: #a13d3d;
}

.link-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
