---
title: Reconstructing Archaic Human Genomes With Hidden Markov Models
createTime: 2026/10/07 20:43:35
permalink: /blog/ku-advbinf-archaic-human-genomes-hmm/
excerpt: This is part of the summary of the course Advanced Bioinformatics for NGS at KU. This note covers methods for detecting archaic introgression without an archaic reference genome, modelling variant counts and ancestry transitions with an HMM, and reconstructing ancient genetic variation across modern populations.
tags:
  - KU
  - Advanced Bioinformatics
---

Modern human genomes retain fragments inherited from archaic human populations. Each individual carries only part of this history, but different individuals preserve different fragments. Combining these fragments across a population can recover a substantial portion of the genetic material of people who disappeared long ago.

Laurits Skov's lecture, *Reviving extinct archaic humans*, connects this reconstruction problem to hidden Markov models (HMMs). Its central methodological question is particularly useful: **can we identify archaic ancestry without using a Neanderthal or Denisovan reference genome?**

The lecture follows the earlier material on [HMMs, PSMC and local ancestry](/blog/ku-advbinf-hmm-psmc-local-ancestry/). Here, the hidden state is ancestry, the observations are counts of variants absent from an outgroup, and the transitions describe the continuity of ancestry along a chromosome.

::: note Source and scope

These notes summarize the lecture delivered on 5 October 2026. Numerical results and study examples are reported as presented in the slides. The term “reviving” refers to recovering genetic information from surviving DNA fragments.

:::

## Archaic ancestry in modern humans {#archaic-ancestry}

The opening slides emphasize that multiple human groups coexisted around 100,000 years ago. They include early modern humans, Neanderthals, Denisovans and several groups known primarily from fossil evidence. Ancient DNA provides much more detailed genetic information for some groups than for others, leaving large gaps in our view of human diversity.

Modern humans and archaic populations exchanged genes after their lineages had diverged. The persistence of genetic material transferred through this mixing is called **introgression**. An **archaic ancestry tract** is a chromosome segment inferred to descend from an archaic population.

The lecture uses approximately 2% Neanderthal ancestry as an illustration for many modern people outside Africa. Denisovan ancestry varies considerably among populations, with larger contributions in some Asian and Oceanian groups. These are population-dependent estimates rather than universal proportions for every individual.

A branching population tree captures divergence, but admixture adds connections between branches. Consequently, similarity to an archaic genome can reflect a history that includes several episodes of gene flow.

## Biological effects of introgression {#biological-effects}

Archaic DNA contributes to modern genetic variation. Some surviving haplotypes have been associated with adaptation, immune function or disease susceptibility.

::: table align="center" title="Examples discussed in the lecture"

| Example | Information presented in the slides | Interpretation |
| :--- | :--- | :--- |
| High-altitude adaptation | A Denisovan-related haplotype associated with high-altitude adaptation has a frequency of about 86% in Tibetan people; Huerta-Sánchez et al. (2014) | Introgression can supply variants useful in a particular environment |
| COVID-19 hospitalization risk | A Neanderthal-derived risk haplotype is reported at about 8% in Europe and 30% in South Asia; Zeberg and Pääbo (2020) | An introgressed haplotype can also be associated with increased disease risk |
| Immune-related variation | Several immune-related archaic haplotypes occur at high frequency; Dannemann and Kelso (2017), Sams et al. (2016) | Archaic ancestry can contribute to immune variation and adaptation |

:::

These percentages describe particular haplotypes. They do not measure the total proportion of archaic ancestry in a person's genome. A disease-risk association also does not mean that every carrier develops the condition.

High frequency motivates further investigation, but frequency alone does not establish that a haplotype was favoured by natural selection. Its interpretation depends on demographic history and the evidence for a functional effect.

## Reference-based detection and the borrowed-word analogy {#reference-based-detection}

