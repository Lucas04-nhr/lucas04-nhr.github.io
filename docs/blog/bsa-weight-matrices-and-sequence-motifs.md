---
title: Weight Matrices and Sequence Motifs
createTime: 2026/09/24 13:09:10
permalink: /blog/ku-bsa-weight-matrices-sequence-motifs/
tags:
  - KU
  - Biological Sequence Analysis
excerpt: "This is part of the summary of the course Biological Sequence Analysis in KU, which is mainly focused on the exam curriculum. The article is mainly about position-specific weight matrices in biological sequence analysis, from splice-site counts and log-odds scores to motif scanning, classification errors, information content, and sequence logos."
preview: true
---

A splice donor site often begins with `GT`, but a genome contains many `GT` dinucleotides that are not splice sites. The interesting question is not merely whether a short pattern is present. It is whether the *surrounding sequence* resembles the collection of known functional sites more than it resembles ordinary background DNA.

The first part of the fourth week of Biological Sequence Analysis develops an answer using **position-specific weight matrices**. The same idea can also be applied to amino-acid motifs, such as signal-peptide cleavage sites.

## From splice sites to positional frequencies {#from-splice-sites-to-frequencies}

The donor site marks the boundary between an exon and the following intron. The lecture examines 1,230 aligned donor-site sequences, each containing two bases upstream and six bases downstream of the splice boundary. Their shared signal is real, but the complete eight-base strings vary considerably: even the most frequent string occurs only 92 times, or about 7.4% of the dataset.

A single consensus string therefore discards too much variation. Instead, count each nucleotide at each aligned position. If $n_i(a)$ is the count of base $a$ at position $i$, the **position-specific frequency** is

$$
p_i(a)=\frac{n_i(a)}{N},
\qquad
\sum_{a\in\{A,C,G,T\}}p_i(a)=1,
$$

where $N$ is the number of aligned sites. A column dominated by one base is relatively conserved; a column with similar frequencies for all four bases is more variable. In the donor-site example, the intronic `GT` is particularly informative.

Before building a model, it helps to ask how frequently patterns occur *by chance*. If bases are independent and uniformly distributed, each base has probability $0.25$ and a specific dinucleotide such as `GT` has probability

$$
P(GT)=0.25\times0.25=0.0625.
$$

Under the alternative frequencies $P(A)=P(T)=0.30$ and $P(C)=P(G)=0.20$, the independence approximation instead gives $P(GT)=0.20\times0.30=0.06$. Real sequences can also have dinucleotide dependencies, so these simple products are illustrative background models, not universal genomic frequencies. Either way, `GT` alone will generate many candidates.

## Turning frequencies into a PSSM {#position-specific-scoring-matrix}

Let $q(a)$ be the background frequency of base $a$. A **position-specific scoring matrix** (PSSM) assigns the following log-odds weight to base $a$ at position $i$:

$$
s_i(a)=\log_2\frac{p_i(a)}{q(a)}.
$$

A positive entry means that the base is more frequent at that position in donor sites than in the background; a negative entry means it is less frequent. For a uniform DNA background, $q(a)=0.25$ for all four bases.

The score of a length-$L$ candidate $x=x_1\ldots x_L$ is the sum of its entries:

$$
S(x)=\sum_{i=1}^{L}s_i(x_i)
=\log_2\frac{P(x)}{Q(x)},
$$

where the usual independent-position models are

$$
P(x)=\prod_{i=1}^{L}p_i(x_i),
\qquad
Q(x)=\prod_{i=1}^{L}q(x_i).
$$

This explains why the logarithm is useful: it converts a product of likelihood ratios into a sum that is easy to compute. A high score means the candidate is more characteristic of the trained donor-site model **relative to the chosen background**. It is not, by itself, the posterior probability that the candidate is a real splice site; that would also require prior probabilities and an appropriate classification model.

### Zero counts and pseudocounts {#zero-counts-and-pseudocounts}

If a base has never been observed in one training column, its estimated $p_i(a)$ is zero and the corresponding log score is $-\infty$. One unseen base would then make the score of an entire window $-\infty$, even if the sample of known sites was limited.

The exercise uses a **Laplace pseudocount** of one for each of the four nucleotides:

$$
\widehat{p}_i(a)=\frac{n_i(a)+1}{N+4}.
$$

This prevents zero probabilities while leaving well-supported frequencies close to their observed values. The denominator is $N+4$ because four counts were incremented in each column.

::: note
Pseudocounts change the estimated frequencies before the logarithm is taken. Adding one directly to a completed PSSM entry is not the same operation.
:::

## Scanning a longer sequence {#scanning-a-sequence}

An eight-position PSSM can score every eight-base window in a longer DNA sequence. If the sequence length is $N$ and the motif width is $L$, there are $N-L+1$ overlapping windows.

For the lecture's 24-base example,

```text
TCACCTAGAGGTGAGTCTAACGTA
```

an eight-base model scores $24-8+1=17$ windows. At each start position, look up one matrix entry for every base and add the eight weights. Plotting score against start position reveals peaks at donor-like segments; the maximum identifies the best-scoring window under this model.

