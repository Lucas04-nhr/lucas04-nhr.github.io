import { layouts } from "chart.js";
import { layoutCovers } from "echarts/types/src/component/brush/visualEncoding.js";
import { DiagramNotFoundError } from "mermaid/dist/diagram-api/diagramAPI.js";
import NotFound from "./layouts/NotFound.vue";
// import Layout from "./layouts/Layout.vue";
import { Layout } from "vuepress-theme-plume/client";
import { defineClientConfig } from "vuepress/client";
import { CreateComponentPublicInstanceWithMixins, ComponentOptionsMixin, PublicProps, GlobalComponents, GlobalDirectives, ComponentProvideOptions, ComponentOptionsBase, VNodeProps, AllowedComponentProps, ComponentCustomProps } from "vue";
// import RepoCard from 'vuepress-theme-plume/features/RepoCard.vue'
// import NpmBadge from 'vuepress-theme-plume/features/NpmBadge.vue'
// import NpmBadgeGroup from 'vuepress-theme-plume/features/NpmBadgeGroup.vue'
// import Swiper from 'vuepress-theme-plume/features/Swiper.vue'

// import CustomComponent from './theme/components/Custom.vue'

// import './theme/styles/custom.css'

export default defineClientConfig({

  layouts: {
    NotFound: NotFound,
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
        if (country === "CN") {
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
  },
});
