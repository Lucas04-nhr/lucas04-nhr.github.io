---
title: Gacha Manager
createTime: 2026/10/02 21:39:25
permalink: /docs/gacha-manager/
copyright: false
comments: false
---

## Motivation {#motivation}

Cross-platform support is one of my main concerns when looking for gacha history tools for Genshin Impact, Honkai: Star Rail and Zenless Zone Zero. Many existing tools depend on a particular operating system or client, making it difficult to use the same workflow across devices. This motivated me to build a **Vue-based, self-hostable gacha record manager that runs in a web browser**.

Gacha Manager aims to handle importing, merging, viewing and backing up records in the browser, reducing dependence on desktop applications and operating systems. The current frontend is a Vue 3 component integrated into this site's VuePress pages. Records are stored locally in the current browser and can be transferred between devices by exporting and importing backups.

## Current scope {#current-scope}

The project currently consists of a web frontend and a metadata service:

- **Web frontend**: imports and merges UIGF archives, displays records and basic statistics by game, account and pool, and exports backups. It supports Genshin Impact, Honkai: Star Rail and Zenless Zone Zero, including Genshin Impact's Miliastra Wonderland records.
- **Metadata service**: runs on Cloudflare Workers and D1, retrieves and updates public item metadata, and provides names, rarity, types and icons for the frontend. Public metadata is synchronized by GitHub Actions or local maintenance commands, and can be supplemented manually.

Public metadata queries contain no UIDs or pull histories. Optional personal synchronization stores those records separately in a user's own Worker and D1 database. Self-hosting requires configuring the frontend and metadata service separately; deployment and update instructions are linked below.

## Demo status {#demo-status}

==**This is currently a demo for exploring browser-based record management and basic metadata retrieval and updates.**== Features, the interface and API may change. Metadata coverage and update speed also depend on upstream sources.

Running in a browser does not guarantee direct access to every game's history API. Cross-origin restrictions still apply, so fetching records may require additional tools or a browser helper script. There is currently no account system or automatic synchronization between devices. Keep your original archives and export backups regularly.

## Usage and deployment {#documentation}

- [Open Gacha Manager Demo](/tool/gacha-manager/)
- [Frontend usage guide](/docs/gacha-manager/frontend/)
- [Metadata API, self-hosting and update guide](/docs/gacha-manager/backend/)
