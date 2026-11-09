---
title: AltStore Source
createTime: 2026/11/09 19:30:05
permalink: /tool/altstore/
excerpt: A personal AltStore source that mirrors the AltGallery list and adds apps picked by Lucas, with steps for adding it to AltStore, SideStore and other compatible apps.
pageLayout: doc
aside: false
readingTime: false
comments: false
copyright: false
---

## Overview {#overview}

This is a personal **AltStore source**: a JSON file that sideloading apps read to list apps, versions and update news. It combines two parts:

- Every app from [AltGallery](https://github.com/bebound/AltGallery), a curated list of IPA projects on GitHub maintained by bebound.
- A few apps picked by me, each built directly from its own GitHub Releases.

The source works with [AltStore](https://altstore.io/), [SideStore](https://sidestore.io/), [LiveContainer](https://github.com/LiveContainer/LiveContainer), [Feather](https://github.com/claration/feather) and other apps that read the AltStore source format.

## Add the Source {#add-the-source}

Source URL:

```text
https://static.lucas04.top/altstore.json
```

::: steps

1. Open the link for your app on the iPhone or iPad where it is installed:

   - [Add to AltStore](altstore://source?url=https://static.lucas04.top/altstore.json)
   - [Add to SideStore](sidestore://source?url=https://static.lucas04.top/altstore.json)
   - [Add to LiveContainer](livecontainer://source?url=https://static.lucas04.top/altstore.json)

2. For any other app, copy the source URL above and add it in the app's source or repository settings.

3. Confirm the source in the app. In AltStore and SideStore, its apps then appear under **Browse** and new releases under **News**. In LiveContainer, the source appears in the **Sources** tab.

:::

## Apps {#apps}

### My Picks {#my-picks}

| App | Description | Requirements |
| --- | --- | --- |
| [GestaltX](https://github.com/huamidev/GestaltX) | A MobileGestalt editor with region-code tweaks, device presets, a field editor and automatic backups. | Installs on iOS 26.0+; editing MobileGestalt on the device requires iOS / iPadOS 27.x. |

::: warning GestaltX
GestaltX changes system capability flags, and the effects depend on the device and OS. It backs up the original values before every write, but use it only on devices you own or are authorized to manage. When re-signing it, keep its share extension and give the app and the extension the same App Group.
:::

### From AltGallery {#from-altgallery}

The full AltGallery list is included as published. See the [AltGallery README](https://github.com/bebound/AltGallery#available-apps) for the current list. To request an app there, open an issue in that repository.

If an app in my picks has the same bundle identifier as an AltGallery app, my entry is used.

## Updates {#updates}

A GitHub Actions workflow rebuilds the source once a day and whenever its configuration changes. It reads the latest AltGallery list and the GitHub Releases of each app I added, then uploads the result only if something changed. Your app refreshes the source on its own schedule, or when you pull to refresh.

The source and its generator are open source:

<RepoCard repo="Lucas04-nhr/lucas04-nhr.github.io" />

## Notes {#notes}

::: note
This source only lists apps and links to their downloads. The IPA files are downloaded from each project's GitHub Releases, and icons and screenshots are loaded from GitHub and the projects' own hosts, so those services see your IP address. I do not build, review or sign these apps. Each app keeps its own license, and you install it at your own risk.

The AltGallery list belongs to its maintainer and is released under the MIT License.
:::
