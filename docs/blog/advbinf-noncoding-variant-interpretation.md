---
title: Non-coding Variant Interpretation
createTime: 2026/09/23 08:28:14
permalink: /blogs/ku-advbinf-noncoding-variant-interpretation/
tags:
  - KU
  - Advanced Bioinformatics
excerpt: This is part of the summary of the course Advanced Bioinformatics for NGS at KU. This article introduces the variant-to-function problem for non-coding genetic variation, linkage disequilibrium, GWAS, molecular QTLs and eQTLs, allele-specific expression, confounder correction, multiple testing, and the use of regulatory evidence to connect association signals to molecular mechanisms.
preview: true
---

A genome-wide association study can identify a genomic region associated with a disease or quantitative trait, but this is usually only the beginning of the biological interpretation.

For coding variants, a plausible mechanism may sometimes be suggested directly by an altered protein sequence. For **non-coding variants**, however, the path from association to function is much less direct.

The central problem is therefore the ==**variant-to-function problem**==:

$$
\text{genetic variant}
\rightarrow
\text{regulatory effect}
\rightarrow
\text{gene regulation}
\rightarrow
\text{molecular phenotype}
\rightarrow
\text{cellular phenotype}
\rightarrow
\text{trait or disease}.
$$

This article combines both lectures on **non-coding variant interpretation**. It begins with the genetic basis of association signals, GWAS, and molecular QTLs, then follows the analysis through colocalization, fine-mapping, regulatory annotation, enhancer-to-gene mapping, sequence-to-function prediction, and polygenic interpretation.

## The Variant-to-Function Problem {#variant-to-function-problem}

The main challenge is that a statistically associated variant is not necessarily the functional variant.

A GWAS can tell us that genetic variation in a genomic region is associated with a phenotype, but it does not automatically tell us:

- which variant in the region is causal;
- which regulatory element is affected;
- which gene is regulated;
- in which tissue or cell type the effect occurs;
- which molecular process connects the variant to the phenotype.

A complete interpretation therefore requires several layers of evidence.

The lecture groups these strategies into four broad categories:

1. associate variants with **molecular quantitative traits**, such as gene expression;
2. perform **statistical fine-mapping**;
3. prioritize variants using **functional annotations and predictive models**;
4. validate candidate mechanisms experimentally.

The first lecture develops the molecular-QTL bridge from genotype to regulatory phenotype. The second asks how to refine the candidate variants, connect them to genes and cell types, and combine statistical and functional evidence.

## A Canonical Example: The FTO Obesity Locus {#fto-obesity-locus}

A well-known example of the difficulty of non-coding variant interpretation comes from obesity-associated variants in an intron of **FTO**.

At first sight, the location of the association signal might suggest that the phenotype is mediated through FTO itself. Functional work instead showed that the associated region overlaps an enhancer regulating the distant genes **IRX3** and **IRX5**, more than one megabase away.

The proposed regulatory chain is:

$$
\text{FTO intronic variant}
\rightarrow
\text{enhancer activity}
\rightarrow
IRX3/IRX5
\rightarrow
\text{adipocyte state}.
$$

One variant disrupts binding of the transcription factor **ARID5B**, which normally contributes to repression of IRX3 and IRX5.

The downstream consequence is a shift favouring lipid-storing **white adipocytes** over energy-burning **beige adipocytes**.

::: tip
The important lesson is not the specific FTO locus itself, but the logic of the example: ==**the nearest gene is not necessarily the regulated gene**==.
:::

This immediately motivates the need for regulatory data rather than relying only on genomic distance.

## Genetic Variation and Recombination {#genetic-variation-and-recombination}

The human genome contains hundreds of millions of known polymorphic sites.

These include:

- common and rare SNPs;
- small insertions and deletions;
- repeat polymorphisms;
- copy-number variants.

Such variants can be associated with quantitative traits such as height, body fat, blood pressure, and disease risk.

However, variants are not inherited independently.

During meiosis, homologous chromosomes undergo **recombination**. Chromosomal crossover mixes the chromosome copies inherited from the two parents.

Recombination is not uniform across the genome. Some regions have elevated recombination rates and are called **recombination hotspots**.

As a result, variants often occur in correlated groups.

## Haplotypes and Linkage Disequilibrium {#haplotypes-and-linkage-disequilibrium}

A **haplotype** is a combination of alleles that tend to occur together on the same chromosome.

