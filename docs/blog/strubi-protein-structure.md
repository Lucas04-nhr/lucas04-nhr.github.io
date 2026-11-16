---
title: "An Overview of Protein Structure"
createTime: 2026/11/16 09:40:00
permalink: /blog/strubi-protein-structure/
excerpt: "This is part of the summary of the course Structural Bioinformatics at KU. This article introduces the polypeptide backbone and its angles, the forces behind folding, the twenty amino acids, and the levels of protein structure."
tags:
  - KU
  - Structural Bioinformatics
---

## Where this fits {#where-this-fits}

This post covers two lectures titled "Overview of protein structure" and one exercise session on molecular visualization with PyMOL. Structure comparison, exposure measures, structure prediction, and AlphaFold are all expressed in the vocabulary introduced here, so this post is mostly a vocabulary list with the reasoning behind each term.

::: note Source
These are my notes on the "Overview of protein structure" lectures of the Structural Bioinformatics course (block 2, 2026–2027) at the University of Copenhagen, written from the lecture slides and the published schedule. The schedule only lists session titles, so where one slide deck spans several sessions the split between posts is my own. The thermodynamics of folding from the same deck is in the [post on folding and RMSD](/blog/strubi-folding-rmsd/).
:::

## The polypeptide chain {#polypeptide-chain}

A protein is a linear polymer of twenty kinds of amino acid that folds into a compact, usually globular shape in water. Each amino acid has a tetrahedral $C_\alpha$ carrying an amine group, a carboxyl group, a hydrogen and one of twenty side chains; natural proteins use the L form.

Two amino acids join in a condensation reaction that forms the **peptide bond**. Resonance gives this bond about 40% double-bond character, which has two consequences that matter for everything that follows:

- there is no free rotation around it, so the six atoms of the peptide group lie in a plane;
- the oxygen and nitrogen carry partial charges, so every peptide group is a small dipole.

Distances are measured in ångström ($1\,\text{Å} = 0.1\,\text{nm}$). A C–C bond is about 1.5 Å, and consecutive $C_\alpha$ atoms are 3.8 Å apart.

## Describing a conformation with angles {#angles}

Bond lengths and bond angles are close to constant, so ==a protein conformation is essentially a list of dihedral angles==. The slides give two parameterizations of the backbone.

| Representation | Points per residue | Angles | Lives on | Used for |
| --- | --- | --- | --- | --- |
| Full backbone | 3 (N, $C_\alpha$, C) | Dihedrals $(\phi, \psi)$, both in $[-\pi, \pi)$ | The torus | Ramachandran plots, local structure models |
| $C_\alpha$ trace | 1 ($C_\alpha$) | Pseudo bond angle $\theta \in [0, \pi]$ and pseudo dihedral $\tau \in [-\pi, \pi)$ | The sphere | Coarse-grained models and simulations |

The three main-chain dihedrals are defined by four consecutive atoms each:

- $\phi$: $C(i-1)$, $N(i)$, $C_\alpha(i)$, $C(i)$
- $\psi$: $N(i)$, $C_\alpha(i)$, $C(i)$, $N(i+1)$
- $\omega$: $C_\alpha(i)$, $C(i)$, $N(i+1)$, $C_\alpha(i+1)$

Because the peptide bond is planar, $\omega$ is almost always 180° (trans). The cis form ($\omega = 0°$) brings neighbouring side chains into a clash and is rare; when it does occur, it is mostly at a peptide bond preceding proline.

The $(\theta, \tau)$ angles of the $C_\alpha$ trace are called pseudo angles because consecutive $C_\alpha$ atoms are not bonded to each other. They are sufficient because the $C_\alpha$–$C_\alpha$ distance is nearly constant.

Side chains add between zero (Gly, Ala) and four (Lys, Arg) further dihedrals. In practice a side chain tends to adopt one of a small set of conformations called **rotamers**, which turns a continuous search into a discrete one and is widely used in homology modelling.

### The Ramachandran plot {#ramachandran}

Plotting $\phi$ against $\psi$ for every residue gives the Ramachandran plot. Steric clashes forbid most of the square, leaving three populated regions: A (right-handed helix), B (strand) and L (left-handed helix). Two points about reading it:

