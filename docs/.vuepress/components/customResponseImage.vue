<template>
  <img
    :src="src"
    :alt="alt"
    :title="title"
    :style="imageStyle"
    class="responsive-image"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

interface Props {
  src: string;
  alt?: string;
  title?: string;
  desktopWidth?: number | string;
  mobileWidth?: number | string;
  mobileBreakpoint?: number;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  title: "",
  desktopWidth: 100,
  mobileWidth: 10,
  mobileBreakpoint: 768,
});

const isMobile = ref(false);

const imageStyle = computed(() => {
  const width = isMobile.value ? props.mobileWidth : props.desktopWidth;
  const widthValue = typeof width === "number" ? `${width}px` : width;
  return {
    width: widthValue,
    height: "auto",
  };
});

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < props.mobileBreakpoint;
};

onMounted(() => {
  checkIsMobile();
  window.addEventListener("resize", checkIsMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkIsMobile);
});
</script>

<style scoped>
.responsive-image {
  transition: width 0.2s ease;
}
</style>
