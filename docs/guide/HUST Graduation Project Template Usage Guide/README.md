---
title: HUST Graduation Project Template Usage Guide
tags:
  - guide
  - HUST
createTime: 2025/12/03 19:58:43
permalink: /docs/hust-gp-template/
---

<LinkCard 
  icon="ic:round-file-copy"
  title="项目 GitHub 主页"
  href="https://github.com/Lucas04-nhr/HUST-GP-Template" > 
  
  点击卡片前往本项目的 GitHub 仓库，如果觉得好用欢迎 star ~

</LinkCard>

::: note
由于本模板主要面向华中科技大学（HUST）生命科学与技术学院的本科毕业论文撰写需求，故指南采用中文进行编写。如有任何疑问，欢迎访问 [FAQs](/docs/hust-gp-template/faqs/) 页面查阅常见问题解答。
:::

## 适用于 HUST 的本科毕业论文 $LaTeX$ 模板使用指南 {#hust-gp-template-guide}

学校似乎只提供了 Word 格式的论文模板，然而 $\LaTeX$ 在排版学术论文方面有着显著优势，尤其是在需要插入大量图片、代码及表格的情况下。

因此，我基于之前各类实验报告的模板，参考着学校要求，创建了一个基于 $\LaTeX$ 的本科毕业论文模板。

