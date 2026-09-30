---
title: Hidden Markov Models, PSMC and Local Ancestry
createTime: 2026/09/30 09:30:50
permalink: /blog/ku-advbinf-hmm-psmc-local-ancestry/
excerpt: "This is part of the summary of Advanced Bioinformatics for NGS at KU. The article connects discrete and continuous-time hidden Markov models with the coalescent, PSMC demographic inference, and local ancestry along chromosomes."
tags:
  - KU
  - Advanced Bioinformatics
---

Genomic observations reveal biological history indirectly. Heterozygous sites contain information about the age of local genealogies, while allele-frequency differences contain information about ancestry. Neither the genealogy nor the ancestry of a chromosome segment is directly observed.

**Hidden Markov models (HMMs)** provide a way to combine these noisy observations with the fact that neighbouring positions often share the same underlying state.

The two lectures develop this connection in three stages: the algorithms for discrete HMMs, rate-driven transitions along a continuous coordinate, and two population-genetic applications: **PSMC** and **local ancestry inference**.

## From Markov chains to hidden states {#markov-chains-and-hidden-states}

A Markov chain describes a sequence of states in which the next state depends on the current state rather than the entire history:

$$
P(Z_t\mid Z_1,\ldots,Z_{t-1})=P(Z_t\mid Z_{t-1}).
$$

An HMM adds an observation process. The state $Z_t$ is hidden, but an observation $O_t$ is generated according to a distribution associated with that state.

The lecture's ice-cream example makes this distinction explicit. A diary records how many ice creams were eaten each day. The underlying weather, HOT or COLD, is unknown. Hot days make some counts more likely, but an ice-cream count does not uniquely determine the weather.

The model is specified by

$$
\lambda=(\pi,A,B).
$$

::: table title="Components of a discrete HMM"

| Component | Definition | Ice-cream example |
| :--- | :--- | :--- |
| Hidden states | Possible values of $Z_t$ | HOT and COLD |
| Initial distribution $\pi$ | $\pi_j=P(Z_1=j)$ | Weather probabilities on the first day |
| Transition matrix $A$ | $a_{ij}=P(Z_t=j\mid Z_{t-1}=i)$ | Probability that the weather persists or changes |
| Emission distribution $B$ | $b_j(o)=P(O_t=o\mid Z_t=j)$ | Probability of an ice-cream count under each weather state |

:::

The rows of $A$ sum to one. For discrete observations, each state's emission probabilities also sum to one.

The standard HMM additionally assumes **conditional independence of observations**: once the hidden states are given, an observation depends only on its own state. Therefore,

$$
P(Z,O\mid\lambda)
=\pi_{Z_1}b_{Z_1}(O_1)
\prod_{t=2}^{T}a_{Z_{t-1},Z_t}b_{Z_t}(O_t).
$$

The observed-data likelihood is obtained by marginalizing over every hidden path:

$$
P(O\mid\lambda)=\sum_ZP(Z,O\mid\lambda).
$$

With $N$ states and $T$ observations, there are $N^T$ possible paths. Dynamic programming makes this sum computable without enumerating them individually.

## Three inference problems {#three-inference-problems}

::: table title="Likelihood, decoding and learning"

| Problem | Question | Main algorithm |
| :--- | :--- | :--- |
| Likelihood | How probable is this observation sequence under the model? | Forward |
| Path decoding | What is the most probable complete hidden-state sequence? | Viterbi |
| Posterior inference | What is the state probability at each position, given all observations? | Forward–Backward |
| Parameter learning | Which parameters best explain the observations? | Baum–Welch / EM |

:::

### Forward: sum over all paths {#forward-algorithm}

Define the forward quantity

$$
\alpha_t(j)=P(O_1,\ldots,O_t,Z_t=j\mid\lambda).
$$

Initialization is

$$
\alpha_1(j)=\pi_jb_j(O_1).
$$

The recursion is

$$
\alpha_t(j)=b_j(O_t)\sum_i\alpha_{t-1}(i)a_{ij}.
$$

