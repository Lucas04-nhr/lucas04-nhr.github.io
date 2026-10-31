---
title: Biological Sequence Analysis
createTime: 2026/10/31 12:00:00
permalink: /docs/ku-bsa/
excerpt: "Oral exam preparation for Biological Sequence Analysis at KU: the exam format, a table of contents for the twelve topic pages, and cross-topic material such as recurring ideas, a formula sheet and follow-up questions that link the topics."
tags:
  - KU
  - Biological Sequence Analysis
  - Exam Preparation
---

These pages prepare the oral exam for Biological Sequence Analysis (5550-B1-1E26) at the University of Copenhagen. An oral exam rewards two things at once: a clear story that can be told in about ten minutes, and enough depth to survive follow-up questions at the whiteboard. Each of the twelve exam topics therefore has its own page combining revision notes, a presentation, a board plan and likely follow-up questions. This overview collects the exam format and the material that links the topics.

::: note Source and scope

The notes are built from the week 1–7 slides and exercises, my own handwritten notes, and a classmate's exam notes. Questions marked ★ on the topic pages were raised in the revision sessions on 27 and 29 October. The advice on talks and board work is my own preparation strategy, not official guidance.

:::

## Exam Format {#exam-format}

- The oral exam takes place on 2–6 November. A die roll picks one of the twelve topics.
- **Preparation: 25 minutes**, open book with all aids allowed. One A4 page of notes may be written and brought into the exam.
- **Exam: about 25 minutes.** A presentation of **about 10 minutes** on the drawn topic, followed by **15–20 minutes of questions**. Questions start from the presentation but may cover any other course topic ("questions overlap, and we can also ask outside the initial topic").

The course learning outcomes describe what is tested: explain the algorithms, derive simple probabilistic methods, interpret the output of standard tools, choose the right method for a biological problem, and say when a method fails. The lecturers' own framing for every topic makes a good skeleton for any answer:

::: tip Five questions for every topic

1. What is the problem?
2. What simple procedure solves it?
3. How do statistics help?
4. What are the assumptions?
5. When does it fail?

:::

## Table of Contents {#table-of-contents}

::: table align="center" title="Topic pages"

| # | Topic | Week / lecturer |
| :--- | :--- | :--- |
| 1 | [Optimal Pairwise Sequence Alignment](/docs/ku-bsa/pairwise-alignment/) | W1, Albrechtsen |
| 2 | [Database Search with BLAST and BLAT](/docs/ku-bsa/blast-and-blat/) | W1–2, Stein |
| 3 | [Score Statistics and E-values](/docs/ku-bsa/score-statistics/) | W2, Stein |
| 4 | [String Matching and Indexing](/docs/ku-bsa/string-matching/) | W1–2, Stein / Korneliussen group |
| 5 | [Next-Generation Sequencing and the BWT](/docs/ku-bsa/ngs-and-bwt/) | W3–5, Korneliussen |
| 6 | [Motifs, Weight Matrices and Logos](/docs/ku-bsa/motifs-and-logos/) | W4, Albrechtsen |
| 7 | [Motif Discovery](/docs/ku-bsa/motif-discovery/) | W7, Albrechtsen |
| 8 | [Hidden Markov Models](/docs/ku-bsa/hidden-markov-models/) | W4–5, Albrechtsen |
| 9 | [Applying HMMs to Biological Sequences](/docs/ku-bsa/hmm-applications/) | W5, Anderson |
| 10 | [Multiple Sequence Alignment and Co-evolution](/docs/ku-bsa/msa-and-coevolution/) | W6, Stein |
| 11 | [Profile HMMs](/docs/ku-bsa/profile-hmms/) | W6, Stein |
| 12 | [Algorithms on RNA Structure](/docs/ku-bsa/rna-structure/) | W2–3, Gorodkin |

:::

## How Each Topic Page Is Organised {#page-structure}

- **Revision notes:** definitions, models, recurrences and worked examples small enough to reproduce by hand, ending with assumptions and limitations.
- **Ten-minute presentation:** a keyword card to glance at while speaking, and a full spoken script (about 850–1,150 words, i.e. 7–9 minutes at a calm pace, leaving time for writing on the board). Every script follows the arc *problem → method → worked example → statistics/complexity → assumptions and failure modes → link to another topic*. Ending on a link invites follow-up questions that have been prepared.
- **Board plan:** what to write or draw, split into *must* (what the examiners are likely to check, or asked for in the revision sessions) and *optional* items.
- **Follow-up questions:** likely questions with model answers. Questions marked ★ were actually raised in the revision sessions on 27 and 29 October.

