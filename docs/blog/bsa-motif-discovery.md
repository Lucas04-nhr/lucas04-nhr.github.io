---
title: Motif Discovery From Word Enrichment to Gibbs Sampling
createTime: 2026/10/15 09:17:11
permalink: /blog/bsa-motif-discovery/
excerpt: This is part of the summary of the course Biological Sequence Analysis in KU, which is mainly focused on the exam curriculum. The article is mainly about how background models, word enrichment, position-specific scoring matrices, and Gibbs sampling reveal recurring sequence patterns with biological relevance.
tags:
  - KU
  - Biological Sequence Analysis
---

Genes with similar expression patterns may share regulatory signals. Searching their promoter regions for recurring sequence elements can therefore suggest common transcription factor binding sites. The difficulty is that these elements are short, variable, and surrounded by sequence that can produce similar patterns by chance.

**Motif discovery** addresses this problem by identifying recurring patterns without knowing their sequence preferences in advance. Two approaches organize the problem: count specific words and test their enrichment, or estimate a probabilistic motif model together with its locations.

## From binding sites to sequence motifs {#sequence-motifs}

A sequence motif is a short recurring element whose instances can differ at some positions. Besides transcription factor binding sites, motifs can describe splice signals, RNA binding sites, miRNA target sites, and protein targeting signals.

Discovering a motif differs from scanning for one. In scanning, a known motif model is moved along a sequence to identify plausible matches. In discovery, both the pattern and its locations are unknown. A sequence match provides a candidate functional site; it does not establish binding or regulation on its own.

Simple discovery models often assume a fixed motif width, no internal gaps, and one occurrence per sequence. These assumptions make inference manageable, but real datasets may contain sequences with no site or several sites.

## Counting words against a background {#word-enrichment}

A word-based method enumerates short sequences of a chosen length. For DNA 6-mers, there are $4^6=4096$ possibilities. The central question is whether a word occurs more often than expected under a background model.

If background bases are independent, with frequency $q(b)$ for base $b$, the probability of a word $x_1\cdots x_n$ is

$$
P(x_1\cdots x_n)=\prod_{i=1}^{n}q(x_i).
$$

For $M$ possible starting positions, its expected count is

$$
\lambda=MP(x_1\cdots x_n).
$$

For sequences of lengths $L_s$, the number of possible starts is $M=\sum_s\max(L_s-n+1,0)$. Ignoring boundary effects, total sequence length can serve as an approximation.

The enrichment ratio compares the observed count $z$ with this expectation:

$$
E=\frac{z}{\lambda}.
$$

An enrichment above one means that the word is more frequent than predicted. Its interpretation depends directly on what the background predicts.

### Why neighboring bases matter {#markov-background}

Independent base frequencies miss local sequence dependencies. For example, CG dinucleotides may be less frequent than the separate C and G frequencies would predict.

A first-order Markov background accounts for the previous base:

$$
P(x_1\cdots x_n)=f(x_1)\prod_{i=2}^{n}P(x_i\mid x_{i-1}).
$$

An $m$th-order model extends the context to the preceding $m$ bases:

$$
P(x_1\cdots x_n)
=f(x_1\cdots x_m)
\prod_{i=m+1}^{n}P(x_i\mid x_{i-m},\ldots,x_{i-1}).
$$

The lecture's `CGCG` example shows how this choice can reverse the apparent direction of enrichment. The dataset contains 761 bases, including 144 C bases, 178 G bases, 24 CG transitions, 30 GC transitions, and one occurrence of `CGCG`.

Under the first-order model,

$$
P(\mathrm{CGCG})
=\frac{144}{761}
\frac{24}{144}
\frac{30}{178}
\frac{24}{144}.
$$

::: table align="center" title="The same word under two background models"

| Background | Expected count | Observed count | Enrichment |
| --- | ---: | ---: | ---: |
| Independent bases | 1.49 | 1 | 0.67 |
| First-order Markov | 0.674 | 1 | 1.48 |

:::

The independent model suggests depletion; the Markov model suggests enrichment. Neither ratio alone establishes significance. The example demonstrates that **enrichment is relative to a specified background**.

If transition probabilities are estimated from the same dataset, the first-order model reproduces its dinucleotide frequencies by construction. For example, estimating $P(G\mid C)=\#CG/\#C$ makes the expected total CG count equal the observed count under the same boundary approximation.

## Testing enrichment {#testing-enrichment}

### Poisson counts {#poisson-counts}

When word occurrences are sufficiently rare and approximately independent, the count can be approximated by a Poisson distribution:

$$
K\sim\operatorname{Poisson}(\lambda),
\qquad
P(K=k)=\frac{e^{-\lambda}\lambda^k}{k!}.
$$

For an observed count $z$, a one-sided enrichment test uses

$$
p=P(K\ge z)
=\sum_{k=z}^{\infty}\frac{e^{-\lambda}\lambda^k}{k!}.
$$

The enrichment ratio measures the size of the departure from expectation; the tail probability measures how surprising the count is under the model.

Overlapping occurrences can undermine the approximation. A long run of G bases creates several overlapping copies of a G-rich word, so those occurrences are dependent. Periodic and self-overlapping words require particular care.

### Comparing foreground and background sets {#foreground-background}

Instead of predicting counts from a sequence model, a method can compare a foreground set with a background set. A contingency table records target-word counts and other counts in both sets. Conditional on the margins, the hypergeometric distribution gives the probability of an allocation; summing allocations at least as enriched gives a one-sided Fisher exact test.

