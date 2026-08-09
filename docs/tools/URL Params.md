---
title: URL Parameters
permalink: /tools/url-params/
pageLayout: doc
comments: false
copyAllowed: false
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
| `copyAllowed` | `true`, `false` | `true` | Allows ordinary copy operations when `true`. When `false`, the custom menu's **Copy** action is disabled and blocked copy attempts put a browser-language copyright notice on the clipboard. A Markdown page can override the cookie with frontmatter such as `copyAllowed: false`. Code-block copy buttons remain available. |
| `selectionAllowed` | `true`, `false` | `true` | Allows or prevents text selection. |
| `menuAllowed` | `custom`, `original`, `false` | `custom` | Uses the site-styled context menu, restores the browser's original context menu, or disables context menus completely. The custom menu is available through right-click on desktop and long press on mobile. |
| `debugAllowed` | `true`, `false` | `false` | Allows browser debugging when `true`. When `false`, the site enables its anti-debugging hooks: periodic `debugger` checks, console clearing, developer-tools shortcut blocking, and a full-screen white or black cover matching the active theme after a detected debugging pause. |

For example, the following URL enables ordinary copying and text selection while restoring the browser's original context menu:

```text
?copyAllowed=true&selectionAllowed=true&menuAllowed=original
```

To prohibit copying on one Markdown page without changing the visitor's cookie, add this to its frontmatter:

```yaml
---
copyAllowed: false
---
```

Parameter names are case-sensitive. Supported values are case-insensitive. After a valid parameter is applied, it is removed from the address bar and the preference is saved in a cookie. All preferences persist between browser sessions. The global content-interaction defaults allow selection and copying while using the custom context menu. A page-level `copyAllowed` frontmatter value takes precedence over the cookie for that page without changing the saved cookie.
