---
title: "Free Energy, Linear Algebra, and the RMSD Algorithm"
createTime: 2026/11/23 09:41:00
permalink: /blog/strubi-folding-rmsd/
excerpt: "This is part of the summary of the course Structural Bioinformatics at KU. This article covers free energy as a restatement of probability, the linear algebra behind optimal superposition, the SVD-based RMSD algorithm, Theseus, GDT_TS, and fold classification."
tags:
  - KU
  - Structural Bioinformatics
series: ku-structural-bioinformatics
---

## Where this fits {#where-this-fits}

This post covers the thermodynamics of folding and stability, and then a basic computational problem: how to compare two structures. The lecture is listed as "Structure comparison, linear algebra, RMSD algorithm", and the exercise session covers the PDB database and the PDB file format.

::: note Source
These are my notes on the folding and structure comparison lectures of the Structural Bioinformatics course (block 2, 2026–2027) at the University of Copenhagen, written from the lecture slides and the published schedule. The schedule only lists session titles, so where one slide deck spans several sessions the split between posts is my own. The folding section covers the thermodynamic definitions only. The structural vocabulary from the same deck is in the [post on protein structure](/blog/strubi-protein-structure/).
:::

## Folding and stability {#folding-and-stability}

Three facts frame the topic. Proteins refold spontaneously, so sequence encodes structure (Anfinsen); exceptions involve cofactors, aggregation or chaperones. Folding can take milliseconds, though some proteins need hours. And folded proteins are only marginally stable: the free energy difference between folded and unfolded states is about 5–15 kcal/mol, the equivalent of a few hydrogen bonds.

### Free energy is probability in additive form {#free-energy}

A **microstate** is one detailed configuration, such as a specific conformation. A **macrostate** is an ensemble of microstates, such as "the unfolded state". A free energy always belongs to a macrostate, and it is tied to the total probability mass of that macrostate:

$$
P(A) \propto \exp\left(-\frac{F_A}{kT}\right)
\qquad\Rightarrow\qquad
\frac{P(A)}{P(B)} = \exp\left(-\frac{\Delta F}{kT}\right)
$$

==The free energy is an additive reformulation of probability.== A difference in free energy between two macrostates is a statement about how much more often the system is found in one than in the other. The slides make the point with a die: the macrostates "even" and "odd" each contain three equally likely outcomes, so they have the same free energy and a probability ratio of one.

At constant temperature and pressure the relevant quantity is the Gibbs free energy:

$$
G = H - TS, \qquad H = U + pV, \qquad S = k \ln W
$$

Here $H$ is the enthalpy, $U$ the internal energy averaged over the microstates (the kind of energy a force field computes), and $S$ the entropy, which depends on the number of microstates $W$ in the macrostate. The unfolded state has far more microstates than the folded one, so folding has to pay for that entropy loss, and marginal stability is the small remainder of two large opposing terms.

### Potential of mean force {#pmf}

A **potential of mean force** (PMF) is the same construction applied to a variable instead of a macrostate. It turns the marginal probability of $x$, with everything else integrated out, into an energy:

$$
P(x) = \int P(x, y)\,dy \;\propto\; \exp\left(-\frac{\text{PMF}(x)}{kT}\right)
$$

The distinction looks pedantic, but the argument about [knowledge-based potentials](/blog/strubi-potentials-rosetta-coevolution/) rests on it.

## The linear algebra that superposition needs {#linear-algebra}

The course is self-contained, so one deck reviews matrices and vectors. Most of it serves a single purpose, the derivation of the optimal superposition, and it is easier to remember when read that way.

| Concept | Property | Where it is used |
| --- | --- | --- |
| Matrix product | Not commutative; shapes $\{n,m\} \times \{m,k\} \to \{n,k\}$ | Coordinates as $\{3,N\}$ matrices |
| Transpose | $(AB)^T = B^T A^T$ | Rearranging the error function |
| Trace | $\text{Tr}(AB) = \text{Tr}(BA)$ | Moving the rotation matrix to the front |
| Determinant | Scale factor of the transformation; $+1$ for a rotation, $-1$ for a roto-reflection | Detecting a mirror-image solution |
| Orthogonal matrix | $U^T = U^{-1}$; rows and columns are orthonormal | Rotations; bounding the entries of $T$ |
| Singular value decomposition | Any real matrix is $A = V S W^T$, with $V$, $W$ orthogonal and $S$ diagonal and non-negative | Solving for the optimal rotation |

