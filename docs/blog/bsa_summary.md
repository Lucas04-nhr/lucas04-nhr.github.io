---
title: Course Summary - Biological Sequence Analysis
createTime: 2026/09/03 21:16:38
permalink: /blog/ku-bsa-summary/
tags:
  - KU
  - Biological Sequence Analysis
password: 16e94e5a3702c27bde806930ea634ac9
excerpt: This is the summary of the course Biological Sequence Analysis in KU, which is mainly focused on the exam curriculum.
---

## Week 01 - Pairwise Alignment {#pairwise-alignment}

### Core Mathematical Concepts {#core-mathematical-concepts}

- **==Alphabet==**: Set of allowed symbols, for example, in DNA sequences, the alphabet is `{A, C, G, T}`.
- **==Probability==**: $0 \leqslant P \leqslant 1$, probability is a measure of the likelihood of an event occurring. The sum of probabilities of all possible events equals 1.
- **==Independent Events==**: Two events A and B are independent if the occurrence of one does not affect the probability of the other. Mathematically, $P(A \cap B) = P(A) \cdot P(B)$.
- **==Joint Probability==**: The probability of two events A and B occurring together, denoted as $P(A, B) = P(A | B) \cdot P(B)$.
- **==Marginal Probability==**: The probability of an event occurring regardless of the outcome of another event, denoted as $P(A) = \sum_{i} P(A, b_i)$.
- **==Bayes' Theorem==**: A fundamental theorem in probability theory that describes the probability of an event based on prior knowledge of conditions related to the event. It is expressed as 
    $$
    P(A | B) = \frac{P(B | A) \cdot P(A)}{P(B)}.
    $$
- Algorithmic complexity describes how running time or memory grows with input size.

### Basics of pairwise sequence alignment {#basics-of-pairwise-sequence-alignment}

- Goal: To find the best alignment between two sequences, which can be DNA, RNA, or protein sequences.
- Main problem: The number of possible alignments grows extremely rapidly, so exhaustive enumeration is impractical. 
- Instead, dynamic programming is used to find the optimal alignment efficiently, by constructing larger optimal solutions from smaller optimal solutions.

### Needleman-Wunsch Algorithm {#needleman-wunsch-algorithm}

#### Background {#nwa-background}

The Needleman-Wunsch algorithm is a dynamic programming algorithm used for ==**global**== sequence alignment. It was developed by Saul Needleman and Christian Wunsch in 1970. The algorithm finds the optimal alignment between two sequences by filling a matrix and backtracking to find the actual alignment.

It aligns two sequences ==**end-to-end**==, meaning it considers the entire length of both sequences. The algorithm uses a scoring system that assigns scores for matches, mismatches, and gaps (insertions or deletions). The goal is to maximize the overall alignment score.

The algorithm is appropriate ==when sequenses are expected to be similar over their entire length==, such as when comparing homologous genes or proteins.

### Algorithm Steps {#nwa-steps}

The algorithm uses the following dynamic programming recurrence relation to fill the scoring matrix:

$$
F(i, j) = \max \begin{cases}
F(i - 1, j) + g_{\text{gap}}, \\
F(i, j - 1) + g_{\text{gap}}, \\
F(i - 1, j - 1) + s(x_i, y_j).
\end{cases} , g_{\text{gap}} \leqslant 0.
$$

In this relation, $F(i, j)$ represents the optimal alignment score for the first i characters of sequence X and the first j characters of sequence Y. The function $s(x_i, y_j)$ returns the score for aligning character $x_i$ from sequence X with character $y_j$ from sequence Y. The gap penalty $g_{\text{gap}}$ is a negative value that penalizes gaps in the alignment.

To implement the Needleman-Wunsch algorithm, there are three main steps:

::: steps
1. **Initialization**: Create a scoring matrix with dimensions (m+1) x (n+1), where m and n are the lengths of the two sequences. Initialize the first row and column with gap penalties.
2. **Matrix Filling**: Fill in the scoring matrix using the recurrence relation, considering matches, mismatches, and gaps.
3. **Backtracking**: Starting from the bottom-right cell of the matrix, trace back to the top-left cell to find the optimal alignment path, which represents the best alignment between the two sequences.
:::

::: note
To initiate the gap penalty,here's a simple formula:
$$
\begin{cases}
F(0, 0) = 0, \\
F(i, 0) = i \cdot g_{\text{gap}}, \\
F(0, j) = j \cdot g_{\text{gap}}.
\end{cases}
$$
:::

### Complexity Analysis {#nwa-complexity}

The time complexity of the Needleman-Wunsch algorithm is $O(mn)$, where $m$ and $n$ are the lengths of the two sequences. The space complexity is also $O(mn)$ due to the storage of the scoring matrix. However, optimizations can be made to reduce space complexity to $O(\min(m, n))$ by only storing two rows or columns at a time.
  