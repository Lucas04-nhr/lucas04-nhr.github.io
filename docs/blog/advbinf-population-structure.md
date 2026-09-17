---
title: Population Structure, Admixture and PCA
createTime: 2026/09/16 09:41:56
permalink: /blogs/ku-advbinf-population-structure/
tags:
  - KU
  - Advanced Bioinformatics
excerpt: This is part of the summary of the course Advanced Bioinformatics for NGS at KU. This article introduces population structure, admixture proportions, ADMIXTURE and NGSadmix, principal component analysis, the relationship between PCA and admixture models, genotype uncertainty in low-depth sequencing, EMU and PCAngsd, and applications of PCA to selection scans.
---

Population-genetic data often contain structure because individuals do not all descend from one perfectly panmictic population.

Different populations may have experienced different demographic histories, genetic drift, migration, and barriers to gene flow. As a consequence, allele frequencies differ systematically between populations.

Two of the most widely used approaches for describing this structure are:

- **admixture analysis**, which represents each individual as a mixture of latent ancestral populations;
- **principal component analysis (PCA)**, which represents genetic variation using a small number of continuous axes.

Although their outputs look very different, the two methods are closely related. Both can be interpreted as ==**low-rank models of individual allele frequencies**==.

This article develops that connection and then considers an important complication for NGS data: genotype uncertainty.

## Population Structure {#population-structure}

A population has **population structure** when allele frequencies differ systematically among subpopulations.

Suppose a population is initially well mixed. If individuals mate randomly and there is extensive gene flow, genetic drift affects the population as a whole.

If a barrier to gene flow separates the population, however, the resulting subpopulations begin to drift independently.

For one SNP, the allele frequency might evolve differently in two populations:

```text
Population 1:  0.50 -> 0.65 -> 0.80
Population 2:  0.50 -> 0.40 -> 0.20
```

The important point is that this process occurs across a large number of genetic variants.

The result is therefore not just one unusual SNP, but a genome-wide pattern of allele-frequency differentiation.

Conceptually,

$$
\text{barrier to gene flow}
\rightarrow
\text{independent drift}
\rightarrow
\text{allele-frequency differences}
\rightarrow
\text{population structure}.
$$

Population structure can arise at very different scales, for example:

- between continents;
- between geographically separated populations;
- along continuous geographical clines;
- within what would conventionally be called one population.

## Admixture {#admixture}

After populations have separated, they may later exchange genes again.

This process is called **admixture**.

An individual is called admixed when their genome contains ancestry derived from multiple populations.

For example, if an individual derives approximately 75% of their genome from population 1 and 25% from population 2, their ancestry proportion can be written as

$$
Q_i=(0.75,0.25).
$$

This is a **global ancestry proportion**: it summarizes the entire genome.

At the chromosome level, the genome instead consists of ancestry segments. Recombination breaks ancestry blocks into smaller segments over generations.

Therefore, two related but different questions can be asked:

- **global ancestry:** what fraction of the genome comes from each ancestry?
- **local ancestry:** which ancestry generated a particular genomic segment?

## The Admixture Matrix $Q$ {#admixture-matrix-q}

For $N$ individuals and $K$ ancestry components, the admixture proportions are represented by an

$$
N\times K
$$

matrix

$$
Q=
\begin{pmatrix}
q_{11} & \cdots & q_{1K}\\
\vdots & \ddots & \vdots\\
q_{N1} & \cdots & q_{NK}
\end{pmatrix}.
$$

For each individual $i$,

$$
\sum_{k=1}^{K}q_{ik}=1,
$$

with

$$
0\le q_{ik}\le 1.
$$

Thus, the rows of $Q$ describe how ancestry is distributed across the $K$ latent populations for each individual.

A standard ADMIXTURE bar plot is simply a graphical representation of the rows of this matrix.

## Population Allele Frequencies {#population-allele-frequencies}

Admixture inference works because ancestral populations differ in allele frequencies.

Let

$$
f_{jk}
$$

denote the allele frequency at SNP $j$ in ancestral population $k$.

Collecting these values gives an allele-frequency matrix

$$
F.
$$

If an individual has admixture proportions $q_{ik}$, then their **individual allele frequency** at site $j$ is

$$
\pi_{ij}
=
\sum_{k=1}^{K} f_{jk}q_{ik}.
$$

In matrix notation,

$$
\Pi = QF.
$$

