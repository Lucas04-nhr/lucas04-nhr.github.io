/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export const enNavbar = defineNavbarConfig([
  { text: 'Home', icon:'mdi:home', link: '/' },
  { text: 'Blog',
    icon: 'mdi:blog',
    items: [
      { text: 'All Posts', link: '/blog/' },
      { text: 'Tags', link: '/blog/tags/' },
    ]
   },
  {
    text: 'Docs',
    icon: 'mdi:file-document-box-multiple-outline',
    items: [
      { text: 'All', link: '/docs/' },
      { text: 'R for Bioinformatics Cookbook', link: '/docs/r-course/' },
      { text: 'HUST Graduation Project', link: '/docs/hust-gp-template/' },
    ]
  },
  {
    text: 'Information',
    icon: 'mdi:about-circle-outline',
    items: [
      { text: 'About', icon: 'icon-park-twotone:people', link: '/about/' },
      { text: 'Friends', icon: 'ic:twotone-people-alt', link: '/friends/' },
      { text: 'Buy me a coffee', icon: 'ic:round-attach-money', link: '/support/' },
      { text: 'Tools', icon: 'mdi:tools', link: '/tools/' },
    ]
  },
])