This comparison depends on the suitability of the background set. Differences in sequence composition can generate enrichment without indicating a shared regulatory mechanism. Testing thousands of words also requires accounting for multiple comparisons when interpreting significance.

## Linking motifs to expression changes {#expression-changes}

The miR-21 knock-down example connects word enrichment with a biological perturbation. If a miRNA represses a transcript, reducing that miRNA can release repression. Genes that increase in expression are therefore candidates for carrying its target sites in their $3'$ untranslated regions.

Counting all 6-mers in those regions can reveal candidate targeting signals. However, the lecture reports that 1200 of 4096 words pass an unadjusted $p<0.01$ threshold in one analysis. Such a broad result calls for examining background assumptions and specificity rather than treating every passing word as a functional site.

Selecting an expression cutoff is also arbitrary. An alternative ranks all genes by expression change and tests word enrichment across successive cutoffs. The resulting enrichment curve shows whether a word concentrates toward one end of the ranked list.

The lecture introduces **Sylamer** as an approach based on Fisher statistics across ranked sequences, and **cWords** as using a related ranking strategy with different statistics.

## Representing variation with a PSSM {#pssm}

An exact-word analysis splits a variable motif into separate strings. A probability matrix instead represents the alternatives at each position within one model.

Let $p_i(b)$ be the probability of base $b$ at motif position $i$. Assuming independence between motif positions,

$$
P_{\mathrm{motif}}(x)=\prod_{i=1}^{n}p_i(x_i).
$$

Comparing this with an independent background gives a log-odds score:

$$
S(x)=\log\frac{P_{\mathrm{motif}}(x)}{P_{\mathrm{background}}(x)}
=\sum_{i=1}^{n}\log\frac{p_i(x_i)}{q(x_i)}.
$$

The position-specific scoring matrix, or **PSSM**, stores

$$
w_i(b)=\log\frac{p_i(b)}{q(b)}.
$$

A positive entry favors that base relative to background; a negative entry disfavors it. Scanning a sequence means adding these entries for every candidate window.

Zero observed counts need special treatment. If $p_i(b)=0$, a candidate containing that base receives a score of $-\infty$. Pseudocounts prevent a limited sample from imposing an absolute exclusion:

$$
p_i(b)=\frac{c_i(b)+\alpha(b)}
{\sum_{b'}[c_i(b')+\alpha(b')]}.
$$

Here $c_i(b)$ is the observed count and $\alpha(b)$ is the added pseudocount.

## Discovering locations with Gibbs sampling {#gibbs-sampling}

If motif locations were known, estimating the matrix would be straightforward. If the matrix were known, plausible locations could be scored. Gibbs sampling resolves this circular dependence through repeated conditional updates.

For a fixed motif width and one site per sequence, the procedure is:

1. Choose a random starting position in every sequence.
2. Randomly select one sequence $r$ and temporarily exclude it.
3. Build a PSSM from the currently selected sites in the other sequences, using pseudocounts.
4. Score every possible motif start in sequence $r$.
5. Convert the scores into probabilities and sample a new start.
6. Repeat, monitoring the sampled patterns and scores.

Excluding sequence $r$ prevents its current site from directly reinforcing the matrix used to rescore itself.

### From scores to sampling probabilities {#sampling-probabilities}

Let $a$ be a candidate start, $W$ the motif model, and $x$ a sequence. With a fixed independent background,

$$
P(x\mid W,a)=Q(x)\exp[S(x,a)],
$$

when $S$ uses natural logarithms. The all-background probability $Q(x)$ is shared across candidate starts. With a uniform prior on starts, it cancels during normalization:

$$
P(a\mid x,W)
=\frac{\exp[S(x,a)]}{\sum_j\exp[S(x,j)]}.
$$

If scores use base-2 logarithms, the corresponding weights are $2^{S(x,a)}$.

**Sampling does not mean always choosing the highest-scoring position.** A position with probability 0.5 is selected about half the time over repeated draws. Lower-scoring positions remain possible, allowing exploration beyond the current preferred match.

A computer can sample by drawing $u$ uniformly from $[0,1)$ and locating it in cumulative probability intervals. Probabilities $(0.2,0.5,0.3)$ produce intervals $[0,0.2)$, $[0.2,0.7)$, and $[0.7,1)$.

### What can go wrong? {#gibbs-limitations}

Finite runs do not guarantee the best motif. A sampler may spend many iterations around a locally favored pattern, or select sites consistently shifted from the intended motif. Choosing the width is another challenge: a short matrix loses information, while a long one includes background positions.

Extensions can shift the selected sites together, adjust motif width, allow zero or multiple sites per sequence, and improve the background model. Multiple random starts help assess sensitivity to initialization. The lecture illustrates the approach with short upstream regions from bacterial genes, seeking a shared ribosome binding signal.

## Connections to HMMs and MEME {#hmm-meme}

A hidden Markov model can describe background sequence followed by a chain of motif positions and then background again. The hidden path determines the motif location, while emission probabilities describe its base preferences. Likelihood-based training estimates the parameters, although local optima remain possible.

The lecture also introduces MEME as a probabilistic discovery method that uses multiple candidate seeds and supports searches for multiple motifs and flexible site occurrence models.

Word counting, PSSMs, and hidden-state models share a dependency: a recurring pattern is meaningful only relative to a suitable account of background sequence. A richer motif model can describe variation, but it cannot compensate automatically for a misleading background or establish biological function without additional evidence.