Here,

- $Q$ contains individual admixture proportions;
- $F$ contains population-specific allele frequencies;
- $\Pi$ contains individual-specific allele frequencies.

For example, suppose

$$
Q_i=(0.4,0.6),
$$

and the frequency of allele T at one SNP is

$$
f_{j1}=0.7,
\qquad
f_{j2}=0.2.
$$

Then

$$
\pi_{ij}
=
0.4\times0.7
+
0.6\times0.2
=
0.4.
$$

So an allele drawn from this individual has probability 0.4 of being T at this site.

## From Individual Allele Frequency to Genotype Probability {#from-individual-allele-frequency-to-genotype-probability}

Under Hardy-Weinberg equilibrium, a diploid genotype can be modeled from the individual allele frequency $\pi_{ij}$.

If the genotype is coded as

$$
G_{ij}\in\{0,1,2\},
$$

then

$$
P(G_{ij}=0)
=
(1-\pi_{ij})^2,
$$

$$
P(G_{ij}=1)
=
2\pi_{ij}(1-\pi_{ij}),
$$

and

$$
P(G_{ij}=2)
=
\pi_{ij}^2.
$$

Therefore, once $Q$ and $F$ are known, the probability of the observed genotype data can be calculated.

The admixture model can therefore be summarized as

$$
Q,F
\rightarrow
\Pi
\rightarrow
G.
$$

## Maximum-Likelihood Estimation {#maximum-likelihood-estimation}

In real data, the genotype matrix $G$ is observed, but $Q$ and $F$ are unknown.

The aim is to find the parameter values that make the observed genotypes most likely:

$$
(\hat Q,\hat F)
=
\operatorname*{argmax}_{Q,F}
P(G|Q,F).
$$

Equivalently, one maximizes the log-likelihood,

$$
(\hat Q,\hat F)
=
\operatorname*{argmax}_{Q,F}
\log P(G|Q,F).
$$

Thus, ADMIXTURE is fundamentally a **maximum-likelihood factorization model**.

The number of parameters grows with both the number of individuals and the number of SNPs. For $N$ individuals, $M$ SNPs and $K$ populations, the model contains approximately

$$
NK+MK
$$

parameters before accounting for constraints.

## Hidden Ancestry States and EM {#hidden-ancestry-states-and-em}

The model also has a natural latent-variable interpretation.

For each allele copy, an unobserved ancestry state indicates from which population that copy originated.

Let

$$
Z_{ijd}
$$

denote the ancestry of allele copy $d$ for individual $i$ at site $j$.

The ancestry state is not directly observed, which connects admixture inference to the same latent-variable framework used in the EM algorithm.

The analogy to the two-coin EM example is direct:

```text
Coin example:
observed data      = coin-toss sequences
latent variable    = which coin generated each sequence
parameters         = head probabilities

Admixture model:
observed data      = genotypes
latent variable    = ancestry state of each allele
parameters         = Q and F
```

This is why EM-style reasoning appears naturally in population-structure models.

## Numerical Optimization and Convergence {#numerical-optimization-and-convergence}

The admixture likelihood does not have a simple closed-form solution.

Programs therefore use numerical optimization.

This introduces an important practical issue: different initial values can converge to different local optima.

A single run is therefore not sufficient evidence of convergence.

A practical strategy is:

1. run the analysis multiple times with different initializations;
2. sort the runs by likelihood;
3. compare the highest-likelihood solutions;
4. if the best runs are very similar, convergence is more plausible;
5. otherwise, run additional replicates.

The lecture suggests roughly ten initial runs and checking whether the best several likelihoods are nearly identical.

## Choosing $K$ {#choosing-k}

The number of ancestry components $K$ is not automatically known.

If the data contain structure corresponding to three major components but the model is forced to use

$$
K=2,
$$

the model must compress three structures into two.

This can produce misleading ancestry proportions.

A common approach is to use cross-validation, but the lecture emphasizes that there may not be a unique biologically "correct" $K$.

Different values of $K$ can reveal structure at different resolutions:

```text
K = 2   broad continental structure
K = 3   one broad group splits further
K = 5   regional structure
K = 10  finer-scale population structure
```

Therefore, $K$ should not be interpreted as the literal number of real historical populations.

Instead, the more precise interpretation is:

> Given $K$ latent ancestry components, how does the model decompose the observed genetic variation?

