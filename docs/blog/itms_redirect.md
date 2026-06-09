---
title: App Store Link Redirection Script
createTime: 2026/06/09 20:05:30
permalink: /blog/itms_link_redirection/
excerpt: 'A Tampermonkey script to redirect App Store links, avoiding being redirected to homepage when using Chinese IP.'
tags:
  - Network Engineering
  - Extension
---

This Tampermonkey script redirects `https://` App Store web links to the `itms-apps://` protocol, so clicking App Store links can open the App Store app directly, to bypass the regional restriction of accessing web App Store in China Mainland. It also provides quick shortcuts to switch App Store regions.

## Features {#features}

- Redirects App Store web links such as `https://apps.apple.com/app/<app_id>` to `itms-apps://apps.apple.com/app/<app_id>`.
- Supports three redirect scenarios:
  1.  Intercepting user clicks on matching links.
  2.  Rewriting matching links in the current page (including dynamically added links).
  3.  Auto-redirecting direct visits to `https://apps.apple.com/...` in the address bar.
- Provides a menu toggle to enable or disable redirect behavior.
- Provides 5 common App Store region switch shortcuts.
- Region shortcuts are grouped under a collapsible menu and sorted by `cc`.

## Installation {#installation}

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Use the following link to install the script.

<LinkCard
  icon="simple-icons:greasyfork"
  title="Install the script on Greasy Fork"
  href="https://update.greasyfork.org/scripts/581888/App%20Store%20Link%20Redirect.user.js"
/>

## Usage {#usage}

After enabling the script:

1. Visit any page containing App Store web links.
2. Click a matching link, and the script will redirect to `itms-apps://...`.
3. Open the Tampermonkey menu to toggle redirect or switch regions.

## Menu Commands {#menu-commands}

- **Toggle Redirect**: Enable or disable all redirect features.
- **Region Shortcuts**: Expand or collapse the region list.
- **Switch Region**: Open App Store internal switch URL:
  - `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?dsf={dsf}&cc={cc}`

## Common Regions {#common-regions}

- **CN**: China Mainland (`dsf=143465`)
- **DK**: Denmark (`dsf=143458`)
- **HK**: Hong Kong (`dsf=143463`)
- **JP**: Japan (`dsf=143462`)
- **TR**: Turkey (`dsf=143480`)
- **US**: United States (`dsf=143441`)

::: note
Region mapping values (`cc`, `dsf`) may change if Apple updates storefront definitions in the future.
:::

---

## Script Code {#script-code}

If you don't have access to Greasy Fork, you can create a new user script in Tampermonkey and copy the following code:

