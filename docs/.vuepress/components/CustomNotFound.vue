<template>
  <section class="not-found">
    <div class="not-found__art">
      <img
        src="https://static.lucas04.top/static/NotFound.png"
        alt="404 Not Found"
        class="not-found__image"
      />
    </div>

    <div class="not-found__body">
      <h1 class="not-found__code">404</h1>
      <p class="not-found__title">Page not found</p>
      <p class="not-found__desc" ref="descEl" v-html="descHtml"></p>

      <div class="not-found__actions">
        <a class="vp-button medium alt" href="/">
          <span class="button-content"><strong>Take me home</strong></span>
        </a>
        <button type="button" class="vp-button medium brand" @click="goBack">
          <span class="button-content"><strong>Go back</strong></span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick, ref } from "vue";

const baseDesc =
  "But if you do not change your direction, and if you keep looking, you may end up where you are heading.";
const descHtml = ref(baseDesc);
const descEl = ref(null);

const applyDescBreak = () => {
  descHtml.value = baseDesc;
  void nextTick(() => {
    const el = descEl.value;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth > 2;
    descHtml.value = overflow ? baseDesc.replace(",", ",<br>") : baseDesc;
  });
};

onMounted(() => {
  applyDescBreak();
  window.addEventListener("resize", applyDescBreak);
});

onUnmounted(() => {
  window.removeEventListener("resize", applyDescBreak);
});

const goHome = () => {
  window.location.href = "/";
};

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    goHome();
  }
};
</script>

<style>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 16px 64px;
  text-align: center;
}

.not-found__art {
  display: flex;
  justify-content: center;
  width: 100%;
}

.not-found__image {
  width: 50em;
  max-width: 50%;
  object-fit: contain;
}

.not-found__code {
  margin: 8px 0 4px;
  font-size: 48px;
  line-height: 1.1;
  font-weight: 700;
}

.not-found__title {
  margin: 0 0 12px;
  font-size: 18px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #3a4655;
}

.not-found__desc {
  margin: 0 0 20px;
  color: #5c6470;
  line-height: 1.6;
}

.not-found__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* fallback to theme-like button styles in case scoped styles aren't injected on 404 */
.not-found__actions .vp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 14px;
  line-height: 1.4;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid var(--vp-c-brand, #5b9bd5);
}

.not-found__actions .vp-button.brand {
  background: var(--vp-c-brand, #5b9bd5);
  color: #fff;
}

.not-found__actions .vp-button.alt {
  background: transparent;
  color: var(--vp-c-brand, #5b9bd5);
}

.not-found__actions .vp-button:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
</style>