## Unsampled Source Populations {#unsampled-source-populations}

A further limitation is that the true ancestral source populations may not be present in the dataset.

Suppose the actual ancestry of an individual comes from populations A and B, but the dataset only contains populations A and C.

The model is still forced to explain the individual using the available components.

Therefore, an estimated contribution from C does not necessarily imply literal ancestry from sampled population C.

This is one reason why admixture components should not be interpreted too literally as historical populations.

## Similar Admixture Patterns Can Have Different Histories {#similar-admixture-patterns-can-have-different-histories}

A particular ADMIXTURE pattern may be compatible with several demographic histories.

For example, an intermediate ancestry profile could arise from:

- recent pulse admixture;
- continuous gene flow;
- isolation by distance;
- ancestral population structure;
- an unsampled ghost population.

Thus,

$$
\text{statistical decomposition}
\neq
\text{unique demographic history}.
$$

ADMIXTURE is useful for describing structure, but demographic interpretation requires additional evidence and models.

## evalAdmix {#evaladmix}

A model should also be checked for goodness of fit.

**evalAdmix** evaluates residual structure left after an admixture model has been fitted.

For individual $i$ and locus $j$, one can compare

$$
\text{observed genotype}
-
\text{model-based expected genotype}.
$$

If the admixture model explains the structure well, residuals should not remain systematically correlated between individuals.

Correlated residuals suggest that some shared structure has not been captured, for example because $K$ is too small.

Thus evalAdmix can help assess model fit and provide information about a lower bound for meaningful values of $K$.

## Low-Depth NGS and Genotype Uncertainty {#low-depth-ngs-and-genotype-uncertainty}

The original ADMIXTURE formulation assumes genotype data are available.

This becomes problematic for low-depth sequencing.

Suppose the true genotype is heterozygous,

$$
A/G,
$$

but the site is covered by only two reads:

```text
A
A
```

The reads do not prove that the genotype is $A/A$. Both reads may simply have sampled the same allele.

At low depth, hard genotype calls can therefore introduce systematic errors.

Sequencing error, mapping uncertainty and allelic sampling further increase the uncertainty.

The important principle is:

==**Do not convert uncertain sequencing evidence into a definite genotype too early.**==

## NGSadmix {#ngsadmix}

NGSadmix extends admixture inference to uncertain NGS data.

Instead of using a called genotype, it uses **genotype likelihoods**.

For sequencing data $X_{ij}$,

$$
P(X_{ij}|G_{ij}=g)
$$

quantifies how compatible the observed reads are with genotype $g$.

For diploid biallelic sites,

$$
g\in\{0,1,2\}.
$$

The genotype can be marginalized out:

$$
P(X_{ij}|Q,F)
=
\sum_{g=0}^{2}
P(X_{ij}|G_{ij}=g)
P(G_{ij}=g|Q,F).
$$

The first term is the genotype likelihood.

The second term is supplied by the population-structure model.

NGSadmix therefore combines sequencing uncertainty and ancestry inference in one likelihood framework.

Conceptually,

```text
sequencing reads
      |
      v
genotype likelihoods
      |
      v
population model P(G | Q,F)
      |
      v
marginal likelihood P(X | Q,F)
      |
      v
estimate Q and F
```

This avoids the bias introduced by hard genotype calling.

## Principal Component Analysis {#principal-component-analysis}

Admixture analysis is not the only way to describe population structure.

**Principal component analysis (PCA)** projects high-dimensional genotype data into a low-dimensional space that retains as much genetic variation as possible.

Suppose there are

- $M$ SNPs;
- $N$ individuals.

The genotype matrix is

$$
G\in\mathbb{R}^{M\times N}.
$$

Each individual is therefore a point in an $M$-dimensional space.

For genomic datasets, $M$ may exceed one million.

PCA replaces these millions of dimensions with a small number of coordinates:

$$
PC1,\ PC2,\ PC3,\ldots
$$

A PCA plot of PC1 against PC2 represents every individual as one point.

Population structure appears because individuals with similar genome-wide allele-frequency patterns tend to have similar PC coordinates.

## PCA and Geography {#pca-and-geography}

A classic result in population genetics is that genetic PCA may resemble geography.

If migration mainly occurs locally, geographically nearby populations tend to have more similar allele frequencies.

The largest axes of genetic variation may therefore align with geographical gradients.

