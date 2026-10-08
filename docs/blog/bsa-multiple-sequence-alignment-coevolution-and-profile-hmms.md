---
title: Multiple Sequence Alignment, Coevolution, and Profile HMMs
createTime: 2026/10/08 18:55:13
permalink: /blog/ku-bsa-msa-coevolution-profile-hmms/
excerpt: This is part of the summary of the course Biological Sequence Analysis in KU, which is mainly focused on the exam curriculum. The article is mainly about multiple sequence alignment and progressive alignment with residue coevolution, sequence profiles, and profile HMMs for protein-family recognition.
tags:
  - KU
  - Biological Sequence Analysis
---

A protein family contains more information than any one of its sequences. Some positions preserve the same residue across distant relatives, some tolerate several alternatives, and others change together to maintain a structural or functional interaction.

**Multiple sequence alignment (MSA)** establishes the correspondence between positions in homologous sequences. From that alignment, we can model individual position preferences with a sequence profile, represent insertions and deletions with a **profile hidden Markov model**, or investigate dependencies between positions through **coevolutionary analysis**.

## What a multiple sequence alignment represents {#msa-purpose}

An MSA places corresponding residues in the same column. Ideally, the correspondence reflects descent from a common ancestral residue, or equivalent positions in a protein structure. These are related objectives, but neither is always easy to establish from sequence alone.

Protein function imposes constraints on structure, and structure imposes constraints on sequence. Consequently, proteins can retain a similar fold even after their sequences have diverged substantially. Adding more family members can reveal a conserved pattern that is difficult to recognize in a pairwise comparison.

MSAs support several applications:

- identifying distant homologs and classifying protein families;
- locating conserved functional residues and structural elements;
- inferring evolutionary relationships and investigating selection;
- building sequence profiles and profile HMMs;
- detecting residue covariation for structural and functional analysis.

A useful alignment should preserve important residues and structural cores while remaining reasonably compact. Introducing many gaps solely to create additional matches can produce a high-scoring but biologically misleading alignment. Consecutive gaps often better represent a single insertion or deletion event than several scattered gaps, which motivates the same gap-opening versus gap-extension distinction used in pairwise alignment.

There are also two different independence problems. Alignment columns can be dependent because residues interact, while the sequences themselves are related by shared ancestry and may be unevenly sampled. Both matter when turning an alignment into a statistical model.

## Scoring and the cost of exact alignment {#msa-scoring}

Constructing an MSA requires an objective function and an algorithm that optimizes it. A common form is

$$
S(M)=G(M)+\sum_i S(M_i),
$$

where $M_i$ is alignment column $i$ and $G(M)$ represents the gap contribution. Scoring each column separately simplifies the problem, but leaves interactions between columns outside the objective.

### Minimum entropy {#minimum-entropy}

Let $c_i(a)$ be the count of residue $a$ in column $i$, and let

$$
n_i=\sum_a c_i(a),\qquad p_i(a)=\frac{c_i(a)}{n_i}.
$$

The column entropy is

$$
H_i=-\sum_a p_i(a)\log p_i(a).
$$

A fully conserved column has entropy zero. A more evenly distributed set of residues has higher entropy. Minimizing entropy therefore favors conserved columns, although gap handling must prevent artificial improvements obtained by spreading residues over unnecessary columns.

The count-based expression in the lecture is

$$
-\sum_a c_i(a)\log p_i(a)=n_iH_i.
$$

For the following example, using base-2 logarithms:

```text
S1  ACG
S2  ACT
S3  AGT
S4  ACG
```

::: table align="center" title="Entropy and sum-of-pairs scores in a small alignment"

| Column | Composition | Entropy $H_i$ | Count-weighted entropy $n_iH_i$ | Identity-based SP score |
| --- | --- | ---: | ---: | ---: |
| 1 | Four A residues | 0 | 0 | 6 |
| 2 | Three C and one G | 0.811 | 3.245 | 3 |
| 3 | Two G and two T | 1 | 4 | 2 |

:::

::: note Calculation correction

The entropy example in the slides contains sign and probability typos. The count-weighted values are positive, and both residue frequencies in the third column are $0.5$. The table above uses the corrected calculations.

:::

### Sum-of-pairs scoring {#sum-of-pairs}

The **sum-of-pairs (SP)** score adds the scores of all sequence pairs within each column:

