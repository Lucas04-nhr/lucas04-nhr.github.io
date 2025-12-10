<template>
  <NotFound>
    <div class="not-found">
      <img
        src="https://static.lucas04.top/static/NotFound.png"
        alt="404 Not Found"
        class="not-found__image"
      />
    </div>
  </NotFound>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
  const footers = document.querySelectorAll(".vp-footer");
  for (let i = 0; i < footers.length - 1; i++) {
    footers[i].remove();
  }
});
</script>

<style>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10%;
  margin-bottom: -15%;
}

.not-found__image {
  width: 30%;
  max-width: 65vw;
  object-fit: contain;
  margin-bottom: 20px;
}
</style>
