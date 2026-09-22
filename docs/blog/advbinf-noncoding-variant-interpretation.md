---
title: Non-coding Variant Interpretation
createTime: 2026/09/23 08:28:14
permalink: /blogs/ku-advbinf-noncoding-variant-interpretation/
tags:
  - KU
  - Advanced Bioinformatics
excerpt: This is part of the summary of the course Advanced Bioinformatics for NGS at KU. This article introduces the variant-to-function problem for non-coding genetic variation, linkage disequilibrium, GWAS, molecular QTLs and eQTLs, allele-specific expression, confounder correction, multiple testing, and the use of regulatory evidence to connect association signals to molecular mechanisms.
watermark:
  fullPage: true
  content: PREVIEW
  contentType: text
  layout: grid
  gridLayoutOptions:
    cols: 2
    rows: 2
    gap: [24, 24]
  width: 180
  height: 120
  rotate: 30
  fontSize: 28px
  fontWeight: bold
  globalAlpha: 0.25
  backgroundRepeat: repeat
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

This article summarizes the first lecture on **non-coding variant interpretation**, focusing on the genetic basis of association signals, genome-wide association studies (GWAS), molecular quantitative trait loci (QTLs), and the statistical issues that arise when trying to connect variants to regulatory mechanisms.

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

The first lecture focuses mainly on the first strategy: using molecular QTLs to bridge genetic association and regulatory function.

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

| QTL | Molecular phenotype |
| --- | --- |
| **eQTL** | gene expression |
| **sQTL** | splicing |
| **caQTL** | chromatin accessibility |
| **mQTL** | DNA methylation |
| **pQTL** | protein abundance |

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

## Putting the Workflow Together {#putting-the-workflow-together}

The logic of non-coding variant interpretation can be summarized as:

```text
GWAS
  |
  v
associated locus
  |
  v
LD block
  |
  v
many correlated candidate variants
  |
  v
molecular QTL evidence
  |
  v
candidate regulatory effect / target gene
  |
  v
fine-mapping + functional annotation
  |
  v
candidate causal variant
  |
  v
experimental validation
  |
  v
molecular mechanism
```

The first major conceptual transition is therefore

$$
\text{statistical association}
\rightarrow
\text{molecular association}.
$$

But even a molecular association is not automatically causal.

An eQTL can nominate a candidate mechanism, but causal interpretation still requires additional evidence such as fine-mapping, regulatory annotation, predictive modelling, and experimental validation.

## Key Takeaways {#key-takeaways}

The most important concepts from this lecture are:

- **GWAS identifies association, not necessarily causality.**
- **LD means the lead SNP is often only a proxy for the causal variant.**
- **LD structure is population dependent**, which matters for interpretation and fine-mapping.
- Many disease-associated variants are non-coding and likely act through **gene regulation**.
- **eQTL mapping** connects genotype to variation in gene expression.
- Local proximity does not by itself prove a true **cis** mechanism.
- **Allele-specific expression** can provide stronger evidence for cis regulation, but mapping bias must be controlled.
- **WASP** removes reads whose mapping position depends on which allele they contain.
- Molecular phenotypes extend beyond expression to splicing, chromatin accessibility, methylation, and protein abundance.
- eQTL studies require careful treatment of **population structure, batch effects, known covariates, and hidden confounders**.
- Large-scale QTL mapping creates a major **multiple-testing problem**.
- Permutation-based methods and FDR procedures are important for obtaining interpretable significance thresholds.
- Molecular QTL evidence is an important bridge from **GWAS locus** to **regulatory mechanism**, but it is only one part of a complete variant-to-function analysis.

The conceptual progression to keep in mind is:

$$
\boxed{
\text{LD}
\rightarrow
\text{GWAS}
\rightarrow
\text{lead SNP}\neq\text{causal SNP}
\rightarrow
\text{molecular QTL}
\rightarrow
\text{regulatory effect}
\rightarrow
\text{functional interpretation}
}
$$

The next step is to move beyond molecular association and ask which variant within an associated locus is actually causal. That requires **statistical fine-mapping** and the integration of functional genomic evidence.

## References {#references}

The lecture material cites, among others:

- Claussnitzer M. et al. *New England Journal of Medicine* — functional interpretation of the FTO obesity-associated locus.
- Albert F.W. & Kruglyak L. *Nature Reviews Genetics* — genetics of gene expression.
- Degner J.F. et al. *Bioinformatics* — mapping bias in allele-specific expression.
- van de Geijn B. et al. *Nature Methods* — WASP for allele-specific mapping.
- Price A.L. et al. *Nature Genetics* — PCA-based correction for population stratification.
- Stegle O. et al. *PLoS Computational Biology* and *Nature Protocols* — PEER.
- GTEx Consortium — large-scale human tissue eQTL analyses.
- Musunuru K. et al. *Nature* — functional interpretation of the 1p13 SORT1 locus.