$$
S(M_i)=\sum_{k<l}s(m_{ki},m_{li}),
$$

where $m_{ki}$ is the character from sequence $k$ in column $i$. Protein alignments can use BLOSUM or PAM substitution scores.

With four sequences there are $\binom{4}{2}=6$ pairs per column. In the example above, an identity score of 1 for matching residues and 0 otherwise gives column scores of 6, 3, and 2. SP scoring incorporates pairwise substitution preferences, but remains a practical objective rather than a complete evolutionary model.

### Why exact dynamic programming is impractical {#exact-msa}

Pairwise alignment uses a two-dimensional dynamic-programming matrix. Aligning $N$ sequences requires an $N$-dimensional state space. For sequences of length approximately $L$, it contains roughly $(L+1)^N$ states, with up to $2^N-1$ possible predecessor moves per state under a simple linear-gap formulation.

The cost grows exponentially with the number of sequences. Exact optimization is consequently feasible only for a few short sequences, and practical MSA methods rely on heuristics.

## Progressive alignment and guide trees {#progressive-alignment}

**Progressive alignment** builds an MSA through a series of smaller alignment problems. Similar sequences are aligned first, and the resulting groups are progressively merged.

The usual workflow is to estimate pairwise distances, construct a **guide tree**, and follow its branching order. Merging may involve sequence–sequence, sequence–profile, or profile–profile alignment. UPGMA and neighbor joining are examples of methods used to construct guide trees.

SP scoring supports this decomposition:

$$
SP(A,B)=SP(A)+SP(B)+\text{cross-group pair scores}.
$$

When the existing within-group alignments are fixed, the merge optimizes the contributions between groups. A gap–gap pair is normally assigned zero score in this formulation.

The guide tree determines the order of operations; it should not automatically be interpreted as a reliable phylogenetic reconstruction. Likewise, pairwise similarity scores may need transformation before serving as evolutionary distances. The lecture gives the Feng–Doolittle transformation

$$
D=-\log\left(\frac{S_{\mathrm{obs}}-S_{\mathrm{rand}}}
{S_{\mathrm{max}}-S_{\mathrm{rand}}}\right),
$$

which compares the observed score with random and maximum-score references.

ClustalW, ClustalΩ, MUSCLE, and T-Coffee illustrate practical MSA approaches. MUSCLE also illustrates that initial distance estimates can come from **k-mer comparisons**, rather than requiring full pairwise alignments first.

A limitation of progressive alignment is that an early mistake can persist through subsequent merges. **Iterative refinement** revisits parts of the alignment to improve the initial result. Neither a sophisticated heuristic nor a high objective score guarantees that every column represents the correct biological correspondence.

## From an alignment to a sequence profile {#sequence-profiles}

Once an MSA is available, each column provides a distribution of residues. A **profile** summarizes these position-specific distributions instead of choosing a single representative sequence.

A conventional substitution matrix applies the same residue-pair score at every position. A profile can instead distinguish a highly conserved catalytic position from a variable surface position. This additional information can improve sensitivity when searching for distant homologs.

One simple profile score averages substitution scores over the residues in a column. For a column containing five V, one F, and one I,

$$
\operatorname{score}(i,a)=\frac{5}{7}s(V,a)
+\frac{1}{7}s(F,a)+\frac{1}{7}s(I,a).
$$

This is convenient, but does not explicitly compare the column's residue preferences with a background model. A probabilistic profile provides that comparison more directly.

### Position-specific scoring matrices {#pssm}

Let $e_i(a)$ be the probability of residue $a$ at profile position $i$. Under the independent-position model, a fixed-length sequence has probability

$$
P(X\mid M)=\prod_{i=1}^{L}e_i(x_i).
$$

If $q_a$ is the background frequency of residue $a$, the corresponding **position-specific scoring matrix (PSSM)** contains log-odds scores

$$
s_i(a)=\log\frac{e_i(a)}{q_a}.
$$

The sequence score is then

$$
S(X)=\sum_{i=1}^{L}\log\frac{e_i(x_i)}{q_{x_i}}.
$$

A positive contribution means that the observed residue is more probable at that family position than under the background distribution. Profiles can be used in dynamic programming or incorporated into heuristic searches. **PSI-BLAST** uses an iterative approach in which detected homologs contribute to a position-specific profile for subsequent searches.

## Profile HMMs: modelling substitutions and indels {#profile-hmms}