For each possible previous state, take the probability accumulated so far, multiply by the transition probability, and sum. Then multiply by the probability of the current observation.

Finally,

$$
P(O\mid\lambda)=\sum_j\alpha_T(j).
$$

Each cell in the computational **trellis** summarizes every path reaching one state at one position. The standard dense calculation costs $O(TN^2)$, rather than enumerating $N^T$ paths.

### Viterbi: retain the best complete path {#viterbi-algorithm}

Viterbi uses the same trellis, but retains the largest path probability:

$$
v_1(j)=\pi_jb_j(O_1),
$$

$$
v_t(j)=b_j(O_t)\max_i\left[v_{t-1}(i)a_{ij}\right].
$$

The winning predecessor is stored as a backpointer. Starting from the best final state and tracing these pointers backwards gives the most probable complete path.

==**Forward sums over paths; Viterbi selects one path.**== Their final probabilities have different meanings: the Viterbi score is the joint probability of the observations and the winning path, whereas Forward returns the likelihood summed over all paths.

### Backward and posterior decoding {#backward-and-posterior-decoding}

The backward quantity describes observations after the current position:

$$
\beta_t(i)=P(O_{t+1},\ldots,O_T\mid Z_t=i,\lambda).
$$

Its boundary condition and recursion are

$$
\beta_T(i)=1,
$$

$$
\beta_t(i)=\sum_j a_{ij}b_j(O_{t+1})\beta_{t+1}(j).
$$

Combining both passes gives

$$
\gamma_t(i)=P(Z_t=i\mid O,\lambda)
=\frac{\alpha_t(i)\beta_t(i)}{P(O\mid\lambda)}.
$$

This uses information from **both sides of a position**. For a genomic region, the evidence comes from the surrounding sequence as well as the observation at the position itself.

Posterior probabilities are useful when uncertainty matters. A region can receive an island or ancestry probability rather than only a hard label.

::: note Two meanings of decoding
Choosing the highest posterior-probability state independently at each position need not reproduce the Viterbi path. Posterior decoding optimizes position-wise decisions; Viterbi optimizes the probability of a complete path, including its transitions.
:::

### Baum–Welch: EM for dependent latent states {#baum-welch}

If the hidden path were observed, learning would largely reduce to counting transitions and emissions. With an unknown path, **Baum–Welch** replaces these counts with posterior expected counts.

In addition to $\gamma_t(i)$, define

$$
\xi_t(i,j)=P(Z_t=i,Z_{t+1}=j\mid O,\lambda)
=\frac{\alpha_t(i)a_{ij}b_j(O_{t+1})\beta_{t+1}(j)}{P(O\mid\lambda)}.
$$

The transition update is

$$
\hat a_{ij}=\frac{\sum_{t=1}^{T-1}\xi_t(i,j)}{\sum_{t=1}^{T-1}\gamma_t(i)}.
$$

For discrete emission symbol $v$,

$$
\hat b_j(v)=\frac{\sum_{t=1}^{T}\gamma_t(j)\mathbf{1}(O_t=v)}{\sum_{t=1}^{T}\gamma_t(j)}.
$$

If the initial distribution is free to vary, its update is $\hat\pi_j=\gamma_1(j)$.

The **E-step** computes posterior occupancies and transitions; the **M-step** updates parameters using those expectations. This is the same soft-counting principle developed in the earlier EM lecture, now applied to states connected along a sequence.

Under the standard EM conditions, the likelihood does not decrease between iterations. This does **not** guarantee a global maximum. Different initializations can lead to different solutions, and a perfectly symmetric initialization can fail to distinguish states. Biological models therefore often fix the state structure and learn only selected parameters.

## What the introductory examples demonstrate {#introductory-examples}

The occasionally dishonest casino switches between a fair die and a loaded die. The fair die emits every face with probability $1/6$; the loaded die emits six with probability $0.5$ and each other face with probability $0.1$.

A six supports the loaded state, but changing dice also has a probability cost. Several observations must be interpreted jointly. The model balances **local emission evidence** against **state persistence**.

