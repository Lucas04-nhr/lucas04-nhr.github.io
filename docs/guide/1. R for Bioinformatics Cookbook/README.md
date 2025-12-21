---
title: R for Bioinformatics Cookbook
createTime: 2025/12/03 19:58:43
permalink: /docs/r-course/
comment: false
tags:
  - R
  - Bioinformatics
  - Multi-omics
---

> Reference: [R for Data Science](https://r4ds.had.co.nz)
>
> The book updated to 2nd ed. on July, 2023, here’s a [link](https://r4ds.hadley.nz) to the official website.

## R for Bioinformatics Cookbook {#cookbook}

<LinkCard
  icon="ic:round-file-copy"
  title="GitHub Repository"
  href="https://github.com/Lucas04-nhr/Review-of-R" >

The original repository of this document. Updated on late 2023.

</LinkCard>

::: note
You can use the "::ic:outline-local-printshop::" function near "On this page" of your desktop browser to save this page as a PDF file for offline reading.

---

The purpose of this material **not only** to deal with the "R for Data Science" course final exam, or in the subsequent learning process need to use the R language to deal with data and draw images of one of the effective reference materials. If you think this project is helpful to your R language learning and usage, welcome to click on **"Star"** and **follow** me, or buy me a coffee [here](/support/), also welcome anyone to submit bug reports through **"issue"** and participate in cooperation through **"Pull Request"**.
:::

## Table of Contents {#table-of-contents}

- [Talk 01: Multi-omics data analysis and visualisation](/docs/r-course/talk01/)
- [Talk 02: R language basics, part 1](/docs/r-course/talk02/)
- [Talk 03: R language basics, part 2](/docs/r-course/talk03/)
- [Talk 04: R language basics, part 3: factor](/docs/r-course/talk04/)
- [Talk 05: Data wrangler, part 1](/docs/r-course/talk05/)
- [Talk 06: Data wrangler, part 2](/docs/r-course/talk06/)
- [Talk 07: Strings and regular expression](/docs/r-course/talk07/)
- [Talk 08: Data iteration & parallel computing](/docs/r-course/talk08/)
- [Talk 09: Data visualisation](/docs/r-course/talk09/)
- [Talk 10: Data summarisation and statistics](/docs/r-course/talk10/)
- [Talk 11: Linear and nonlinear regression](/docs/r-course/talk11/)
- [Talk 12: Machine learning basics](/docs/r-course/talk12/)

## About these notes {#about-notes}

These are personal notes compiled while studying the "R for Bioinformatics: Multi-omics Data Analysis" course. The material was completed at the end of 2023 and has been reorganized here for archival and future reference.

## Scope {#scope}

- Key concepts in multi-omics experimental design and data preprocessing
- Quality control, normalization, and batch-effect correction
- Differential expression and differential abundance analysis (RNA-seq, proteomics)
- Multi-omics integration strategies and algorithms (feature-level and sample-level integration)
- Visualization methods for high-dimensional omics data
- Functional enrichment, pathway analysis, and network-based interpretation
- Practical workflows for single-cell and bulk multi-omics datasets

## Data, code, and tools {#data-code-tools}

- Example data and R scripts accompany most topics to demonstrate reproducible workflows
- Common R/Bioconductor packages referenced: tidyverse, DESeq2, edgeR, limma, sva, clusterProfiler, mixOmics, MOFA2, Seurat, SingleCellExperiment, scater (and other domain-specific tools)
- Outputs include R Markdown notebooks, rendered HTML/PDF, and reusable code snippets

## How to use this collection {#how-to-use}

- Browse sections by topic to find conceptual summaries and runnable examples
- Use provided R Markdown files for step-by-step reproductions; consider renv or packrat to reproduce package environments
- Adapt code examples to your own data and document changes in new notebooks

## Contribution and licensing {#contribution-licensing}

- Contributions, fixes, and improvements are welcome via issues or pull requests
- If not otherwise stated, treat these notes as permissively sharable; check individual code files for specific license details

## Acknowledgement {#acknowledgement}

Compiled for personal learning and long-term reference. Feel free to reuse or adapt these notes for educational purposes.

We would like to express our sincere gratitude to the users who participated in the co-construction or provided constructive suggestions (in the order of the time they made the suggestions or participated in the co-construction):

- [Rui Zhu](https://github.com/1508324011)
- [Tianhao Wang](https://github.com/lwstkhyl)