Recombination gradually breaks down haplotypes over evolutionary time, while recombination hotspots can form boundaries between haplotype blocks.

This leads to **linkage disequilibrium (LD)**.

LD is the non-random association of alleles at two or more loci.

If two loci are in linkage equilibrium, their alleles are inherited independently. If they are in linkage disequilibrium, particular allele combinations are inherited together more often than expected by chance.

A commonly used measure is the squared correlation:

$$
r^2.
$$

Conceptually:

- $r^2=1$: perfect LD;
- $r^2=0$: no correlation;
- $0<r^2<1$: partial LD.

LD depends on several factors:

- genomic distance;
- recombination history;
- allele frequency;
- population history.

Because recombination history differs between populations, LD structure is ==**population dependent**==.

This matters directly for downstream analyses such as fine-mapping: LD reference data should ideally be ancestry matched.

## LD Is Useful and Problematic {#ld-is-useful-and-problematic}

LD has a useful consequence: not every variant has to be measured directly.

If an observed SNP is strongly correlated with another SNP, the missing genotype can often be inferred statistically using **genotype imputation**.

Imputation works by matching sample haplotypes to haplotypes in a reference panel and probabilistically filling in unobserved variants.

However, LD also creates one of the central problems of association studies.

Suppose a causal variant is surrounded by many highly correlated SNPs. Because those SNPs are inherited together, many of them may show similar association statistics.

Therefore,

$$
\boxed{
\text{lead SNP} \neq \text{causal variant}
}
$$

The **lead SNP** is usually the variant with the strongest statistical association in a region. It should not automatically be interpreted as the functional variant.

## Genome-Wide Association Studies {#genome-wide-association-studies}

The goal of a **genome-wide association study (GWAS)** is to identify genetic variants associated with a specific trait.

The phenotype may be:

- a binary trait, such as disease status;
- a quantitative trait, such as height or blood pressure.

For a case-control study, the simplest question is whether genotype frequencies differ between cases and controls.

The null hypothesis is:

$$
H_0:
\text{genotype and phenotype are independent}.
$$

Modern GWAS generally use regression models rather than only simple contingency-table tests.

For a quantitative phenotype, a simplified model can be written as

$$
Y_i
=
\beta_0
+
\beta_G G_i
+
\sum_k \beta_k C_{ik}
+
\epsilon_i,
$$

where

- $Y_i$ is the phenotype of individual $i$;
- $G_i$ is genotype dosage, usually $0$, $1$, or $2$;
- $C_{ik}$ are covariates;
- $\beta_G$ represents the genetic association.

For case-control traits, logistic regression or mixed-model equivalents can be used.

Large biobank analyses frequently use mixed models to deal with **relatedness** and **population structure**.

### Important GWAS Considerations {#important-gwas-considerations}

Several assumptions and confounders must be handled carefully:

- standard regression assumes independent observations;
- related individuals must be removed or explicitly modelled;
- ancestry and population structure must be controlled;
- biological covariates such as age and sex may need adjustment;
- technical and batch effects can create spurious signals;
- statistical power depends strongly on sample size, effect size, and minor allele frequency.

The **minor allele frequency (MAF)** is the frequency of the less common allele in a specified population.

Rare variants are generally harder to detect because fewer individuals carry the relevant allele.

## Why Non-Coding GWAS Hits Are Difficult to Interpret {#why-non-coding-gwas-hits-are-difficult}

Many GWAS signals for common complex disease lie outside protein-coding regions.

They may overlap regulatory elements such as:

- enhancers;
- promoters;
- insulators;
- transcription-factor binding sites;
- regions controlling chromatin accessibility.

Three problems follow.

First, the associated variant may regulate a gene at considerable genomic distance.

Second, LD may prevent the causal variant from being distinguished from neighbouring proxy variants.

Third, a GWAS association alone does not provide a molecular mechanism.

GWAS therefore gives us

$$
\text{variant} \leftrightarrow \text{trait},
$$

but the missing part is

$$
\text{variant}
\rightarrow
\text{molecular effect}
\rightarrow
\text{trait}.
$$

This is where molecular QTL mapping becomes useful.

## Molecular QTLs {#molecular-qtls}

A **quantitative trait locus (QTL)** is a genomic locus associated with variation in a quantitative phenotype.

If the phenotype is molecular rather than organismal, we obtain a **molecular QTL**.

Examples include:

::: table align="center" copy="all" title="Molecular QTLs and their associated phenotypes"
| QTL | Molecular phenotype |
| --- | --- |
| **eQTL** | gene expression |
| **sQTL** | splicing |
| **caQTL** | chromatin accessibility |
| **mQTL** | DNA methylation |
| **pQTL** | protein abundance |
:::

The general idea is

$$
\text{genotype}
\rightarrow
\text{molecular phenotype}.
$$

This can provide an intermediate layer between a disease-associated variant and the final phenotype.

## Expression Quantitative Trait Loci {#expression-quantitative-trait-loci}

An **expression quantitative trait locus (eQTL)** is a genetic variant associated with variation in gene expression between individuals.

In an eQTL study:

- genotype is the explanatory variable;
- gene expression is the quantitative molecular phenotype.

An eQTL can change the amount of RNA produced from a gene.

Therefore, eQTL mapping asks whether expression changes systematically with genotype.

A simple additive model is

$$
Y_i
=
\beta_0
+
\beta_GG_i
+
\epsilon_i,
$$

where

- $Y_i$ is gene expression;
- $G_i\in\{0,1,2\}$ is the number of copies of one allele;
- $\beta_G$ is the change in expression per additional allele copy.

The association test asks whether

$$
H_0:\beta_G=0.
$$

If $\beta_G$ is significantly different from zero, genotype is associated with expression.

Conceptually, GWAS and eQTL mapping are statistically similar:

$$
\text{GWAS: genotype}
\rightarrow
\text{organism-level phenotype}
$$

versus

$$
\text{eQTL: genotype}
\rightarrow
\text{gene expression}.
$$

This similarity makes eQTLs especially useful for interpreting disease-associated loci.

## Local and Distal eQTL Effects {#local-and-distal-eqtl-effects}

eQTLs can act locally or distally.

A **cis-eQTL** is a local regulatory effect acting on the same DNA molecule.

A **trans-eQTL** acts through a diffusible regulator.

For example, a trans effect might be mediated by:

- a transcription factor;
- an RNA molecule;
- a signalling protein.

In practical analyses, local eQTLs are often defined using genomic distance, for example within approximately $1$ Mb of a gene.

However,

::: warning
A **local eQTL** is not automatically a biologically demonstrated **cis-eQTL**. Genomic proximity is an operational definition, whereas cis regulation refers to action on the same DNA molecule.
:::

One way to obtain more direct evidence for cis regulation is **allele-specific expression**.

## Allele-Specific Expression {#allele-specific-expression}

In a heterozygous individual, both alleles of a gene are present in the same cellular environment.

If both alleles are regulated equally, their transcription should be approximately balanced.

Suppose an individual is heterozygous:

$$
A/B.
$$

Under equal expression,

$$
A:B \approx 1:1.
$$

If a cis-regulatory variant changes the activity of only one chromosome, the two alleles may be expressed at different levels.

RNA-seq can detect this by counting reads containing each allele at heterozygous exonic positions.

The central idea is powerful because both alleles are measured in the same individual and therefore share many trans-acting and environmental influences.

However, allele-specific expression introduces an important technical problem.

## Mapping Bias in Allele-Specific Analysis {#mapping-bias-in-allele-specific-analysis}

Reads carrying the reference allele may align to the reference genome more easily than reads carrying the alternative allele.

This can generate an artificial allelic imbalance even when the two chromosomes are expressed equally.

In other words,

$$
\text{mapping bias}
\rightarrow
\text{apparent allele-specific expression}.
$$

This is a computational artefact, not necessarily a biological effect.

## WASP and Allele-Specific Mapping {#wasp-and-allele-specific-mapping}

**WASP** was introduced to reduce allele-specific mapping bias.

For every read overlapping a SNP:

1. identify the allele present in the read;
2. change it to the alternative allele;
3. remap the modified read;
4. compare the new mapping location with the original location;
5. discard the read if the mapping position changes.

The logic is that a read should only be retained if its genomic placement is independent of which allele it contains.

Thus,

```text
original allele -> same mapping position
swapped allele  -> same mapping position
```

is acceptable, whereas

```text
original allele -> locus A
swapped allele  -> locus B
```

indicates allele-sensitive mapping and the read is discarded.

## Local eQTL Mapping {#local-eqtl-mapping}

Local eQTL analysis can be formulated as a large collection of linear regression problems.

For each gene, variants in a local window are tested individually.

A common operational window is approximately

$$
\pm 1\text{ Mb}.
$$

If genotype is encoded as