CpG-island prediction transfers the same idea to DNA. The underlying label is whether a position belongs to an island or the background, and the observations are nucleotide patterns. The probability of G following C is higher in the island model.

Because this example depends on adjacent-base relationships, a model must encode those relationships, for example through expanded states or region-specific nucleotide transitions. Two region labels with independent single-base emissions alone do not fully describe CpG enrichment.

These examples establish the pattern used in the genomic applications: ==**a hidden regional property changes along the sequence and becomes visible through noisy observations**==.

## Continuous-time transitions along the genome {#continuous-time-transitions}

For genomic data, the distance between observations can matter as much as their order. Two SNPs separated by 100 bp should not automatically have the same transition probabilities as two SNPs separated by 2 Mb.

A **continuous-time Markov chain (CTMC)** describes instantaneous transition rates using a matrix $Q$:

$$
q_{ij}\geq0\quad(i\neq j),
\qquad q_{ii}=-\sum_{j\neq i}q_{ij}.
$$

Each row of $Q$ sums to zero. In contrast, each row of a probability transition matrix sums to one.

The transition probabilities over distance or time $d$ are

$$
P(d)=e^{Qd}.
$$

The coordinate need not be chronological time: it may be physical distance in base pairs or genetic distance in Morgans.

### Wait, then jump {#wait-then-jump}

In state $i$, the waiting distance is exponentially distributed with rate $-q_{ii}$. The mean waiting distance is $1/(-q_{ii})$. On leaving, the destination is chosen with probability

$$
P(i\rightarrow j\mid\text{a jump})=\frac{q_{ij}}{-q_{ii}}.
$$

For a two-state model with ordinary regions $N$ and runs of homozygosity $R$,

$$
Q=\begin{pmatrix}-a&a\\b&-b\end{pmatrix}.
$$

The stationary distribution is

$$
\pi_N=\frac{b}{a+b},\qquad\pi_R=\frac{a}{a+b}.
$$

The transition probabilities are

$$
P_{NN}(d)=\pi_N+\pi_Re^{-(a+b)d},
\qquad P_{NR}(d)=\pi_R(1-e^{-(a+b)d}),
$$

$$
P_{RN}(d)=\pi_N(1-e^{-(a+b)d}),
\qquad P_{RR}(d)=\pi_R+\pi_Ne^{-(a+b)d}.
$$

At short distances, $P(d)$ is close to the identity matrix. At long distances, its rows approach the stationary distribution: the process progressively loses information about its starting state.

::: note No event versus the same endpoint
The probability of never leaving $N$ is $e^{-ad}$. The probability of ending in $N$ is $P_{NN}(d)$, which also includes paths that leave and return. For a symmetric two-state chain, the latter is $\tfrac12+\tfrac12e^{-2ad}$, not $e^{-ad}$.
:::

### ROH: why SNP spacing is information {#roh-and-snp-spacing}

A **run of homozygosity (ROH)** is a long region with little heterozygosity, often reflecting inheritance of both copies from a shared ancestor. The lecture's illustrative emission model is

::: table title="Toy ROH emissions"

| State | $P(\mathrm{het})$ | $P(\mathrm{hom})$ |
| :--- | ---: | ---: |
| Ordinary region $N$ | 0.50 | 0.50 |
| ROH $R$ | 0.01 | 0.99 |

:::

With $a=0.25$ and $b=0.75$ per Mb, ordinary runs have mean length 4 Mb, ROHs have mean length about 1.33 Mb, and the stationary ROH fraction is 0.25. These are teaching parameters rather than universal biological values.

Six homozygous observations packed into a short interval provide evidence for a shared ROH state. A large subsequent gap allows that state to change before the next observation. Using one transition matrix for every SNP pair discards this information and can change the decoded result.

Forward and Viterbi retain their recursions, with $a_{ij}$ replaced by $P_{ij}(d_t)$ for each gap. Learning the CTMC rates requires expected jump counts and expected distance spent in each state, including unobserved changes inside gaps:

