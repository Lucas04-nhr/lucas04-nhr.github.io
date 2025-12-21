import { h } from "vue";
import CustomNotFound from "./components/CustomNotFound.vue";
import CustomAside from "./components/CustomAside.vue";
import { applyPanguSpacingToDOM } from "./components/Pango.vue";
import { Layout } from "vuepress-theme-plume/client";
import { NotFound } from "vuepress-theme-plume/client";
import { defineClientConfig } from "vuepress/client";
import PageContextMenu from "vuepress-theme-plume/features/PageContextMenu.vue";
import RepoCard from "vuepress-theme-plume/features/RepoCard.vue";
import NpmBadge from "vuepress-theme-plume/features/NpmBadge.vue";
import NpmBadgeGroup from "vuepress-theme-plume/features/NpmBadgeGroup.vue";
import Swiper from "vuepress-theme-plume/features/Swiper.vue";
// import CustomComponent from './theme/components/Custom.vue'
import "./theme/styles/custom.css";

export default defineClientConfig({
  layouts: {
    Layout: h(Layout, null, {
      "doc-title-after": () => h(PageContextMenu),
      'aside-outline-after': () => h(CustomAside),
    }),

    NotFound: () =>
      h(NotFound, null, {
        "not-found": () => h(CustomNotFound),
      }),
  },

  enhance({ app, router }) {
    // built-in components
    // app.component('RepoCard', RepoCard)
    // app.component('NpmBadge', NpmBadge)
    // app.component('NpmBadgeGroup', NpmBadgeGroup)
    // app.component('Swiper', Swiper) // you should install `swiper`

    // your custom components
    // app.component('CustomComponent', CustomComponent)

    // Apply Pangu spacing on page content update
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Apply on router navigation
      router.afterEach(() => {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          applyPanguSpacingToDOM(".vp-doc");
        }, 100);
      });

      // Also apply on initial load
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          setTimeout(() => {
            applyPanguSpacingToDOM(".vp-doc");
          }, 100);
        });
      } else {
        setTimeout(() => {
          applyPanguSpacingToDOM(".vp-doc");
        }, 100);
      }
    }

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
          (el as HTMLElement).style.display = isHome ? "none" : "";
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

      // Handle theme switching for picture elements with data-theme attribute
      const updatePictureElements = () => {
        const isDark = document.documentElement.classList.contains("dark");
        document.querySelectorAll("picture[data-theme]").forEach((picture) => {
          const img = picture.querySelector("img");
          if (!img) return;

          const sources = picture.querySelectorAll("source");
          sources.forEach((source) => {
            const srcsetKey = source.getAttribute("data-srcset-key");
            const dataSrcset = source.getAttribute("data-srcset");

            if (srcsetKey && dataSrcset) {
              // Set srcset for the current theme
              if (
                (isDark && srcsetKey === "dark") ||
                (!isDark && srcsetKey === "light")
              ) {
                source.setAttribute("srcset", dataSrcset);
                // Also update the img src as fallback
                img.setAttribute("src", dataSrcset);
              } else {
                source.removeAttribute("srcset");
              }
            }
          });

          // Force browser to reload the image
          if (img.complete) {
            img.style.opacity = "0";
            setTimeout(() => {
              img.style.opacity = "1";
            }, 10);
          }
        });
      };

      // Update on initial load
      updatePictureElements();

      // Observe theme changes on html element
      const themeObserver = new MutationObserver(() => {
        updatePictureElements();
      });

      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  },
});
