---
title: UTokyo Oral Exam Preparation Notes
createTime: 2026/01/09 10:11:23
password: Quadrant9-Referable-Refute
permalink: /blog/utokyo_oral_exam/
copyright: false
comment: false
exexcerpt: 'Some preparation notes for my upcoming oral exam for the University of Tokyo''s Computational Biology Master''s program, focusing on my chosen supervisor and potential Q&A topics.'
tags:
  - UTokyo
  - Exam
---

## Details of the chosen supervisor {#supervisor-details}

### Martin Frith {#martin-frith}

<LinkCard 
  icon="mdi:web"
  title="Martin Frith"
  href="https://sites.google.com/site/frithbioinfo/" >
  Laboratory of Large-Scale Bioinformatics, Department of Computational Biology and Medical Sciences (CBMS), Graduate School of Frontier Sciences, The University of Tokyo.

  The lab is jointly based at the University of Tokyo (Kashiwa campus) and the National Institute of Advanced Industrial Science and Technology (AIST) in Tokyo.
</LinkCard>

#### Background {#martin-background}

Professor Frith holds a B.A. in Physics and Philosophy from the University of Oxford (1996), a Part III in Mathematical Tripos from the University of Cambridge (1997), and a Ph.D. in Bioinformatics from Boston University (2004). He conducted postdoctoral work at the University of Queensland and RIKEN (2004–2007), then served as a researcher and later senior researcher at AIST's Computational Biology Research Center (2007–present). He joined the University of Tokyo as Professor in 2016.

#### Research Focus {#martin-research}

The lab develops algorithmic and mathematical methods to extract insights from genetic sequences, focusing on evolutionary history, genome regulation, and conserved elements. Key areas include:

  - Sensitive sequence alignment tools (e.g., **LAST**, for homology detection in noisy or long-read data).
  - Probabilistic models for alignment scores and sequence sampling.
  - Detection of ancient evolutionary signals (e.g., transposable elements, viral integrations, protein fossils, chromosome rearrangements).
  - Repeat masking and analysis of conserved regulatory DNA across animal phyla.

==**Notable tools and contributions:**== LAST (widely used for large-scale alignments), methods for frameshift alignments, and repeat-masking techniques. Recent work (as of 2025) includes position-specific probability models for sequence similarity and studies on Precambrian-conserved developmental control regions.

#### Relevance {#martin-relevance}

This aligns closely with your proposed research on extending sensitive alignment algorithms (like LAST) to long-read metagenomic data for bacterial evolutionary adaptations, GC skew/SNP analysis, and microbial metagenomics.

### GOTO Susumu （後藤 晋） {#goto-susumu}

<LinkCard 
  icon="mdi:web"
  title="GOTO Susumu （後藤 晋）"
  href="https://www.researchgate.net/lab/Susumu-Goto-Lab" >
  Life Science Database Integration Group, affiliated with the Database Center for Life Sciences (DBCLS), Research Organization of Information and Systems (ROIS).

  He is a Visiting Professor in the CBMS department at the University of Tokyo.
</LinkCard>

#### Background {#goto-background}

Professor Goto is a prominent figure in bioinformatics databases, with a long association with KEGG (Kyoto Encyclopedia of Genes and Genomes). He leads efforts at DBCLS, a national center focused on integrating and enhancing accessibility of life science databases.

#### Research Focus {#goto-research}

The group emphasizes database integration, Semantic Web technologies, and tools for cross-database querying in life sciences. Key projects include:

  - **TogoID**: An identifier conversion service that links IDs across diverse databases (e.g., genes, compounds, pathways) with semantic relationships (e.g., "glycan attached to protein").
  - Integration of heterogeneous biological data for pathway analysis, enzyme gene identification, and multi-omics studies.
  - Development of web services for usability, including ontology-based tools and automatic data updates.
  - DBCLS also organizes BioHackathons and promotes open science/data initiatives.

#### Relevance {#goto-relevance}

You mentioned this choice due to alignment with your database coursework and interest in large-scale evolutionary studies. It complements your microbiome/SNP projects by enabling better integration of multi-omics data from various sources.

### KIRYU Hisanori （桐生 久則） {#kiryu-hisanori}

<LinkCard 
  icon="mdi:web"
  title="KIRYU Hisanori （桐生 久則）"
  href="https://www.s.u-tokyo.ac.jp/en/people/kiryu_hisanori/" >
  Laboratory of Biological Network Analysis, Department of Computational Biology and Medical Sciences (CBMS), Graduate School of Frontier Sciences, The University of Tokyo.
