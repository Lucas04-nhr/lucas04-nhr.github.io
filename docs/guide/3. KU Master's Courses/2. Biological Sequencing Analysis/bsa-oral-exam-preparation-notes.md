---
title: Biological Sequence Analysis
createTime: 2026/10/31 12:00:00
permalink: /docs/ku-bsa/
excerpt: "A topic-by-topic revision guide for an oral exam in biological sequence analysis, covering alignment, database search, score statistics, indexing, NGS, motifs, HMMs, multiple alignment and profile HMMs, each with a whiteboard route."
tags:
  - Biological Sequence Analysis
  - Exam Preparation
---

An oral exam in biological sequence analysis rewards two things at once: a clear story that can be told in a few minutes, and enough mathematical depth to survive follow-up questions at the whiteboard. These notes are organised around that format. Each topic starts with a short opening statement, then moves through the core definitions and algorithms, and ends with a worked example small enough to reproduce by hand.

::: note How to use these notes
Every section follows the same pattern: **opening → model or recurrence → worked example → interpretation and pitfalls**. The "whiteboard route" lines are the order in which I intend to draw things if asked to explain a topic from scratch.
:::

## 1. Optimal pairwise alignment {#pairwise-alignment}

### Objective and scoring

Pairwise alignment places corresponding residues of two sequences in columns, allowing gaps for insertions and deletions, and maximises a score. Residue order is preserved and gap–gap columns are not allowed. DNA is often scored with simple match/mismatch values, while proteins use substitution matrices. "Optimal" always means optimal under the chosen scoring scheme, not necessarily biologically correct.

$$
S(A) = \sum_{\text{residue pairs}} s(x_i, y_j) - \sum_{\text{gap runs}} g(k)
$$

Enumerating all alignments grows exponentially; dynamic programming (DP) avoids this by reusing optimal solutions for prefixes. The running example uses match $+2$, mismatch $-1$ and a linear gap cost $d = 2$.

### Global alignment: Needleman–Wunsch

Global alignment aligns both sequences end to end. For prefixes $x_{1..i}$ and $y_{1..j}$:

$$
F(i,j) = \max
\begin{cases}
F(i-1,j-1) + s(x_i, y_j) & \text{align residues} \\
F(i-1,j) - d & x_i \text{ against a gap} \\
F(i,j-1) - d & \text{a gap against } y_j
\end{cases}
$$

Initialise $F(0,0)=0$, $F(i,0) = -id$, $F(0,j) = -jd$, fill the table in dependency order, and trace back from $F(m,n)$ to $(0,0)$ along predecessors that attain the maximum. Ties can produce several co-optimal alignments.

**Whiteboard example.** $X = \text{ACG}$ (rows), $Y = \text{TC}$ (columns):

| | ∅ | T | C |
|---|---:|---:|---:|
| ∅ | 0 | −2 | −4 |
| A | −2 | −1 | −3 |
| C | −4 | −3 | 1 |
| G | −6 | −5 | −1 |

Traceback $(3,2) \to (2,2) \to (1,1) \to (0,0)$ gives

```text
A C G
T C -
```

with score $-1 + 2 - 2 = -1$.

### Why DP is correct, and what it costs

If the last column of an optimal alignment is fixed, the remainder must be an optimal alignment of the corresponding prefixes; otherwise replacing it would improve the whole alignment. This is optimal substructure. There are $(m+1)(n+1)$ cells with $O(1)$ work each, so time and space are $O(mn)$. The score alone needs only two rows, i.e. $O(\min(m,n))$ space, but ordinary traceback then loses its history; recovering the alignment in linear space needs an additional method such as Hirschberg's algorithm.

### Local alignment: Smith–Waterman

$$
H(i,j) = \max\{0,\; H(i-1,j-1) + s(x_i,y_j),\; H(i-1,j) - d,\; H(i,j-1) - d\}
$$

with $H(i,0) = H(0,j) = 0$. The zero allows a restart, discarding negative-scoring prefixes. Traceback starts at the highest cell anywhere in the table and stops at zero, so poorly matching flanks are excluded. In the example above the local optimum is just C/C with score 2, whereas the global optimum scores $-1$. Neither mode is inherently better: the choice depends on the biological question (whole homologous genes versus a shared domain). Both run in $O(mn)$.

### Affine gap penalties

With a linear cost, one gap of length 5 costs the same as five gaps of length 1. Affine costs favour fewer, longer gaps, which is more realistic for indels. With $o > e > 0$:

$$
g(k) = kd \;\;(\text{linear}), \qquad g(k) = o + (k-1)e \;\;(\text{affine})
$$

Gotoh's formulation adds states that distinguish opening from extending:

$$
\begin{aligned}
I(i,j) &= \max\{F(i-1,j) - o,\; I(i-1,j) - e\} \\
D(i,j) &= \max\{F(i,j-1) - o,\; D(i,j-1) - e\} \\
F(i,j) &= \max\{F(i-1,j-1) + s(x_i,y_j),\; I(i,j),\; D(i,j)\}
\end{aligned}
$$

$I$ ends in $x_i$/gap and $D$ in gap/$y_j$. For global alignment, boundary cells take the value $-g(i)$ or $-g(j)$ in the valid gap state, impossible states are $-\infty$, and $F(0,0) = 0$. A constant number of states keeps the complexity at $O(mn)$.

### Substitution matrices

For a fixed ungapped alignment with independent columns, compare a related model $M$ (aligned-pair probabilities $p_{ab}$) with a random model $R$ (background frequencies $q_a$):

$$
\log\frac{P(X,Y \mid M)}{P(X,Y \mid R)} = \sum_i \log\frac{p_{x_i y_i}}{q_{x_i} q_{y_i}},
\qquad s(a,b) \propto \log\frac{p_{ab}}{q_a q_b}
$$

A positive score means the pair is enriched over chance, zero means equal, negative means depleted. Logs make scores additive, and conservative substitutions such as I/L/V can score positively without being identical.

| Matrix | Basis | Higher number means |
|---|---|---|
| PAM | Close relatives, extrapolated evolutionary model | Greater distance |
| BLOSUM | Conserved local blocks | Smaller distance |

BLOSUM is built from conserved, ungapped protein blocks: similar sequences are clustered to limit redundancy, weighted pairs are counted between clusters, and the frequencies are turned into scaled, rounded log-odds. BLOSUM62 refers to a 62% clustering threshold, not a minimum identity between every compared pair. BLOSUM80 suits close relatives, BLOSUM45 distant ones. PAM250 means 250 accepted substitutions per 100 residues, which allows repeated changes at the same site; it does not mean 250% observed difference.

::: warning Identity, similarity and homology
Identity is identical residues divided by alignment length. Similarity also counts conservative substitutions under a stated matrix. Homology means common ancestry and is a yes/no claim, not a percentage. A high score alone does not establish homology or shared function.
:::

## 2. Database search with BLAST and BLAT {#blast-and-blat}

### The search problem and the seed principle

Database searching asks which sequences contain a region similar to the query. Smith–Waterman over the whole database costs $O(lL)$ for query length $l$ and total database length $L$, which is accurate but too slow at scale. Heuristics restrict expensive alignment to promising candidates, at the price of possibly missing true matches:

```text
generate words → find seeds → extend → evaluate
```

The pigeonhole argument justifies exact seeds: with $n$ aligned positions and at most $d$ mismatches, split the alignment into $d+1$ blocks; at least one block is mismatch-free and has length at least

