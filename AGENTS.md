# Project Collaboration Guide

This guide applies to the entire repository. Before making changes, read the target files, related configuration, and comparable articles. Follow the project's actual structure and language conventions. Follow the user's preferred language for communication; choose article language according to the user's request and the relevant series.

## Project and Directory Structure

This is Lucas's personal blog, covering bioinformatics course notes, paper discussions, technical notes, and project guides. It uses VuePress 2, Vue 3, TypeScript, Vite, and `vuepress-theme-plume`, with pnpm for dependency management.

| Path | Purpose |
| --- | --- |
| `docs/blog/` | Standalone blog posts; `Archived/` contains historical articles |
| `docs/guide/` | Documentation series, including R courses, the HUST graduation project template, KU master's courses, and StayUp Schedule |
| `docs/tools/` | Tool pages and usage instructions |
| `docs/legal/` | Legal and copyright information |
| `docs/README.md` | Site homepage |
| `docs/about.md`, `docs/friends.md`, `docs/shop.md`, `docs/support.md` | Standalone site pages |
| `docs/.vuepress/config.ts` | VuePress, bundler, plugin, and theme feature configuration |
| `docs/.vuepress/plume.config.ts` | Theme appearance, site profile, copyright, and collection/navigation integration |
| `docs/.vuepress/collections.ts`, `docs/.vuepress/navbar.ts` | Content collections, automatic sidebars, and top navigation |
| `docs/.vuepress/client.ts` | Client registration, layouts, and browser interactions |
| `docs/.vuepress/components/`, `docs/.vuepress/layouts/` | Custom components and page layouts |
| `docs/.vuepress/theme/` | Theme components, utilities, and styles |
| `docs/.vuepress/public/` | Static assets, served from the site root |
| `.github/workflows/`, `.github/scripts/` | GitHub Pages deployment and dependency update automation |

## Common Commands

Run commands from the repository root. Node.js requirements are defined by `engines` in `package.json`; CI uses Node.js 22. Use the pnpm version specified by `packageManager`.

```sh
pnpm install --frozen-lockfile
pnpm docs:dev
pnpm docs:dev-clean
pnpm docs:build
pnpm docs:preview
```

- Start with `docs:dev`; use `docs:dev-clean` when the development server needs a clean cache.
- `docs:build` clears caches and temporary files and generates `docs/.vuepress/dist`. `docs:preview` serves the existing build output.
- `pnpm vp-update` updates VuePress and the theme. Use it only for upgrade tasks. Keep `package.json` and `pnpm-lock.yaml` synchronized when changing dependencies, and preserve existing `pnpm-workspace.yaml` settings.
- There are currently no test, lint, or typecheck scripts. Do not claim to have run checks that are not configured.

## Content Placement and Metadata

- Place standalone articles in `docs/blog/`. Place related courses, tutorials, and project documentation in the appropriate series under `docs/guide/`. Tool documentation belongs in `docs/tools/`.
- Prefer short, descriptive English kebab-case filenames for new posts, following `bsa-pairwise-alignment.md`, `advbinf-em-algo.md`, and `paper-sharing-20260414.md`. Preserve existing numeric prefixes, spaces, and naming conventions in documentation series. Quote paths containing spaces in shell commands.
- Do not rename historical files, relocate `Archived/`, or renumber an entire series solely to standardize naming.
- Use YAML frontmatter at the top of Markdown files. New posts normally include `title`, `createTime`, `permalink`, `excerpt`, and `tags`. For series documents, follow neighboring pages for at least the title, creation time, and permalink.
- Format `createTime` as `YYYY/MM/DD HH:mm:ss`. Preserve existing creation times. For new articles, use the actual creation time or a user-provided time rather than copying a neighboring article's timestamp.
- Write a concise `excerpt` describing the topic and scope in the article's language. Avoid promotional wording. Reuse existing tag names and capitalization, such as `KU`, `Advanced Bioinformatics`, and `Paper Sharing`; add tags only when the content warrants them.
- Treat existing `permalink` values as stable public addresses, independent of titles or filenames. Historical posts use both `/blog/` and `/blogs/`; preserve both conventions for existing pages. Prefer `/blog/<slug>/` for new standalone posts and check for duplicate links before writing one.
- Collection configuration requires guide links to start with `/docs/`, tool links with `/tool/`, and legal links with `/legal/`; otherwise sidebars may not match. Update `collections.ts` or `navbar.ts` when adding a collection or navigation entry. Ordinary new articles generally need no configuration changes.
- Do not copy `password`, `copyright: false`, `comment: false`, or other special states from neighboring posts as template defaults. Preserve existing access and comment settings. Do not move protected content to public pages or copy passwords into documentation, logs, or new posts.
- Currently, `preview: true` adds a PREVIEW watermark and disables comments when `watermark` is unspecified. This is a display setting, not an access restriction.

## Writing Style

### Shared Principles

- Read two or three articles from the same series or content type before writing. Prefer recent original course notes over archived or republished material. Respect each article's language; the site's default `en-US` locale does not imply that Chinese content should be translated.
- Use a clear study-note style that directly explains concepts, conditions, and applications. Avoid exaggerated wording, generic introductions, and repeated summaries. Do not imitate typos, duplicated paragraphs, or unverified claims in older articles.
- Body content usually starts with `##`, with `###` and `####` for details; the page title comes from frontmatter. The theme outline displays heading levels two through four, so organize the main content within those levels.
- Give important new sections explicit English anchors where useful, such as `## Expectation {#expectation}`. Prefer kebab-case for new anchors and avoid duplicates within a page. Preserve existing anchors to keep external references working.
- Mark concepts with `**term**` and highlight a few key conclusions with `==key conclusion==` or `==**key conclusion**==`. Avoid highlighting entire paragraphs or using bold throughout the page.
- Use lists for parallel points and procedures, and tables for comparing algorithms, parameters, or results. Keep explanations and arguments in coherent paragraphs.
- Introduce full technical names and abbreviations where needed. Chinese articles may include English terminology. Keep notation, terminology, units, and capitalization consistent throughout.
- Do not invent author experiences, experimental results, command output, paper details, or citations. Distinguish published findings, course material, and the author's own explanations. State limitations when evidence is missing.