</LinkCard>

#### Background {#kiryu-background}

Associate Professor Kiryu specializes in computational biology, with expertise in statistical methods for biological data analysis.

#### Research Focus {#kiryu-research}
The lab is a "dry" lab (computational only) that applies statistical, probabilistic, and machine learning methods to genome-scale data. Key areas include:

  - Inference of gene regulatory networks (e.g., **RENGE** and **SCODE** algorithms for single-cell RNA-seq during differentiation).
  - RNA secondary structure prediction and analysis (e.g., tools combining homologous sequences, base-pairing probabilities).
  - Biological network analysis, including promoter sequences, transcription networks, and RNA-binding protein motifs.
  - Data-driven approaches using AI/ML for single-cell sequencing, animal behavior, and plant morphology data.

==**Notable contributions:**== Development of tools like Rtools (web server for RNA structural analyses) and methods for reproducible high-throughput structural analyses.

#### Relevance {#kiryu-relevance}

This fits your mention of exploring microbial interactions through graph-based models and complements your iGEM network engineering experience. It could extend your microbiome correlations (e.g., via DESeq2) to regulatory network inference in microbial communities.

## Oral Exam Q&A Preparation {#oral-exam-prep}

### Motivational and Background Questions {#motivational-questions}

:::steps

1. **Why do you want to pursue a Master's in Computational Biology at the University of Tokyo, and specifically in Prof. Martin Frith's lab?**

    My passion for bioinformatics stems from its power to integrate computational tools with biological data to reveal patterns in microbial ecosystems and evolution, as highlighted in my research plan. During my undergraduate studies at Huazhong University of Science and Technology, where I achieved a GPA of 3.27 and excelled in courses like Omics Data Analysis and Biostatistics, I realized the need for advanced skills to handle large-scale genomic data. Prof. Frith's lab appeals to me because of its focus on sensitive sequence alignment tools like LAST and detecting evolutionary signals such as transposable elements and ancient fossils in genomes. This aligns with my BGI internship experience analyzing bacterial SNPs and GC skew, where I used machine learning to study habitat-driven evolution. Joining this lab would allow me to apply these to metagenomics, contributing to health-related discoveries like microbiome dysbiosis biomarkers.

2. **You mentioned no prior consultation with Prof. Frith. How did you learn about his research, and why is it a good fit for you?**

    I learned about Prof. Frith's work through publicly available resources, such as publications on tools for homology detection and significant sequence non-existence. For instance, his development of LAST for sensitive alignments resonates with my interest in noisy long-read metagenomic data from bacterial communities. In my research plan, I propose extending such tools to microbial genomes to uncover adaptations, building on my BGI project where I developed Python algorithms for GC skew calculation and SNP analysis in terabyte-scale data. This fit excites me because it bridges my microbial focus with the lab's expertise in probabilistic modeling for evolutionary insights.

3. **Your GPA is 3.27. Can you explain any challenges and how you've overcome them?**

    While my overall GPA is 3.27, I ranked in the top 10% in key courses like Bioinformatics and Omics Data Analysis, demonstrating strong performance in relevant areas. Early challenges included balancing rigorous coursework with extracurriculars like leading the iGEM team and News Agency. I overcame this by prioritizing time management and applying practical skills from projects, such as scripting in R and Python, which boosted my later achievements, including gold medals in iGEM and SynBio. This experience has prepared me for graduate-level research demands.
:::

### Research Experience Questions {#research-experience-questions}

:::steps
1. **Describe your role in the microbiome project under Prof. Wei-Hua Chen. What were the key challenges and outcomes?**

    As team leader since December 2023, I managed tasks, wrote analysis scripts, and performed data processing for the project "Investigation of the Relationship between Genetic Background, Skin Microbiota, and Skin Characteristics." Challenges included integrating multi-omics data and handling variability in microbiota samples. I used QIIME for diversity metrics and DESeq2 for statistical correlations, leading to preliminary insights on genetic-microbiota links. The project was submitted as a province-level innovation initiative and is on track for results in 2025, enhancing my skills in experimental design and big-data handling.

2. **In your BGI internship with Prof. Yuanqiang Zou, what specific contributions did you make to the bacterial genome projects?**

    Starting July 2025, I developed machine learning algorithms in Python to calculate GC skew for analyzing bacterial complete genome maps, identifying replication origins and evolutionary markers. For the metaCC sequencing project, I explored microbial growth-environment relationships in the human gut by analyzing read coverage and polymorphisms. In the large-scale SNP analysis project—my graduation thesis—I processed terabyte-scale data using Bowtie2 for alignments and GATK for variant calling, revealing evolutionary relationships across habitats. These contributions honed my high-performance computing skills and directly relate to metagenomic challenges.

