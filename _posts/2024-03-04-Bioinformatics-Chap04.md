---
layout: post
title: Bioinformatics-Chapter 04
date: 20240304
category: "Bioinformatics Class Notes"
tags: [Bioinformatics, Notes]
author: Lucas
comment: true
mathjax: true
published: true
---

## 人生物信息学中的机器学习

- SVM, Artificial neural networks, Hidden Markov Model…

> ![VM, Artificial neural networks, Hidden Markov Model](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/Lkr0Yz.jpg)

## 中国早期机器学习在生物学中的应用

- 清华大学孙之荣教授:
  - **1997年**，将人工神经网络引入生物信息学领域；
  - **1999年**，利用支持向量机预测可变剪接位点；
  - **2001年**，构建蛋白质细胞亚定位预测工具*SubLoc*，以及蛋白质二级结构预测算法。

## 生物医学中的六种数据类型

- 序列数据：DNA、RNA、蛋白质序列
- 结构数据：NMR、X-ray、Cryo-EM/Cryo-ET
- 遗传/进化距离数据
- 谱数据：基因芯片、蛋白质-蛋白质相互作用
- 影像数据: 图像、视频（CT、MRI、超声）
- 文本数据：科学文献、电子病历
- 混合数据：二代测序数据（序列、谱）

## 模型评估与选择

- 样本/检验数据：阳性数据 (P)，阴性数据 (N)
  - 阳性数据 (P)：真实的，被实验所证实的数据
  - 阴性数据 (N)：被实验所证明为无功能的数据
- 对于预测结果的评估，定义：
  - 真阳性 (TP): 阳性数据中被预测为阳性的数据
  - 假阳性 (FP): 阴性数据中被预测为阳性的数据
  - 真阴性 (TN): 阴性数据中被预测为阴性的数据
  - 假阴性 (FN): 阳性数据中被预测为阴性的数据