$$
k = \left\lfloor \frac{n}{d+1} \right\rfloor.
$$

This guarantee assumes mismatches only, not arbitrary indels.

### Fast lookup and the seed-length trade-off

Instead of comparing every query word with every database position, preprocess the query words into a lookup structure and scan the database once. For fixed $k$ the scan is roughly $O(L)$ plus preprocessing, hit reporting and extension, so total work still depends on database size. A hash table gives expected constant-time lookup with controlled load and collision handling; a search tree is an alternative.

Short words are sensitive but produce many chance hits; long words reduce random matches but miss divergent regions. Low-complexity masking suppresses repetitive, uninformative seeds, and a database index trades memory for speed when many queries are run.

### BLAST step by step

BLAST (Basic Local Alignment Search Tool):

1. Mask low-complexity regions and generate overlapping query words.
2. For proteins, generate neighbourhood words, score them against the query word with a matrix such as BLOSUM62, and keep those above a threshold.
3. Scan the database for exact occurrences of retained words.
4. Extend promising hits into high-scoring segment pairs (HSPs), process them further, and report alignments with significance.

A database word therefore need not equal the original query word; it exactly matches a retained neighbour. Lowering the word-score threshold usually increases sensitivity and computation.

**Whiteboard example.** For query word PQG, the neighbour PEG scores $7 + 2 + 6 = 15$ under BLOSUM62, so Q/E is accepted if 15 meets the threshold. Extending the seed:

| | Flank | | | Seed | | | Flank |
|---|---|---|---|---|---|---|---|
| Query | R | P | P | Q | G | L | F |
| Database | D | P | P | E | G | V | V |
| Score | −2 | 7 | 7 | 2 | 6 | 1 | −1 |

The five-residue segment PPQGL/PPEGV scores 23 and is an HSP in this ungapped example. The seed is only a starting point: extension tests whether the surrounding sequence supports a longer high-scoring region, and a negative substitution need not stop extension immediately. Later steps can produce gapped local alignments, and one sequence pair may contain several separately scored local regions.

### Significance

A large database offers many opportunities for chance matches. The E-value is the expected number of chance matches scoring at least $S$:

$$
E(S) = Kmn\,e^{-\lambda S}, \qquad P(\text{at least one}) \approx 1 - e^{-E(S)}
$$

Higher scores give exponentially smaller E-values; a tenfold larger database gives roughly a tenfold larger E-value. The E-value is an expected count, can exceed 1, and is not the probability that two sequences are unrelated. For small $E$, $P \approx E$. Coverage, length, identity and biological context should be inspected alongside it.

### BLAT: index the genome instead of the query

BLAT (BLAST-Like Alignment Tool) keeps a hash of non-overlapping target words in memory, omitting very common repeats. Overlapping query words are looked up, compatible hits are grouped and then extended. Typical word sizes in the course were 11-mers for DNA and 4–5-mers for protein. Because the target index is reused for many queries, BLAT suits high-identity mapping of transcripts or sequences to a genome, while BLAST supports broader similarity searches.

### Choosing the word length

Let $q$ be identity per position, $w$ the number of independent word opportunities, and $p = q^k$. The number of matching words is $X \sim \text{Binomial}(w, p)$:

$$
P(X=0) = (1-p)^w, \qquad P(X=1) = wp(1-p)^{w-1}
$$

One-hit detection is $1 - P(X=0)$; requiring two hits gives $1 - P(X=0) - P(X=1)$. Increasing $k$ lowers $q^k$: fewer random hits but more missed true matches. These are approximations because overlapping words are dependent.

For random sequence over an alphabet of size $M$, a word matches with probability $M^{-k}$, so for target length $L$ and query length $l$:

$$
E(\text{random seed pairs}) \approx \frac{L}{k}(l - k + 1)M^{-k}
$$

Requiring two hits close together on the same diagonal ($j - i$ constant for ungapped matches) makes random coincidences far rarer. With $N_2$ eligible pairs of non-overlapping seed comparisons, independence gives $E_2 \approx N_2 M^{-2k}$; the eligible pairs must be counted first rather than squaring the one-hit expectation. This lets a shorter $k$ recover sensitivity while controlling extension work. Indels shift the diagonal and are handled by chaining or gapped alignment.

FASTA follows a related route: find exact word hits ($k = 1$–2 for proteins, 4–6 for DNA), identify high-scoring diagonals, rescore and join nearby regions, then run Smith–Waterman in selected windows. Final optimal refinement cannot rescue regions discarded during heuristic filtering.

## 3. Score statistics and E-values {#score-statistics}

### Why a high score needs statistics

A database search tests many possible matches, so even unrelated sequences can produce high scores. The raw score depends on the scoring parameters, the bit score normalises it, and the E-value counts expected chance hits.

### Probabilistic meaning of a score

$$
\frac{P(X,Y \mid M)}{P(X,Y \mid R)} = \prod_i \frac{p_{x_i y_i}}{q_{x_i} q_{y_i}}, \qquad
S = \sum_i \log \frac{p_{x_i y_i}}{q_{x_i} q_{y_i}}
$$

Positive scores favour related pairing over chance. Gapped alignments also subtract gap penalties. Raw scores depend on the matrix and gap costs, so they cannot be compared directly across scoring schemes.

### Extreme values

What is reported is the best local score, so the relevant null distribution is that of a maximum, not of a typical score. Under suitable assumptions it is approximately a Gumbel (extreme-value) distribution rather than normal. This requires the expected substitution score under the background to be negative while some scores are positive, so random alignments do not keep improving with length. Gapped searches use parameters calibrated by simulation.

### E-value and search space

$$
E(S) = Kmn\,e^{-\lambda S}
$$

$m, n$ are effective query and database lengths; $K$ and $\lambda$ depend on the scoring system and background.

$$
P(S_{\max} \le x) \approx \exp\!\left[-Kmn\,e^{-\lambda x}\right], \qquad
P(S_{\max} \ge S) \approx 1 - e^{-E(S)}
$$

The probability follows from a Poisson argument: if the number of chance hits above the threshold is approximately Poisson with mean $E$, the probability of none is $e^{-E}$. $E$ is a count and may exceed 1; a probability cannot. For $E \ll 1$, $1 - e^{-E} \approx E$. Neither is a posterior probability of homology.

| Change (other factors fixed) | Effect on E-value |
|---|---|
| Raw score increases by $\Delta S$ | Multiply by $e^{-\lambda \Delta S}$ |
| Database length $n \to 10n$ | Multiply by 10 |
| Search space $mn \to 2mn$ | Multiply by 2 |

The same alignment receives a larger E-value in a larger database. For illustration, $E = 0.01$ gives $P \approx 0.00995$, whereas $E = 2$ gives $P \approx 0.865$.

### Bit scores

$$
S' = \frac{\lambda S - \ln K}{\ln 2}, \qquad E = mn\,2^{-S'}
$$

Bit scores are expressed in standardised units and do not themselves include database size. At fixed search space, one extra bit halves the E-value; doubling the database requires one extra bit to keep the same E-value; a tenfold increase requires $\log_2 10 \approx 3.32$ bits.

