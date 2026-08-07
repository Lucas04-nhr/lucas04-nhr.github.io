---
title: URL Parameters
permalink: /tools/url-params/
pageLayout: doc
comments: false
createTime: 2026/08/02 21:32:33
password: 1769b6cc7667f797dfca9de03d3ed91a
---


## URL Parameters {#url-parameters}

Here lists some URL parameters that can be used to customize the behavior of the site.

| Parameter | Available values | Default | Behavior |
| --- | --- | --- | --- |
| `locale` | `zh-hans`, `zh-hant` | Browser language | Uses Simplified Chinese (`zh-hans`) or Traditional Chinese (`zh-hant`) character forms. Traditional Chinese is selected automatically for `zh-Hant`, Hong Kong, Macao, and Taiwan browser locales; other locales default to Simplified Chinese. |
| `theme` | `light`, `dark`, `auto` | `auto` | Uses the light theme, dark theme, or follows the operating-system appearance. |
| `bypass` | `true`, `false` | `false` | Enables or disables bypassing the internal connectivity rule used by region detection. |
| `copyAllowed` | `true`, `false` | `false` | Allows ordinary copy operations when `true`. When `false`, ordinary copying is blocked, while code-block copy buttons and the custom menu's **Copy** action remain available. |
| `selectionAllowed` | `true`, `false` | `false` | Allows or prevents text selection. |
| `menuAllowed` | `custom`, `original`, `false` | `custom` | Uses the site-styled context menu, restores the browser's original context menu, or disables context menus completely. The custom menu is available through right-click on desktop and long press on mobile. |
| `debugAllowed` | `true`, `false` | `false` | Allows browser debugging when `true`. When `false`, the site enables its anti-debugging hooks: periodic `debugger` checks, console clearing, developer-tools shortcut blocking, and a full-screen white or black cover matching the active theme after a detected debugging pause. |

For example, the following URL enables ordinary copying and text selection while restoring the browser's original context menu:

```text
?copyAllowed=true&selectionAllowed=true&menuAllowed=original
```

Parameter names are case-sensitive. Supported values are case-insensitive. After a valid parameter is applied, it is removed from the address bar and the preference is saved in a cookie. All preferences persist between browser sessions.
