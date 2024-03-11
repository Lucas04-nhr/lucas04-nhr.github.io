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

## 常用的评估指标

- 灵敏度 (Sensitivity, Sn): 对于真实的数据，能够测成“真”的比例是多少 - (Type II error)
- 特异性 (Specificity, Sp): 对于阴性的数据，能够预测成“假”的比例是多少 - (Type I error)
- 准确性 (Accuracy, Ac): 对于整个数据集(包括阳性和阴性数据)，预测总共的准确比例是多少
- 马修相关系数(Mathew correlation coefficient, MCC): 当阳性数据的数量与阴性数据的数量差别较大时，能够更为公平的反映预测能力，值域```[-1,1]```

![常用评估指标](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/PzYkEI.png)

## ROC curve

- X轴：1-Sp
- Y轴：Sn
- AUC（area under the curve）
  - 值：ROC的面积越大，预测能力越强

![ROC curve](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/jO1lFH.png)

## 预测性能的评估 

### 自检法 (Self-consistency validation)

- 训练数据当成测试数据
- 训练数据中所有的阳性数据为测试数据中的阳性数据
- 训练数据中所有的阴性数据为测试数据中的阴性数据
- 反映当前预测工具对目前已知的数据的预测能力
- 假设：根据目前已知的数据所构建的计算模型能够反映未知的数据的模式
- 缺点：不能反映计算模型的稳定性

### 除一法 (Leave-one-out validation)

- 每次从数据集中去掉一个，包括阳性数据和阴性数据
- 利用剩下的数据重新训练，并构建新的计算模型
- 对去掉的这一个数据进行打分
- 保证每个数据去掉一次，从而得到所有数据的分值
- 计算各个阈值的Ac, Sn, Sp和MCC
- 计算AUC值，作为准确性的评价指标

### N折交叉法 (N-fold cross-validation)

- 将数据集分成n组，并保证阳性数据与阴性数据的比例与原数据相同
- 将n-1组作为训练数据，重新训练并构建计算模型；1组不用于训练
- 将n-1组的数据重新分为n组，其中n-1组用来构建模型，1组用于调参
- 对不用训练的1组进行打分，计算性能
- 重复n次，使每组数据都用于独立测试集1次
- 选取AUC最高模型

## 预测性能及稳定性

- 自检法: 反映预测性能
- 留一法 & N折交叉法: 反映预测系统的稳定
性
- 预测性能 vs. 检验性能
  - 差距较小：系统稳定
  - 差距过大：系统不稳定，数据过训练

## 阈值的确定

- Threshold 或 Cut-off：
  - 人为设定，主要依据经验
  - 给定阈值以上或以下预测为阳性
  - 即利用阈值进行“一刀切”
  - 确定阈值的一般方法
- 传统策略：平衡Sn和Sp，使两者大致相当
  - 实际应用：高Sp低Sn保证预测结果的可靠性
  - MCC最大值，保证综合预测性能最高
  - ......

## 过训练 (Overfitting/Overtraining)

- 根据已知数据构建的模型只能很好的适用于训练数据
- 不适合用来预测
- 对训练数据的微小改变对于预测性能影响过大
- 预测工具过训练：只能很好的符合训练数据，而对新数据则性能很差

## 如何评估算法的准确性？

![Example](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/JvcJRh.png)

### 线性模型 & 决策树

- 线性回归 (Linear Regression)
  - $f(x)=ax+b$
- 对数几率回归/逻辑回归(Logistic regression)
  - $f(x)=\frac{1}{1+e^{-ax-b}}$
- 信息熵
  - $ Ent(D) = - \sum_{k=1}^{ |y| } D\ log_{2} {p_k}$
- 信息增益
  - $ Gain(D,a) = Ent(D) - \sum_{v=1} ^ {V} \frac{|D^v|}{|D|}Ent(D^v)$

### 神经网络 & 支持向量机

- 单层 & 多层神经网络
- 误差逆传播 (Back propagation, BP)
  - ![误差逆传播1](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/8cJUIc.jpg)
  - ![误差逆传播2](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/GFfwPd.jpg)
- 划分超平面
  - $f(x)=w^{T}x+b$
- 核函数
  - 将线性不可分样本映射到更高维空间，从而线性可分
  - ![核函数](https://cdn.jsdelivr.net/gh/Lucas04-nhr/Pictures@main/uPic/lUHEva.jpg)

### 贝叶斯分类器 & 集成学习
- 贝叶斯最优分类器
  - $h^{*} = arg \max_{c \in Y}P(C | x)$
  - $P(C | x) = \frac{P(x | C)P(C)}{P(x)}$
- 集成学习的错误率：
  - $e <= exp{-\frac{1}{2} T {1 - 2\epsilon}^2 }$
