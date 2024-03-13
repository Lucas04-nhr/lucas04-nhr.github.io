---
layout: post
title: Bioinformatics-Chapter 03
date: 20240304
category: "Bioinformatics Class Notes"
tags: [Bioinformatics, Notes]
author: Lucas
comment: true
mathjax: true
published: true
---

## GenBank

GenBank是一个由美国国家生物技术信息中心（NCBI）维护的公共数据库，它包含了大量的DNA序列数据，以及一些蛋白质序列数据，下面是一些GenBank的基础知识：

- GenBank数据格式
  ![GenBank数据格式](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/ViP7Zm.png)
- GenBank数据类型
  ![GenBank数据类型](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/HvW0wZ.png)

## UniProt

UniProt是一个由三个数据库组成的联合数据库，它包含了大量的蛋白质序列数据，下面是一些UniProt的基础知识：

- UniProt数据格式
  ![UniProt数据格式](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/xEDdIz.png)
- UniProt数据类型
  1. UniProtKB（UniProt Knowledgebase）：这是最大的组成部分，包含了已知的蛋白质序列和相关信息。它提供了详细的注释、功能预测和分类信息。
  2. UniRef（UniProt Reference Clusters）：这是一组聚类的蛋白质序列，根据相似性进行聚类。每个聚类都有一个代表性序列，以减少数据库的冗余。
  3. UniParc（UniProt Archive）：这是一个归档数据库，用于存储已知的蛋白质序列的副本。它可以用于验证和追踪蛋白质序列的来源。

## Example: 生物序列数据检索

利用实验学方法（如RNA-Seq），发现了潜在参与调控细胞有丝分裂的某个基因，测序结果如下（genotype）：

> CCCCTGCCTGGCAGCCCTTTCTCAAGGACCACCGCATCTCTACATTCAAGA
> ACTGGCCCTTCTTGGAGGGCTGCGCCTGCACCCCGGAGCGGATGGCCGA
> GGCTGGCTTCATCCACTGCCCCACTGAGAACGAGCCAGACTTGGCCCAGT
> GTTTCTTCTGCTTCAAGGAGCTGGAAGGCTGGGAGCCAGATGACGACCCC
> ATAGAGGAACATAAAAAGCATTCGTCCGGTTGCGCTTTCCTTTCTGTCAAGA
> AGCAGTTTGAAGAATTAACCCTTGGTGAATTTTTGAAACTGGACAGAGAAAG
> AGCCAAGAACAAAATTGCAAAGGAAACCAACAATAAGAAGAAAGAATTTGAG
> GAAACTGCGGAGAAAGTGCGCCGTGCCATCGAGCAGCTGGCTGCCATGGA
> TTGAGGCCTCTGGC

问题：

1. 这是哪个基因？
2. 编码的蛋白质序列是怎样的？
3. 有没有保守的功能结构域（domain）？
4. 它的功能是怎样的？
5. 它在真核生物中保守吗？
6. 有没有三级结构信息？

## 基因本体的结构

- 基因本体被组织为层次性的有向非循环图(Directed acyclic graph, DAG)
- 每个术语
  - 可以有一个多个父亲术语
  - 0个，1个或多个孩子术语
- 术语通过两类关系连接
  - `is-a`
  - `part-of`

> 父子关系
> ![父子关系](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/dK0amA.png)

### 注意

  从孩子术语到上层的父亲术语的路径必须是真实的。

## 基因本体的维护

- 废弃 (Obsolete): 术语被去除或重新定义
- 基因本体的ID永不删除
- 对每一个废弃的术语，需要说明为何该术语废弃

## Human BIRC5

- BIRC5: Baculoviral IAP Repeat Containing 5
- 也被称为Survivin
- 一个抑制凋亡的蛋白质
- 在癌症中过表达
- 在正常细胞中表达较低
- 在有丝分裂中起重要作用