## Preparation and Answering Technique {#technique}

During the 25-minute preparation:

- Pick the three to five *must* items for the drawn topic and work the examples out on paper, so they only need to be copied onto the board.
- Put formulas on the left, the worked example in the middle, and keep the right side free; examiners often ask for an addition during the questions.
- Keep diagrams minimal and correct: three columns of a profile HMM, two states for the casino, seven rows for BANANA\$. A small correct drawing beats a large messy one.

During the exam:

- Write while saying it, then turn back to the examiners rather than talking to the board.
- Leave everything up after the talk; follow-up questions usually point at what is already on the board.

::: tip Answering in four steps

1. Give the direct answer first.
2. Justify it with the model or formula.
3. Name an assumption or limitation.
4. If unsure, reason aloud from first principles ("let me think about what the model assumes…"). Reasoning is rewarded.

:::

## Recurring Ideas {#recurring-ideas}

The twelve topics are held together by a few ideas, which make good bridges in the question round:

1. **Dynamic programming:** Needleman–Wunsch and Smith–Waterman, Viterbi/Forward/Backward, profile-HMM alignment, progressive MSA (profile–profile DP) and Nussinov.
2. **Log-odds scores** $\log \frac{P(\text{data} \mid \text{model})}{P(\text{data} \mid \text{background})}$: substitution matrices, PSSMs, codon usage, profile-HMM scores and BLAST bit scores.
3. **Background models:** independent letters $q(a)$ versus Markov chains; the background defines what is surprising.
4. **Pseudocounts and regularisation:** PSSMs, HMM training, profile HMMs, Gibbs sampling and Potts models.
5. **Heuristics versus exact methods:** BLAST/BLAT versus Smith–Waterman, progressive MSA versus $N$-dimensional DP, Gibbs/EM versus exhaustive search.
6. **Statistics of chance hits:** E-values, Poisson word counts, false positives when scanning with a PSSM, random ORFs and random RNA folds.

### Dynamic Programming Everywhere {#dp-everywhere}

::: table align="center" title="Dynamic programming across the course"

| Algorithm | Table cell | Recurrence over | Complexity |
| :--- | :--- | :--- | :--- |
| Needleman–Wunsch / Smith–Waterman | Prefixes $(i,j)$ of two sequences | 3 predecessors (+0 for local) | $O(mn)$ |
| Affine gaps (Gotoh) | 3 matrices | Open / extend | $O(mn)$ |
| Viterbi / Forward | (state, position) | All previous states (max / sum) | $O(LK^2)$ |
| Profile-HMM alignment | (model position, sequence position, M/I/D) | Sparse transitions | $O(nL)$ |
| Progressive MSA step | Profile–profile | As pairwise | $O(mn)$ per merge |
| Nussinov | Interval $(i,j)$ of one sequence | 3 cases + $O(N)$ bifurcations | $O(N^3)$ |

:::

The common pattern is optimal substructure, overlapping subproblems, a table filled in dependency order, and a traceback. Viterbi is the "max" version and Forward the "sum" version of the same recurrence.

### Log-Odds Everywhere {#log-odds-everywhere}

Substitution matrices $\log \frac{p_{ab}}{q_a q_b}$; PSSMs $\log \frac{p_i(a)}{q(a)}$; codon usage $\log \frac{P(c \mid \text{coding})}{P(c \mid \text{background})}$; profile-HMM emissions $\log \frac{e_j(a)}{q_a}$; BLAST bit scores; Gibbs sampling probabilities $\propto 2^S$; and CpG-island classification $\log \frac{P(x \mid +)}{P(x \mid -)}$ with two Markov chains. A positive value always means the data are more likely under the model than under the background.

### Model Families {#model-families}

::: table align="center" title="Model families"

| Model | What it captures |
| :--- | :--- |
| PSSM | Independent positions, fixed length, no gaps |
| Profile HMM | Independent positions plus position-specific insertions and deletions |
| Potts model (DCA) | Adds pairwise couplings between positions within a family |
| Covariance model (SCFG) | Adds paired emissions and nested structure for RNA |
| Protein language model | Context-dependent representations learned across all proteins, without an explicit MSA |

:::

## Protein Language Models {#protein-language-models}

