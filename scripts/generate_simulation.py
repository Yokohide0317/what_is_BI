"""Build the browser dataset from the selected R/DESeq2 CSV exports.

Only the five small files in data/analysis are copied from the remote analysis.
The FASTQ, Salmon index, and other intermediate files are not needed here.
"""

import csv
import json
import math
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'analysis'
DESTINATION = ROOT / 'public' / 'data' / 'simulation.json'


def rows(filename):
    with (SOURCE / filename).open(newline='') as source:
        return list(csv.DictReader(source))


def optional_number(value):
    if value in ('', 'NA'):
        return None
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f'Nonfinite result: {value}')
    return result


metadata = rows('samples.csv')
factors = {row['']: float(row['sizeFactor']) for row in rows('03_sizeFactors.csv')}
counts = rows('counts.csv')
results = rows('05_results.csv')
names = [row[''] for row in metadata]

if Counter(row['condition'] for row in metadata) != {'Control': 3, 'Treat': 3}:
    raise ValueError('Expected three Control and three Treat samples')
if len(names) != len(set(names)) or set(names) != set(factors):
    raise ValueError('Sample names and size factors do not match')
if any(not math.isfinite(value) or value <= 0 for value in factors.values()):
    raise ValueError('Invalid size factor')

count_by_gene = {row['']: row for row in counts}
result_by_gene = {row['']: row for row in results}
if len(count_by_gene) != len(counts) or len(result_by_gene) != len(results):
    raise ValueError('Duplicate gene name')
if count_by_gene.keys() != result_by_gene.keys():
    raise ValueError('Counts and results have different genes')

samples = [
    {
        'id': name,
        'condition': row['condition'],
        'group': row['group'],
        'total': sum(int(gene[name]) for gene in counts),
        'sizeFactor': factors[name],
    }
    for name, row in zip(names, metadata, strict=True)
]

genes = []
for row in counts:
    name = row['']
    values = [int(row[sample]) for sample in names]
    if any(value < 0 for value in values):
        raise ValueError(f'Negative count: {name}')
    result = result_by_gene[name]
    base_mean = optional_number(result['baseMean'])
    actual_mean = sum(value / factors[sample] for value, sample in zip(values, names, strict=True)) / len(names)
    if base_mean is None or not math.isclose(base_mean, actual_mean, rel_tol=1e-10, abs_tol=1e-8):
        raise ValueError(f'baseMean does not match normalized counts: {name}')
    genes.append({
        'id': name,
        'counts': values,
        'baseMean': base_mean,
        'log2FoldChange': optional_number(result['log2FoldChange']),
        'pvalue': optional_number(result['pvalue']),
        'padj': optional_number(result['padj']),
    })

output = {
    'engine': 'R / DESeq2',
    'contrast': 'Treat / Control',
    'source': 'Sato et al., PNAS 2024, doi:10.1073/pnas.2414618121; DRA011729',
    'samples': samples,
    'genes': genes,
}
DESTINATION.parent.mkdir(parents=True, exist_ok=True)
DESTINATION.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n')
print(f'Saved {len(genes)} genes, {len(samples)} samples to {DESTINATION}')
