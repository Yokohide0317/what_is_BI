"""教育用の人工発現量。論文データでもRNA-seq解析パイプラインでもない。"""
import itertools
import json
import math
from pathlib import Path
import random

rng = random.Random(20261023)
allocations = list(itertools.combinations(range(12), 6))
# 模式セットA。順位表の左側に10遺伝子、右側に6遺伝子が現れる例。
set_a = {
    'Gene24', 'Gene11', 'Gene12', 'Gene10', 'Gene22',
    'Gene23', 'Gene04', 'Gene09', 'Gene08', 'Gene34',
    'Gene05', 'Gene15', 'Gene47', 'Gene02', 'Gene13', 'Gene01',
}
genes = []
for i in range(48):
    baseline = 80 + (i % 7) * 20
    effect = (-1.6 + (i % 12) * 0.29) if i < 24 else (i % 5 - 2) * 0.07
    noise = (0.12, 0.25, 0.45, 0.65)[i % 4]
    control = [max(1, round(rng.gauss(baseline, baseline * noise))) for _ in range(6)]
    treated = [max(1, round(rng.gauss(baseline * 2**effect, baseline * noise))) for _ in range(6)]
    values = control + treated
    observed = abs(sum(treated) - sum(control))
    extreme = sum(abs(2 * sum(values[j] for j in indices) - sum(values)) >= observed for indices in allocations)
    genes.append({
        'id': f'Gene{i + 1:02}',
        'control': control,
        'treated': treated,
        'log2fc': math.log2(sum(treated) / sum(control)),
        'p': extreme / len(allocations),
        'padj': 1,
        'member': f'Gene{i + 1:02}' in set_a,
    })
ordered = sorted(genes, key=lambda gene: gene['p'])
previous = 1
for rank in range(len(ordered), 0, -1):
    previous = min(previous, ordered[rank - 1]['p'] * len(ordered) / rank)
    ordered[rank - 1]['padj'] = previous
output = Path(__file__).resolve().parents[1] / 'src/data/genes.json'
output.write_text(json.dumps(genes, ensure_ascii=False, indent=2) + '\n')
print(f'{len(genes)} artificial genes; {len(allocations)} exact allocations; saved {output.name}')