Protein language models came up in week 7 and are a possible side question. A language model assigns probabilities to token sequences. Protein language models (ESM, ProtBERT, ProtGPT2) are trained **self-supervised** on millions of UniProt sequences, either with a masked-token objective (BERT-like: predict hidden residues from context) or a next-token objective (GPT-like: generative design). Tokenisation (single amino acids, $k$-mers, …) is a modelling choice. Transformers use **self-attention**, so each position weights information from every other position; attention weights are not automatically mechanistic explanations.

The models output **embeddings** (per residue or pooled per protein) for downstream prediction of localisation, function, stability or structure. A variant-effect score masks the position and compares $\log P(\text{mutant}) - \log P(\text{wild type})$; a negative value means the mutation is disfavoured (the exercise notebook used ESM). Compared with alignments and profiles, which are explicit, interpretable and evolutionary, PLMs learn distributed representations, work without an MSA and generalise beyond close matches, but can exploit dataset shortcuts and biases such as redundancy and over-represented families. Good prediction is not understanding. A useful link: a PLM is like a huge, context-dependent generalisation of a profile or Potts model, learned across all families.

## Formula Sheet {#formula-sheet}

A candidate for the one permitted A4 page:

- **Alignment:** $F(i,j) = \max\{F(i-1,j-1) + s,\ F(i-1,j) - d,\ F(i,j-1) - d\}$; Smith–Waterman adds 0. Affine $g(k) = d_o + (k-1) d_e$.
- **Scores and seeds:** $s(a,b) = \log \frac{p_{ab}}{q_a q_b}$; exact seed length $\lfloor n/(d+1) \rfloor$; P(miss a word) $= 1 - q^k$; random word $M^{-k}$.
- **Statistics:** $E = Kmn\,e^{-\lambda S}$; $P = 1 - e^{-E}$; $S' = (\lambda S - \ln K)/\ln 2$; $E = mn\,2^{-S'}$.
- **Indexing:** perfect hash $\sum x_i M^{k-i}$; suffix array search $O(m \log N)$; suffix tree $O(m + z)$; FM-index $O(m)$.
- **NGS:** $Q = -10 \log_{10} \epsilon$; depth ~ Poisson, $P(D = 0) = e^{-\lambda}$.
- **BWT:** $LF(i) = C[L[i]] + \mathrm{Occ}(L[i], i)$; $l' = C[c] + \mathrm{Occ}(c, l-1) + 1$, $r' = C[c] + \mathrm{Occ}(c, r)$.
- **Motifs:** $w = \log_2 \frac{p}{q}$; Laplace $\frac{n+1}{N+4}$; $I = \sum p \log_2 \frac{p}{q}$; letter height $p \cdot I$.
- **Motif discovery:** word $\lambda = l \prod q$; Markov $f(x_1) \prod P(x_i \mid x_{i-1})$; Poisson tail; Gibbs $P(a) \propto 2^{S(a)}$.
- **HMMs:** $v_l(i+1) = e_l(x_{i+1}) \max_k v_k(i) a_{kl}$; $f_l(i+1) = e_l(x_{i+1}) \sum_k f_k(i) a_{kl}$; $b_k(i) = \sum_l a_{kl} e_l(x_{i+1}) b_l(i+1)$; posterior $f_k(i) b_k(i)/P(x)$; $O(LK^2)$; mean duration $1/(1 - a_{kk})$.
- **Gene finding:** random ORF $(1 - p_{\text{stop}})^n$ with $p_{\text{stop}} = 3/64$; codon emission $P_1(x_1) P_2(x_2 \mid x_1) P_3(x_3 \mid x_1 x_2)$.
- **MSA:** entropy $-\sum c \log p$; SP $\sum_{k<l} s$; exact $O(2^N L^N)$; MI $\sum p_{ab} \log \frac{p_{ab}}{p_a p_b}$; Potts $\frac{1}{Z} \exp(\sum h + \sum J)$; about $5n$ sequences.
- **Profile HMMs:** pseudocounts $\frac{c + Aq}{N + A}$; $P(a \mid b) = q_a e^{s(a,b)}$; $\alpha_{ja} = A \sum_b P(a \mid b) f_{jb}$.
- **Nussinov:** four cases; $O(N^3)$ time, $O(N^2)$ memory.

## Cross-Topic Questions {#cross-topic-questions}

These can follow any presentation.

::: collapse