$$
\hat a=\frac{E[\#(N\rightarrow R)]}{E[\text{distance in }N]},
\qquad
\hat b=\frac{E[\#(R\rightarrow N)]}{E[\text{distance in }R]}.
$$

### Matrix exponentiation and uniformization {#uniformization}

The matrix exponential can be obtained from the Kolmogorov equation, eigendecomposition where applicable, or numerical methods.

**Uniformization** chooses $\nu\geq\max_i(-q_{ii})$ and constructs

$$
R=I+\frac{Q}{\nu}.
$$

Then

$$
e^{Qd}=\sum_{n=0}^{\infty}e^{-\nu d}\frac{(\nu d)^n}{n!}R^n.
$$

The CTMC is represented by a discrete chain whose number of steps follows a Poisson distribution. Self-transitions can represent virtual events. The infinite sum is exact; truncating it gives a numerical approximation.

The lecture also discusses a fixed-step approximation. That should be distinguished from the Poisson-weighted uniformization identity above. At sufficiently small intervals, $P(d)\approx I+Qd$ is useful, but large intervals require accounting for multiple events.

A second example treats elevated and background mutation-rate classes as hidden states. Observed substitution types provide noisy evidence for the class, while a rate process governs changes along the chromosome. The same framework can accommodate larger state spaces, although computation becomes more expensive.

## The coalescent connects sequence variation to demography {#coalescent-and-demography}

Demography includes historical effective population sizes, migration and population splits. It determines the neutral variation expected in a genome, so it is relevant when interpreting selection or association signals.

The lecture contrasts demographic inference based on the **site-frequency spectrum**, **linkage disequilibrium**, and **local genealogies**. PSMC belongs to the third group.

### Looking backwards in time {#looking-backwards}

In a Wright–Fisher population with $N_e$ diploid individuals, there are $2N_e$ chromosome copies. Two lineages traced backwards choose the same ancestral copy with probability approximately $1/(2N_e)$ per generation. At that point they **coalesce**.

For constant population size,

$$
P(T_{\mathrm{MRCA}}>t)=\left(1-\frac{1}{2N_e}\right)^t
\approx e^{-t/(2N_e)},
$$

$$
E[T_{\mathrm{MRCA}}]=2N_e\text{ generations}.
$$

The continuous approximation is exponential, with a standard deviation equal to its mean. Local coalescence times can therefore vary widely even under a constant-size history.

With $k$ lineages, there are $\binom{k}{2}$ possible pairs. In units of $2N_e$ generations, the waiting time until the next coalescence has mean

$$
E[T_k]=\frac{1}{\binom{k}{2}}=\frac{2}{k(k-1)}.
$$

For $n$ sampled lineages,

$$
E[T_{\mathrm{MRCA}}]=\sum_{k=2}^{n}\frac{2}{k(k-1)}
=2\left(1-\frac1n\right)
$$

in these scaled units. The final two lineages account for a substantial part of the total depth.

### Mutations make genealogy observable {#mutations-and-genealogy}

Two copies with TMRCA $T$ have a combined branch length of $2T$ generations. With neutral mutation rate $\mu$ per base per generation, their expected number of mutations separating them per base is $2\mu T$.

At low divergence,

$$
P(\text{difference at a site}\mid T)\approx2\mu T.
$$

Averaging under a constant-size model gives the familiar relation

$$
E[\text{heterozygosity}]\approx4N_e\mu.
$$

Deep genealogies tend to contain more heterozygous sites. Shallow genealogies tend to contain fewer. Mutation is stochastic, so heterozygosity is a noisy measurement rather than an exact clock at each position.

### Changing population size changes coalescence times {#changing-population-size}

For a population history $N_e(t)$, the pairwise coalescence hazard is

$$
h(t)=\frac{1}{2N_e(t)}.
$$

Its survival function and density are

$$
S(t)=\exp\left[-\int_0^t h(u)\,du\right],
\qquad f(t)=h(t)S(t).
$$

A bottleneck increases the coalescence hazard during its time interval and concentrates coalescence events there. A larger population has a lower hazard.

==**The distribution of local coalescence times carries information about historical effective population size.**== Effective population size is a genetic parameter, not a direct count of living individuals.

## PSMC: population history from one diploid genome {#psmc}

**Pairwise Sequentially Markovian Coalescent (PSMC)** uses the two chromosome copies of one diploid individual to infer a population-size history.

Historical recombination causes local genealogies to vary along a chromosome. PSMC approximates this sequence of genealogies as a Markov process. This is a tractable approximation to the full ancestral recombination graph, not a claim that all genomic windows are independent.

::: table title="The HMM inside PSMC"

| Component | PSMC interpretation |
| :--- | :--- |
| Sequence coordinate | Position along the chromosome |
| Hidden state | Local TMRCA, represented by a time interval in the fitted model |
| Observation | Whether a sequence window contains a heterozygous site |
| Transition | Recombination-driven changes in local genealogy |
| Emission | Mutation-driven probability of observing heterozygosity |
| Parameters | Population-size history and mutation/recombination scaling parameters |

:::

### Continuous state and scaled time {#psmc-scaled-time}

Let $N_0$ be a reference effective size and define scaled coalescence time and relative population size:

$$
t=\frac{T}{2N_0},\qquad\eta(t)=\frac{N_e(t)}{N_0}.
$$

The marginal TMRCA density is

$$
f(t)=\frac1{\eta(t)}
\exp\left[-\int_0^t\frac{du}{\eta(u)}\right].
$$

For constant relative size $\eta(t)=1$, this becomes $f(t)=e^{-t}$.

Two coordinates must be kept separate: **position along the chromosome** indexes observations, while **time into the past** defines the hidden TMRCA.

### Emissions: longer histories accumulate more mutations {#psmc-emissions}

For a window of $L$ bases, define

$$
\theta_L=4N_0\mu L.
$$

Under the lecture's Poisson mutation model,

$$
P(O=0\mid t)=e^{-\theta_Lt},
\qquad P(O=1\mid t)=1-e^{-\theta_Lt}.
$$

Here $O=1$ means that the window contains heterozygosity. The lecture uses 100-bp windows. Window scaling is absorbed into the mutation parameter when the equations are written per bin.

The probability of observing heterozygosity increases with TMRCA, but eventually approaches one. A binary window observation then contains progressively less information for distinguishing very deep times.

### Transitions: recombination and block length {#psmc-transitions}

An older genealogy has greater total branch length and therefore more opportunities for historical recombination. With the lecture's scaled recombination parameter $\rho$,

$$
P(\text{no recombination over distance }d\mid t=s)=e^{-\rho sd}.
$$

The expected distance to such an event is $1/(\rho s)$. Deep genealogies tend to occupy shorter recombination blocks, whereas shallow genealogies tend to persist over longer stretches.

For a single bin, the lecture writes the transition template as

$$
p(t\mid s)=e^{-\rho s}\delta(t-s)
+(1-e^{-\rho s})q(t\mid s).
$$

The first term retains the current TMRCA. The second describes a new TMRCA after recombination and re-coalescence. The kernel $q(t\mid s)$ depends on population history, since that history determines the rate at which the ancestral lineage coalesces.

::: note Recombination and state changes
A recombination event need not change the TMRCA or its discretized state. The event-rate intuition explains why genealogy blocks depend on coalescence depth, but recombination events and detected state boundaries are not interchangeable.
:::

PSMC consequently uses two related signals: **heterozygote density** and **correlation along the chromosome**. The former informs mutation history; the latter informs the persistence of local genealogies.

### Discretization and parameter fitting {#psmc-discretization}

In the continuous formulation, Forward sums become integrals over possible TMRCAs. Repeating those integrals across millions of windows and EM iterations would be expensive.

PSMC partitions time into intervals and represents population size as piecewise constant. Transitions and emissions are derived from the continuous model, producing a finite-state HMM.

The lecture gives the discretization pattern

```text
1*4+25*2+1*4+1*6
```

This groups 64 atomic time intervals into **28 population-size parameters**: one shared across the first four intervals, 25 each spanning two intervals, one spanning four, and one spanning six. Coarser grouping at the recent and ancient ends reflects weaker information there.

Fitting starts from an initial population history. Forward–Backward provides expectations in the E-step, and numerical optimization updates demographic parameters in the M-step. The original procedure described in the lecture uses Powell's method and takes the estimates after 20 iterations. That iteration count describes the reported procedure rather than guaranteeing convergence for every dataset.

The hidden state is **TMRCA**. The historical curve **$N_e(t)$ is a fitted model parameter**, not the hidden state itself.

### Scaling and limits of interpretation {#psmc-scaling-and-limits}

If $\theta_{\mathrm{base}}=4N_0\mu$, then

$$
N_0=\frac{\theta_{\mathrm{base}}}{4\mu}.
$$

For generation length $g$ years,

$$
T_{\mathrm{years}}=2N_0tg,
\qquad N_e(t)=N_0\eta(t).
$$

The mutation rate and generation length are external assumptions. Changing them changes the absolute scales of the inferred history.

Resolution also varies through time:

- **Very recent history:** one pair of copies provides limited recent coalescence information, and long blocks offer few independent histories for resolving fine time intervals.
- **Very ancient history:** blocks become short, multiple recombinations may occur within a window, and binary heterozygosity emissions lose discrimination.
- **Intermediate history:** the balance between mutation information and genealogy persistence is often more favourable.

The lecture illustrates PSMC with the human analyses of [Li and Durbin (2011)](https://doi.org/10.1038/nature10231). Under their scaling, European and East Asian genomes show a pronounced historical bottleneck, while Yoruba genomes show a different, milder pattern. These are model-based demographic interpretations under the stated assumptions.

## Local ancestry: locating ancestry along chromosomes {#local-ancestry}

Global admixture analysis describes an individual's overall ancestry proportions. **Local ancestry inference** asks which source population contributed a particular chromosome segment.

After admixture, recombination produces a mosaic of ancestry tracts. Successive generations break these tracts into shorter pieces. Their spatial pattern therefore contains information about both ancestry and admixture history.

::: table title="Global versus local ancestry"

| Analysis | Typical output | Question |
| :--- | :--- | :--- |
| Global ancestry | One ancestry-proportion vector per individual | How much ancestry comes from each component overall? |
| Local ancestry | State probabilities or ancestry tracts along each chromosome | Which ancestry contributed each position? |

:::

A local ancestry HMM uses source populations as hidden labels, recombination-driven transitions, and allele or haplotype evidence as emissions. The initial distribution may be based on global admixture proportions.

### A two-source transition model {#local-ancestry-transitions}

Consider a simplified single-pulse admixture model. Admixture occurred $G$ generations ago, and ancestry A has proportion $m$, while B has proportion $1-m$.

If the separation $d$ is already measured in **Morgans**, the expected number of reset events is $Gd$. A separate physical recombination rate is needed when using physical distance instead.

The probability of no reset is $e^{-Gd}$. After a reset, ancestry is redrawn from the mixture proportions:

$$
P(A\rightarrow A;d)=e^{-Gd}+(1-e^{-Gd})m,
$$

$$
P(A\rightarrow B;d)=(1-e^{-Gd})(1-m),
$$

$$
P(B\rightarrow A;d)=(1-e^{-Gd})m,
$$

$$
P(B\rightarrow B;d)=e^{-Gd}+(1-e^{-Gd})(1-m).
$$

A reset can return the same ancestry. Thus, the total reset rate differs from the rate of visible ancestry changes.

In this model, the exit rate from a B tract is $Gm$ per Morgan, giving

$$
E[L_B]=\frac1{Gm},\qquad E[L_A]=\frac1{G(1-m)}.
$$

With $m=0.8$, B tracts average 12.5 cM after 10 generations and 1.25 cM after 100 generations. Older admixture leaves shorter tracts, which are harder to detect. Continuous migration or multiple pulses require a more elaborate interpretation than this single-pulse model.

### Emissions depend on the observation and ploidy {#local-ancestry-emissions}

For a haploid allele $x\in\{0,1\}$ and source frequency $p_A$,

$$
P(x\mid A)=p_A^x(1-p_A)^{1-x}.
$$

The same allele can therefore support different ancestry states depending on source-population frequencies.

For diploid observations, the hidden state must account for both copies, such as $AA$, $AB$, or $BB$. If both copies come from A and are sampled independently,

$$
P(g\mid AA)=\binom2g p_A^g(1-p_A)^{2-g}.
$$

For mixed ancestry $AB$, the corresponding probabilities are

$$
P(g=0\mid AB)=(1-p_A)(1-p_B),
$$

$$
P(g=1\mid AB)=p_A(1-p_B)+(1-p_A)p_B,
$$

$$
P(g=2\mid AB)=p_Ap_B.
$$

This distinction clarifies the lecture's simplified binomial emission. A single ancestry label for one haplotype and a diploid genotype emission represent different modeling choices.

### Outputs and biological applications {#local-ancestry-applications}

Forward–Backward returns an ancestry probability at each position. Viterbi returns the most probable complete ancestry path. Depending on the implementation and assumptions, EM can also estimate quantities such as mixture proportions or admixture time.

Local ancestry supports several applications:

- **Admixture dating:** tract lengths provide information about time since mixing.
- **Selection after admixture:** a local excess of one ancestry relative to its genomic background may suggest preferential retention.
- **Admixture mapping:** ancestry at a locus can be associated with a phenotype.
- **Introgression detection:** segments may trace to an archaic population or another species.

An ancestry excess or association is a statistical signal requiring biological interpretation; the decoded label alone does not establish its cause.

### Related methods introduced in the lecture {#local-ancestry-methods}

::: table title="Different ways to obtain local ancestry evidence"

| Method | Lecture emphasis |
| :--- | :--- |
| HAPMIX | A two-source model using phased reference haplotypes and recombination-based ancestry transitions |
| RFMix | Random-forest classification combined with sequence smoothing; accommodates multiple source populations |
| fatash | Uses haplotype clusters in windows as observations rather than requiring pre-labelled source panels |
| hmmix | Detects archaic introgression without an archaic reference genome, using counts of variants absent from an outgroup |

:::

The methods share the need to connect evidence across positions, but they differ in data representation, reference requirements and statistical architecture. The introductory HMM explains the general logic rather than every implementation detail.

For the hmmix practical, the important shift is from observing individual alleles to observing **window-level counts of variants absent from an outgroup**. A Poisson emission model supplies evidence for the two hidden classes.

## A shared framework with different biological clocks {#shared-framework}

::: table title="ROH, PSMC and local ancestry"

| Feature | ROH model | PSMC | Local ancestry model |
| :--- | :--- | :--- | :--- |
| Hidden state | Ordinary region or ROH | Local TMRCA interval | Source ancestry or ancestry pair |
| Observations | Homozygous and heterozygous SNPs | Heterozygosity in windows | Alleles, haplotypes or variant counts |
| Transition mechanism | Entry and exit rates along distance | Historical recombination and re-coalescence | Recombination after admixture |
| Main interpretation | Shared ancestral segments | Historical effective population size | Ancestry mosaics and admixture history |
| Important uncertainty | Sparse markers and errors | Mutation scaling, time resolution and model assumptions | Source information, short tracts and admixture model |

:::

There are also two distinct notions of continuity. A process can evolve continuously along chromosome position while having a finite number of labels, as in a two-source ancestry model. PSMC additionally begins with a **continuous hidden variable**, TMRCA, which is discretized for computation.

The lecture places PSMC in a broader family. MSMC and MSMC2 extend coalescent inference to several haplotypes; SMC++ combines sequentially Markovian information with frequency information from many unphased genomes. Other approaches add migration or sample more of the ancestral recombination graph. These extensions change the information available and the complexity of the hidden model.

The central modeling decision is what the hidden label represents. Once that is defined, the transition process expresses why neighbouring positions share history, and the emission process expresses how that history produces data. Forward, Viterbi and posterior inference then solve different questions about the same model. Their biological conclusions remain tied to the assumptions used to construct those transitions and emissions.