This does not mean that PCA is given geographical coordinates.

Rather,

$$
\text{geography}
\rightarrow
\text{gene flow and drift}
\rightarrow
\text{allele-frequency covariance}
\rightarrow
\text{PCA structure}.
$$

The lecture illustrates this both with European data and with population structure across mainland China.

## PCA as a Covariate in GWAS {#pca-as-a-covariate-in-gwas}

Population structure can confound genome-wide association studies.

Suppose a phenotype is more common in one population and an allele is also more common in that population.

The SNP may then appear associated with the phenotype even when there is no causal relationship.

A typical GWAS model therefore includes PCs as covariates:

$$
Y
=
\beta_0
+
\beta_GG
+
\beta_1PC1
+
\beta_2PC2
+
\cdots
+
\epsilon.
$$

The PCs absorb major axes of population stratification and can substantially reduce spurious association signals.

## Multi-Dimensional Scaling {#multi-dimensional-scaling}

The lecture introduces **multi-dimensional scaling (MDS)** as a useful comparison to PCA.

MDS aims to project data into a lower-dimensional space while preserving pairwise distances.

The general workflow is:

1. choose a distance metric;
2. calculate pairwise distances between individuals;
3. choose the number of dimensions;
4. find low-dimensional coordinates that approximately preserve those distances.

For example, the Manhattan distance between two individuals can be calculated as

$$
d(i,l)
=
\sum_j
|G_{ji}-G_{jl}|.
$$

If the original distance is 3 and the projected one-dimensional coordinates are

$$
6.10
\quad\text{and}\quad
3.08,
$$

the projected distance is

$$
|6.10-3.08|
=
3.02.
$$

Thus, MDS focuses on preserving **distance**, whereas PCA focuses on preserving **variance**.

## Centering and Scaling Genotypes {#centering-and-scaling-genotypes}

For PCA, SNPs are normally standardized before decomposition.

For SNP $j$ with allele frequency $f_j$, the expected diploid genotype is

$$
E[G_{ij}]
=
2f_j.
$$

Under Hardy-Weinberg equilibrium,

$$
\operatorname{Var}(G_{ij})
=
2f_j(1-f_j).
$$

A standardized genotype can therefore be defined as

$$
\tilde G_{ij}
=
\frac{
G_{ij}-2f_j
}{
\sqrt{2f_j(1-f_j)}
}.
$$

After standardization,

$$
E[\tilde G_{ij}]
=
0,
$$

and

$$
\operatorname{Var}(\tilde G_{ij})
=
1.
$$

This prevents common SNPs with naturally larger genotype variance from dominating the PCA merely because of their allele frequency.

## Genotype Covariance Matrix {#genotype-covariance-matrix}

The standardized genotype matrix can be used to calculate the covariance between individuals.

For individuals $i$ and $l$,

$$
\operatorname{cov}(\tilde G_i,\tilde G_l)
=
\frac{1}{M}
\sum_{j=1}^{M}
\tilde G_{ij}\tilde G_{lj}.
$$

In matrix notation,

$$
C
=
\frac{1}{M}
\tilde G^T\tilde G.
$$

If two individuals have similar genetic backgrounds, they tend to have similar standardized genotypes and therefore positive covariance.

Population structure is consequently encoded in this covariance matrix.

## PCA by SVD or Eigenvalue Decomposition {#pca-by-svd-or-eigenvalue-decomposition}

There are two closely related ways to compute PCA.

### SVD of the genotype matrix

Apply singular value decomposition directly to the normalized genotype matrix:

$$
\tilde G
=
U\Sigma V^T.
$$

### Eigenvalue decomposition of the covariance matrix

First calculate

$$
C
=
\tilde G^T\tilde G,
$$

then decompose

$$
C
=
V\Lambda V^T.
$$

These approaches are related because

$$
\tilde G^T\tilde G
=
V\Sigma^2V^T.
$$

Therefore,

$$
\Lambda
=
\Sigma^2.
$$

The singular values quantify the amount of variation represented by each component, while the corresponding vectors determine the PC directions and scores.

## Low-Rank Approximation {#low-rank-approximation}

The key idea of PCA is that the genotype matrix often contains much more structure than is needed to describe the major patterns.

The full SVD is

$$
\tilde G
=
U\Sigma V^T.
$$

Keeping only the first $K$ components gives

