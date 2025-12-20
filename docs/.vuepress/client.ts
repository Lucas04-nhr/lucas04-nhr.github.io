import { h } from "vue";
import CustomNotFound from "./components/CustomNotFound.vue";
import { Layout } from "vuepress-theme-plume/client";
import { NotFound } from "vuepress-theme-plume/client";
import { defineClientConfig } from "vuepress/client";
import PageContextMenu from 'vuepress-theme-plume/features/PageContextMenu.vue'
// import RepoCard from 'vuepress-theme-plume/features/RepoCard.vue'
// import NpmBadge from 'vuepress-theme-plume/features/NpmBadge.vue'
// import NpmBadgeGroup from 'vuepress-theme-plume/features/NpmBadgeGroup.vue'
// import Swiper from 'vuepress-theme-plume/features/Swiper.vue'

// import CustomComponent from './theme/components/Custom.vue'

// import './theme/styles/custom.css'

export default defineClientConfig({
  layouts: {

    Layout: h(Layout, null, {
      // 将 PageContextMenu 添加到 doc-title-after 插槽，即文章标题的右侧
      'doc-title-after': () => h(PageContextMenu), 
    }),

    NotFound: () =>
      h(NotFound, null, {
        "not-found": () => h(CustomNotFound),
      }),
  },

  enhance({ app }) {
    // built-in components
    // app.component('RepoCard', RepoCard)
    // app.component('NpmBadge', NpmBadge)
    // app.component('NpmBadgeGroup', NpmBadgeGroup)
    // app.component('Swiper', Swiper) // you should install `swiper`

    // your custom components
    // app.component('CustomComponent', CustomComponent)

    void (async () => {
      console.log("Attempting to detect visitor country for beian display...");
      try {
        const res = await fetch("https://ipapi.co/country/", {
          cache: "no-store",
        });
        const country = (await res.text()).trim().toUpperCase();
        console.log(`Detected country: ${country}`);
        if (country === "CN" && typeof document !== "undefined") {
          const el = document.getElementById("beian-cn");
          if (el) {
            el.style.display = "inline";
            console.log("Visitor from China, displaying beian info.");
          }
        }
      } catch (e) {
        console.log("Failed to detect country:", e);
        // silently ignore errors (network, rate limit, CORS, ...)
      }
    })();

    // Hide footer on home page (vp-content.is-home) to avoid layout shift (only run in browser)
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const hideHomeFooter = () => {
        const isHome = Boolean(document.querySelector(".vp-content.is-home"));
        document.querySelectorAll(".vp-footer").forEach((el) => {
          el.style.display = isHome ? "none" : "";
        });
      };

      hideHomeFooter();
      const footerObserver = new MutationObserver(hideHomeFooter);
      footerObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  },
});