::: warning A high-scoring window is a candidate, not a confirmed splice site
The model only sees local sequence composition. Many more genomic `GT` positions exist than true donor sites, and sequence context outside the short window can matter.
:::

## Scores, thresholds, and classification errors {#thresholds-and-errors}

Known donor and non-donor windows tend to have different score distributions, but those distributions overlap. A threshold converts a score into a prediction. Lowering it recovers more true donor sites at the cost of more false positives; raising it suppresses false positives at the cost of missing more true sites.

| Outcome | Meaning |
| --- | --- |
| True positive | A real donor site is predicted as one |
| False positive | A non-donor window is predicted as a donor site |
| False negative | A real donor site is missed |

The lecture illustrates the base-rate problem: at a setting that recovers roughly 80% of true donors, its example still yields around 1.5 false positives per kilobase. This figure describes the lecture's particular model and dataset, not a general operating guarantee. It shows why apparently good separation between score histograms need not translate into a small absolute number of false alarms across a genome.

## The same model for signal peptides {#signal-peptides}

The approach is not limited to nucleotides. A signal peptide is a short N-terminal segment that directs a protein into a transport or secretion pathway and is often cleaved. The lecture builds an amino-acid weight matrix from 1,011 eukaryotic proteins, aligning ten residues before and five residues after the cleavage site. Each column now contains counts or weights for 20 amino acids rather than four nucleotides.

Candidate cleavage positions can be scored by sliding this 15-position matrix along a protein and selecting the highest-scoring position. Comparing that prediction with the known cleavage position gives a positional-error distribution. Testing against proteins without signal peptides examines discrimination from negative examples.

The choice of background becomes particularly important here: amino acids are not equally frequent in real proteomes. Replacing a uniform $q(a)=1/20$ with realistic amino-acid frequencies changes the log-odds weights and may change which candidate sites score highly. **A weight is meaningful only relative to its background model.**

## Information content and sequence logos {#information-content}

What is the average PSSM score contributed by one position when a base is actually drawn from that position's donor-site distribution? Weight each possible score by its frequency:

$$
I_i=\sum_a p_i(a)s_i(a)
=\sum_a p_i(a)\log_2\frac{p_i(a)}{q(a)}
=D_{\mathrm{KL}}(p_i\parallel q).
$$

This is the **Kullback-Leibler divergence**, or relative entropy, from the background distribution to the position-specific distribution. With base-2 logarithms it is measured in bits. It is never negative, equals zero when $p_i=q$, and becomes larger as the column differs more strongly from the background.

For example, if $p_i(G)=0.70$ and each other nucleotide has frequency $0.10$ against a uniform $0.25$ background, the `G` log-odds entry is positive while the other three entries are negative. The *frequency-weighted sum* of all four entries is nevertheless positive: approximately $0.64$ bits. This is why an individual PSSM entry and a position's information content should not be confused.

A **sequence logo** visualizes these columns. In the representation used in the lecture, the total stack height at position $i$ is its information content $I_i$, while each letter's displayed height is proportional to $p_i(a)I_i$. A tall column indicates a distribution that is distinctive relative to the background; a prominent letter indicates a frequently observed residue.

For four DNA bases and a *uniform* background, a completely conserved column reaches $\log_2 4=2$ bits. That familiar two-bit ceiling and the simple frequency-based logo interpretation assume the specified background. With a non-uniform background, the KL divergence for a perfectly conserved base is instead $\log_2[1/q(a)]$, which need not be 2 bits.

::: note
The visible height of a letter in this logo convention is its frequency-weighted share of the column's **total** information. It should not be confused with the signed term $p_i(a)\log_2[p_i(a)/q(a)]$ in the KL sum; an individual signed term can be negative.
:::

## What the model can and cannot express {#model-limitations}

The complete path is **aligned examples → positional counts → frequencies → log-odds matrix → sliding-window scores → a decision threshold**. Information content offers a parallel description of which columns contribute the most distinctive signal.

The main simplifying assumption is that positions contribute independently. A PSSM can express that `G` is preferred at one position and `T` at another, but it does not explicitly learn dependencies *between* those positions. It is therefore a useful, interpretable baseline for local motif recognition rather than a complete model of splicing or signal-peptide processing.

## Exam checklist {#exam-checklist}

::: steps

1. Explain why a donor-site consensus sequence misses genuine sequence variation.
2. Convert aligned sequence counts into position-specific frequencies.
3. Define a background distribution and compute $s_i(a)=\log_2[p_i(a)/q(a)]$.
4. Add the correct matrix entries to score a candidate window, and interpret the result as a log-likelihood ratio rather than a posterior probability.
5. Explain why zero counts yield $-\infty$ and calculate frequencies with a Laplace pseudocount.
6. Count the $N-L+1$ windows in a sequence of length $N$ for a motif of width $L$.
7. Describe the sensitivity–false-positive trade-off when choosing a threshold.
8. Explain why realistic nucleotide or amino-acid background frequencies matter.
9. Show that the mean position-specific PSSM score equals $D_{\mathrm{KL}}(p_i\parallel q)$.
10. Read a sequence logo and state when the two-bit DNA maximum applies.

:::