The lecture compares identifying introgressed DNA with identifying borrowed words in languages. Danish uses *weekend*, which can be recognized by comparison with English. Likewise, a modern human chromosome segment resembling a Neanderthal sequence may provide evidence of Neanderthal ancestry.

The analogy also explains a limitation. Using English as the only donor language would miss borrowings from French or German. Similarly, searching only for similarity to an available archaic genome can miss ancestry from another archaic source, or from a population poorly represented by the sampled reference.

An ancient genome belongs to a particular individual. That individual may be related to the population that contributed DNA to modern humans without being an exact representative of it.

This motivates separating two questions:

1. **Detection:** which chromosome regions have evidence of archaic ancestry?
2. **Attribution:** which known archaic genomes or populations are those regions most similar to?

The method introduced in the lecture addresses detection without requiring a Neanderthal or Denisovan genome. Comparisons with such genomes can follow afterwards.

## An outgroup-based observation sequence {#outgroup-observations}

The HMM approach presented from Skov et al. (2018) uses a target population and a suitable outgroup. Variants observed in the outgroup are removed, and the remaining variants are counted in windows along the target genome.

The intuition is genealogical. A lineage that diverged deeply from the modern human background has had more time to accumulate differences. An introgressed archaic tract may therefore contain more variants absent from the outgroup than an ordinary modern human tract.

::: steps

1. **Identify variants in the target genome.**

   These provide the raw observations for the analysis.

2. **Remove variants found in the outgroup.**

   The remaining set emphasizes variation not observed in that comparison population.

3. **Count remaining variants in consecutive windows.**

   Each window contributes an observed count, producing a sequence such as $1,0,0,2,2,1,0$ in the lecture illustration.

4. **Infer ancestry with the HMM.**

   The model combines the count in each window with evidence that ancestry tends to persist across neighbouring windows.

:::

“Absent from the outgroup” means absent from the sampled data. It does not guarantee absence from every member of that population. The outgroup's sampling and history therefore matter to the interpretation.

## The two-state HMM {#two-state-hmm}

Let $Z_i$ denote the hidden ancestry state of window $i$, and let $K_i$ be its observed variant count. The model has two states:

$$
Z_i\in\{I,A\},
$$

where $I$ is **Ingroup**, the modern human background, and $A$ is **Archaic**.

::: table align="center" title="Population-genetic meaning of the HMM components"

| Component | Meaning in this application |
| :--- | :--- |
| Hidden state $Z_i$ | Modern human background or archaic ancestry in a window |
| Observation $K_i$ | Number of retained variants in that window |
| Emission distribution | Probability of the count conditional on ancestry |
| Transition matrix | Probability of maintaining or changing ancestry between windows |
| Parameter learning | Estimation of model parameters using Baum–Welch |
| Decoding | Assignment of window states using posterior probabilities |

:::

A high count provides evidence for the archaic state, but it does not determine that state by itself. Counts fluctuate, and adjacent windows provide additional information. This is the reason to model a sequence rather than classify every window independently.

### Poisson emissions {#poisson-emissions}

The variant count is modelled with a Poisson distribution:

$$
P(K_i=k\mid Z_i=s)
=\frac{e^{-\lambda_s}\lambda_s^k}{k!}.
$$

The parameter $\lambda_s$ is the expected number of retained variants under state $s$. In the lecture's haploid formulation,

$$
\lambda_I=\mu L T_I,
\qquad
\lambda_A=\mu L T_A.
$$

Here, $\mu$ is the mutation rate, $L$ is the window length, and $T_I$ and $T_A$ are the time parameters for the respective lineages in the lecture model. These expressions use the lecture's parameterization of the relevant divergence history.

A deeper archaic lineage generally gives $\lambda_A>\lambda_I$. Thus, a window with several retained variants can be more likely under the archaic emission distribution, while a low count can favour the ingroup state. The distributions overlap, so uncertainty remains.

For diploid data, the lecture gives

$$
\lambda_I=2\mu L T_I
$$

and