$$
\tilde G
\approx
U_K\Sigma_KV_K^T.
$$

This is a **rank-$K$ approximation**.

The first component captures the largest possible amount of variation, the second captures the largest remaining amount under orthogonality constraints, and so on.

## The Connection Between PCA and ADMIXTURE {#connection-between-pca-and-admixture}

This is one of the central ideas of the lecture.

Recall that admixture analysis models individual allele frequencies as

$$
\Pi
=
QF.
$$

Since the expected diploid genotype is

$$
E[G]
=
2\Pi,
$$

we can write

$$
\frac{1}{2}E[G]
\approx
\Pi.
$$

ADMIXTURE therefore assumes

$$
\Pi
=
QF.
$$

PCA, on the other hand, gives a truncated-SVD approximation:

$$
\Pi
\approx
\frac{1}{2}
U_K\Sigma_KV_K^T.
$$

Thus, both methods can be interpreted as ==**low-rank decompositions of the matrix of individual allele frequencies**==.

Their main difference is the constraints imposed on the factors.

In ADMIXTURE,

$$
0\le q_{ik}\le1,
$$

and

$$
\sum_kq_{ik}=1.
$$

The entries of $F$ are also constrained to valid allele frequencies.

PCA has no equivalent ancestry-proportion constraints. PC coordinates can be negative or positive and do not have to sum to one.

This is why PCA is often easier to interpret as a continuous axis of variation, whereas ADMIXTURE naturally produces mixture proportions.

However, both are describing closely related genetic structure.

## Continuous Population Structure {#continuous-population-structure}

PCA is often described as especially useful for continuous population structure.

For example, isolation by distance may produce a gradual cline:

```text
Population A  ->  intermediate groups  ->  Population B
```

PCA naturally represents this as a continuous trajectory along a PC axis.

ADMIXTURE may represent the same pattern as continuously changing ancestry proportions between components.

Thus the distinction between "continuous PCA" and "discrete ADMIXTURE" should not be taken too literally.

Both methods are different parameterizations of underlying low-dimensional genetic structure.

## Missing Genotypes {#missing-genotypes}

A major practical problem for PCA is missingness.

Almost all genotype datasets contain some missing values, and low-depth sequencing can contain extremely high levels of missing information.

A common strategy is **mean imputation**.

For SNP $j$ with allele frequency $f_j$, a missing diploid genotype is replaced by

$$
E[G_j]
=
2f_j.
$$

After centering, this corresponds to assigning zero to the standardized genotype.

This approach is computationally convenient but can introduce bias.

## Why Mean Imputation Can Distort PCA {#why-mean-imputation-can-distort-pca}

The problem is that mean imputation uses the same population-wide expectation for every individual.

Suppose two populations have allele frequencies

$$
f_A=0.9
$$

and

$$
f_B=0.1.
$$

The overall frequency may be around

$$
f=0.5.
$$

A missing genotype from an individual in population A is therefore imputed using a value based on the overall mean instead of that individual's ancestry.

As missingness increases, individuals are progressively pulled toward the overall mean.

In PCA space, this tends to move low-depth or highly missing individuals toward the origin.

This is particularly severe when 90--99% of genotype entries are missing.

The lecture demonstrates that conventional methods can strongly distort the true PCA structure under this level of missingness.

## EMU {#emu}

EMU addresses this problem using an iterative low-rank imputation strategy.

The central observation is:

> If PCA is known, individual allele frequencies can be estimated; if individual allele frequencies are known, PCA can be recalculated.

A simplified EMU-style procedure is:

1. perform an initial mean imputation;
2. calculate PCA;
3. reconstruct individual allele frequencies from the low-rank PCA model;
4. update only the missing entries;
5. recalculate PCA;
6. repeat until convergence.

Instead of replacing a missing genotype by

$$
2f_j,
$$

EMU can replace it using an individual-specific prediction

$$
2\pi_{ij}.
$$

This allows imputation to depend on the individual's population structure.

Conceptually,

```text
initial imputation
      |
      v
     PCA
      |
      v
estimate individual allele frequencies
      |
      v
update missing values
      |
      v
repeat until convergence
```

The observed genotype entries remain fixed; only missing entries are updated.

## PCA for Low-Depth Sequencing {#pca-for-low-depth-sequencing}

Low-depth sequencing is even more subtle than ordinary missing genotype data.

At a covered site, the genotype itself may still be uncertain.

