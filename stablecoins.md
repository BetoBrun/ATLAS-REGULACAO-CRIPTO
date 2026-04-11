from pathlib import Path
import json
from datetime import datetime, timezone
import pycountry

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / 'data' / 'manual-overrides.json'
PRESETS = BASE / 'data' / 'presets.json'
API = BASE / 'api'
COUNTRY_DIR = API / 'country'
COUNTRY_DIR.mkdir(parents=True, exist_ok=True)

WEIGHTS = {
    'legal_certainty': 20,
    'proportionality': 15,
    'exchanges': 10,
    'stablecoins': 10,
    'tokenization': 10,
    'taxation': 10,
    'mining_infrastructure': 10,
    'innovation_openness': 10,
    'anti_centralization': 5,
}


def compute_score(criteria: dict) -> int:
    return int(round(sum(criteria.get(k, 0) for k in WEIGHTS)))


def classify(score: int) -> str:
    if score >= 80:
        return 'very_favorable'
    if score >= 65:
        return 'favorable'
    if score >= 50:
        return 'mixed'
    if score >= 35:
        return 'restrictive'
    return 'very_restrictive'


def enrich_country(c: dict) -> dict:
    c['score'] = compute_score(c.get('criteria', {}))
    c['classification'] = classify(c['score'])
    rec = pycountry.countries.get(alpha_3=c['iso3'])
    c['iso2'] = getattr(rec, 'alpha_2', None)
    c.setdefault('status', {})
    if 'defi' not in c['status']:
        exch = str(c['status'].get('exchanges', '')).lower()
        tok = str(c['status'].get('tokenization', '')).lower()
        if any(k in exch for k in ['regulated', 'licensed']) or 'active' in tok or 'open' in tok:
            c['status']['defi'] = 'indirectly regulated'
        elif any(k in exch for k in ['banned', 'hostile']):
            c['status']['defi'] = 'restricted'
        else:
            c['status']['defi'] = 'uncertain'
    refs = c.get('references', []) or []
    ref_labels = ' '.join((r.get('label', '') + ' ' + r.get('url', '')) for r in refs).lower()
    if len(refs) >= 3 and any(k in ref_labels for k in ['gov', 'gob', 'bank', 'sec', 'cvm', 'fsa', 'mas', 'sfc', 'finma', 'europa', 'planalto']):
        c['profile_quality'] = 'primary_source_backed'
    elif refs:
        c['profile_quality'] = 'source_backed'
    else:
        c['profile_quality'] = 'preliminary'
    c['primary_source_count'] = sum(1 for r in refs if any(k in (r.get('url', '') + r.get('label', '')).lower() for k in ['.gov', 'europa.eu', 'sec', 'fsa', 'mas', 'sfc', 'finma', 'planalto', 'bank']))
    return c


def main() -> None:
    payload = json.loads(DATA.read_text(encoding='utf-8'))
    countries = [enrich_country(c) for c in payload['countries']]
    countries_sorted = sorted(countries, key=lambda x: (x['region'], x['country']))
    rankings = {
        'top_favorable': sorted(countries_sorted, key=lambda x: x['score'], reverse=True)[:10],
        'top_restrictive': sorted(countries_sorted, key=lambda x: x['score'])[:10],
    }
    updates = sorted(
        [{'country': c['country'], 'iso3': c['iso3'], 'last_update': c['last_update'], 'trend': c['trend'], 'score': c['score'], 'summary_pt': c.get('summary_pt', ''), 'summary_en': c.get('summary_en', '')} for c in countries_sorted],
        key=lambda x: x['last_update'], reverse=True
    )[:20]
    metrics = {
        'generated_at': datetime.now(timezone.utc).isoformat().replace('+00:00','Z'),
        'total_jurisdictions': len(countries_sorted),
        'average_score': round(sum(c['score'] for c in countries_sorted) / len(countries_sorted), 1),
        'licensed_regimes': sum(1 for c in countries_sorted if any(k in str(c.get('status', {}).get('exchanges', '')).lower() for k in ['regulated', 'licensed'])),
        'cbdc_programmes': sum(1 for c in countries_sorted if not any(k in str(c.get('status', {}).get('cbdc', '')).lower() for k in ['not central', 'research only', 'research', 'unclear'])),
        'source_backed_profiles': sum(1 for c in countries_sorted if c['profile_quality'] != 'preliminary'),
        'primary_sources_catalogued': sum(c['primary_source_count'] for c in countries_sorted),
        'defi_defined_regimes': sum(1 for c in countries_sorted if c.get('status', {}).get('defi') not in [None, '', 'uncertain']),
    }
    metadata = {
        'generated_at': metrics['generated_at'],
        'country_count': len(countries_sorted),
        'theme_count': 4,
        'thesis_core_count': sum(1 for c in countries_sorted if c.get('thesis_core')),
        'methodology_version': '3.0.0-definitive'
    }
    (API / 'countries.json').write_text(json.dumps({'countries': countries_sorted}, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'rankings.json').write_text(json.dumps(rankings, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'updates.json').write_text(json.dumps(updates, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'metrics.json').write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    for c in countries_sorted:
        (COUNTRY_DIR / f"{c['iso3']}.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding='utf-8')
    if PRESETS.exists():
        pass

if __name__ == '__main__':
    main()