- Where does dynamic programming appear in the course, and what differs?

  Pairwise alignment (prefix pairs, $O(mn)$), affine gaps (3 matrices), Viterbi/Forward/Backward (state × position, $O(LK^2)$), profile-HMM alignment ($O(nL)$), progressive MSA (profile–profile), Nussinov/MFE (intervals, $O(N^3)$). Common: optimal substructure + overlapping subproblems + table + traceback. Viterbi ↔ NW: max over predecessors; Forward = "sum" version.

- Where do log-odds scores appear?

  Substitution matrices, PSSMs, codon usage, profile HMM emissions, CpG Markov chain classification, BLAST bit scores, Gibbs sampling weights ($2^S$). Always: log of model probability / background probability; positive supports the model.

- Where do pseudocounts appear and why?

  PSSMs, HMM training from labelled data, profile HMMs (add-one, background, substitution, Dirichlet), Gibbs sampling, Potts models (regularisation). Small samples → zeros → −∞ log scores and overfitting.

- Where do Markov chains appear?

  Background models for motif discovery, CpG islands, hidden layer of HMMs, gene finders' higher-order emissions, codon models.

- Connection between a pairwise alignment and an HMM?

  Pair HMM: states M (emit aligned pair with $p_{ab}$), X and Y (emit residue against gap); Viterbi = optimal alignment; transitions δ (open), ε (extend) give affine gaps. Profile HMM = alignment of a sequence to a family model.

- What is the difference between a PSSM, a profile HMM, a Potts model and a protein language model?

  PSSM: independent positions, no gaps. Profile HMM: independent positions + position-specific indels. Potts: + pairwise couplings between positions (family-specific). PLM: neural network trained on all proteins, context-dependent representations capturing long-range dependencies without an explicit MSA.

- What is a protein language model? How could it predict variant effects?

  A transformer trained self-supervised to predict masked (BERT-like, ESM) or next (GPT-like) amino acids from context on millions of sequences; produces embeddings per residue/protein used for downstream tasks (structure, function, localisation). Variant effect: mask the position and compare $\log P(\text{mutant aa})-\log P(\text{wild-type aa})$; negative = disfavoured. Caveats: learns dataset biases/shortcuts; good prediction ≠ mechanistic understanding; interpretability limited; but no MSA needed and generalises to sequences without close homologs.

- Global vs local in different contexts?

  NW vs SW; profile HMM global/local/glocal; BLAST reports local HSPs; MSA is global; motif scanning is local by definition.

- How do heuristics trade accuracy for speed in the course?

  BLAST/BLAT seeds (may miss hits), progressive MSA (may miss optimum), Gibbs/EM (local optima), HMMER filters, BWA seeds. All exchange guaranteed optimality for orders-of-magnitude speedups; calibrate with statistics and benchmarks.

- What is the difference between sensitivity and specificity in sequence search/prediction?

  Sensitivity = TP/(TP+FN) (fraction of true items found); specificity = TN/(TN+FP); precision = TP/(TP+FP). Lowering thresholds (T in BLAST, PSSM threshold, E-value cutoff) increases sensitivity, decreases specificity/precision. Rare positives make precision low even with good specificity.

- Why are protein searches more sensitive than DNA searches, and why are structure/function more conserved than sequence?

  Degenerate code + chemical similarity of amino acids; structure is constrained by function, so many sequences fold alike — "function > structure > sequence" in conservation (27% identity, same fold example). Same for RNA: structure conserved via compensatory mutations.

- Explain Bayes' theorem with an example from the course.

  $P(A|B)=\frac{P(B|A)P(A)}{P(B)}$. Posterior state probabilities in HMMs; genotype calling $P(G|D)\propto P(D|G)P(G)$; probability that a high-scoring PSSM window is a real site needs the prior (base-rate problem); Gibbs sampling probability of a motif position.

- Explain the Poisson distribution's role in the course.

  Number of chance BLAST hits (E-value → P = 1 − e^{−E}); sequencing depth at a site; word counts in motif discovery. All are counts of rare, approximately independent events.

:::

## Closing Thoughts {#closing-thoughts}

Across all of these topics, the same few ideas keep returning. Dynamic programming turns exponential searches over alignments or state paths into tables filled in polynomial time. Log-odds scores compare a model of related or functional sequence with a background, which is why the choice of background changes conclusions in motif discovery, database search and gene finding alike. Heuristics such as seeds, indexes and progressive merging buy speed by discarding candidates early, and nothing later in the pipeline can recover what was discarded. Finally, every score, E-value or posterior is evidence under a model, not proof of homology, binding or function; being explicit about that distinction is usually what separates a good oral-exam answer from a merely correct one.