- It is a quality check. Tools such as PROCHECK divide the plot into favoured, less favoured, allowed and forbidden regions, and a model with many residues in forbidden regions deserves suspicion.
- It is a flat projection of a torus cut open. The left and right edges are the same line, and so are the top and bottom, which is why clusters appear to be split across the borders.

Glycine and proline are the exceptions. Glycine has no side chain and populates regions closed to other residues; proline's ring restricts $\phi$ to a narrow band.

Angles need their own statistics. The slides introduce the **von Mises distribution**, the counterpart of the Gaussian for directional data, with a concentration parameter $\kappa$ that plays the role of an inverse variance. It is also used in [probabilistic models of local structure](/blog/strubi-solvent-exposure-local-structure/).

## Forces behind protein structure {#forces}

Folding is driven by noncovalent interactions of the protein with itself, with water and with other molecules. Three fundamental interactions are enough to explain the rest.

| Interaction | Origin | Range and strength | Practical consequence |
| --- | --- | --- | --- |
| Steric repulsion | Pauli exclusion between overlapping electron orbitals | Very strong, very short range | Atoms behave as hard spheres with a van der Waals radius |
| Electrostatics | Charges and partial charges (Coulomb's law) | Strong, long range, scaled down by the dielectric constant $D$ | Salt bridges, dipole interactions, hard to compute accurately |
| Van der Waals | Mutually induced, transient dipoles | Weak, short range | Optimal contact at the sum of the radii plus 0.3–0.5 Å |

Electrostatics is the difficult one. The dielectric constant is 1 in vacuum and about 80 in water, but a protein is a body of low $D$ immersed in a solvent of high $D$, so a single constant does not apply. The **Poisson–Boltzmann equation** treats the solvent as a continuum and can be solved numerically.

Steric repulsion and van der Waals attraction are usually combined in the **Lennard-Jones potential**, with a repulsive $r^{-12}$ term and an attractive $r^{-6}$ term:

$$
E(r) = \frac{C_{12}}{r^{12}} - \frac{C_6}{r^6}
$$

Two effects that follow from these interactions get their own names:

- The **hydrogen bond** forms between a hydrogen attached to an electronegative atom (the donor, N or O) and another electronegative atom (the acceptor). It is worth 2–10 kcal/mol and behaves partly like a covalent bond: it is directional, ideally linear, and the atoms sit closer than their van der Waals radii would allow. Backbone CO···HN hydrogen bonds define helices and sheets.
- The **hydrophobic effect** is a property of water rather than of the protein. A group that cannot hydrogen-bond reduces the number of ways the surrounding water can arrange its hydrogen-bond network, which is entropically unfavourable. Burying hydrophobic groups together reduces that cost, so proteins form a hydrophobic core and expose polar residues.

A related idea is the **dehydron**: a backbone hydrogen bond exposed to water is weak because water competes for it. Wrapping it in hydrophobic groups stabilizes it, and this contributes to folding, complex formation and drug binding.

A **force field** such as CHARMM adds these terms up (bonds, angles, dihedrals, Lennard-Jones, electrostatics) into one energy function for simulation.

## The amino acids {#amino-acids}

Three axes classify the side chains: charged or neutral (with a $pK_a$, the pH at which half the groups are charged), polar or apolar, and hydrophobic or hydrophilic.

| Group | Residues | Character | Secondary-structure preference | Worth remembering |
| --- | --- | --- | --- | --- |
| Hydroxyl | Ser, Thr | Polar, neutral, hydrophilic | Ser coil, Thr sheet | |
| Amide | Asn, Gln | Polar, neutral, hydrophilic | Asn coil, Gln helix | |
| Basic | Arg, Lys | Positive, hydrophilic | Helix | $pK_a$ 12.0 and 10.5; long apolar stretch before the charge |
| Acidic | Asp, Glu | Negative, hydrophilic | Asp coil, Glu helix | $pK_a$ 3.9 and 4.3; bind $Ca^{2+}$ |
| Aliphatic | Ala, Val, Leu, Ile | Apolar; Val, Leu, Ile hydrophobic | Val and Ile sheet, Ala and Leu helix | Ala is indifferent to exposure |
| Aromatic | Phe, Tyr, Trp | Hydrophobic; Tyr and Trp weakly polar | Sheet | Edge-to-face stacking; Tyr $pK_a$ 10.0 |
| Sulfur | Cys, Met | Weakly polar, hydrophobic | Met helix, Cys sheet | Cys forms disulfide bridges and binds $Zn^{2+}$; $pK_a$ 8.3 |
| Histidine | His | Polar, basic, ambivalent | Helix | $pK_a$ 6.1, so its charge changes near physiological pH; binds metals when unprotonated |
| Glycine | Gly | Apolar, no side chain | Coil, turns | Unusual backbone angles |
| Proline | Pro | Apolar imino acid | Coil, turns | Bends or breaks helices, absent from strands, often cis |

The table is most useful for judging mutations when no structure is at hand. A proline introduced into a helix or a glycine into a strand is likely to be disruptive, while changes in loops are often tolerated.

## Secondary structure {#secondary-structure}

Secondary structure is the local shape of the backbone, defined by hydrogen-bond patterns. There are three broad categories: helix, strand and everything else ("loop" or "coil", which is not random).

The right-handed **α-helix** bonds the C=O of residue $n$ to the N–H of residue $n+4$. It has 3.6 residues per turn, a rise of 1.5 Å per residue and a pitch of 5.4 Å, with $(\phi, \psi)$ near $(-60°, -50°)$. All its peptide dipoles point the same way, so the helix as a whole has a dipole with the positive end at the N-terminus, which is where negatively charged ligands tend to bind.

Two other helices exist. The $3_{10}$ helix ($n \to n+3$) accounts for about 4% of residues, usually as a single turn at the end of an α-helix. The π-helix ($n \to n+5$) is rarer still. Both suffer from strained backbone angles, poor packing and bent hydrogen bonds.

In a **β-strand** the side chains alternate between the two faces of the sheet. Strands pair into parallel or antiparallel sheets with different hydrogen-bond geometry. Neighbouring antiparallel strands are connected by **β-hairpins**, which are abundant, often contain Gly or Pro, and often act as folding initiation sites.

## Tertiary and quaternary structure {#tertiary-structure}

Three terms are easy to confuse:

- A **structure** is one specific experimental model, from X-ray crystallography or NMR for example.
- A **fold** is the overall shape: which secondary-structure elements occur along the chain and how they pack.
- A **domain** is a part of a protein that is, or could be, an independently folding unit, and that is often reused across proteins.

Folds fall into four classes: all-α, all-β, mixed and irregular. The slides put the number of observed folds at about a thousand, most of them mixed, with the total unknown. Some folds ("superfolds") turn up again and again, while others are confined to one family.

A shared fold has two possible explanations. Haemoglobin and leghaemoglobin have only 11.9% sequence identity but a common ancestor: **divergent evolution**, where structure is conserved long after sequence similarity has faded. The four-helix bundles of cytochrome c′ and myohemerythrin share a fold without a common ancestor: **convergent evolution**. Telling the two apart is what the classification databases in the [post on folding and RMSD](/blog/strubi-folding-rmsd/) attempt.

Many proteins consist of several associating chains; that arrangement is the **quaternary structure**.

## Looking at it in PyMOL {#pymol}

The accompanying exercise session is on molecular visualization with PyMOL. The commands below are not the exercise sheet, only a short way of checking the lecture's claims on the homeodomain (PDB entry 1ENH) that the slides use as their running example.

```text
fetch 1enh
as cartoon
color red, ss h
show sticks, resn PRO+GLY
phi_psi 1enh
```

`phi_psi` prints the backbone dihedrals per residue, which should cluster around $(-60°, -50°)$ in the three helices.

## What to take away {#takeaways}

- A conformation is a list of dihedral angles; $(\phi, \psi)$ pairs live on a torus, and the Ramachandran plot is that torus cut open.
- The hydrophobic effect is entropic and comes from water. It is the main driving force of folding, and it is why [solvent exposure](/blog/strubi-solvent-exposure-local-structure/) is a central quantity in structural bioinformatics.
- Structure is more conserved than sequence, so a shared fold is weak evidence for common ancestry on its own.