The geometric reading of the SVD is that any linear map is a rotation, followed by a scaling along the axes, followed by another rotation. The same deck covers vectors (the dot product gives lengths and angles through $a \cdot b = |a||b|\cos\theta$; the cross product gives a perpendicular vector) and the NumPy calls for all of the above.

```python
import numpy as np

a = np.array([[1, 2], [3, 4], [5, 6]])
a.shape                      # (3, 2)
a.T @ a                      # matrix product
np.linalg.det(a[0:2, 0:2])   # determinant of the top 2x2 block
v, s, wt = np.linalg.svd(a)  # singular value decomposition
```

## Minimum RMSD superposition {#rmsd}

A structure is a set of 3D vectors. Given two sets $x$ and $y$ of $n$ paired vectors, both centred on the origin, the root mean square deviation is

$$
\text{RMSD}(x, y) = \sqrt{\frac{1}{n}\sum_{i=1}^{n} |x_i - y_i|^2}
$$

This depends on how the two structures happen to be oriented, so what is wanted is the minimum over all rotations $U$. That is the same as minimizing

$$
E(U) = \sum_{i} |x_i - U y_i|^2 = E_0 - 2L(U),
\qquad E_0 = \sum_i \left(|x_i|^2 + |y_i|^2\right),
\qquad L(U) = \text{Tr}(X^T U Y)
$$

where $X$ and $Y$ are the $\{3,N\}$ coordinate matrices. $E_0$ does not depend on $U$, so the task is to maximize $L$. The derivation is short once the tools above are in hand:

::: steps

1. **Move the rotation to the front.**

   By the cyclic property of the trace, $L(U) = \text{Tr}(U Y X^T) = \text{Tr}(UR)$, with $R = YX^T$ the $\{3,3\}$ correlation matrix of the two structures.

2. **Decompose the correlation matrix.**

   Write $R = V S W^T$. Then $L = \text{Tr}(U V S W^T) = \text{Tr}(S\,T)$ with $T = W^T U V$.

3. **Bound the result.**

   $S$ is diagonal, so $L = \sigma_1 T_{11} + \sigma_2 T_{22} + \sigma_3 T_{33}$. $T$ is a product of orthogonal matrices and therefore orthogonal, so no entry exceeds 1. The singular values are non-negative, so $L$ is largest when $T$ is the identity.

4. **Read off the rotation and the RMSD.**

   $T = I$ gives $U_{\min} = W V^T$ and $L_{\max} = \sigma_1 + \sigma_2 + \sigma_3$, so

   $$
   \text{RMSD} = \sqrt{\frac{E_0 - 2(\sigma_1 + \sigma_2 + \sigma_3)}{n}}
   $$

5. **Check for a reflection.**

   If $\det(W V^T) = -1$ the solution is a roto-reflection, which would superimpose a mirror image. Use $U_{\min} = W Z V^T$ with $Z = \text{diag}(1, 1, -1)$ instead, and flip the sign of $\sigma_3$ in the formula.

:::

The slides give this as pseudocode. Below is my NumPy version of it; I checked it on random coordinate sets, including mirrored ones, against the RMSD computed directly from the rotated coordinates.

```python
import numpy as np

def superimpose(x, y):
    """Rotate y onto x. x and y are (3, N) arrays of paired coordinates."""
    x = x - x.mean(axis=1, keepdims=True)   # move both to the origin
    y = y - y.mean(axis=1, keepdims=True)
    r = y @ x.T                             # correlation matrix R = Y X^T
    v, s, wt = np.linalg.svd(r)             # R = V S W^T
    w = wt.T
    u = w @ v.T
    z = np.diag([1.0, 1.0, 1.0])
    if np.linalg.det(u) < 0:                # roto-reflection: flip one axis
        z[2, 2] = -1.0
        u = w @ z @ v.T
    e0 = (x ** 2).sum() + (y ** 2).sum()
    msd = (e0 - 2.0 * (s * np.diag(z)).sum()) / x.shape[1]
    return u, np.sqrt(max(msd, 0.0))
```

