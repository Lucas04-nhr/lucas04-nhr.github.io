import { defineComponent, onBeforeUnmount, watch } from "vue";
import { usePageFrontmatter } from "vuepress/client";
import { applyPageCopyAllowedPreference } from "../utils/contentInteractionPreference";

type ContentInteractionFrontmatter = {
  copyAllowed?: unknown;
};

export default defineComponent({
  name: "ContentInteractionPreferenceSync",
  setup() {
    const frontmatter = usePageFrontmatter<ContentInteractionFrontmatter>();

    watch(
      () => frontmatter.value.copyAllowed,
      (copyAllowed) => {
        applyPageCopyAllowedPreference(
          typeof copyAllowed === "boolean" ? copyAllowed : null,
        );
      },
      { immediate: true },
    );

    onBeforeUnmount(() => applyPageCopyAllowedPreference(null));

    return () => null;
  },
});
