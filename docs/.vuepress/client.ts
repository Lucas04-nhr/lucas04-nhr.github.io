import { h } from "vue";
import CustomNotFound from "./components/customNotFound.vue";
import CustomAside from "./components/customAside.vue";
import ResponsiveImage from "./components/customResponseImage.vue";
import DebugInfo from "./components/debugInfo.vue";
import RawJsonOutput from "./components/rawJsonOutput.vue";
import { applyPanguSpacingToDOM } from "./components/customPango.vue";
import { Layout } from "vuepress-theme-plume/client";
import { NotFound } from "vuepress-theme-plume/client";
import { defineClientConfig } from "vuepress/client";
import PageContextMenu from "vuepress-theme-plume/features/PageContextMenu.vue";
import RepoCard from "vuepress-theme-plume/features/RepoCard.vue";
import NpmBadge from "vuepress-theme-plume/features/NpmBadge.vue";
import NpmBadgeGroup from "vuepress-theme-plume/features/NpmBadgeGroup.vue";
import Swiper from "vuepress-theme-plume/features/Swiper.vue";
// import CustomComponent from './theme/components/Custom.vue'
import "./theme/styles/fonts_body.css";
import "./theme/styles/custom_color.css";

export default defineClientConfig({
  layouts: {
    Layout: h(Layout, null, {
      "doc-title-after": () => h(PageContextMenu),
      "aside-outline-after": () => h(CustomAside),
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
    app.component("ResponsiveImage", ResponsiveImage);
    app.component("DebugInfo", DebugInfo);
    app.component("RawJsonOutput", RawJsonOutput);
    // app.component('CustomComponent', CustomComponent)

    // Replace encrypted page lock icon with custom image
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const replaceLockIcon = () => {
        const lockIcon = document.querySelector(
          "span.vpi-lock.icon-lock-head"
        ) as HTMLElement | null;
        if (lockIcon && !(lockIcon as any).dataset.replaced) {
          const img = document.createElement("img");
          img.src = "https://static.lucas04.top/static/Forbidden.png";
          img.alt = "Encrypted";
          img.title = "Forbidden";
          img.style.display = "inline";
          img.style.height = "120px";
          img.style.verticalAlign = "middle";
          lockIcon.replaceWith(img);
        }
      };

      // Replace on router navigation
      router.afterEach(() => {
        setTimeout(replaceLockIcon, 100);
      });

      // Replace on initial load
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", replaceLockIcon);
      } else {
        replaceLockIcon();
      }
    }

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

    // Detect visitor country to conditionally display beian info
    void (async () => {
      console.log("Attempting to detect visitor country for beian display...");
      try {
        const res = await fetch("https://ip.lucas04.top", {
          cache: "no-store",
        });
        const data = await res.json();
        const country = data.IP.Country.toUpperCase();
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

    // Ensure back-to-top button stays within viewport bounds
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const ensureBackToTopInBounds = () => {
        const backToTopBtn = document.querySelector(
          ".vp-back-to-top"
        ) as HTMLElement | null;
        if (!backToTopBtn) return;

        const rect = backToTopBtn.getBoundingClientRect();
        const padding = 16; // padding from edge
        let adjusted = false;

        // Check if element exceeds right edge
        if (rect.right > window.innerWidth) {
          backToTopBtn.style.right = `${padding}px`;
          adjusted = true;
        }

        // Check if element exceeds bottom edge
        if (rect.bottom > window.innerHeight) {
          backToTopBtn.style.bottom = `${padding}px`;
          adjusted = true;
        }

        // Reset if within bounds
        if (!adjusted) {
          backToTopBtn.style.right = "";
          backToTopBtn.style.bottom = "";
        }
      };

      // Run on initial load
      setTimeout(ensureBackToTopInBounds, 100);

      // Watch for DOM changes
      const backToTopObserver = new MutationObserver(ensureBackToTopInBounds);
      backToTopObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Watch for window resize
      window.addEventListener("resize", ensureBackToTopInBounds);

      // Watch for route changes
      router.afterEach(() => {
        setTimeout(ensureBackToTopInBounds, 100);
      });
    }

    // Add long press on hero-tagline to navigate to /debug/
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      let pressTimer: NodeJS.Timeout | null = null;

      const setupHeroTaglineLongPress = () => {
        const heroTagline = document.querySelector(
          ".hero-tagline"
        ) as HTMLElement | null;

        if (!heroTagline || (heroTagline as any).dataset.longPressEnabled) {
          return;
        }

        // Mark as processed to avoid duplicate listeners
        (heroTagline as any).dataset.longPressEnabled = "true";

        const handlePressStart = (e: MouseEvent | TouchEvent) => {
          // Prevent default behavior to avoid text selection
          e.preventDefault();

          // Clear any existing timer
          if (pressTimer) {
            clearTimeout(pressTimer);
          }

          // Start the 10-second timer
          pressTimer = setTimeout(() => {
            console.log("Long press detected, navigating to /debug/");
            router.push("/debug/");
          }, 10000); // 10 seconds
        };

        const handlePressEnd = () => {
          // Cancel the timer if user releases before 10 seconds
          if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
        };

        // Add event listeners for both mouse and touch events
        heroTagline.addEventListener("mousedown", handlePressStart);
        heroTagline.addEventListener("mouseup", handlePressEnd);
        heroTagline.addEventListener("mouseleave", handlePressEnd);
        heroTagline.addEventListener("touchstart", handlePressStart, {
          passive: false,
        });
        heroTagline.addEventListener("touchend", handlePressEnd);
        heroTagline.addEventListener("touchcancel", handlePressEnd);
      };

      // Setup on initial load
      setTimeout(setupHeroTaglineLongPress, 100);

      // Setup after route changes
      router.afterEach(() => {
        setTimeout(setupHeroTaglineLongPress, 100);
      });

      // Setup when DOM changes (in case hero-tagline is dynamically added)
      const heroObserver = new MutationObserver(setupHeroTaglineLongPress);
      heroObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  },
});