$$
G\in\{0,1,2\},
$$

an additive model assumes that each additional copy of the effect allele changes expression by a fixed amount.

For example,

$$
E[Y|G]
=
\beta_0+\beta_GG.
$$

If AA is the baseline genotype, then AB and BB are expected to differ from AA by approximately one and two copies of the allele effect, respectively.

The estimated coefficient $\beta_G$ therefore describes both the direction and magnitude of the expression association.

## Confounders in Molecular QTL Studies {#confounders-in-molecular-qtl-studies}

Gene expression is affected by far more than genotype.

Known biological confounders may include:

- sex;
- age;
- ancestry.

There are also technical and experimental confounders.

Examples include:

- sample collection;
- library preparation;
- sequencing;
- operator or laboratory;
- processing pipeline;
- sequencing date.

A variable such as sequencing date may itself be only a **surrogate** for a more complicated batch effect.

The lecture illustrates how large technical effects can be: in one example, a substantial fraction of measured genetic variance in 1000 Genomes data could be explained by sequencing date through its influence on coverage.

Therefore, an apparent genetic association may partly reflect technical structure rather than biology.

## Population Stratification {#population-stratification}

Population stratification occurs when allele frequencies differ systematically between groups because of ancestry.

Suppose cases and controls have different ancestry proportions.

Then a SNP may have different allele frequencies between cases and controls even if it has no biological effect on disease.

This produces a spurious association:

$$
\text{ancestry}
\rightarrow
\begin{cases}
\text{allele frequency}\\
\text{phenotype distribution}
\end{cases}
$$

which can appear as

$$
\text{genotype}\leftrightarrow\text{phenotype}.
$$

A standard approach is to use **principal component analysis (PCA)** on genotype data.

Leading genotype PCs capture major axes of ancestry variation and can be included as covariates.

For example,

$$
Y
=
\beta_0
+
\beta_G G
+
\beta_1PC_1
+
\beta_2PC_2
+\cdots
+
\epsilon.
$$

The goal is to estimate the genotype effect after controlling for major ancestry-related variation.

## PCA for Confounder Adjustment in eQTL Studies {#pca-for-confounder-adjustment-in-eqtl-studies}

PCA can also be applied to expression data.

The lecture distinguishes two common uses:

- **genotype PCs**: adjust primarily for population structure;
- **expression PCs**: capture major sources of expression variation, including technical confounders.

A practical strategy is to choose a number of expression PCs that increases the number of reproducible discoveries.

However, confounder correction must be used carefully: a hidden factor can contain both unwanted technical variation and genuine biology.

Removing too much variation can remove real signal.

## Modelling Confounders {#modelling-confounders}

There are two broad approaches.

One is to construct a transformed expression dataset from which covariate effects have been removed, then perform a simpler association analysis.

Another is to fit genotype and covariates jointly.

For example,

$$
Y_i
=
\beta_0
+
\beta_G G_i
+
\sum_{k=1}^{K}\gamma_kC_{ik}
+
\epsilon_i.
$$

Here, the coefficient $\beta_G$ estimates the genotype effect conditional on the included confounders.

## PEER and Hidden Factors {#peer-and-hidden-factors}

Some confounders are not measured directly.

**PEER** — Probabilistic Estimation of Expression Residuals — addresses this by treating expression variation as a combination of:

- known covariates;
- hidden factors;
- residual noise.

Conceptually,

$$
Y
=
\text{known factors}
+
\text{hidden factors}
+
\text{residual}.
$$

PEER infers latent factors and their weights using Bayesian inference.

These inferred factors can then be used to reduce unwanted expression variation before or during eQTL mapping.

In GTEx analyses, modelling PEER factors increases the number of genes for which significant eQTLs can be detected.

::: caution
Hidden-factor correction is not automatically harmless. If a hidden factor captures genuine biological variation linked to the process of interest, adjusting it away may reduce true signal.
:::

## The Multiple-Testing Problem {#multiple-testing-problem}

A realistic cis-eQTL study may test roughly $20{,}000$ genes against all nearby variants.

This produces millions of association tests.

If each test were evaluated at

$$
p<0.05,
$$

a very large number of false-positive associations would be expected by chance.

Multiple-testing correction is therefore essential.

## Bonferroni Correction {#bonferroni-correction}

A global Bonferroni correction uses

$$
\alpha_{\text{corrected}}
=
\frac{\alpha}{N},
$$

where $N$ is the number of tests.