A PSSM models residue preferences, but does not by itself provide a full probabilistic description of insertions and deletions. A **profile HMM** adds a structured state topology to represent these events.

::: table align="center" title="States in a profile HMM"

| State | Biological interpretation | Emission behavior |
| --- | --- | --- |
| Match $M_i$ | Occupies core alignment position $i$ | Emits a residue from a position-specific distribution |
| Insert $I_i$ | Adds residues between core positions | Emits residues; self-transitions allow an insertion of variable length |
| Delete $D_i$ | Skips core position $i$ | Silent: emits no residue |

:::

“Match” means occupying a model position, not necessarily matching a consensus residue exactly. A match state can emit different amino acids with different probabilities.

Transition probabilities describe how likely a sequence is to continue through core positions, enter an insertion, or skip a position. Insertion self-transitions provide a probabilistic mechanism for extending a gap. Delete states advance through the model without consuming a sequence character.

Unlike a generic HMM whose states may represent broad biological regions, a profile HMM has an ordered backbone tied to the positions of a particular sequence family.

### Building a profile HMM from an MSA {#building-profile-hmms}

Construction starts by selecting the columns that will become core match positions. Each aligned sequence is then interpreted as a path through match, insert, and delete states. Counts along these paths provide estimates of emission and transition probabilities, followed by regularization.

The SH3 domain example in the lectures illustrates this conversion from family alignment to model. The alignment is therefore an important input: incorrect column correspondences can become incorrect model preferences.

Sampling also matters. A large cluster of nearly identical sequences can dominate raw counts without providing an equivalent amount of independent evolutionary information. Selecting representative sequences or applying **sequence weights** reduces this bias.

### Searching and recovering alignments {#profile-inference}

For an observed sequence $X$, the model can evaluate all compatible state paths or identify the best individual path.

::: table align="center" title="Forward and Viterbi for profile HMMs"

| Method | Quantity | Interpretation |
| --- | --- | --- |
| Forward | $P(X\mid M)=\sum_\pi P(X,\pi\mid M)$ | Total probability across all compatible paths |
| Viterbi | $\pi^*=\arg\max_\pi P(X,\pi\mid M)$ | Most probable single path and its implied alignment |

:::

Forward combines support from multiple possible alignments. Viterbi selects one optimal path. Searching for family members does not always require reporting an alignment, but recovering a path is useful when incorporating a new sequence into the family alignment.

Model topology can also define different search modes:

- **Local matching:** part of the sequence matches part of the model.
- **Multiple local matches:** related regions occur more than once in a sequence.
- **Global in the model, local in the sequence:** the full domain model matches a segment within a longer protein.

The last mode is particularly useful for protein-domain searches. Pfam illustrates the use of alignments and profile HMMs to represent protein families, while HMMER provides tools for searching with these models.

## Pseudocounts and regularization {#pseudocounts}

Estimating probabilities directly from counts gives zero probability to unobserved residues or transitions. With limited data, absence from the sample does not establish biological impossibility. **Pseudocounts** prevent these overly confident estimates.

Let $c_i(a)$ be the observed count and $n_i=\sum_a c_i(a)$. Adding one count for each of $K$ possible residues gives

$$
e_i(a)=\frac{c_i(a)+1}{n_i+K}.
$$

With no observations, this produces a uniform distribution. With many observations, the added counts have little influence.

A more informative prior uses background residue frequencies:

$$
e_i(a)=\frac{c_i(a)+Aq_a}{n_i+A},
$$

where $A$ controls the total pseudocount strength. When data are scarce, estimates remain close to the background; when data are abundant, they approach the observed frequencies.

### Pseudocounts informed by substitutions {#substitution-pseudocounts}

Background frequencies ignore which residues have already been observed in a column. Substitution-informed pseudocounts distribute additional probability according to plausible replacements of those residues:

$$
\alpha_i(a)=A\sum_b P(a\mid b)f_i(b),
$$

where $f_i(b)$ is the observed frequency of residue $b$. The regularized emission probability becomes

$$
e_i(a)=\frac{c_i(a)+\alpha_i(a)}{n_i+A}.
$$

For example, observations of a hydrophobic amino acid can provide some support for other plausible hydrophobic substitutions, even if those alternatives were absent from a small sample.

The connection to a substitution matrix follows from log-odds scoring. In the natural-log, unscaled formulation,

