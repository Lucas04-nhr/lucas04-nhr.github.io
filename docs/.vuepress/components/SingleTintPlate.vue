<script setup lang="ts">
import InputRange from "./InputRange.vue";

const tintPlate = defineModel<number>({
  required: true,
});
</script>

<template>
  <p>
    For light mode, prefer values between 150 and 240; for dark mode, prefer
    values between 20 and 80.
  </p>
  <div class="single-tint-plate">
    <span>RGB:</span>
    <InputRange v-model="tintPlate" :max="240" :min="20" />
  </div>
</template>

<style scoped>
.single-tint-plate {
  display: flex;
  align-items: center;
  padding: 16px 0 0;
}
</style>