This strongly controls false positives, but can be overly conservative.

This is particularly problematic in QTL mapping because nearby SNPs are correlated through LD.

The tests are therefore not truly independent.

Different loci may also contain different numbers of variants and different allele-frequency structures.

## False Discovery Rate {#false-discovery-rate}

Instead of controlling the probability of making any false-positive call, **false discovery rate (FDR)** methods control the expected proportion of false discoveries among rejected hypotheses.

Conceptually,

$$
\mathrm{FDR}
=
E\left[
\frac{\text{false discoveries}}
{\text{all discoveries}}
\right].
$$

The **Benjamini-Hochberg** procedure controls FDR under independence and certain positive-dependence structures.

LD creates correlated tests, so the dependence structure must still be considered when interpreting the results.

## Permutation-Based Correction {#permutation-based-correction}

A locus-restricted permutation approach can empirically model the null distribution.

The basic procedure is:

1. keep genotype data fixed;
2. permute expression values or sample labels;
3. rerun the local association tests;
4. record the smallest p-value from each permutation;
5. compare the observed association against this empirical null distribution.

This preserves the local genotype correlation structure while breaking the true genotype-expression relationship.

The resulting empirical p-value answers:

> How often would an association at least this strong arise under the null hypothesis of no genotype-expression relationship?

Permutation tests can be computationally expensive.

Therefore, practical analyses may use:

- adaptive permutation schemes;
- beta-distribution approximations.

## GTEx v8 cis-eQTL Mapping {#gtex-v8-cis-eqtl-mapping}

The lecture uses **GTEx v8** as an example of a real cis-eQTL analysis pipeline.

Covariates included:

- the top five genotype principal components;
- PEER-derived covariates;
- sequencing platform;
- sequencing protocol;
- sex.

For each variant-gene pair within $1$ Mb, a linear regression model was fitted.

The null hypothesis tested whether the regression slope between genotype and expression was zero.

Nominal p-values were converted to beta-distribution-adjusted empirical p-values.

These were then used to calculate q-values, and an

$$
\mathrm{FDR}\le 0.05
$$

threshold was used to identify genes with significant eQTLs.

The overall workflow can be summarized as

$$
\boxed{
\text{genotype}
\rightarrow
\text{confounder adjustment}
\rightarrow
\text{variant-gene regression}
\rightarrow
\text{locus-level correction}
\rightarrow
\text{FDR}
\rightarrow
\text{significant eQTL}
}
$$

## A Second Example: SORT1 and LDL Cholesterol {#sort1-and-ldl-cholesterol}

The **1p13 locus** provides another example of moving from association to function.

A GWAS signal at 1p13 is associated with **LDL cholesterol** and **myocardial infarction**.

eQTL mapping showed that the variant is strongly associated with **SORT1 expression in liver**.

Functional interpretation then links the locus to hepatic lipoprotein metabolism.

The proposed chain is:

$$
\text{1p13 variant}
\rightarrow
\text{SORT1 expression in liver}
\rightarrow
\text{hepatic lipoprotein metabolism}
\rightarrow
\text{LDL phenotype}.
$$

This illustrates the value of molecular QTL data: the eQTL provides an intermediate molecular phenotype connecting a non-coding association signal to a specific gene and tissue.

## Colocalization of GWAS and eQTL Signals {#colocalization}

Finding an eQTL in the same region as a GWAS association is a useful starting point, but it does not demonstrate that the two traits share a causal variant.

The problem is again LD. One variant may affect the disease trait and a different nearby variant may affect expression. If the two variants are correlated, their association patterns can overlap even when the underlying causal variants differ. The relevant question is:

> Are the GWAS and eQTL association patterns across the locus compatible with the same underlying causal variant?

The **coloc** framework expresses this as five hypotheses:

::: table align="center" copy="all" title="Colocalization hypotheses and interpretations"

| Hypothesis | Interpretation |
| :---: | --- |
| $H_0$ | Neither trait has an association in the region |
| $H_1$ | Only trait 1 is associated |
| $H_2$ | Only trait 2 is associated |
| $H_3$ | Both traits are associated, but with different causal variants |
| $H_4$ | Both traits are associated and share one causal variant |

:::

For a region containing $Q$ variants, the method considers possible causal configurations and combines them within each hypothesis. Bayesian model comparison gives posterior probabilities such as

$$
PP_4
=
P(H_4|\text{data}).
$$

