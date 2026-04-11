# Atlas da Regulação de Criptoativos — versão definitiva

Versão estática pronta para GitHub Pages, com:
- mapa global funcional
- KPIs automáticos
- filtros por região, tendência, tema, qualidade e score
- painel detalhado do país
- comparador entre jurisdições
- camada suplementar de DeFi
- API estática gerada a partir de `data/manual-overrides.json`

## Estrutura
- `index.html`
- `style.css`
- `script.js`
- `data/manual-overrides.json`
- `data/presets.json`
- `content/themes/*.md`
- `api/*`
- `scripts/build_api.py`
- `scripts/run_pipeline.py`

## Subida para GitHub
Envie o conteúdo desta pasta diretamente para a raiz do repositório.

## Rebuild local
```bash
python scripts/run_pipeline.py
```