### Course and Algorithm Notes

Use `docs/blog/advbinf-em-algo.md` and `docs/blog/bsa-pairwise-alignment.md` as references. Recent KU course notes are mainly in English. A useful progression is basic concepts and applicability, methods or derivations, examples and interpretation, then complexity or limitations. Adapt this structure to the topic rather than filling a rigid template.

- Explain model assumptions, variables, and algorithm objectives before presenting equations. Follow derivations with intuitive explanations and concrete examples where useful.
- Use `$...$` for inline mathematics and `$$` blocks for display equations. The current renderer is KaTeX. Keep math environments complete and check subscripts, superscripts, matrices, recurrence boundaries, probability conditions, and complexity claims for consistency.
- Label code fences with the actual language, such as `r`, `python`, `bash`, or `text`. Separate command output from executable code. Do not present invented output as a verified result.
- For documentation series, also read the containing directory's `README.md` and neighboring pages. Preserve course or lecture context and links to original slides, Rmd files, or other source materials.

### Paper Discussions

Follow the source presentation in `docs/blog/paper-sharing-20260414.md`. Cover the original paper, background, methods, main results, discussion, and limitations as appropriate. Verify statistics, dates, figure numbers, and findings against their sources. Preserve confidence intervals and qualifications rather than turning inferences into established facts.

Use `<LinkCard>` for original-paper links where helpful. Give figures meaningful descriptions and retain their corresponding numbers. For republished or translated articles, distinguish the original paper from the secondary source and retain attribution. Never label republished text as original work.

### Technical Notes and Project Guides

Explain the problem or goal, applicable environment, concrete steps, verification method, and relevant caveats. Use `::: steps`, code blocks, and admonitions where useful. Some technical articles, such as `apfs-volume.md`, are republished; preserve their source status when borrowing their structure. Explain the actual effects of commands involving data deletion, disk operations, or similar changes.

## Markdown and Assets

- This project uses Plume's extended Markdown. See `docs/guide/9999. Markdown/markdown-example.md` for syntax examples and `docs/.vuepress/config.ts` for enabled features.
- Use `::: note`, `::: tip`, `::: warning`, `::: steps`, collapsible containers, `<LinkCard>`, Mermaid, and registered Vue components as needed. Follow existing repository examples, close containers, fences, and component tags properly, and avoid adding dependencies for ordinary articles.
- Reference files in `docs/.vuepress/public/` using site-root paths, such as `/assets/<filename>`. Preserve existing asset URLs on `pic.lucas04.top`, `static.lucas04.top`, and other hosts. Do not invent upload URLs.
- Prefer stable `permalink` values for internal page links and verify anchors when linking to sections. Provide meaningful image alt text and retain source information for republished figures.
- Asset URL replacement is enabled in the theme configuration. Check `replaceAssets` and build output when migrating assets rather than replacing existing URLs indiscriminately.
- The theme defaults article content to CC BY-NC-SA 4.0. Repository code licensing is defined in `LICENSE`. Preserve article-specific copyright notices and exceptions.

## Site Code Changes

- Make the smallest necessary changes within existing component, layout, utility, or style directories. Follow the target file's formatting, naming, and import conventions without reformatting unrelated files.
- Settings in `plume.config.ts` override matching settings in `config.ts`. Confirm which file owns a setting and avoid duplicating it. Maintain the existing division between feature configuration requiring a restart and theme configuration supporting hot updates.
- Keep browser APIs inside client lifecycle hooks or existing environment guards. Avoid directly accessing `window`, `document`, storage, or observers during SSR. Clean up new listeners and observers on unmount and account for repeated route entry.
- For interaction changes, check light and dark themes, mobile viewports, and route transitions. Read the corresponding logic in `theme/utils/` before changing language switching, URL parameters, or user preferences.
- Do not commit generated directories such as `node_modules/`, `.temp/`, `.cache/`, or `dist/`, or edit build output directly.

## Verification and Delivery

- Check `git status` and diffs before and after editing, preserving the user's existing changes. Report what changed, which checks ran, and what remains unverified.
- For repository documentation changes such as this file, verify content, paths, commands, and `git diff --check`. A full site build is unnecessary.
- After changing articles or site code, run `pnpm docs:build`. Inspect build errors and new or affected warnings. Report environmental limitations honestly if the build cannot finish; do not claim it passed.
- For changes to equations, containers, Vue components, assets, or styles, inspect affected pages through the development server or build preview. A successful build alone does not confirm correct formula rendering, remote images, or interactions.
- VuePress automatically fills in titles and creation times. After starting or building the site, check for unrelated Markdown changes. Handle only changes introduced by the task and preserve user edits.
- Pushing to `main` currently triggers deployment. Keep commits, pushes, publishing, and dependency upgrades within the user's requested scope; completing a local edit does not itself authorize deployment.
- When the user explicitly asks Codex to push changes, include `Co-authored-by: Codex <noreply@openai.com>` in the commits created for that push by default, unless the user requests otherwise.