$$
\lambda_A=\mu L T_A+\mu L T_I.
$$

The first expression accounts for two ingroup chromosome copies. The second represents one archaic copy and one ingroup copy.

::: warning Diploid model assumption

The slides assume that archaic tracts are always heterozygous in this diploid formulation. The two-state model therefore does not explicitly distinguish zero, one and two archaic copies. This is a modelling simplification, not a biological rule about every introgressed segment.

:::

### Recombination and ancestry transitions {#ancestry-transitions}

Introgression initially introduces chromosome segments. Recombination in subsequent generations breaks those segments into shorter tracts. Transition probabilities connect this process to the HMM.

Write

$$
p=P(I\rightarrow A),\qquad q=P(A\rightarrow I).
$$

With rows and columns ordered as $I,A$, the transition matrix is

$$
\mathbf{P}=
\begin{pmatrix}
1-p&p\\
q&1-q
\end{pmatrix}.
$$

Let $a$ be the archaic admixture proportion, $T_{\mathrm{admix}}$ the generations since admixture, and $r$ the recombination rate per base per generation. Define

$$
x=T_{\mathrm{admix}}rL.
$$

For the haploid model, the slides derive

$$
P(I\rightarrow I)=e^{-x}+(1-e^{-x})(1-a).
$$

The first term corresponds to no recombination over the interval. The second corresponds to recombination followed by another ingroup segment. A recombination event therefore does not necessarily change the ancestry state.

When $x$ is small, $e^{-x}\approx1-x$, giving

$$
P(I\rightarrow I)\approx1-ax,
\qquad p\approx ax.
$$

The lecture overview similarly gives

$$
q\approx(1-a)x.
$$

In the diploid approximation, entering the archaic state can involve either chromosome copy, so

$$
p\approx2ax.
$$

The factor of two follows from the diploid state definition and its heterozygosity assumption.

These relationships explain why older introgression generally produces shorter surviving tracts: more generations allow more recombination. They also show why ancestry transitions depend on window length and recombination rate. The linear expressions are small-$x$ approximations, rather than unrestricted formulas for arbitrary distances.

## Learning and decoding {#learning-and-decoding}

The model's ancestry and time parameters are initially unknown. The lecture uses **Baum–Welch**, the expectation–maximization procedure for HMMs, to estimate them from the observations.

Conceptually, the procedure alternates between calculating posterior expectations for states and transitions under the current parameters and updating parameters to better explain those expectations. The estimates describe the data within the model's assumptions. Their biological interpretation therefore depends on those assumptions and on quantities such as mutation and recombination rates.

For ancestry assignment, the lecture uses **posterior maximum decoding**:

$$
\hat Z_i=\operatorname*{arg\,max}_{s\in\{I,A\}}
P(Z_i=s\mid K_1,\ldots,K_n).
$$

Each window receives the state with the highest posterior probability, using information from the whole observation sequence.

::: table align="center" title="Posterior decoding and Viterbi"

| Method | Optimization target | Useful output |
| :--- | :--- | :--- |
| Viterbi | Most probable complete state path | One globally optimized sequence of states |
| Posterior maximum decoding | Most probable state separately at each window | Window labels together with posterior state probabilities |

:::

The most probable state at each position need not form the most probable complete path. A posterior near 0.5 indicates an uncertain assignment in this two-state model, whereas a posterior near one provides stronger support for archaic ancestry.

The simulation figure compares inferred tracts with the known simulated states. A separate benchmark compares HMM, Sprime and versions of Sstar using **sensitivity**, the fraction of true archaic sequence detected, and **precision**, the fraction of calls that are truly archaic. The HMM performs well in the conditions shown. The figure supports that comparison within those simulations; it does not establish universal superiority under every demographic or data-quality scenario.

## Reconstructing archaic sequence across a population {#population-reconstruction}

The lecture next presents the analysis of **27,566 Icelanders** from Skov et al. (2020). The logic is to detect archaic tracts in individuals and then combine the genomic regions represented by those tracts across the population.

