---
title: 组会文献分享 20251212
createTime: 2025/12/10 16:48:35
permalink: /blog/paper_sharing_20251212
tags:
  - Paper Sharing
  - SNP
  - Evolution
---

## 原始文献 {#original-paper}

<LinkCard
  icon="ic:outline-description"
  title="Original Paper"
  href="https://www.sciencedirect.com/science/article/pii/S0092867425008517"
>

  Bronze Age Yersinia pestis genome from sheep sheds light on hosts and evolution of a prehistoric plague lineage（青铜时代羊中鼠疫耶尔森菌基因组揭示了史前鼠疫谱系的宿主和进化）

</LinkCard>

## 引言 {#introduction}

这篇文章的作者团队来自德国马克斯·普朗克感染生物学研究所、哈佛大学等机构，第一作者是**Ian Light**。 这篇论文的创新点是首次从非人类宿主（一只青铜时代家羊）中恢复出古鼠疫菌基因组，揭示了史前鼠疫如何通过牲畜传播。

---

这篇文章的最大亮点是：**第一次从4000年前的一只家羊里挖出了鼠疫耶尔森菌基因组**，直接把史前鼠疫从“只在人骨里看到”变成了“动物→人”的完整证据链。

::: center
<font size=5><strong>羊就是史前鼠疫传给人类的“中间商”</strong></font>
:::

> The recovery of Y. pestis from a domestic sheep provides the first direct evidence for livestock acting as intermediary hosts facilitating human infections.

## 背景 {#background}

鼠疫耶尔森菌（*Yersinia pestis*）是黑死病的病原体，大多数人类病原体源于动物源性（zoonotic）。在史前时期，尤其是晚新石器时代到青铜时代（LNBA 时期，约 5000-3000 年前），有一种独特的鼠疫谱系在欧亚大陆广泛传播了 2000 多年，但它缺乏有效的跳蚤传播机制（如缺少关键基因变异），所以科学家一直困惑：它如何维持和传播？此前，这个 LNBA 谱系只在古人类遗骸中发现，从未在动物中找到直接证据。这篇论文填补了这个空白，表明牲畜可能扮演了关键角色。

## 结果 {#results}

### 考古背景和时空重合 {#archaeological-context}

研究团队分析了俄罗斯乌拉尔南部 Arkaim 遗址（属于 Sintashta-Petrovka 文化，约4000年前）的家畜遗骸，包括羊和牛的骨骼和牙齿。该遗址是青铜时代游牧文化的重要定居点，以创新的牛羊马养殖闻名。 他们使用古 DNA 技术从一只家羊（直接定年为 1935-1772 cal BCE）中提取并重建了 *Y. pestis* 基因组。方法包括 DNA 捕获、测序、系统发育分析和选择压力评估（purifying selection）。还与其他已知 LNBA 人类基因组进行了比较。

研究人员发现，距离 Arkaim 不到 200 公里的 Kamennyi Ambar 遗址，同时期已经报道过两个人类 LNBA 鼠疫病例。

::: center
<strong>同一时间、几乎同一地点，羊和人都感染了同一支鼠疫</strong>
:::

### 系统树上的证据 {#phylogenetic-evidence}

把这只羊的基因组（编号 ARK017）放到已有的LNBA谱系系统树里，会发现它和附近遗址的两个人样本**抱成了一个极短的进化分支**。作者估算它们共同祖先就在几十年到一两百年前。换句话说：这只羊和那两个人，极大概率死于同一波鼠疫暴发。

### 从动物到人的完整传播链 {#transmission-evidence}

论文用基因组+考古证据，给出了最合理的传播路径：

1. **野生啮齿动物 → 家羊**：反复“溢出”，羊群暴发后死光（epizootic，死胡同感染）
2. **家羊 → 人类**：Sintashta人极端依赖羊，羊骨占遗址动物骨 70% 以上。每天挤奶、剪毛、宰杀、处理病羊尸体，接触血液和肺组织，感染风险极高。
3. **人 → 人**：LNBA 谱系缺跳蚤传播的关键突变，主要靠飞沫和伤口传播，效率低，所以没形成黑死病那种大流行，但足够局部维持 2000 年。

## 借鉴 {#takeaways}

### 优点 {#strengths}

这篇文章的方法对我们做细菌全基因组和进化分析特别有参考价值：

1. 古 DNA 的 SNP 过滤策略完全可以搬到现代低质量数据上
2. 用 `IQ-TREE` 做 SNP-based 最大似然树，短分支判断近期共同祖先的方法很严谨
3. $\dfrac{\text{d}N}{\text{d}S}$ + 平行进化分析，能很好地解释功能基因的丢失和选择压力

### 局限性 {#limitations}

当然，也有一定的局限性：例如古 DNA 覆盖度低，现代高深度数据不需要这么严格的修剪，但过滤思路通用等。

## 总结 {#conclusion}

4000 年前的这只羊，替我们把史前鼠疫的“动物宿主”谜底彻底揭开，也提醒我们：很多今天的人畜共患病，可能就藏在我们身边的家畜里。