$$
s(a,b)=\log\frac{P(a,b)}{q_aq_b}
=\log\frac{P(a\mid b)}{q_a},
$$

so

$$
P(a\mid b)=q_a\exp(s(a,b)).
$$

For a real score matrix, the logarithm base and score scaling must be accounted for before converting scores back to probabilities.

::: note Formula notation

The final substitution-pseudocount slide contains inconsistent summation indices. The expressions here consistently sum over the observed residue $b$ to obtain the pseudocount for residue $a$, and normalize by the total observed and added counts.

:::

## Coevolution: information between alignment columns {#coevolution}

Position-specific profiles describe what each column prefers. They do not explicitly describe arbitrary dependencies between distant positions. Those dependencies can carry a different kind of biological information.

If two residues interact, a mutation at one position can favor a compensatory mutation at the other. A change in charge, size, or chemical preference may be tolerated only when the partner residue also changes. Across a protein family, these constraints can appear as correlated variation between MSA columns.

### Mutual information and indirect correlations {#mutual-information}

Let $p_{ij}(a,b)$ be the joint frequency of residues $a$ and $b$ at positions $i$ and $j$. Their mutual information is

$$
MI(i,j)=\sum_{a,b}p_{ij}(a,b)
\log\frac{p_{ij}(a,b)}{p_i(a)p_j(b)}.
$$

If the positions are independent, the joint distribution factorizes and the mutual information is zero. A related measure is the difference between the observed joint frequency and the independent expectation:

$$
C_{ij}(a,b)=p_{ij}(a,b)-p_i(a)p_j(b).
$$

However, correlation is not sufficient evidence of direct physical contact. Shared ancestry and uneven sampling can create correlations. So can indirect interactions: if A depends on B and B depends on C, A and C may correlate without directly interacting.

This is why contact inference requires more than ranking raw pairwise correlations.

### A global model of residue couplings {#global-couplings}

The lecture introduces a global statistical model of the form

$$
P(\mathbf a)=\frac{1}{Z}
\exp\left[\sum_{i<j}J_{ij}(a_i,a_j)+\sum_i h_i(a_i)\right].
$$

::: table align="center" title="Components of a global sequence model"

| Component | Role |
| --- | --- |
| $h_i(a_i)$ | Represents position-specific residue preferences |
| $J_{ij}(a_i,a_j)$ | Represents couplings between pairs of positions |
| $Z$ | Normalizes probabilities over all possible sequences |

:::

Inferring couplings jointly can help separate direct interactions from correlations transmitted through other positions. The lectures illustrate covariance-matrix inversion as one route from observed covariation toward inferred couplings.

These models require many diverse sequences because they estimate effects across many position pairs and residue combinations. The normalization is also computationally challenging: for length $L$ and alphabet size $q$, there are $q^L$ possible sequences. Practical inference therefore relies on approximations.

### Biological applications {#coevolution-applications}

Strong inferred couplings can provide candidate contact or distance constraints for protein-structure modelling, analogous in purpose to constraints obtained from experimental measurements. The lecture connects this use of sequence information with modern structure-prediction approaches such as AlphaFold2, which combine sequence and structural information.

Other applications include identifying functional sites, investigating protein–protein interactions, assessing variants, and designing new family-compatible sequences.

A sequence model can also be generative: it can assign probabilities to sequences and produce new samples. Generating sequences alone does not establish biological realism. Evaluation should examine properties that were not explicitly supplied as fitting targets, and functional claims may require experimental validation.

## Choosing what the model needs to capture {#model-comparison}

::: table align="center" title="From alignment to different representations of a protein family"

| Representation | Main information retained | Typical use |
| --- | --- | --- |
| MSA | Corresponding positions, conservation, and gap patterns | Comparative and evolutionary analysis |
| PSSM | Position-specific residue preferences | Sensitive profile-based sequence searching |
| Profile HMM | Residue preferences plus insertion and deletion paths | Family recognition, domain searches, and alignment |
| Coupling model | Position preferences plus dependencies between position pairs | Contact inference and sequence compatibility analysis |

:::

A profile HMM is well suited to recognizing a family whose members differ in substitutions and indels. A coupling model addresses the additional question of which residue combinations are compatible across positions. Both depend on the quality and diversity of the underlying alignment, but they preserve different aspects of its evolutionary information.