```javascript title="App Store Link Redirect.user.js" :collapsed-lines
// ==UserScript==
// @name         App Store Link Redirect
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Redirect App Store web links to itms-apps and provide quick region switch shortcuts.
// @author       Lucas
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      GPLv3
// @icon        https://www.apple.com/favicon.ico
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY_REDIRECT_ENABLED = "isRedirectEnabled";
  const STORAGE_KEY_REGION_MENU_EXPANDED = "isRegionMenuExpanded";
  let isRedirectEnabled = GM_getValue(STORAGE_KEY_REDIRECT_ENABLED, true);
  let isRegionMenuExpanded = GM_getValue(
    STORAGE_KEY_REGION_MENU_EXPANDED,
    false,
  );

  const COMMON_REGIONS = [
    { name: "China Mainland", cc: "CN", dsf: "143465" },
    { name: "Denmark", cc: "DK", dsf: "143458" },
    { name: "Hong Kong", cc: "HK", dsf: "143463" },
    { name: "Japan", cc: "JP", dsf: "143462" },
    { name: "Turkey", cc: "TR", dsf: "143480" },
    { name: "United States", cc: "US", dsf: "143441" },
  ];

  function getSortedRegions() {
    return [...COMMON_REGIONS].sort((left, right) =>
      left.cc.localeCompare(right.cc),
    );
  }

  function isHttpProtocol(protocol) {
    return protocol === "http:" || protocol === "https:";
  }

  function isWebAppStoreUrl(url) {
    return (
      isHttpProtocol(url.protocol) &&
      url.hostname.toLowerCase() === "apps.apple.com"
    );
  }

  function toItmsAppsUrl(url) {
    return `itms-apps://${url.host}${url.pathname}${url.search}${url.hash}`;
  }

  function maybeParseUrl(input) {
    try {
      return new URL(input, window.location.href);
    } catch (_) {
      return null;
    }
  }

  function toggleRedirect() {
    isRedirectEnabled = !isRedirectEnabled;
    GM_setValue(STORAGE_KEY_REDIRECT_ENABLED, isRedirectEnabled);
    alert(
      `App Store redirect is now ${isRedirectEnabled ? "enabled" : "disabled"}.`,
    );
    window.location.reload();
  }

  function toggleRegionMenu() {
    isRegionMenuExpanded = !isRegionMenuExpanded;
    GM_setValue(STORAGE_KEY_REGION_MENU_EXPANDED, isRegionMenuExpanded);
    alert(
      `Region shortcuts are now ${isRegionMenuExpanded ? "expanded" : "collapsed"}.`,
    );
    window.location.reload();
  }

  function buildRegionSwitchUrl(region) {
    const query = new URLSearchParams({ dsf: region.dsf, cc: region.cc });
    return `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/resetAndRedirect?${query.toString()}`;
  }

  function switchRegion(region) {
    window.location.href = buildRegionSwitchUrl(region);
  }

  function registerMenus() {
    const stateText = isRedirectEnabled ? "enabled" : "disabled";
    const stateIcon = isRedirectEnabled ? "✅" : "❌";
    GM_registerMenuCommand(
      `${stateIcon} Toggle Redirect (current: ${stateText})`,
      toggleRedirect,
    );

    const regionStateText = isRegionMenuExpanded ? "expanded" : "collapsed";
    const regionStateIcon = isRegionMenuExpanded ? "▼" : "▶";
    GM_registerMenuCommand(
      `${regionStateIcon} Region Shortcuts (current: ${regionStateText})`,
      toggleRegionMenu,
    );

    if (!isRegionMenuExpanded) {
      return;
    }

    getSortedRegions().forEach((region) => {
      GM_registerMenuCommand(
        `Switch Region: ${region.cc} - ${region.name}`,
        function () {
          switchRegion(region);
        },
      );
    });
  }

  function rewriteAnchor(anchor) {
    const parsed = maybeParseUrl(anchor.href);
    if (!parsed || !isWebAppStoreUrl(parsed)) {
      return;
    }

    const itmsHref = toItmsAppsUrl(parsed);
    if (anchor.href !== itmsHref) {
      anchor.href = itmsHref;
      anchor.dataset.itmsRedirectRewritten = "1";
    }
  }

  function rewriteExistingAnchors(root) {
    const anchors = root.querySelectorAll("a[href]");
    anchors.forEach(rewriteAnchor);
  }

  function startDomRewriteObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          if (node.matches("a[href]")) {
            rewriteAnchor(node);
          }
          rewriteExistingAnchors(node);
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function handleAnchorClick(event) {
    if (!isRedirectEnabled) {
      return;
    }
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a[href]");
    if (!anchor) {
      return;
    }

    const parsed = maybeParseUrl(anchor.href);
    if (!parsed || !isWebAppStoreUrl(parsed)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    window.location.href = toItmsAppsUrl(parsed);
  }

  function maybeRedirectCurrentPage() {
    if (!isRedirectEnabled) {
      return;
    }

    const current = maybeParseUrl(window.location.href);
    if (!current || !isWebAppStoreUrl(current)) {
      return;
    }

    window.location.replace(toItmsAppsUrl(current));
  }

  registerMenus();
  maybeRedirectCurrentPage();

  if (!isRedirectEnabled) {
    return;
  }

  rewriteExistingAnchors(document);
  startDomRewriteObserver();
  document.addEventListener("click", handleAnchorClick, true);
})();
```