A high $PP_4$ supports a shared variant under the model. All five probabilities still matter: a large $PP_3$ supports two distinct signals, while probability on $H_1$ or $H_2$ may show weak evidence for association in one dataset.

::: warning Colocalization is not a comparison of lead SNPs
The same lead SNP can appear in both studies because of LD, and different lead SNPs can still tag one shared signal. Colocalization evaluates the ==**locus-wide association patterns**==.
:::

The basic formulation assumes at most one causal variant for each trait in the region. Multiple signals may require conditioning or methods that support them directly. Results also depend on priors, comparable variant coverage, and adequate power. Even strong colocalization supports shared genetic control rather than proving that the molecular phenotype mediates the organism-level trait.

## Why GWAS Hits and eQTLs Do Not Completely Overlap {#gwas-eqtl-differences}

Less than half of trait-associated loci can typically be explained by a colocalizing eQTL in available datasets. Several factors contribute:

- many eQTL studies have limited power for rare variants;
- the relevant tissue, cell type, developmental stage, or stimulation state may be missing;
- splicing, chromatin, methylation, or protein abundance may be more relevant than steady-state RNA;
- detected eQTLs and GWAS variants occupy different regions of the effect-size space.

The lecture introduces a simple model:

$$
\text{variant}
\xrightarrow{\beta}
\text{expression}
\xrightarrow{\gamma}
\text{phenotype}.
$$

An eQTL study mainly obtains power from expression variance related to $\beta^2$. The phenotypic association depends on the combined path and is related to $\beta^2\gamma^2$ in this simplified model. A small expression effect can therefore accompany a detectable phenotypic effect when the affected gene has a strong influence on the trait.

Detected eQTLs are relatively enriched in promoters, whereas GWAS variants are strongly enriched in enhancers. Genes with detectable eQTLs also tend to tolerate loss-of-function variation better than some constrained disease-relevant genes.

::: tip
==**The absence of a detected eQTL does not show that a GWAS variant is non-regulatory.**== It may reflect limited power, an unmeasured context, another molecular phenotype, or a small regulatory effect on a phenotypically important gene.
:::

## Statistical Fine-Mapping {#statistical-fine-mapping}

GWAS identifies an associated locus, while **statistical fine-mapping** asks which variants within it remain plausible causes after accounting for LD.

Its main questions are:

- which variants may be causal;
- whether one or several causal signals occur;
- how much posterior probability belongs to each variant;
- what smallest set contains a causal effect with a chosen credibility.

Fine-mapping can be written as a sparse variable-selection problem:

$$
\mathbf{y}
=
\mathbf{X}\mathbf{b}
+
\boldsymbol{\epsilon},
$$

where $\mathbf{X}$ is the genotype matrix and non-zero elements of $\mathbf{b}$ represent effects. LD makes columns of $\mathbf{X}$ highly correlated, while $\mathbf{b}$ is assumed to be sparse. Association strength alone cannot distinguish a causal variant from correlated neighbours. Fine-mapping therefore combines ==**association statistics and LD**==.

### Posterior Inclusion Probabilities {#posterior-inclusion-probabilities}

For variant $j$, the **posterior inclusion probability (PIP)** is

$$
\mathrm{PIP}_j
=
P(b_j\neq0|\text{data}).
$$

A larger PIP means that the fitted model gives more posterior support to variant $j$ having an effect. The value depends on the data, LD estimate, priors, and model assumptions.

### Credible Sets {#credible-sets}

A credible set is constructed to have at least a chosen posterior probability of containing a causal effect. For a 95% credible set $C$,

$$
P\left(
\text{at least one causal variant is in } C
\mid
\text{data}
\right)
\geq 0.95.
$$

The set may contain one well-resolved variant or many variants that LD makes difficult to distinguish.

::: warning A credible set is not a list of confirmed causal variants
A 95% credible set does not give every member a 95% probability of causality. Its coverage is conditional on the fitted model, and the true variant can be missing because of incomplete coverage, incorrect LD, model misspecification, or sampling variation.
:::

## Multiple Causal Signals and SuSiE {#susie}

A locus may contain several causal variants. Conditional analysis can search for a second signal after accounting for a lead variant. Joint methods model several variants at once. The lecture compares **CAVIAR**, **FINEMAP**, and **SuSiE**.

**SuSiE**, or *Sum of Single Effects*, decomposes the total effect into $L$ components:

$$
\mathbf{b}
=
\sum_{\ell=1}^{L}
\mathbf{b}_{\ell}.
$$