3. **Tell us about your "Challenge Cup" project with Assoc. Prof. Sheng Wang. How did you use AI in it?**

    In July-August 2024, I participated in exploring shear and splicing of antimicrobial peptides for cancer treatment. My role involved modeling, code implementation, and using AI like AlphaFold to predict peptide structures and simulate modifications. Challenges included optimizing predictions for efficacy against tumor cells. This built my proficiency in AI-driven sequence modeling, which I can apply to evolutionary analyses in Prof. Frith's lab.

4. **How has your iGEM experience (2023-2025) prepared you for graduate research?**

    As leader of the Network Engineering Group, I constructed front-end web pages for project display and collaborated in Human Practices for team communications. We won gold in 2023 and 2025, silver in 2024, plus a SynBio gold in 2024. This taught me interdisciplinary teamwork, project management, and applying bioinformatics to synthetic biology, skills I'll use in lab collaborations and tool development.
:::

### Proposed Research and Technical Skills Questions {#proposed-research-questions}

:::steps
1. **In your research plan, you propose applying sensitive alignment algorithms to long-read metagenomic data. Can you elaborate on the methods and potential impacts?**

    I aim to extend tools like Prof. Frith's LAST to microbial metagenomes, integrating machine learning for GC skew and SNP analysis with probabilistic models to handle noisy long-read data from environments like the human gut. Methods would include homology detection for transposable elements and viral integrations, identifying habitat-specific adaptations. Impacts could include biomarkers for microbiome-linked diseases, advancing precision medicine by revealing evolutionary pressures on bacteria.

2. **What programming languages and tools are you proficient in, and how have you used them?**

    I'm proficient in Python, and R. In coursework, I used Python/R for omics visualization and biostatistics. In projects, Python was key for ML algorithms at BGI (e.g., GC skew), R for DESeq2 in microbiome analysis, and tools like QIIME, Bowtie2, GATK, and AlphaFold for data processing and predictions. These prepare me for optimizing alignment tools in the lab.

3. **How would you address challenges in noisy long-read data for bacterial metagenomics?**

    Noisy data often includes errors in base calling and assembly. I'd use probabilistic models from Prof. Frith's work, like in LAST, combined with error-correction via machine learning (e.g., trained on GC skew patterns from my BGI experience). Statistical filtering with tools like DESeq2 could reduce false positives, ensuring reliable detection of evolutionary signals like SNPs or non-existent sequences.
:::

### Future Plans and General Questions {#future-plans-questions}

:::steps
1. **What are your career goals after completing the Master's?**

    After the Master's, I plan to pursue a PhD in computational biology, possibly at the University of Tokyo or internationally. Long-term, I aim for a research position in academia or industry, like at BGI, developing microbiome-based tools for therapeutics against antibiotic resistance or environmental health issues. I'll focus on mentoring and collaborations to translate computational advances into global health solutions.

2. **Why did you choose GOTO Susumu and KIRYU Hisanori as second and third choices?**

    Prof. GOTO's Life Science Database Integration Group aligns with my database skills from coursework and interest in large-scale data for evolutionary studies. Prof. KIRYU's Biological Network Analysis lab complements my network engineering in iGEM and microbiome correlations, allowing me to explore microbial interactions through graph-based models if not in Prof. Frith's lab.

3. **Describe a time when you led a team and faced a setback. How did you handle it?**

    As leader of HUST's News Agency (2022-2024), we faced a setback when a major event's coverage was delayed due to technical issues. I reassigned tasks, prioritized key photos and releases, and coordinated with team members, resulting in top university promotional ranking and a Department Star award. This experience strengthened my leadership for research teams.

4. **How do your extracurriculars, like the News Agency, relate to your research interests?**

    Leading the News Agency involved photographing events, drafting releases, and designing visuals, sharpening my communication and project management skills. These are crucial for bioinformatics, where presenting complex data (e.g., omics visualizations) and collaborating interdisciplinary is key, as in my iGEM Human Practices role.

5. **Any questions for us? (Common closing question)**

    Could you tell me more about ongoing projects in Prof. Frith's lab involving metagenomics or microbial evolution, and how new students typically contribute in their first year?
:::