::: warning What the algorithm assumes
The derivation needs paired vectors: it must already be known which atom in one structure corresponds to which atom in the other. It also treats every atom alike, which is the assumption the next two sections relax.
:::

## Beyond least squares {#beyond-least-squares}

### Theseus {#theseus}

Least-squares superposition implicitly assumes that atom positions are uncorrelated and all have the same variance. Neither holds for proteins: atoms are chemically bonded, and loops vary far more than the core. The effect is that a few highly variable regions dominate the fit and smear out the well-conserved parts.

**Theseus** (Theobald and Wuttke, 2006) recasts superposition as a maximum-likelihood problem. Each observed structure is a rotated and translated copy of a latent mean structure $M$ plus a perturbation:

$$
X_i = R_i (M + E_i) + T_i, \qquad E_i \sim \text{MatrixNormal}(0, \Sigma, I_3)
$$

The covariance matrix $\Sigma$ lets variable atoms count for less. A later Bayesian version (Moreta et al., 2019) places priors on all quantities and represents rotations as unit **quaternions**, the four-dimensional analogues of complex numbers, which make it easy to define a uniform distribution over rotations.

### Finding the equivalent positions {#equivalent-positions}

Paired positions are available when comparing a native structure with a complex of the same protein. For two different proteins there are insertions, deletions, missing residues and conformational changes, and the pairing has to be found first. Heuristics dominate: Monte Carlo optimization of the alignment as in Dali, or aligning secondary-structure elements and trying their combinations.

### GDT_TS {#gdt-ts}

RMSD squares the deviations, so a single displaced loop can ruin the score of an otherwise good model. The **Global Distance Test** asks instead what percentage of $C_\alpha$ atoms can be superimposed within a distance cutoff. GDT_TS is the average of that percentage at 1, 2, 4 and 8 Å. It is the headline measure in the CASP structure prediction assessments, including the CASP14 results discussed in the [AlphaFold post](/blog/strubi-alphafold/).

| Measure | What it reports | Sensitive to outliers | Typical use |
| --- | --- | --- | --- |
| RMSD | Average deviation in Å after optimal rotation | Yes | Closely related structures, same protein in two states |
| Theseus | Maximum-likelihood superposition with per-atom variances | No | Ensembles with rigid cores and flexible parts |
| GDT_TS | Mean percentage of residues within 1, 2, 4, 8 Å | No | Scoring predicted models against the native structure |

## Classifying folds {#classification}

Structure comparison makes classification possible, and classification matters for practical reasons: the PDB is highly redundant, so building a non-redundant data set requires knowing what is related to what; and a shared fold can hint at function or ancestry.

A **domain** is a potentially independent folding unit: compact, with more contacts inside than between domains, no secondary structure shared with a neighbour, and reusable in evolution. The slides are frank that these rules are fuzzy.

| Resource | Hierarchy | How it is built | Strength | Weakness |
| --- | --- | --- | --- | --- |
| SCOP | Class, fold, superfamily, family | Manual curation | Regarded as the gold standard | Does not scale; the classic release dates from 2009, with SCOP2 following |
| CATH | Class, architecture, topology, homology | Largely automated, pairwise superposition | More objective | Some misclassifications; still scales poorly |
| Gauss integrals (Røgen and Fain) | A 30-dimensional vector per chain, clustered | Fully automated | Fast, objective, scales well | Purely geometric description of the chain |

In CATH, **architecture** describes how secondary-structure elements pack and **topology** how they are connected, so topology corresponds to the fold. The slides quote 43 architectures, 1,472 topologies and 6,631 homologous superfamilies for the 2021 statistics.

The third approach treats the backbone as a curve in space and borrows from knot theory. Quantities such as the **writhe** (signed crossings of the curve with itself, averaged over all viewing directions) summarize the chain's shape as a fixed-length vector, so structures can be compared without aligning them at all.

## What to take away {#takeaways}

- A free energy difference is a log ratio of probabilities between macrostates; a PMF does the same for a variable.
- Optimal superposition reduces to one SVD of a 3×3 matrix. The determinant check is the part that is easy to forget.
- RMSD is the right tool for nearly identical structures and a poor one for models with flexible or wrong regions; GDT_TS and Theseus address that in different ways.