::: note
- 本模板基于 $\LaTeX$ 制作，如需使用建议先行学习相关知识。
- 软件及字体的安装教程不在此赘述，可参考网络资源。
- 如果在生命学院大二开设的 R 语言课程中使用 R Markdown 编写过实验报告并且后期没有卸载过 TinyTeX，那么你已经具备了使用本模板的基本环境。
- 如果不确定是否具有基本环境，请参考 [Rapheal](https://github.com/chide-org) 提供的 [Windows 简明教程（含 biber 问题修复）](/docs/hust-gp-template/wsl-biber-fix/)
:::

### 先决条件 {#prerequisites}

- 安装 $\LaTeX$ 发行版（推荐使用由 Yihui Xie 维护的 [TinyTeX](https://yihui.org/tinytex/)）。
- 安装 $\LaTeX$ 编辑器（理论上任何文本编辑器都可以对文件进行编辑）。
- 安装必要的字体（如 SimSun、SimHei 等）。

::: tip
- 本人使用 macOS 系统的 VS Code 作为编辑器，通过 TinyTeX 附带的 XeLaTeX 引擎利用 `latexmk` 进行更自动化的编译。这两个工具都是跨平台的，理论上可以在 Windows 和 Linux 系统上使用。
- 如果你不想配置环境，也可以将模板上传至 [Overleaf](https://www.overleaf.com/) 或 [FlyLaTeX](https://www.flylatex.cn/) 等在线 $\LaTeX$ 编辑器中进行编辑和编译。学校提供了 FlyLaTeX 编辑器的高级版功能（协作、历史版本等），使用统一身份认证登录后即可免费使用。
- 根据学院讲座的模板，论文中可能使用到的字体有宋体(SimSun/FandolSong)、黑体(SimHei/FandolHei)等，其中 [Fandol 系列字体](https://ctan.org/tex-archive/fonts/fandol)是 CTAN 官方的默认字体，考虑到生信专业大部分干实验可能需要插入代码，模板中也附带了等宽字体 [Maple Mono NF CN](https://github.com/Subframe7536/maple-font) 的支持，推荐安装上述所有字体以确保论文编译效果最佳。
:::

### 下载模板 {#download-template}

<LinkCard 
  icon="ic:outline-file-download"
  title="下载"
  href="https://github.com/Lucas04-nhr/HUST-GP-Template/releases" > 
  
  点击卡片前往 GitHub 仓库的 Relese 页面，下载**最新版本**的模板并完成解压

</LinkCard>

### 在编辑器中打开模板并进行编辑修改 {#open-and-edit-template}

使用你喜欢的文本编辑器打开解压后的模板文件夹，建议直接打开整个文件夹以便于管理。此处以 VS Code 为例：

::: tip
如果你使用 VS Code，可以安装 [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) 插件以获得更好的 $\LaTeX$ 编辑体验。
:::

- `sample.tex` 是模板的主文件，其他文件中包含了参考文献、图片等资源。
- 论文的正文部分位于 `sample.tex` 文件中的 `\begin{document}` 和 `\end{document}` 之间。
- 参考文献存储在 `references.bib` 文件中，使用 BibTeX 格式进行管理。
- 图片资源存储在 `fig` 文件夹中，你可以将自己的图片放入该文件夹并在正文中引用。
- `titlepage.tex` 文件包含论文的原创性声明和版权页，一般不需要进行修改。
- `cnabstract.tex` 和 `enabstract.tex` 文件分别包含中文和英文摘要部分。
- `cover.tex` 文件包含封面部分，请将个人信息部分修改为正确的内容。

::: caution
- 由于在线编辑器的局限性，可能无法使用 `minted` 宏包进行代码高亮显示，特殊代码框样式不受影响。
- 论文的标题及副标题请在 `sample.tex` 文件的`\begin{document}`之前的对应部分进行修改，会自动被引用到封面和标题页中。
- 请确保在编辑过程中不要更改模板中的命令和环境定义，除非你非常清楚自己在做什么，否则可能会导致编译错误或排版问题。
:::

#### 一些自定义的命令 {#custom-commands}

模板中预定义了一些自定义命令以简化论文的编写过程，可以[点击前往查看](/docs/hust-gp-template/custom-commands/)

### 编译模板 {#compile-template}

#### 环境配置 {#environment-configuration}

在编辑器中打开 `.latexmkrc` 文件，确保其中的环境变量路径配置正确，将 `'$YOUR_CUSTOM_FILE_PATH'` 替换为你本地安装 `pygments` 以及 `minted` 的路径，否则可能会在有代码插入时出现问题：

```perl
$ENV{'PATH'} = '~/Developer/miniconda3/bin:' . $ENV{'PATH'};
```

#### 编译命令 {#compilation-command}

在编辑器中打开 `sample.tex` 文件后，可以使用以下命令进行编译：

```bash
latexmk sample.tex
```

该命令会根据已经预定义好的`.latexmkrc`文件配置自动调用 XeLaTeX 引擎进行编译，并生成最终的 PDF 文件 `sample.pdf`。

你也可以使用编辑器自带的编译功能（如 VS Code 的 LaTeX Workshop 插件）：按住 `Cmd/Ctrl + Shift + P` 打开命令面板，输入 `LaTeX Workshop: Build with recipe` 并选择编译选项 `latexmk(latexmkrc)` 进行编译。

::: tip
你可以在项目根目录下创建 `.vscode/settings.json` 文件，并添加以下内容以指定默认的编译选项及自动编译时机：
```json :collapsed-lines=5
{
  "latex-workshop.latex.recipe.default": "latexmk (latexmkrc)",
  "latex-workshop.latex.autoBuild.run": "onFileChange",
  "latex-workshop.latex.autoBuild.interval": 300000,
  "latex-workshop.latex.autoClean.run": "onSucceeded",
  "latex-workshop.latex.rootFile.indicator": "\\begin{document}",
  "latex-workshop.latex.clean.fileTypes": [
    "%DOCFILE%.aux",
    "%DOCFILE%.bbl",
    "%DOCFILE%.blg",
    "%DOCFILE%.idx",
    "%DOCFILE%.ind",
    "%DOCFILE%.lof",
    "%DOCFILE%.lot",
    "%DOCFILE%.out",
    "%DOCFILE%.toc",
    "%DOCFILE%.acn",
    "%DOCFILE%.acr",
    "%DOCFILE%.alg",
    "%DOCFILE%.glg",
    "%DOCFILE%.glo",
    "%DOCFILE%.gls",
    "%DOCFILE%.fls",
    "%DOCFILE%.log",
    "%DOCFILE%.fdb_latexmk",
    "%DOCFILE%.snm",
    "%DOCFILE%.synctex(busy)",
    "%DOCFILE%.synctex.gz",
    "%DOCFILE%.nav",
    "%DOCFILE%.vrb"
  ]
}
```
:::

到这一步如果没有出现报错，你应该已经成功生成了论文的 PDF 文件 `sample.pdf`，可以在文件夹中找到并打开查看最终效果。

::: tip
请在提交论文前仔细检查生成的 PDF 文件，确保所有内容均符合要求，包括图片、表格、参考文献等。
- 如果发现问题，可以返回到相应的源文件进行修改，然后重新编译生成新的 PDF 文件。
- 部分报错可以参考后续的 [FAQs](/docs/hust-gp-template/faqs/) 部分进行解决。
:::

## 协助编辑 {#contribute}

如果你有更好的想法，欢迎 Fork 本仓库并提交 Pull Request，达到一定质量后将会被合并至主分支，并在[支持者名单](SUPPORTERS.md)中进行记录以示感谢。

## 问题反馈 {#issue-feedback}

如果在使用过程中遇到任何问题，请先查看 [FAQ](/docs/hust-gp-template/faqs/) 页面，如果页面中没有你所遇到的情形，欢迎前往本仓库的 [Issues](https://github.com/Lucas04-nhr/HUST-GP-template/issues) 页面进行反馈。

::: flex around center
<LinkCard 
  icon="ic:outline-description"
  title="前往 FAQ 页面查看常见问题"
  href="/docs/hust-gp-template/faqs/" > 
</LinkCard>

<LinkCard 
  icon="ic:round-question-answer"
  title="前往 GitHub Issues 页面反馈"
  href="https://github.com/Lucas04-nhr/HUST-GP-template/issues" > 
</LinkCard>
:::

## 投喂 {#support}

如果你觉得这个模板对你有帮助，欢迎通过 [此页面](https://github.com/Lucas04-nhr#-support-me) 进行支持，另外，也欢迎点击 Star 来表示对本项目的认可。本人将不定期将达到一定金额的支持者名单更新在 [支持者名单](/docs/hust-gp-template/supporters/) 中，以表达感谢。


