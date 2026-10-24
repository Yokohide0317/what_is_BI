"""Build the small browser payload from the reproducible GSEA source files."""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/analysis/gsea-source'
TARGET = ROOT / 'public/data/gsea.json'

analysis = json.loads((SOURCE / 'gsea_fig5.json').read_text())
with (SOURCE / 'ranked_genes.tsv').open(newline='') as handle:
    ranking = list(csv.DictReader(handle, delimiter='\t'))

assert len(ranking) == analysis['genes']
assert all(int(row['rank']) == index for index, row in enumerate(ranking, 1))

for item in analysis['sets']:
    leading = set(item['leadingEdge'])
    for hit in item['hits']:
        row = ranking[hit['rank'] - 1]
        assert hit['gene'] == row['gene']
        hit['metric'] = float(row['signal_to_noise'])
        hit['leadingEdge'] = hit['gene'] in leading
    assert sum(hit['leadingEdge'] for hit in item['hits']) == item['leadingEdgeSize']
    del item['leadingEdge']

# The lower panel is a sampled view of the exact ranking. Keep both ends and
# enough intervening points to show the metric trend without shipping 17k rows.
stride = max(1, len(ranking) // 600)
analysis['rankMetric'] = [
    [int(row['rank']), float(row['signal_to_noise'])]
    for index, row in enumerate(ranking)
    if index % stride == 0 or index == len(ranking) - 1
]

TARGET.write_text(json.dumps(analysis, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'{TARGET.relative_to(ROOT)}: {TARGET.stat().st_size} bytes')