Each component acts as one slot for a causal signal and distributes probability across variants that might explain it. SuSiE is fitted with **Iterative Bayesian Stepwise Selection (IBSS)**:

::: steps

1. Initialize effect components and residuals.
2. Remove the current contribution of component $\ell$.
3. Calculate the residual left after the other components.
4. Fit a single-effect regression to the residual.
5. Update the variant probabilities and effect distribution for component $\ell$.
6. Cycle through all components until the variational objective stabilizes.

:::

The output includes overall PIPs, one credible set for each supported signal, and posterior summaries of effect sizes. If several SNPs are in very high LD, the model can distribute probability among them instead of making a hard choice.

::: note
IBSS approximates the posterior. The number of components, LD accuracy, priors, missing variants, and sample size all affect the result. Several credible sets represent several ==**putative signals**==, rather than experimental confirmation.
:::

## From Fine-Mapped Variants to Function {#from-fine-mapping-to-function}

Fine-mapping defines a statistical candidate set. Functional interpretation then asks:

1. where the variant acts;
2. which regulatory element is affected;
3. which gene the element controls;
4. which cell type or state is relevant;
5. what molecular change the allele produces.

These questions require different data types. A strong interpretation combines them rather than assigning causality from one annotation.

## Mapping Regulatory Elements and Cell Types {#mapping-regulatory-elements}

**ENCODE**, **Roadmap Epigenomics**, and related projects annotate chromatin accessibility, transcription-factor binding, and histone modifications. H3K27ac is commonly used as a marker of active regulatory regions.

If fine-mapped variants from many disease loci are enriched in enhancers active in one tissue, that tissue becomes a plausible context for the trait. The analysis compares overlap with an appropriate background of common variants.

::: caution
Regulatory enrichment identifies shared architecture and relevant biological contexts across loci. It does not determine which SNP is causal at one locus.
:::

## Linking Enhancers to Target Genes {#enhancer-to-gene-mapping}

An enhancer may regulate a distant gene, skip a nearby gene, or act only in a specific cellular state. The **Activity-by-Contact (ABC)** model scores enhancer–gene links using

$$
\text{ABC score}
\propto
\text{enhancer activity}
\times
\text{enhancer--promoter contact}.
$$

Activity can be estimated with H3K27ac and ATAC-seq, while contact can be estimated with Hi-C. An element that is both active and in contact with a promoter is a stronger candidate regulator.

ABC-Max has connected inflammatory-bowel-disease variants to genes in specific cellular contexts, including evidence implicating PDGF signalling. The lecture also introduces **scE2G**, which uses single-cell regulatory information to predict enhancer–gene links.

The reason for these models is that

$$
\text{enhancer}
\rightarrow
\text{target gene}
$$

depends on cell type and cellular state. Physical contact or a high score is supporting evidence, rather than direct proof that one nucleotide changes expression.

## Variant Annotation and Sequence-to-Function Models {#sequence-to-function-models}

The **Ensembl Variant Effect Predictor (VEP)** collects annotations describing potential consequences of a variant. Sequence-to-function models predict molecular signals directly from DNA. The lecture discusses **BPNet**, **ENCODE GRAMMAR**, and **AlphaGenome**.

In **in silico mutagenesis**, the sequence window and context are held fixed, only the allele is changed, and the predicted difference is

$$
\Delta_{\text{predicted}}
=
f(S_{\mathrm{ALT}})
-
f(S_{\mathrm{REF}}).
$$

Both direction and magnitude should be inspected across relevant output tracks. This resembles a virtual allele-replacement experiment, but remains a model prediction.

AlphaGenome takes a long DNA sequence as input and predicts many functional genomic tracks at high resolution. **AlphaGenome Variant Impact (AVI)** scores combine model outputs with features such as conservation and AlphaMissense-related information. Feature-attribution methods such as SHAP can indicate which predictions contributed to an impact score.

::: warning Prediction is not validation
VEP annotations, enhancer overlaps, sequence-model outputs, AVI scores, and feature attributions can prioritize variants and suggest mechanisms. They do not show that the effect occurs in the relevant tissue or causes the trait.
:::

## Polygenicity and Missing Heritability {#polygenicity}

Most complex traits are **polygenic**. Even important loci usually have small effects, and genome-wide significant variants explain only a modest fraction of the predicted genetic variance. Many additional common variants can contribute effects too weak to cross the significance threshold.