**Worked example.** Let $S' = 30$ bits and $mn = 10^6$. Then $E = 10^6 / 2^{30} \approx 9.31 \times 10^{-4}$ and $P \approx 0.000931$. In a 100-fold larger database, $E \approx 0.0931$ and $P \approx 0.0889$; keeping the original E-value needs $\log_2 100 \approx 6.64$ more bits. To require $E \le E_0$, solve $S' \ge \log_2(mn/E_0)$: for $mn = 10^6$ and $E_0 = 0.01$, the cutoff is about 26.58 bits.

### Pitfalls

- A stricter cutoff reduces chance hits but may miss weak homologues.
- Low complexity and composition bias violate the background model; masking or composition correction helps.
- A short identical match can still have a relatively large E-value.
- Statistical significance supports further investigation; it does not establish identical function.

Whiteboard route: log-odds → random maximum → $E = Kmn\,e^{-\lambda S}$ → $P = 1 - e^{-E}$ → bit score and $E = mn\,2^{-S'}$.

## 4. String matching and indexing {#string-matching}

### Exact seeds

String matching finds a query pattern of length $m$ inside a reference of length $N$; with $z$ occurrences, full alignment would cost about $O(mN)$. The same pigeonhole argument as before applies: $m = 12$ and $d = 2$ give three 4-base blocks, at least one of which matches exactly. For independent uniform letters, a random word matches with probability $M^{-k}$.

### Hash tables

A hash maps a word to a bucket holding the key and its occurrence positions. Distinct words can collide in a bucket; chaining or open addressing resolves this by comparing keys. With a suitable hash and controlled load, bucket lookup is expected $O(1)$, but forming the key costs $O(k)$ and reporting positions costs $O(z)$, so the whole search is not constant time.

For DNA, encode A = 0, C = 1, G = 2, T = 3:

$$
h(x_1 \cdots x_k) = \sum_{i=1}^{k} x_i\, 4^{k-i}, \qquad h(\text{ACGT}) = 27
$$

This is collision-free for fixed $k$, but direct addressing needs $4^k$ slots, which grows exponentially. Indexing the query and scanning the database is the classical BLAST layout; indexing the database once for many queries is the BLAT layout.

### Suffix tries and suffix trees

Every substring is a prefix of some suffix, so indexing suffixes indexes all substrings. A unique terminator `$` ensures no suffix is a prefix of another.

- **Suffix trie:** one character per edge, shared prefixes share paths, leaves store suffix starts. Worst-case time and space $O(N^2)$.
- **Suffix tree:** non-branching paths are compressed into single edges whose labels are stored as intervals in the reference. Linear-time construction exists under suitable alphabet assumptions; space is $O(N)$ with substantial constant overhead.

To build a small tree by hand, list all suffixes, insert them one by one, split an edge at the first mismatch when a new suffix diverges inside it, and mark leaves with suffix starts. Searching starts at the root and consumes query characters along edges; a mismatch means no occurrence, and all descendant leaves of the end point give the positions. Existence costs $O(m)$; reporting all matches costs $O(m + z)$.

For BANANA\$, the root branches to `$`, `A`, `BANANA$` and `NA`. Searching ANA follows A then NA, and the descendant leaves give positions 2 and 4 (1-based). A generalised suffix tree indexes several sequences with distinct terminators and labels leaves by (sequence ID, start).

### Suffix arrays

A suffix array stores suffix start positions in sorted order:

| Rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| SA | 7 | 6 | 4 | 2 | 1 | 5 | 3 |
| Suffix | `$` | `A$` | `ANA$` | `ANANA$` | `BANANA$` | `NA$` | `NANA$` |

All suffixes starting with the query form a contiguous interval, found by two binary searches. For ANA, ranks 3–4 map to reference positions 4 and 2. Ranks are not reference coordinates.

| Structure | Space | Search including output |
|---|---|---|
| Hash of fixed $k$-mers | Representation-dependent | Expected $O(1)$ per bucket, plus key and output |
| Suffix trie | $O(N^2)$ | $O(m + z)$ |
| Suffix tree | $O(N)$, high overhead | $O(m + z)$ |
| Suffix array | $O(N)$, compact | $O(m \log N + z)$ |

Naive comparison sorting of suffixes can cost $O(N^2 \log N)$; specialised linear-time construction exists. The BWT/FM-index reduces memory further.

For mismatch-tolerant search, split the query into $d+1$ blocks, search each exactly, use block offsets to infer candidate starts, and verify. Exact seeds locate candidates; extension handles mismatches and gaps.

## 5. Next-generation sequencing and the BWT {#ngs-and-bwt}

### Data, quality and workflow

Next-generation sequencing produces many reads from sampled DNA fragments. Illumina uses sequencing by synthesis on an adapter-prepared library; paired-end reads cover both fragment ends. A typical pipeline:

```text
sample → library → sequencing → FASTQ → QC / adapter trimming
       → reference mapping → SAM/BAM → filtering, variant and genotype inference → VCF
```

FASTA stores identifiers and sequences; FASTQ stores four lines per read (ID, sequence, `+`, per-base quality string); SAM/BAM store alignment records (reference, position, flag, MAPQ, CIGAR, sequence, qualities); VCF stores variants and genotypes.

Base quality and mapping quality both use the Phred scale but describe different uncertainties:

$$
Q = -10 \log_{10} P(\text{error}), \qquad P(\text{error}) = 10^{-Q/10}
$$

Q20 means a 1% error probability and Q30 means 0.1%; FASTQ usually encodes $Q$ as ASCII $Q + 33$. A read in a repeat can have excellent base qualities and still a low MAPQ, because its placement is uncertain.

Depth counts reads covering a position; breadth is the fraction of positions covered. Under uniform independent sampling, $D \sim \text{Poisson}(\lambda)$ and $P(D \ge 1) = 1 - e^{-\lambda}$, so a given mean depth does not guarantee every site is covered. Duplicates add reads without independent evidence. Ancient DNA brings short fragments, low endogenous content, contamination and low complexity; deamination (C→U) shows up as terminal C→T or G→A, which causes errors but also helps authenticate genuinely ancient molecules.

A few record-reading details: SAM `POS` is 1-based and `FLAG` is a bit mask. The CIGAR `5M1I4M2D3M` consumes 13 read bases and 14 reference bases; `M` covers matches and mismatches, `I`/`D` are relative to the reference, and `S` clips read bases. Genotypes are inferred with $P(G \mid D) \propto P(D \mid G) P(G)$; in a VCF, `0/1` means REF and the first ALT, unphased.

### Why index the reference

Millions of reads must be mapped to a large genome while tolerating errors and real differences. Full DP for every read is too expensive, so the reference is preprocessed once. With reference length $m$ (including `$`) and query length $n$:

| Index | Representation | Exact search |
|---|---|---|
| Suffix tree | Compressed tree of suffixes | $O(n)$ |
| Suffix array | Sorted suffix starts | $O(n \log m)$ |
| FM-index | Compressed BWT plus rank support | $O(n)$, assuming constant-time rank |

The FM-index search counts occurrences; locating all coordinates is extra. Its practical memory footprint is far smaller than an explicit suffix tree.

### Building the BWT

Append `$`, sort all cyclic rotations, and take the last column $L$; the first column is $F$. For BANANA\$:

$$
SA = (7,6,4,2,1,5,3), \qquad F = \texttt{\$AAABNN}, \qquad L = \texttt{ANNB\$AA}
$$

Row 3, for instance, is `ANA$BAN`: its suffix starts at 4 and the preceding character is N. Each $L[i]$ is the character immediately before the corresponding suffix. In practice the BWT is derived from the suffix array without materialising the rotation matrix. The transform is reversible and groups similar contexts, which makes compression easier, but it does not shorten the string by itself.

### LF mapping

The key property is occurrence order: the $k$-th A in $L$ corresponds to the $k$-th A in $F$. With 1-based inclusive indices:

$$
C[c] = \#\{\text{characters} < c\}, \qquad \mathrm{Occ}(c, i) = \#\{c \text{ in } L[1..i]\}, \qquad
LF(i) = C[L[i]] + \mathrm{Occ}(L[i], i)
$$

$LF$ moves to the row whose suffix starts one position earlier in the reference, so repeated LF steps reconstruct the text backwards from `$`. An FM-index stores the BWT, $C$, rank support for $\mathrm{Occ}$, and usually a sampled suffix array for locating hits, trading memory against locating time.

### Backward search

Process the query right to left, keeping the interval $[l, r]$ of sorted rows whose suffixes begin with the part matched so far. Start with $[1, m]$. To prepend $c$:

$$
l' = C[c] + \mathrm{Occ}(c, l-1) + 1, \qquad r' = C[c] + \mathrm{Occ}(c, r)
$$

If $l' > r'$ there is no exact match. At the end, the count is $r - l + 1$, and coordinates come from $SA[l..r]$ or from LF walks to sampled positions.

**Worked example.** Reference `AGACCCATGACC$`, BWT `CGG$CCCACATAA`:

| $c$ | `$` | A | C | G | T |
|---|---|---|---|---|---|
| $C[c]$ | 0 | 1 | 5 | 10 | 12 |

Searching GACC:

| Character added | Pattern matched | Interval |
|---|---|---|
| C | C | [6, 10] |
| C | CC | [8, 10] |
| A | ACC | [2, 3] |
| G | GACC | [11, 12] |

For example, extending C to CC gives $l' = 5 + \mathrm{Occ}(C, 5) + 1 = 5 + 2 + 1 = 8$ and $r' = 5 + \mathrm{Occ}(C, 10) = 10$. The final count is 2 and the reference starts are 2 and 9; the interval [11, 12] contains row numbers, not genomic coordinates. As an LF check, $L[6] = \text{C}$ and $LF(6) = 5 + 3 = 8$.

### From exact search to read alignment

Exact backward search cannot handle mismatches or indels on its own, so mappers use seed-and-extend: find seeds with the index, locate and group compatible hits, extend candidates with mismatches and gaps, compare alternatives, and assign MAPQ. BWA-aln seeds from the first bases of the read (configurable length) before extending; BWA-MEM finds maximal exact matches, chains compatible hits and extends them with local alignment. Short reads in repeats create alternative placements, while longer reads and paired-end constraints improve specificity.

## 6. Motifs, weight matrices and logos {#motifs-and-logos}

### Why a consensus is not enough

A sequence motif is a short recurring pattern associated with a function: donor splice sites, transcription-factor binding sites, signal-peptide cleavage sites. The donor site is the exon-to-intron boundary in pre-mRNA. Instances vary, so a consensus loses information. In the course's donor-site data, the single most common complete sequence accounted for only 92 of 1230 sites (about 7.5%). The intronic GT is conserved, but GT alone is common in background DNA.

### Counts, probabilities and log-odds weights

For $N$ aligned sites of width $L$, with $n_i(a)$ the count of symbol $a$ at position $i$ and background $q(a)$:

$$
p_i(a) = \frac{n_i(a)}{N}, \qquad w_i(a) = \log_2 \frac{p_i(a)}{q(a)}
$$

The terminology varies (count matrix, probability matrix, PWM, PSSM), so it is worth stating which one is meant. Positive weights mean enrichment relative to background, negative weights depletion. A uniform DNA background is $q(a) = 1/4$, but real backgrounds are often unequal and change the scores.

An unobserved symbol gives $p_i(a) = 0$ and $w_i(a) = -\infty$, which would veto any window containing it. Pseudocounts fix this; Laplace smoothing adds one per symbol before normalising:

$$
p_i(a) = \frac{n_i(a) + 1}{N + 4} \quad (\text{DNA}), \qquad \frac{n_i(a)+1}{N + 20} \quad (\text{protein})
$$

### Scoring windows

Assuming independent positions under both models:

$$
S(x) = \sum_{i=1}^{L} w_i(x_i) = \log_2 \frac{P(x \mid M)}{P(x \mid B)}
$$

A score $S$ means the window is $2^S$ times as probable under the motif model as under background. This is a likelihood ratio, not a posterior probability of function, which would also need a prior. Sliding a width-$L$ matrix over a length-$n$ sequence gives $n - L + 1$ windows (24 bases and an 8-base matrix give 17 windows) at a naive cost of $O(nL)$.

### Thresholds and the base-rate problem

Predict a site when $S \ge t$. Lowering $t$ raises sensitivity and false positives; raising it does the opposite. Thresholds should be evaluated on held-out data or by cross-validation. Because most genomic windows are negatives, precision with prevalence $\pi$ is

$$
\text{precision} = \frac{\pi\,\text{TPR}}{\pi\,\text{TPR} + (1-\pi)\,\text{FPR}}
$$

so even a small false-positive rate can swamp true hits. The course's donor model gave roughly 1.5 false positives per kilobase at 80% sensitivity, a dataset-specific figure.

### Information content is the expected weight

A logo summarises a column, while a PSSM scores a base. Averaging the weight over the motif frequencies connects them:

$$
I_i = \sum_a p_i(a)\, w_i(a) = \sum_a p_i(a) \log_2 \frac{p_i(a)}{q(a)} = D_{\mathrm{KL}}(p_i \,\|\, q)
$$

Individual weights can be negative, but $I_i \ge 0$, with equality only when $p_i = q$. For a uniform background over $K$ symbols, $I_i = \log_2 K - H_i$ with $H_i = -\sum_a p_i(a) \log_2 p_i(a)$; for DNA, $I_i = 2 - H_i$.

| Column distribution | $H_i$ | $I_i$ |
|---|---|---|
| Four equally frequent bases | 2 bits | 0 bits |
| Two equally frequent bases | 1 bit | 1 bit |
| One fully conserved base | 0 bits | 2 bits |

The 2-bit ceiling assumes a uniform background; a fully conserved base $a$ against a non-uniform background gives $\log_2[1/q(a)]$. For proteins the uniform maximum is $\log_2 20 \approx 4.32$ bits.

### Reading a logo

The horizontal axis is motif position, the total stack height is $I_i$, relative letter heights are the frequencies, and the absolute letter height is $h_i(a) = p_i(a)\, I_i$. A zero-height stack under a uniform background means equal frequencies, not a missing position. Logo heights should not be confused with the signed terms inside the KL sum.

**Small calculation.** With $p_i(\text{G}) = 0.7$, other bases 0.1 and $q = 0.25$:

$$
w_i(\text{G}) = \log_2 2.8 \approx 1.49, \quad w_i(\text{A,C,T}) = \log_2 0.4 \approx -1.32, \quad
I_i \approx 0.7(1.49) + 0.3(-1.32) \approx 0.64 \text{ bits}
$$

The G letter is $0.7 \times 0.64 \approx 0.45$ bits tall. Three different numbers describe the same column: base weight 1.49, column information 0.64, and letter height 0.45.

### Protein application and limitations

For signal-peptide cleavage, 1011 proteins were aligned over 10 residues before and 5 after the cut, giving a $20 \times 15$ matrix used to scan candidate positions with a realistic amino-acid background. The model's limits are structural: independent positions ignore residue correlations, fixed widths do not model indels, and predictions depend on alignment quality and representative training data.

Whiteboard route: aligned sites → counts → probabilities with pseudocounts → log-odds → window score and threshold → expected score as KL divergence → logo.

## 7. Motif discovery {#motif-discovery}

### Scanning versus discovery

Scanning assumes the motif model is known and looks for occurrences. Discovery starts from sequences believed to share a signal, such as promoters of co-regulated genes, without knowing either the pattern or its locations. Short, variable motifs can also arise by chance in heterogeneous background.

### Word enrichment

Enumerate all $k$-mers ($4^k$ for DNA), count them, and compare with the background expectation. For independent bases:

$$
P_0(w) = \prod_{i=1}^{k} q(w_i), \qquad \lambda = M P_0(w), \qquad \text{enrichment} = z / \lambda
$$

where $z$ is the observed count and $M = \sum_s \max(L_s - k + 1, 0)$ counts valid start positions. Enrichment is a ratio relative to the chosen background, not a significance test.

### Why a Markov background matters

Neighbouring bases are correlated, and an independent model can mistake composition biases for motifs. A first-order Markov model uses

$$
P_0(w) = f(w_1) \prod_{i=2}^{k} P(w_i \mid w_{i-1}).
$$

In the course example (761 bases, 144 C, 178 G, 24 CG, 30 GC, one observed CGCG), ignoring edge effects:

$$
P_0(\text{CGCG}) = \frac{144}{761} \cdot \frac{24}{144} \cdot \frac{30}{178} \cdot \frac{24}{144}
$$

| Background | Expected count $\lambda$ | Enrichment $1/\lambda$ |
|---|---|---|
| Independent bases | 1.49 | 0.67 |
| First-order Markov | 0.674 | 1.48 |

The same word moves from apparent depletion to enrichment purely because of the background: the null model defines what counts as surprising.

### Significance

For rare, roughly independent occurrences, $K \sim \text{Poisson}(\lambda)$ and

$$
p = P(K \ge z) = \sum_{j=z}^{\infty} \frac{e^{-\lambda} \lambda^j}{j!}.
$$

Enrichment measures effect size; the p-value measures surprise under the null. Self-overlapping or periodic words create dependent counts, and testing many words requires multiple-testing correction. Fisher's exact test compares word hits and non-hits between foreground and background in a 2×2 table, summing the hypergeometric tail; composition, lengths and counting units must be matched.

When the input is an expression experiment, a fixed cutoff is arbitrary. In a miR-21 knock-down, direct targets may rise in expression once repression is released, so their 3′ UTRs should be enriched for target sites. Ranking genes by expression change and testing enrichment across successive cutoffs avoids choosing one threshold; Sylamer uses Fisher statistics along the ranking and cWords a related approach. A sequence hit alone does not prove direct targeting.

### Variable motifs and Gibbs sampling

Exact-word methods split a variable motif into many strings; a probability matrix combines them. With width $k$ and candidate start $a$:

$$
S(x, a) = \sum_{i=1}^{k} \log_2 \frac{p_i(x_{a+i-1})}{q(x_{a+i-1})}, \qquad
p_i(b) = \frac{c_i(b) + \alpha(b)}{\sum_{b'} [c_i(b') + \alpha(b')]}
$$

Known sites would give the matrix, and a known matrix would give the sites. Gibbs sampling breaks this circularity by updating one sequence at a time, assuming a fixed width, one ungapped site per sequence, and independent positions:

::: steps
1. Choose a random motif start in every sequence.
2. Select one sequence $r$ and temporarily leave it out.
3. Estimate the motif matrix from the current sites in the remaining sequences, with pseudocounts.
4. Score every valid start in sequence $r$.
5. Convert the scores into probabilities and sample a new start.
6. Repeat, check stability, and use several random initialisations.
:::

Leaving $r$ out prevents its current site from reinforcing the matrix used to rescore it. With a fixed background and uniform prior over starts, $P(x \mid a, \Theta) = Q(x)\, 2^{S(x,a)}$, where the all-background term $Q(x)$ cancels on normalisation:

$$
P(a \mid x, \Theta) = \frac{2^{S(x,a)}}{\sum_j 2^{S(x,j)}}
$$

(With natural-log scores, use $e^{S}$.) The new start is sampled, not chosen as the maximum, so lower-scoring positions remain possible and the sampler can explore. For scores $(0, 1, 2)$ the weights are $(1, 2, 4)$ and the probabilities $(1/7, 2/7, 4/7)$; a uniform draw $u = 0.6$ falls in $[3/7, 1)$ and selects the third site.

### Limitations and related methods

Finite runs do not guarantee the best motif; the sampler can stay near local solutions or shifted versions of the motif. The width may be wrong, and sequences may contain zero or several sites. Multiple starts, joint shifts, width changes, flexible site counts and better backgrounds help, but a standard PSSM still cannot model dependencies between positions. The course application was the ribosome binding signal upstream of *E. coli* genes.

An HMM can represent background and successive motif-position states, with the hidden path giving motif locations. MEME uses expectation maximisation from candidate seeds, supports different occurrence models, and can find several motifs, again with possible local optima. An enriched motif is a candidate biological signal; enrichment alone does not prove binding or regulatory function.

## 8. Hidden Markov models {#hidden-markov-models}

### Model and assumptions

A hidden Markov model describes observations $x_{1:N}$ generated by hidden states $z_{1:N}$, with parameters

$$
\pi_k = P(z_1 = k), \qquad a_{kl} = P(z_{i+1} = l \mid z_i = k), \qquad e_k(b) = P(x_i = b \mid z_i = k).
$$

The next state depends only on the current state (first-order Markov), and each observation depends only on its own state. The joint probability is

$$
P(x, z) = \pi_{z_1} e_{z_1}(x_1) \prod_{i=2}^{N} a_{z_{i-1} z_i}\, e_{z_i}(x_i),
$$

with each of $\pi$, the rows of $A$ and each emission distribution summing to 1. Simulation samples a start state, emits, samples the next state and repeats. The formulas below assume a fixed sequence length with no explicit end state.

### The occasionally dishonest casino

Hidden states are a fair die F and a loaded die L; observations are rolls 1–6.

$$
A = \begin{pmatrix} 0.95 & 0.05 \\ 0.10 & 0.90 \end{pmatrix}, \qquad
e_F(b) = \tfrac{1}{6}, \qquad e_L(6) = \tfrac{1}{2}, \qquad e_L(1,\ldots,5) = \tfrac{1}{10}
$$

Rows are the current state and columns the next, ordered (F, L). A run of sixes supports L, but a single six is not conclusive: emissions supply local evidence while transitions favour persistence, so short genuine switches can be missed. As an example, $P(x = 66, z = FL) = \pi_F \cdot \tfrac{1}{6} \cdot 0.05 \cdot \tfrac{1}{2}$.

| Question | Algorithm |
|---|---|
| Generate a sequence | Simulation |
| Most probable complete state path | Viterbi |
| Probability of the observations $P(x)$ | Forward |
| State probabilities at each position | Forward–Backward |
| Estimate parameters with unknown states | Baum–Welch |

### Viterbi: the best complete path

Since $P(x)$ is constant across paths, $z^* = \arg\max_z P(z \mid x) = \arg\max_z P(x, z)$. Let $v_k(i)$ be the highest joint probability of a path generating $x_{1:i}$ and ending in $k$:

$$
v_k(1) = \pi_k e_k(x_1), \qquad v_k(i) = e_k(x_i) \max_l \left[v_l(i-1)\, a_{lk}\right]
$$

Store the argmax pointers, choose $z_N^* = \arg\max_k v_k(N)$, and trace back. The result is a globally optimal path, not a set of independent position-wise choices.

### Forward: summing over paths

$f_k(i) = P(x_{1:i}, z_i = k)$ replaces the max with a sum:

$$
f_k(1) = \pi_k e_k(x_1), \qquad f_k(i) = e_k(x_i) \sum_l f_l(i-1)\, a_{lk}, \qquad P(x) = \sum_k f_k(N)
$$

Viterbi keeps the best path into each state; Forward adds all of them. Both reuse prefixes instead of enumerating $K^N$ paths.

### Backward and posterior decoding

$b_k(i) = P(x_{i+1:N} \mid z_i = k)$ covers the remaining observations and excludes $x_i$, which Forward already includes:

$$
b_k(N) = 1, \qquad b_k(i) = \sum_l a_{kl}\, e_l(x_{i+1})\, b_l(i+1), \qquad
\gamma_k(i) = P(z_i = k \mid x) = \frac{f_k(i)\, b_k(i)}{P(x)}
$$

Useful checks are $\sum_k \gamma_k(i) = 1$ and $\sum_k f_k(i) b_k(i) = P(x)$ at every position. Posterior decoding picks $\arg\max_k \gamma_k(i)$ independently at each position. It optimises position-wise accuracy and keeps uncertainty visible in posterior curves, but it can differ from Viterbi and may even produce an invalid path when some transitions are forbidden.

### Parameter estimation

With known state paths, count transitions $A_{kl}$ and emissions $E_k(b)$, add pseudocounts, and normalise:

$$
a_{kl} = \frac{A_{kl}}{\sum_j A_{kj}}, \qquad e_k(b) = \frac{E_k(b)}{\sum_c E_k(c)}
$$

With unknown states, use expected counts under the current parameters. The adjacent-state posterior is

$$
\xi_{kl}(i) = P(z_i = k, z_{i+1} = l \mid x) = \frac{f_k(i)\, a_{kl}\, e_l(x_{i+1})\, b_l(i+1)}{P(x)},
$$

and for one sequence

$$
a_{kl} = \frac{\sum_{i=1}^{N-1} \xi_{kl}(i)}{\sum_{i=1}^{N-1} \gamma_k(i)}, \qquad
e_k(b) = \frac{\sum_{i=1}^{N} \gamma_k(i)\, \mathbf{1}[x_i = b]}{\sum_{i=1}^{N} \gamma_k(i)}, \qquad \hat\pi_k = \gamma_k(1).
$$

For several independent sequences, aggregate the counts without adding transitions between sequences.

Baum–Welch is expectation maximisation: initialise within a fixed topology; in the E-step run Forward–Backward to get expected transition and emission counts; in the M-step normalise them; repeat until the log-likelihood $\ell(\theta) = \sum_j \log P(x^{(j)} \mid \theta)$ stops improving. Exact EM never decreases the likelihood but does not guarantee a global optimum, so initialisation and multiple starts matter. Viterbi training instead counts along the single best path, and decoding alone never updates parameters.

### Complexity, durations and biological meaning

Dense algorithms take $O(NK^2)$ time for $K$ states. The likelihood alone needs $O(K)$ rolling memory, while traceback or stored posteriors need $O(NK)$. To avoid underflow, use scaling or log probabilities (log-sum-exp for Forward, max for Viterbi).

A self-loop implies a geometric duration:

$$
P(D = \ell) = a_{kk}^{\ell-1}(1 - a_{kk}), \qquad E[D] = \frac{1}{1 - a_{kk}}
$$

so the casino's fair and loaded dice persist for 20 and 10 rolls on average. In biological models, states represent regions, emissions describe sequence preferences, and topology constrains their order; a signal peptide, for example, has a K/R-rich N-region, a hydrophobic H-region and a cleavage-associated C-region before the mature protein.

Whiteboard route: casino → joint probability → Viterbi (max) → Forward (sum) → Backward and posteriors → expected counts and Baum–Welch.

## 9. Applying HMMs to biological sequences {#hmm-applications}

### From biology to a model

Biological sequences contain regions with different properties in a constrained order. An HMM represents those regions as hidden states and the residues as emissions; begin and end states are usually silent:

$$
P(x, z) = a_{B z_1} e_{z_1}(x_1) \prod_{i=2}^{n} a_{z_{i-1} z_i} e_{z_i}(x_i)\; a_{z_n E}
$$

The point is to combine weak local evidence into a single coherent annotation. Training only learns parameters within the chosen architecture; it does not discover the correct biology by itself.

### Signal peptides and the cleavage boundary

A simple model is $B \to S \to Q \to M \to E$, with self-loops in the signal ($S$) and mature ($M$) states and $Q$ marking the cleavage-associated residue. Because the physical cut lies between residues, the labelling convention has to be stated.

| Refined state | Region | Emission preference |
|---|---|---|
| $N$ | N-terminal region | Positively charged, K/R-rich |
| $H$ | Hydrophobic core | Hydrophobic residues |
| $C$ | C-terminal signal region | Polar, cleavage-associated |
| $Q_{-1}, Q$ | Positions next to the cut | Position-specific preferences |
| $M$ | Mature protein | Typical protein composition |

The refined topology $B \to N \to H \to C \to Q_{-1} \to Q \to M \to E$ uses loops for variable region lengths and dedicated boundary states to learn a local motif; several internal states may share one coarse label. In the exercise, region-specific emissions and a pre-cleavage state improved exact cut prediction, though more complexity is not automatically better.

### Training and decoding

Training takes a model specification and sequences and returns an estimated model. Fully labelled paths allow counting with pseudocounts; coarse labels can leave internal states unresolved; unknown paths require Baum–Welch (expected counts) or Viterbi training (hard counts from the best path), both sensitive to initialisation.

Decoding takes a trained model and a sequence and returns labels and posteriors without re-estimating anything:

$$
z^* = \arg\max_z P(z \mid x) \;\;(\text{Viterbi}), \qquad z_i = \arg\max_k P(z_i = k \mid x) \;\;(\text{posterior})
$$

::: warning Why posterior decoding can miss the cut
Every legal path through this topology contains $Q$, so Viterbi must predict a cut. Posterior decoding decides each position independently: the cut probability can be spread across neighbouring residues and never be the largest at any single one. The result can omit $Q$ or violate allowed transitions, even though the boundary certainly exists and only its location is uncertain. For labels shared by several states, sum their posteriors first.
:::

### Evaluation

In a confusion matrix (rows actual, columns predicted), the diagonal holds correct predictions and the off-diagonal cells show which labels are over- or underpredicted. For a target class,

$$
\text{recall} = \frac{TP}{TP + FN}, \qquad \text{precision} = \frac{TP}{TP + FP}.
$$

Residue-level accuracy and exact cleavage-site accuracy per protein measure different things: one misplaced cut can coexist with almost perfect residue accuracy, and rare boundary labels make overall accuracy misleading. Five-fold cross-validation trains on four subsets and tests on the fifth in turn; close homologues should stay in the same fold to limit leakage, and a separate final test set is needed if validation was used to choose the design.

### Prokaryotic gene finding

An open reading frame (ORF) is a stretch without an in-frame stop, but random DNA contains ORFs too, so a gene finder combines codon usage, ORF length, the ribosome binding site (RBS) and start/stop signals. A schematic forward-strand architecture:

```text
Intergenic → RBS → Start → (C1 → C2 → C3)+ → Stop → Intergenic
```

Codon usage is scored against a composition-matched background, $s(c) = \log_2 [P(c \mid \text{coding}) / P(c \mid \text{background})]$, and summed over codons under an independence assumption. GC enrichment alone is not sufficient evidence.

Three phase states with independent single-base emissions cannot capture codon preferences: TAA is a stop while TAT is a sense codon. Context-dependent emissions or expanded states are needed:

$$
P(x_1 x_2 x_3) = P_1(x_1)\, P_2(x_2 \mid x_1)\, P_3(x_3 \mid x_1 x_2)
$$

For random ORF lengths with stop probability $p$ per independent triplet,

$$
P(\text{no stop in } m \text{ codons}) = (1-p)^m, \qquad P(m \text{ non-stops then a stop}) = (1-p)^m p,
$$

with $p = 3/64$ for uniform bases under the standard code. Long ORFs support coding but are insufficient alone; tools such as GeneMark decode an integrated model with Viterbi.

### Eukaryotic genes

Introns interrupt the coding sequence, and repeats and variable GC content complicate background modelling. The core path is

```text
Exon → Donor → Intron → Acceptor → Exon
```

with repeated introns and intronless genes allowed, start and stop modules delimiting the CDS, and optional promoter, transcription start, UTR and poly-A modules. Transcription start differs from translation start, and the stop codon is not the transcript end. Splice-site scores supply local evidence while the full model enforces a coherent structure. Intron phase (0, 1 or 2) must be tracked, because introns can fall between codons or after one or two bases of a codon; separate phase paths keep the reading frame intact when exons are joined. HMMgene and GENSCAN are examples.

### Generalised HMMs

Ordinary self-loops imply geometric lengths, meaning the chance of leaving a state does not depend on how long the model has stayed. A generalised HMM samples a length explicitly and emits a whole segment. GENSCAN combines explicit lengths with gene signals and strand structure, at the cost of a more expensive DP over candidate lengths.

Membrane-protein topology is another application: amino-acid emissions separate hydrophobic transmembrane helices from inside and outside loops (inside → TM → outside → TM → inside), the positive-inside bias adds evidence, and multiple helix states or explicit lengths constrain the span. Hydrophobic signal peptides must be distinguished using cleavage and context evidence.

Whiteboard route: define observations and states → draw the signal-peptide topology → explain the missing posterior cut → draw the coding cycle and exon–intron path → geometric versus explicit lengths.

## 10. Multiple sequence alignment and co-evolution {#msa-and-coevolution}

### Purpose

A multiple sequence alignment (MSA) places corresponding residues of several related sequences into shared columns. Ideally a column represents a shared ancestral residue or an equivalent structural position, and these two goals need not coincide. MSAs support remote homology detection, family definition, functional-site analysis, phylogeny, profiles and co-evolution studies. A good alignment aligns key residues and structural cores and keeps indels coherent; a high score does not guarantee biological correctness.

### Scoring: entropy and sum of pairs

Most objectives are column-additive, $S(M) = G(M) + \sum_i S(M_i)$ with a gap term $G$, which ignores dependencies between columns.

Minimum entropy uses column counts $c_i(a)$, $n_i = \sum_a c_i(a)$ and $p_i(a) = c_i(a) / n_i$:

$$
H_i = -\sum_a p_i(a) \log_2 p_i(a), \qquad -\log_2 P(M_i) = -\sum_a c_i(a) \log_2 p_i(a) = n_i H_i
$$

Conserved columns have zero entropy; gaps must be penalised so that the objective does not reward artificial conservation.

Sum of pairs (SP) adds substitution scores over every pair of sequences in every column:

$$
S_{SP}(M) = G(M) + \sum_i \sum_{k<l} s(m_{ki}, m_{li})
$$

Each pair is counted once and gaps must be defined consistently. SP is practical but not a full phylogenetic model.

**Whiteboard example.** Sequences ACG, ACT, AGT and ACG give $\binom{4}{2} = 6$ pairs per column; with match 1 and mismatch 0:

| Column composition | $H_i$ (bits) | $n_i H_i$ | SP |
|---|---|---|---|
| 4 A | 0 | 0 | 6 |
| 3 C, 1 G | 0.811 | 3.245 | 3 |
| 2 G, 2 T | 1 | 4 | 2 |

Entropy values are always non-negative; negative numbers in some versions of this example are typos.

### Why exact MSA is infeasible

For $N$ sequences of length $L$, exact DP has $(L+1)^N$ cells and $2^N - 1$ predecessor moves per cell (advance any non-empty subset of sequences). Time is $O\big((2^N - 1)(L+1)^N\big)$ and space $O\big((L+1)^N\big)$, so heuristics are unavoidable.

### Progressive alignment

::: steps
1. Estimate pairwise distances, from alignments or fast $k$-mer comparisons.
2. Build a guide tree, for example with UPGMA or neighbour joining.
3. Merge from the leaves to the root: sequence–sequence, sequence–profile, then profile–profile DP, aligning similar sequences first and preserving existing correspondences within groups.
:::

With linear SP scoring, within-group scores are fixed, so only cross-group scores are optimised and gap–gap pairs score zero. A profile column pair is scored as $\sum_{a,b} f_i(a)\, g_j(b)\, s(a,b)$ using column frequencies. The guide tree is a merge order, not necessarily a phylogeny. Errors made early persist ("once a gap, always a gap"), so iterative refinement splits and realigns groups, without guaranteeing a global optimum. MUSCLE combines $k$-mer distances, progressive alignment and refinement; Clustal and MAFFT are other examples.

### Co-evolution

Conservation concerns one column; co-evolution concerns joint variation between columns. Interacting residues may undergo compensatory substitutions: a K/E salt bridge can become E/K, where either single change would break the interaction but the double change restores it.

With marginal frequencies $p_i(a)$ and joint frequencies $p_{ij}(a,b)$, independence predicts $p_{ij}(a,b) = p_i(a) p_j(b)$:

$$
C_{ij}(a,b) = p_{ij}(a,b) - p_i(a) p_j(b), \qquad
MI(i,j) = \sum_{a,b} p_{ij}(a,b) \log_2 \frac{p_{ij}(a,b)}{p_i(a) p_j(b)}
$$

Independent columns have zero mutual information, and fully conserved columns carry no co-variation signal. In the toy case where half the sequences have K/E and half E/K, both marginals are $(1/2, 1/2)$ but only two of four combinations occur; each observed pair has $C = 1/2 - 1/4 = 1/4$, and $MI = 2 \cdot \tfrac{1}{2} \log_2 2 = 1$ bit.

### Why correlation is not contact

- **Indirect coupling:** if A contacts B and B contacts C, A and C can correlate without touching.
- **Shared ancestry and sampling bias:** related sequences are not independent observations, and overrepresented clades dominate counts.
- **Alignment problems:** misalignment, gaps and low diversity distort frequencies. Functional constraints can also link physically distant sites.

Diverse homologues, alignment checks and sequence weighting help, although weighting cannot remove all phylogenetic confounding.

### Global coupling models

A pairwise Potts model describes single-site preferences and pairwise couplings jointly:

$$
P(\mathbf{a}) = \frac{1}{Z} \exp\left[\sum_i h_i(a_i) + \sum_{i<j} J_{ij}(a_i, a_j)\right]
$$

$h_i$ are single-position fields, $J_{ij}$ pairwise couplings and $Z$ the normalisation over all sequences. The model is fitted to the observed single- and pair-site frequencies, and direct coupling analysis (DCA) looks for couplings that explain the correlations jointly, helping separate direct from indirect effects. In the mean-field approximation, couplings relate to the negative inverse of the (suitably encoded and regularised) covariance matrix; raw covariance and inferred couplings are different quantities. Exact $Z$ would sum over $q^L$ sequences ($q = 20$, or 21 with gaps), so approximate inference is required, and the many parameters need many diverse sequences plus pseudocounts or regularisation.

Ranked couplings yield a contact map whose top pairs can be used as restraints for 3D modelling, much like experimental distance restraints, and this kind of co-evolutionary information is one ingredient that AlphaFold2 integrates with structural reasoning. Strong couplings suggest candidate contacts but do not prove physical interaction. A PSSM models independent positions; a profile HMM adds ordered match, insert and delete paths; a coupling model adds pairwise dependencies. All of them depend on alignment quality and sequence diversity.

Whiteboard route: MSA purpose → entropy and SP example → exponential DP → guide tree and progressive merges → compensatory pair and MI → indirect correlation → global couplings and contact map.

## 11. Profile HMMs {#profile-hmms}

### From an alignment to a profile

A protein family has conserved and variable positions, and a profile captures these position-specific preferences. For $L$ independent ungapped positions with emissions $e_i(a)$ and background $q_a$:

$$
P(X \mid M) = \prod_{i=1}^{L} e_i(x_i), \qquad
S(X) = \sum_{i=1}^{L} \log_2 \frac{e_i(x_i)}{q_{x_i}}
$$

This is a PSSM. For instance, $e_i(W) = 0.5$ against $q_W = 0.01$ contributes $\log_2 50 \approx 5.64$ bits. PSI-BLAST builds such a PSSM iteratively from detected homologues, but a PSSM has no probabilistic model of indels, and including false hits can make the profile drift.

### Architecture

A profile HMM has an ordered backbone of core positions, and both transitions and emissions can be position-specific. Unlike the region-level HMMs above, its states are tied to positions in one family.

| State | Meaning | Consumes sequence / advances core |
|---|---|---|
| $M_i$ | Core position, emits a residue | Yes / yes |
| $I_i$ | Insertion after core position $i$ | Yes / no |
| $D_i$ | Deletion of core position $i$, silent | No / yes |

A match state does not require identity; it can emit any residue with non-zero probability. Typical moves are $M_i \to M_{i+1}$, $M_i \to I_i \to M_{i+1}$ and $M_i \to D_{i+1} \to M_{i+2}$; $I_i \to I_i$ allows longer insertions and $D_i \to D_{i+1}$ consecutive deletions. Silent delete chains represent many possible skips with only $O(L)$ states and transitions.

If an insertion self-loop has probability $r$, then, given entry, the insertion length follows $P(\ell) = (1 - r) r^{\ell-1}$ for $\ell \ge 1$. Its log contribution is an opening term plus $(\ell - 1) \log r$, which is exactly the shape of an affine gap cost, but with position-specific parameters.

### Building from an MSA

Select core columns (often by occupancy or conservation) and treat the rest as insertions. Read each sequence as a path of M, I and D states, count emissions and transitions, normalise, and regularise. Sequence weighting or redundancy reduction prevents a large cluster of close relatives from dominating.

**Small example.** Declare columns 1, 3 and 4 as core:

| | 1 | 2 | 3 | 4 | Path |
|---|---|---|---|---|---|
| $S_1$ | A | − | C | G | $M_1 M_2 M_3$ |
| $S_2$ | A | T | C | G | $M_1 I_1 M_2 M_3$ |
| $S_3$ | A | − | − | G | $M_1 D_2 M_3$ |

$M_2$ emits C twice and $D_2$ emits nothing. From $M_1$, the raw outgoing counts give probability $1/3$ each to $M_2$, $I_1$ and $D_2$. The core length is 3 while observed lengths are 3, 4 and 2. Regularisation then removes unjustified zeros.

### Scoring, alignment and search modes

For a path $\pi$, $P(X, \pi \mid M)$ multiplies transition probabilities with emission probabilities of emitting states; silent states contribute transitions only.

$$
P(X \mid M) = \sum_\pi P(X, \pi \mid M), \qquad \pi^* = \arg\max_\pi P(X, \pi \mid M)
$$

Forward sums over all paths and Viterbi selects the best one, which also yields the alignment; both are compared with a null model as log-odds, computed in log space or with scaling. The sum is always at least the best single path. For sequence length $n$ and core length $L$, the sparse topology gives $O(nL)$ time and $O(nL)$ full-table space, or $O(L)$ memory for the score alone. Silent deletes advance the model index without advancing the sequence index.

Search modes are controlled by entry, exit and flanking transitions: *local* aligns part of the model to part of the sequence, *multiple local hits* capture repeated domains, and *glocal* aligns the full model (with indels) inside a longer sequence. HMMER provides the search tools and Pfam the family and domain models; good hits can be aligned back to extend the MSA.

### Regularisation

Not observing a residue in a small sample does not make it impossible. Pseudocounts prevent unjustified zeros and pull uncertain estimates toward a prior; they are not extra observations. With (possibly weighted) counts $c_i(a)$, $N_i = \sum_a c_i(a)$ and alphabet size $K$:

$$
e_i(a) = \frac{c_i(a) + 1}{N_i + K} \;\;(\text{add one}), \qquad
e_i(a) = \frac{c_i(a) + A q_a}{N_i + A} \;\;(\text{background prior})
$$

$A$ is the total prior strength. With no data the estimates fall back to uniform or background frequencies; with abundant data the empirical frequencies dominate. For example, two observations of A with a uniform DNA background and $A = 4$ give $e(\text{A}) = 3/6$ and $e(\text{C}) = e(\text{G}) = e(\text{T}) = 1/6$. Analogous priors apply to transitions, restricted to allowed outgoing moves and normalised per row.

A better prior uses the observed column composition to favour plausible substitutions. With $f_i(b) = c_i(b) / N_i$:

$$
\alpha_i(a) = A \sum_b P(a \mid b)\, f_i(b), \qquad
e_i(a) = \frac{c_i(a) + \alpha_i(a)}{N_i + A}, \qquad \sum_a \alpha_i(a) = A
$$

A column dominated by isoleucine therefore lends pseudocount mass to leucine and valine rather than spreading it uniformly, which is what makes profile HMMs effective at detecting remote family members from small seed alignments.

## Closing thoughts {#closing-thoughts}

Across all of these topics, the same few ideas keep returning. Dynamic programming turns exponential searches over alignments or state paths into tables filled in polynomial time. Log-odds scores compare a model of related or functional sequence with a background, which is why the choice of background changes conclusions in motif discovery, database search and gene finding alike. Heuristics such as seeds, indexes and progressive merging buy speed by discarding candidates early, and nothing later in the pipeline can recover what was discarded. Finally, every score, E-value or posterior is evidence under a model, not proof of homology, binding or function; being explicit about that distinction is usually what separates a good oral-exam answer from a merely correct one.
