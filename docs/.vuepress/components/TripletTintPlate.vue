<script setup lang="ts">
import InputRange from "./InputRange.vue";

const min = 20;
const max = 240;

const tintPlate = defineModel<[number, number, number]>({
  required: true,
});
</script>

<template>
  <p>
    For light mode, prefer values between 150 and 240; for dark mode, prefer
    values between 20 and 80.
  </p>
  <div class="triplet-tint-plate">
    <span>R:</span>
    <InputRange v-model="tintPlate[0]" :min="min" :max="max" />
  </div>
  <div class="triplet-tint-plate">
    <span>G:</span>
    <InputRange v-model="tintPlate[1]" :min="min" :max="max" />
  </div>
  <div class="triplet-tint-plate">
    <span>B:</span>
    <InputRange v-model="tintPlate[2]" :min="min" :max="max" />
  </div>
</template>

<style scoped>
.triplet-tint-plate {
  display: flex;
  align-items: center;
  padding: 16px 0 0;
}
</style>