For sequencing data $X_{ij}$ and genotype $G_{ij}$, the genotype likelihood is

$$
P(X_{ij}|G_{ij}=g).
$$

Using Bayes' theorem together with a prior based on allele frequency,

$$
P(G_{ij}=g|X_{ij},\pi_{ij})
=
\frac{
P(X_{ij}|G_{ij}=g)
P(G_{ij}=g|\pi_{ij})
}{
\sum_{g'}
P(X_{ij}|G_{ij}=g')
P(G_{ij}=g'|\pi_{ij})
}.
$$

The posterior genotype dosage is then

$$
E[G_{ij}|X_{ij},\pi_{ij}]
=
\sum_{g=0}^{2}
g
P(G_{ij}=g|X_{ij},\pi_{ij}).
$$

This dosage contains more information than a hard genotype call because it preserves genotype uncertainty.

## PCAngsd {#pcangsd}

PCAngsd extends PCA to genotype-likelihood data.

Instead of first calling genotypes, it uses genotype uncertainty while estimating the covariance structure.

A simplified workflow is

```text
sequencing data
      |
      v
genotype likelihoods
      |
      v
estimate allele frequencies
      |
      v
estimate genotype dosages / covariance
      |
      v
PCA
      |
      v
update individual allele frequencies
      |
      v
iterate
```

This approach can recover population structure from low-depth sequencing much more accurately than naïvely calling genotypes first.

The same principle appeared in NGSadmix:

==**preserve genotype uncertainty instead of converting it into hard calls too early.**==

## Ultra-Low-Depth Data {#ultra-low-depth-data}

The lecture presents a large non-invasive prenatal testing dataset as an example.

The sequencing depth is approximately

$$
0.06\times,
$$

which is far below the level at which reliable diploid genotype calls can be made genome-wide.

Nevertheless, the dataset contains a very large number of individuals.

Using methods designed for extreme missingness and uncertainty, PCA can still recover geographic population structure.

One example in the lecture shows a genetic gradient across mainland China, demonstrating that weak information per sample can still reveal structure when modeled appropriately across many individuals and loci.

## Host Genetics from Metagenomic Data {#host-genetics-from-metagenomic-data}

Another example uses human DNA present in gut metagenomic sequencing.

Most reads are microbial, but a fraction map to the human genome.

These host reads can be used to infer human population structure.

Because host coverage is low and uneven, genotype-likelihood-based PCA methods are particularly appropriate.

The lecture shows that PCAngsd can recover structure among several Chinese populations and minority groups using this type of data.

## PCA-Based Selection Scans {#pca-based-selection-scans}

PCA can also be used to identify variants whose allele-frequency patterns are unusually strongly associated with a major axis of population structure.

Suppose the expected allele frequency at SNP $j$ varies along a PC according to a regression-like model,

$$
\Pi_j
=
\alpha
+
U_j\beta
+
\epsilon.
$$

A SNP whose frequency changes much more strongly along the PC than expected may be a candidate for local adaptation or selection.

The lecture illustrates this idea using loci such as:

- **EPAS1**;
- the **IGH** region;
- **FADS2**;
- **ABCC11**.

These examples connect genomic differentiation to traits involving altitude adaptation, immune response, fatty-acid metabolism, sweating and earwax phenotype.

The important methodological point is not that PCA alone proves selection, but that PCA-derived individual allele frequencies provide a useful framework for testing variants that deviate strongly from genome-wide structure.

## Large-Scale PCA {#large-scale-pca}

Modern biobank-scale datasets may contain

- hundreds of thousands of individuals;
- millions of SNPs.

A full SVD of the entire genotype matrix can therefore be computationally expensive.

If only the first $K$ principal components are needed, calculating all singular vectors is unnecessary.

Instead of

$$
A
=
U\Sigma V^T,
$$

one can approximate

$$
A
\approx
U_K\Sigma_KV_K^T.
$$

This motivates randomized and approximate SVD algorithms.

## Randomized SVD {#randomized-svd}

Randomized SVD attempts to approximate the dominant singular subspace without performing a complete factorization.

A random projection is used to identify a lower-dimensional subspace containing most of the important variation.

Power iterations can improve the approximation.

The practical difficulty for very large genetic datasets is that repeated power iterations may require repeatedly reading the full genotype matrix, making I/O expensive.

## PCAone {#pcaone}

PCAone is presented as a scalable PCA implementation for very large datasets.

Its strategy is designed to approximate the leading singular vectors accurately while reducing memory and repeated full-data access.

The lecture compares PCAone with implementations based on:

- full SVD;
- IRAM;
- randomized SVD;
- probabilistic PCA.

The main emphasis is that PCAone can provide high accuracy with low memory use and good computational performance.

The same approach can scale to datasets with hundreds of thousands of individuals and millions of common SNPs.

## Admixture, PCA and NGS: One Unified View {#admixture-pca-and-ngs-one-unified-view}

The two lectures can be summarized with one common object:

$$
\Pi
=
\text{matrix of individual allele frequencies}.
$$

ADMIXTURE models this as

$$
\Pi
=
QF.
$$

PCA approximates it as

$$
\Pi
\approx
\frac{1}{2}
U_K\Sigma_KV_K^T.
$$

For high-depth genotype data, both methods can work directly from genotypes.

For low-depth sequencing, the genotype itself is uncertain.

The preferred workflow is therefore

```text
reads
  |
  v
genotype likelihoods
  |
  +----------------------+
  |                      |
  v                      v
NGSadmix              PCAngsd
  |                      |
  v                      v
admixture Q          principal components
  \                      /
   \                    /
    v                  v
   individual allele frequencies
```

This unifies several topics from the course:

- probability and Bayes' theorem;
- latent variables and EM-style inference;
- genotype likelihoods;
- population structure;
- low-rank matrix factorization;
- numerical optimization;
- uncertainty in low-depth NGS.

## Key Equations {#key-equations}

The most important equations from the two lectures are summarized below.

### Individual allele frequency in the admixture model

$$
\pi_{ij}
=
\sum_{k=1}^{K}
f_{jk}q_{ik}.
$$

### Matrix form

$$
\Pi
=
QF.
$$

### Genotype probabilities

$$
P(G=0)
=
(1-\pi)^2,
$$

$$
P(G=1)
=
2\pi(1-\pi),
$$

$$
P(G=2)
=
\pi^2.
$$

### NGSadmix likelihood contribution

$$
P(X_{ij}|Q,F)
=
\sum_{g=0}^{2}
P(X_{ij}|G_{ij}=g)
P(G_{ij}=g|Q,F).
$$

### Standardized genotype

$$
\tilde G_{ij}
=
\frac{
G_{ij}-2f_j
}{
\sqrt{2f_j(1-f_j)}
}.
$$

### Covariance matrix

$$
C
=
\frac{1}{M}
\tilde G^T\tilde G.
$$

### SVD

$$
\tilde G
=
U\Sigma V^T.
$$

### Truncated PCA

$$
\tilde G
\approx
U_K\Sigma_KV_K^T.
$$

### Posterior genotype dosage

$$
E[G|X,\pi]
=
\sum_{g=0}^{2}
gP(G=g|X,\pi).
$$

## Take-Home Messages {#take-home-messages}

The main ideas from the population-structure lectures are:

1. Population structure arises from systematic allele-frequency differences among groups.

2. Admixture represents individuals using ancestry proportions across latent populations.

3. ADMIXTURE estimates ancestry proportions $Q$ and ancestral allele frequencies $F$ by maximum likelihood.

4. The number of ancestry components $K$ is a modeling choice and should not automatically be interpreted as the literal number of historical populations.

5. ADMIXTURE results require convergence checks and model assessment.

6. PCA represents genetic structure as a small number of continuous axes of variation.

7. PCA can be computed from either the normalized genotype matrix or its covariance matrix.

8. ADMIXTURE and PCA are closely related because both describe individual allele frequencies using low-rank structure.

9. Missingness can strongly bias PCA, especially when low-depth individuals are pulled toward the population mean.

10. EMU uses PCA itself to iteratively improve missing-data imputation.

11. In low-depth sequencing, genotype likelihoods should be retained rather than replaced by hard genotype calls.

12. NGSadmix and PCAngsd apply the same general principle: integrate over genotype uncertainty.

13. PCA-derived population structure can be used not only for visualization and GWAS correction, but also for detecting loci with unusual geographic or population differentiation.

The broader lesson is that population-genetic inference is not simply a matter of converting reads into genotypes and running downstream software.

The uncertainty in the sequencing data is part of the statistical problem and should, whenever possible, remain part of the model.
