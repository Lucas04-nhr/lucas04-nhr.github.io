<script setup>
import { NotFound } from 'vuepress-theme-plume/client'
</script>

<template #not-found>
  <NotFound>
    <div class="custom-content not-found">
    <img src="https://static.lucas04.top/static/NotFound.png" alt="404 Not Found" style="width:300px;" />
    </div>
  </NotFound>
</template>

<style>
.custom-content {
  width: 100%;
}
</style>