$$
\text{complex trait}
=
\text{many weak genetic effects}
+
\text{a smaller number of detectable loci}.
$$

**Missing heritability** describes the gap between heritability estimated from family or genome-wide data and the variance explained by individually significant associations. Polygenicity, rare and structural variants, imperfect tagging, and estimation differences can contribute.

## Stratified LD Score Regression {#stratified-ld-score-regression}

A SNP in LD with many variants tags more possible genetic effects and is expected to have a larger GWAS $\chi^2$ statistic on average. A simplified LD score is

$$
\ell_j
=
\sum_k r_{jk}^2.
$$

**Stratified LD score regression (S-LDSC)** partitions this quantity by annotations such as enhancers, promoters, coding regions, and cell-specific regulatory elements. If SNPs with high LD to one category show systematically larger association statistics, that category may be enriched for trait heritability.

::: note
S-LDSC asks which annotations carry disproportionate heritability across the genome. It does not fine-map an individual locus.
:::

## Integrating the Evidence {#integrating-the-evidence}

The complete analysis can be organized as an evidence-integration workflow:

::: steps

1. Use **GWAS** to identify trait-associated loci.
2. Use **LD** to understand why correlated variants share an association signal.
3. Use **fine-mapping** to estimate PIPs and credible sets for one or more signals.
4. Use **molecular QTLs and colocalization** to test candidate molecular links.
5. Use **regulatory maps and enrichment** to identify plausible elements and cell types.
6. Use **enhancer-to-gene models** to nominate target genes.
7. Use **VEP and sequence-to-function models** to predict allele-specific molecular effects.
8. Design experiments that distinguish the competing variants, genes, and mechanisms.

:::

These layers answer different questions:

::: table align="center" copy="all" title="Evidence and its contribution to interpretation"

| Evidence | Main contribution | Does not establish alone |
| --- | --- | --- |
| GWAS and LD | Associated locus and correlated variants | Functional variant or target gene |
| Molecular QTLs | Candidate molecular phenotype | Shared causality with the trait |
| Colocalization | Compatibility with a shared genetic signal | Mediation or molecular mechanism |
| Fine-mapping | PIPs and credible sets | Experimental causality |
| Regulatory maps | Candidate element and cell type | The causal SNP at one locus |
| Enhancer-to-gene models | Candidate target gene | Direct regulatory validation |
| Sequence models | Predicted REF-to-ALT effect | An observed effect in vivo |

:::

The final experiment should be chosen to separate the main alternatives. For example, candidate variants can be edited in the relevant cellular context, candidate enhancers can be perturbed, and the predicted target gene and molecular phenotype can be measured.

::: caution
==**Evidence convergence is stronger than any single annotation.**== GWAS significance, a high PIP, enhancer overlap, colocalization, or a sequence-model score can each prioritize a hypothesis. None is a complete demonstration of causality by itself.
:::

## Key Takeaways {#key-takeaways}

- **GWAS identifies association rather than a complete mechanism.**
- **LD makes the lead SNP an unreliable synonym for the causal variant.**
- LD is population dependent, so ancestry-matched LD information matters for fine-mapping.
- Molecular QTLs connect genotype to expression, splicing, accessibility, methylation, or protein abundance.
- Local proximity does not prove a cis mechanism, and allele-specific analyses require control of mapping bias.
- Population structure, batch effects, hidden factors, and multiple testing must be addressed in QTL studies.
- Colocalization compares locus-wide association patterns and distinguishes a shared signal from two signals correlated through LD.
- Fine-mapping produces probabilistic evidence: PIPs and credible sets.
- SuSiE represents multiple putative signals as a sum of single-effect components fitted by IBSS.
- Regulatory atlases and enrichment analyses nominate elements, tissues, and cell types.
- ABC and single-cell E2G methods connect enhancers to candidate target genes.
- VEP and sequence-to-function models predict molecular consequences that can guide experiments.
- Complex traits are usually polygenic, and S-LDSC tests whether functional categories are enriched for heritability.
- Experimental validation remains necessary to establish the molecular chain from variant to phenotype.

The progression across the two lectures is:

$$
\boxed{
\text{GWAS locus}
\rightarrow
\text{LD-aware fine-mapping}
\rightarrow
\text{molecular association}
\rightarrow
\text{regulatory element}
\rightarrow
\text{target gene and cell type}
\rightarrow
\text{molecular mechanism}
\rightarrow
\text{experimental validation}
}
$$
