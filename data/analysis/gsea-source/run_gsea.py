# /// script
# requires-python = ">=3.10"
# dependencies = ["gseapy==1.3.*", "pandas"]
# ///
"""Reanalyse the gene sets shown in Sato et al. (PNAS 2024) Fig. 5C-E.

The inputs come from data/analysis; the scores need not match the paper.

Run from the repository root:
    python data/analysis/gsea-source/run_gsea.py

The MSigDB GMT files are downloaded into a local cache and are not written here.
"""

import json
import urllib.request
from pathlib import Path

import gseapy as gp
import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
ANALYSIS = HERE.parent
CACHE = Path.home() / '.cache' / 'what_is_BI' / 'msigdb'
MSIGDB = 'https://data.broadinstitute.org/gsea-msigdb/msigdb/release/2024.1.Hs/'
GMTS = ['h.all.v2024.1.Hs.symbols.gmt', 'c6.all.v2024.1.Hs.symbols.gmt']
TREAT = ['shPPP3CA_1', 'shPPP3CA_2', 'shPPP3CA_3']
CONTROL = ['shControl_1', 'shControl_2', 'shControl_3']
TARGETS = {
    'HALLMARK_E2F_TARGETS': {'figure': '5C', 'collection': 'H', 'paper': {'NES': -2.34, 'FDR': '<0.001', 'P': '<0.001'}},
    'E2F1_UP.V1_UP': {'figure': '5D', 'collection': 'C6', 'paper': {'NES': -1.22, 'FDR': 0.183, 'P': 0.055}},
    'E2F1_UP.V1_DN': {'figure': '5E', 'collection': 'C6', 'paper': {'NES': 1.54, 'FDR': 0.013, 'P': 0.002}},
}
SEED = 1
# gseapy >= 1.3 applies the GSEA desktop floor (sd >= 0.2 * |mean|) in signal_to_noise.
PERMUTATIONS = 1000


def gene_sets():
    CACHE.mkdir(parents=True, exist_ok=True)
    sets = {}
    for name in GMTS:
        path = CACHE / name
        if not path.exists():
            urllib.request.urlretrieve(MSIGDB + name, path)
        for line in path.read_text().splitlines():
            fields = line.split('\t')
            sets[fields[0]] = fields[2:]
    return sets


def running_es(ranking, members):
    """Weighted (p = 1) running enrichment score, as in GSEA."""
    hit = ranking.index.isin(members)
    weight = np.abs(ranking.to_numpy()) * hit
    step = np.where(hit, weight / weight.sum(), -1 / (len(ranking) - hit.sum()))
    return np.cumsum(step), hit


counts = pd.read_csv(ANALYSIS / 'counts.csv', index_col=0)
size_factors = pd.read_csv(ANALYSIS / '03_sizeFactors.csv', index_col=0)['sizeFactor']
normalized = (counts / size_factors[counts.columns])[TREAT + CONTROL]
normalized = normalized[(counts > 0).any(axis=1)]
expression = normalized.reset_index().rename(columns={'index': 'NAME'})
expression.insert(1, 'DESCRIPTION', 'na')

sets = gene_sets()
result = gp.gsea(
    data=expression, gene_sets=sets, cls=['shPPP3CA'] * 3 + ['shControl'] * 3,
    method='signal_to_noise', permutation_type='gene_set', permutation_num=PERMUTATIONS,
    min_size=15, max_size=500, weight=1.0, seed=SEED, threads=4, outdir=None, verbose=False,
)
ranking = result.ranking.sort_values(ascending=False, kind='mergesort')
table = result.res2d.set_index('Term')

pd.DataFrame({'rank': range(1, len(ranking) + 1), 'gene': ranking.index, 'signal_to_noise': ranking.round(6).to_numpy()}) \
    .to_csv(HERE / 'ranked_genes.tsv', sep='\t', index=False)

output = []
for name, info in TARGETS.items():
    curve, hit = running_es(ranking, sets[name])
    peak = int(np.argmax(np.abs(curve)))
    es = float(curve[peak])
    if not np.isclose(es, table.loc[name, 'ES'], atol=1e-6):
        raise ValueError(f'Running ES does not match gseapy for {name}')
    hit_ranks = np.flatnonzero(hit) + 1
    # Between hits the curve falls by a constant step, so these vertices define it exactly.
    vertices = [(0, 0.0)]
    for rank in hit_ranks:
        vertices += [(int(rank - 1), float(curve[rank - 2]) if rank > 1 else 0.0), (int(rank), float(curve[rank - 1]))]
    vertices.append((len(ranking), float(curve[-1])))
    leading = hit_ranks[hit_ranks <= peak + 1] if es > 0 else hit_ranks[hit_ranks >= peak + 1]
    row = table.loc[name]
    output.append({
        'name': name, 'figure': info['figure'], 'collection': info['collection'],
        'msigdbSize': len(sets[name]), 'size': int(hit.sum()),
        'ES': round(es, 6), 'NES': round(float(row['NES']), 4),
        'nominalP': float(row['NOM p-val']), 'FDR': float(row['FDR q-val']),
        'peakRank': peak + 1, 'leadingEdgeSize': int(len(leading)),
        'paper': info['paper'],
        'hits': [{'rank': int(rank), 'gene': ranking.index[rank - 1]} for rank in hit_ranks],
        'leadingEdge': [ranking.index[rank - 1] for rank in leading],
        'curveVertices': [[rank, round(value, 6)] for rank, value in dict(vertices).items()],
    })

summary = {
    'source': 'Sato et al., PNAS 2024, doi:10.1073/pnas.2414618121, Fig. 5C-E; DRA011729',
    'geneSets': 'MSigDB 2024.1.Hs (Hallmark, C6), https://www.gsea-msigdb.org/',
    'input': 'DESeq2 size-factor-normalized counts from data/analysis/counts.csv (Salmon scaledTPM rounded), genes with at least one nonzero count',
    'geneId': 'HGNC symbol (GENCODE v37 metadata, as in counts.csv)',
    'method': {
        'tool': f'gseapy {gp.__version__} gsea()', 'metric': 'signal_to_noise',
        'direction': 'positive = higher in shPPP3CA (Treat); rank 1 is the most increased in Treat',
        'permutation': f'gene_set, {PERMUTATIONS}, seed {SEED}', 'weight': 1.0,
        'setSize': '15-500 genes present in the ranking',
        'fdrScope': 'all Hallmark and C6 sets tested together',
    },
    'genes': len(ranking),
    'sets': output,
}
(HERE / 'gsea_fig5.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1) + '\n')
for item in output:
    print(item['figure'], item['name'], 'ES', item['ES'], 'NES', item['NES'], 'FDR', item['FDR'], 'size', item['size'], 'peak', item['peakRank'])