One person preserves only a small fraction of archaic ancestry. Another may preserve different regions. Their combined coverage can therefore be much larger than the ancestry proportion of either individual. The lecture reports recovery of approximately **40–50% of the archaic genome** in this population analysis.

::: table align="center" title="Three quantities that should remain distinct"

| Quantity | Question answered |
| :--- | :--- |
| Individual ancestry proportion | What fraction of one person's genome is inferred to be archaic? |
| Population-wide cumulative coverage | How much of the archaic genome is represented by the union of detected regions? |
| Fragment attribution | Which available archaic reference does a detected fragment resemble? |

:::

Cumulative coverage does not reconstruct a single historical individual's complete genome. The recovered material is a mosaic of fragments that survived in different descendants and may reflect multiple archaic lineages.

After detection, the slides classify the fragments by resemblance to available archaic genomes:

::: table align="center" title="Fragment classification shown for the Icelandic analysis"

| Category | Reported share |
| :--- | ---: |
| Vindija-like | 50.8% |
| Altai-like | 13.1% |
| Ambiguous Neanderthal-like | 20.4% |
| Denisova-like | 3.3% |
| Unknown | 12.2% |

:::

These percentages describe the classification of the detected archaic material. For example, 3.3% Denisova-like fragments does not mean that 3.3% of every Icelandic person's genome is Denisovan.

## Archaic signals and alternative admixture histories {#admixture-histories}

The presence of Denisovan-like fragments in the Icelandic analysis raises a question about their route into modern humans. The lecture presents alternative historical explanations: direct contribution from a Denisovan-related population, or contribution through a Neanderthal population that already carried Denisovan ancestry.

One slide proposes admixture with a Neanderthal source population containing approximately 6–8% Denisovan ancestry. This is presented as a possible explanation, and the percentage refers to that proposed source population.

The slides also illustrate an individual with mixed Neanderthal and Denisovan ancestry, reinforcing that archaic populations themselves could exchange genes. Consequently, the reference genome most similar to a fragment does not uniquely identify the route by which that fragment entered modern humans.

**Sequence resemblance, ancestry assignment and the historical path of gene flow are related but distinct inferences.**

## Global sampling and remaining questions {#global-sampling}

The final research examples extend the cumulative reconstruction across worldwide populations. The slides attribute these results to Kerdoncuff et al. (2024), labelled as a bioRxiv study in the lecture, and report approximately **1.6 Gb of Neanderthal sequence** and **600 Mb of Denisovan sequence** recovered across samples.

These are cumulative recovered sequence amounts. They do not represent the amount of archaic DNA in one individual.

The lecture emphasizes that much Neanderthal ancestry is shared across non-African populations, whereas South Asians and Oceanians carry a substantial proportion of distinctive Denisovan ancestry. Sampling different populations therefore contributes information that cannot be recovered simply by adding more individuals from a single population.

The closing slides ask about unknown archaic sources and gene flow from modern humans into Neanderthals. *Homo erectus* appears as a possible unknown source to investigate. An unassigned fragment, however, does not by itself identify a species: limited references and unresolved ancestry can also leave fragments unclassified.

## What the HMM contributes {#hmm-contribution}

The method links two sources of evidence. **Emissions** connect retained variant counts to the depth of local ancestry. **Transitions** connect neighbouring ancestry states to recombination and the time since admixture. Baum–Welch estimates model parameters, while posterior decoding expresses ancestry support along the genome.

Its important advantage is that initial detection does not require an archaic donor genome. That broadens the search beyond the few archaic individuals already sequenced, while subsequent reference comparisons help interpret the detected material.

The remaining uncertainty is biological as well as statistical. Outgroup choice, incomplete sampling and simplified demographic assumptions affect what can be detected and how it can be attributed. Large and diverse modern datasets recover more of the surviving archaic mosaic, but they still provide an incomplete view of the populations that contributed it.
