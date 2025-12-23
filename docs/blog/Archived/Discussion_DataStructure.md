---
title: Data Structure Q&A
createTime: 2024/03/18
permalink: /blog/data-structure-qa/
tags:
  - Data Structure
  - Review
  - Archived
---

::: warning

All the posts with "Archived" tag are old notes for backup only. They are migrated from my old blog system with `Jekyll`, with lack of proper formatting.

所有带有 “Archived” 标签的文章均为旧笔记，仅供备份存档。它们是从我以前使用 `Jekyll` 博客系统迁移过来的，缺乏更新的格式支持。

:::

## Here's a Q&A Page of Data Structure for you to ask questions and share your knowledge.

这是一个 Q&A 页面，你可以在这里提问和分享你的知识。

点击[此处](#giscus-target)快速定位

---

Based on Giscus and GitHub Discussions, I will add a comment section to this page. You can ask questions and share your knowledge here. I will check and update the common questions of classmates in the comment section from time to time.

Press [here](#giscus-target) to jump to the comment section

基于 Giscus 和 GitHub Discussions 构建，我将在此页面添加评论区。你可以在这里提问和分享你的知识，我会不定期查看并在评论区更新同学们的共性问题。

---

## 有关 IDE 的选择与安装

1. 大一上 C++如果留下来了 Visual Studio 2010 版本，~~如果能忍受没有代码补全和 Copilot 等 AI 功能的话~~可以直接使用。

> 2016 版本之前的 Visual Studio 需要~~破解之后使用~~安装学习版

2. 如果没有留下来，可以做如下尝试（难度依次递增，但是功能性也相应依次递增，操作不来的可以~~淘宝搜索“软件代安装”~~私信我）：

   - 在线网站 [Lightly](https://lightly.teamcode.com/)

     {% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/62dbb46f-401d-40ee-ab23-71c09157c14e" caption="Price of Lightly" %}

   - Microsoft Visual Studio 2019+

     从 2019 版本开始代码补全才引入了软件当中，从 2016 版本开始每个大版本都有对应的**免费社区版**，不需要花钱，更早版本则需要自行寻找学习版

   - Microsoft Visual Studio Code

     **开源免费**，Mac 平台也适用，但是配置稍显复杂，但是可以自行 B 站搜索“配置 Visual Studio Code 运行调试 C++/Perl/Python/R 语言”，按照教程更改对应 JSON 配置文件

   - JetBrains IDE

     不需要过多配置。和 Microsoft Visual Studio 功能相似的另一家公司开发的 IDE，学习版由于律师函，能找到的版本都不是最新版，而且普遍都不稳定，但是该公司为在校学生**免费**提供专业版本的非商业使用许可证，仅需前往[官网](https://www.jetbrains.com/community/education/#students)申请即可，下附申请说明。~~每年可以省￥ 1000 多~~

   {% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/8e9cc667-08cc-4454-b273-0d260e95a372" caption="JetBrains Student License" %}

---

### JetBrains 学生许可证申请说明（简要）

由于华科邮箱已经被 JetBrains 拉进邮箱验证的黑名单，所以我们无法通过简便方式即时获取许可证。

你需要准备：学信网学籍验证报告

剩余步骤可见[知乎文章](https://www.zhihu.com/question/382644898/answer/2784267828)，一次验证有效期一年，到期之前会发送邮件提示续期。激活验证邮件如下所示：
{% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/5f417f34-eb47-4968-8d01-c2781e008c66" caption="License Certificate" %}

**注意：** 验证时长一般为一周左右，关注官方邮件消息，许可证激活链接有有效期，如果过期可以自行向官方中文客户支持发送邮件。
{% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/168ecb5c-833b-40bf-9bbf-417d9f938533" caption="Email Send to JetBrains Support" %}
{% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/6f71bcab-58a9-4060-b8a9-7694cf2b7249" caption="Replied Email from JetBrains Support" %}

---

### GitHub Student Developer Pack 申请说明（简要）

可查看[知乎文章](https://zhuanlan.zhihu.com/p/672294491)

对于华科学生，通过该方式申请 JetBrains 学生许可证已无效。

> 由于华科邮箱已经被 JetBrains 拉进邮箱验证的黑名单，所以我们无法通过简便方式即时获取许可证。

认证成功后显示的页面（此认证 2 年有效）

{% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/8365ebf8-3a64-4e78-b9b9-aa99bb21805d" caption="Success!" %}

GitHub Student Developer Pack 还提供包括但不限于 Azure 云服务每年$100 的额度，可以自己搭建云服务器(包括但不限于创建 QQ 聊天机器人等)、配置 SQL Server、namespace 每年免费域名……

---

### GitHub Copilot 安装使用指南

这是一个基于 GPT3.5-Turbo 的 AI 代码生成平台，本人真实体验可以提高至少 50%编程速度。

- Visual Studio

本人暂无 Windows 设备，此部分咕咕

- Visual Studio Code

前往插件商店下载有关 GitHub Copilot 的插件，登录 GitHub 账号即可使用。

{% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/888151f3-448b-4138-93c6-62c68bf56f9d" caption="GitHub Copilot in VSCode" %}

- JetBrains IDEs

前往插件商店下载有关 GitHub Copilot 的插件，登录 GitHub 账号即可使用。

{% include figure.html image="https://github.com/Lucas04-nhr/lucas04-nhr.github.io/assets/117806313/b374d23e-4a9a-490f-9fe1-1d60cd1cab03" caption="GitHub Copilot in JetBrains IDEs" %}

由于 GitHub 和~~巨硬~~Microsoft 千丝万缕的联系，Copilot 插件在微软系产品上的使用体验显著优于 JetBrains 系。
