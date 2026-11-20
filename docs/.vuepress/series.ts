/**
 * @see https://theme-plume.vuejs.press/guide/features/ 查看文档了解配置详情
 *
 * Series（专栏）配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 *
 * 专栏是跨集合的内容分组：不改变文章的 permalink，只为同一专栏的文章补充目录、
 * 文首提示与文末「下一篇」。文章通过 frontmatter `series: <id>` 声明归属，
 * 每篇文章最多属于一个专栏。未声明 `seriesOrder` 时按 `createTime` 排序。
 *
 * 落地页生成在 `/series/<id>/`，总览页为 `/series/`。
 */

import type { SeriesOptions } from "vuepress-theme-plume";

export const series: SeriesOptions = {
  index: true, // 在 /series/ 生成专栏总览页
  autoCreate: false, // 只承认下方声明的专栏，避免 frontmatter 拼写错误时生成新专栏
  items: {
    /* ---------- KU master's courses ---------- */
    "ku-advanced-bioinformatics": {
      title: "Advanced Bioinformatics for NGS",
      description:
        "Lecture notes from the KU course: NGS data, EM, population structure, HMMs, archaic genomes, and phylogenetics.",
    },
    "ku-biological-sequence-analysis": {
      title: "Biological Sequence Analysis",
      description:
        "Lecture notes from the KU course: alignment, RNA structure, weight matrices, motifs, HMMs, and sequence indexing.",
    },
    "ku-structural-bioinformatics": {
      title: "Structural Bioinformatics",
      description:
        "Lecture notes from the KU course: protein structure, folding and RMSD, solvent exposure, potentials, and AlphaFold.",
    },
    "ku-vision-and-image-processing": {
      title: "Vision and Image Processing",
      description:
        "Lecture notes from the KU course on image formation, linear algebra, and image processing methods.",
    },

    /* ---------- Research and projects ---------- */
    "paper-sharing": {
      title: "Paper Sharing",
      description:
        "Group meeting paper presentations on bacterial genomics, evolution, and infectious disease.",
    },
    "graduation-thesis": {
      title: "Graduation Thesis",
      description:
        "Proposal and project notes for the undergraduate thesis on SNP-based bacterial evolution.",
    },
    "network-engineering": {
      title: "Network Engineering",
      description:
        "Notes on the CERNET academic access channel and App Store link redirection.",
    },

    /* ---------- HUST undergraduate courses (archived) ---------- */
    "hust-bioinformatics": {
      title: "Bioinformatics Review",
      description: "Archived chapter reviews from the HUST Bioinformatics course.",
    },
    "hust-data-structure": {
      title: "Data Structure",
      description:
        "Archived homework, online judge solutions, and review notes from the HUST Data Structure course.",
    },
    "hust-molecular-biology": {
      title: "Molecular Biology Homework",
      description: "Archived homework from the HUST Molecular Biology course.",
    },
    "hust-database": {
      title: "Database",
      description: "Archived online judge exercises from the HUST Database course.",
    },
    "hust-python": {
      title: "Python",
      description: "Archived online judge exercises from the HUST Python course.",
    },
    "hust-instrumental-analysis": {
      title: "Instrumental Analysis",
      description: "Archived chapter reviews from the HUST Instrumental Analysis course.",
    },
  },
};
