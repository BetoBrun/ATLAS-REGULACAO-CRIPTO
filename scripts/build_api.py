from pathlib import Path
import json
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / 'data' / 'manual-overrides.json'
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

def profile_quality(country: dict) -> str:
    primary = country.get('primary_sources') or []
    refs = country.get('references') or []
    if primary:
        return 'primary_source_backed'
    if refs:
        return 'source_backed'
    return 'preliminary'

def count_normative_acts(country: dict) -> int:
    return len(country.get('laws') or []) + len(country.get('primary_sources') or [])

def is_licensed(country: dict) -> bool:
    return 'licensed' in str((country.get('status') or {}).get('exchanges', '')).lower() or 'regulated' in str((country.get('status') or {}).get('exchanges', '')).lower()

def has_cbdc(country: dict) -> bool:
    cbdc = str((country.get('status') or {}).get('cbdc', '')).lower()
    return any(x in cbdc for x in ['pilot', 'launched', 'research', 'exploration']) and 'not central' not in cbdc

def main() -> None:
    payload = json.loads(DATA.read_text(encoding='utf-8'))
    countries = payload['countries']
    for c in countries:
        c['score'] = compute_score(c['criteria'])
        c['classification'] = classify(c['score'])
        c['profile_quality'] = profile_quality(c)
        c['normative_act_count'] = count_normative_acts(c)
        c.setdefault('primary_sources', [])
        c.setdefault('authorities', [])
        c.setdefault('defi_focus_en', '')
        c.setdefault('defi_focus_pt', '')
        c.setdefault('defi_signals_en', [])
        c.setdefault('defi_signals_pt', [])

    countries_sorted = sorted(countries, key=lambda x: x['score'], reverse=True)
    rankings = {
        'top_favorable': countries_sorted[:10],
        'top_restrictive': list(reversed(countries_sorted[-10:])),
    }
    updates = sorted(
        [{'country': c['country'], 'iso3': c['iso3'], 'last_update': c['last_update'], 'trend': c['trend'], 'score': c['score']} for c in countries],
        key=lambda x: x['last_update'], reverse=True
    )
    themes_payload = json.loads((API / 'themes.json').read_text(encoding='utf-8')) if (API / 'themes.json').exists() else {'themes': []}
    theme_count = len(themes_payload.get('themes', themes_payload if isinstance(themes_payload, list) else []))
    metadata = {
        'generated_at': datetime.now(timezone.utc).isoformat().replace('+00:00','Z'),
        'country_count': len(countries),
        'theme_count': theme_count,
        'thesis_core_count': sum(1 for c in countries if c.get('thesis_core')),
        'methodology_version': '2.3.0-primary-defi'
    }
    metrics = {
        'jurisdictions_mapped': len(countries),
        'average_score': round(sum(c['score'] for c in countries) / len(countries), 1) if countries else 0,
        'licensed_regimes': sum(1 for c in countries if is_licensed(c)),
        'cbdc_programmes': sum(1 for c in countries if has_cbdc(c)),
        'normative_acts_catalogued': sum(c['normative_act_count'] for c in countries),
        'source_backed_profiles': sum(1 for c in countries if c['profile_quality'] in ('source_backed', 'primary_source_backed')),
        'primary_source_backed_profiles': sum(1 for c in countries if c['profile_quality'] == 'primary_source_backed'),
        'primary_sources_catalogued': sum(len(c.get('primary_sources') or []) for c in countries),
    }
    API.mkdir(parents=True, exist_ok=True)
    (API / 'countries.json').write_text(json.dumps({'countries': countries}, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'rankings.json').write_text(json.dumps(rankings, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'updates.json').write_text(json.dumps(updates, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    (API / 'metrics.json').write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding='utf-8')
    for c in countries:
        (COUNTRY_DIR / f"{c['iso3']}.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
