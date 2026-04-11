
const I18N = {
  pt: {
    jurisdictions: 'Jurisdições analisadas', avg: 'Score médio global', licensed: 'Regimes com licenciamento', sources: 'Fontes primárias',
    allRegions: 'Todas', allTrends: 'Todas', allTopics: 'Todos', allQualities: 'Todas',
    selectCountry: 'Selecione um país', selectHelp: 'Clique no mapa ou na tabela para abrir o perfil regulatório.',
    lastUpdate: 'Última atualização', status: 'Visão de status', laws: 'Principais leis e marcos', opportunities: 'Oportunidades', risks: 'Riscos', sourcesTitle: 'Fontes',
    legal_certainty:'Segurança jurídica', proportionality:'Proporcionalidade', exchanges:'Exchanges', stablecoins:'Stablecoins', tokenization:'Tokenização', taxation:'Tributação', mining_infrastructure:'Infraestrutura de mineração', innovation_openness:'Abertura à inovação', anti_centralization:'Anticentralização', defi:'DeFi',
    country:'País', score:'Score', classification:'Classificação', trend:'Tendência', region:'Região',
    primary_source_backed:'Fontes primárias', source_backed:'Com fontes', preliminary:'Preliminar',
    very_favorable:'Muito favorável', favorable:'Favorável', mixed:'Misto', restrictive:'Restritivo', very_restrictive:'Muito restritivo',
    improving:'Em melhora', stable:'Estável', worsening:'Em piora', mixedTrend:'Mista',
    compareA:'Jurisdição A', compareB:'Jurisdição B', generatedAt:'Gerado em', countriesCovered:'Países cobertos',
    mapNote:'Polígonos preenchidos: {filled} • Jurisdições em marcador: {markers}',
    noData:'Sem dados'
  },
  en: {
    jurisdictions: 'Jurisdictions analysed', avg: 'Average score', licensed: 'Licensed regimes', sources: 'Primary sources',
    allRegions: 'All', allTrends: 'All', allTopics: 'All', allQualities: 'All',
    selectCountry: 'Select a country', selectHelp: 'Click the map or the table to open the regulatory profile.',
    lastUpdate: 'Last update', status: 'Status overview', laws: 'Principal laws and frameworks', opportunities: 'Opportunities', risks: 'Risks', sourcesTitle: 'Sources',
    legal_certainty:'Legal certainty', proportionality:'Proportionality', exchanges:'Exchanges', stablecoins:'Stablecoins', tokenization:'Tokenization', taxation:'Taxation', mining_infrastructure:'Mining infrastructure', innovation_openness:'Innovation openness', anti_centralization:'Anti-centralization', defi:'DeFi',
    country:'Country', score:'Score', classification:'Classification', trend:'Trend', region:'Region',
    primary_source_backed:'Primary-source backed', source_backed:'Source-backed', preliminary:'Preliminary',
    very_favorable:'Very favorable', favorable:'Favorable', mixed:'Mixed', restrictive:'Restrictive', very_restrictive:'Very restrictive',
    improving:'Improving', stable:'Stable', worsening:'Worsening', mixedTrend:'Mixed',
    compareA:'Jurisdiction A', compareB:'Jurisdiction B', generatedAt:'Generated at', countriesCovered:'Countries covered',
    mapNote:'Filled polygons: {filled} • Marker jurisdictions: {markers}',
    noData:'No data'
  }
};

const state = { lang: 'pt', countries: [], filtered: [], selected: null, map: null, metrics: null, presets: [], rankings: null, updates: [], metadata: null };
const MARKER_COORDS = { EUU:{lat:50.8503,lng:4.3517}, HKG:{lat:22.3193,lng:114.1694}, SGP:{lat:1.3521,lng:103.8198}, ARE:{lat:24.4539,lng:54.3773}, SLV:{lat:13.7942,lng:-88.8965}, PRY:{lat:-23.4425,lng:-58.4438}, BHS:{lat:25.0343,lng:-77.3963}, BMU:{lat:32.3078,lng:-64.7505}, CYM:{lat:19.3133,lng:-81.2546}, GIB:{lat:36.1408,lng:-5.3536}, LIE:{lat:47.1660,lng:9.5554}, MUS:{lat:-20.3484,lng:57.5522}, QAT:{lat:25.2854,lng:51.5310} };
const MARKER_ONLY = new Set(['EUU','BHS','BMU','CYM','GIB','LIE','MUS','QAT']);
const QUALITY_ORDER = ['primary_source_backed','source_backed','preliminary'];

function t(k){ return (I18N[state.lang]||I18N.pt)[k] || k; }
function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function colorForScore(score){ if(score>=80) return '#14532d'; if(score>=65) return '#16a34a'; if(score>=50) return '#eab308'; if(score>=35) return '#f97316'; return '#b91c1c'; }
function classLabel(v){ return t(v); }
function trendLabel(v){ return t(v==='mixed' ? 'mixedTrend' : v); }
function fmtDate(d){ try { return new Date(d).toLocaleDateString(state.lang==='pt'?'pt-BR':'en-GB'); } catch { return d || '—'; } }
async function loadJson(path){ const r = await fetch(path); if(!r.ok) throw new Error(`Failed to load ${path}`); return r.json(); }

function applyLanguage(){
  document.documentElement.lang = state.lang === 'pt' ? 'pt-BR':'en';
  document.querySelectorAll('.lang-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.lang===state.lang));
  document.getElementById('label-jurisdictions').textContent = t('jurisdictions');
  document.getElementById('label-score').textContent = t('avg');
  document.getElementById('label-licensed').textContent = t('licensed');
  document.getElementById('label-sources').textContent = t('sources');
  renderAll();
}

function uniqueRegions(){ return [...new Set(state.countries.map(c=>c.region))].sort(); }
function populateFilters(){
  const region = document.getElementById('region-filter');
  const current = region.value || 'all';
  region.innerHTML = `<option value="all">${t('allRegions')}</option>` + uniqueRegions().map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
  region.value = current;
  const a = document.getElementById('compare-a'), b = document.getElementById('compare-b');
  const options = state.countries.slice().sort((x,y)=>x.country.localeCompare(y.country)).map(c=>`<option value="${esc(c.iso3)}">${esc(c.country)}</option>`).join('');
  a.innerHTML = options; b.innerHTML = options;
  a.value = state.countries.some(c=>c.iso3==='BRA') ? 'BRA' : state.countries[0]?.iso3;
  b.value = state.countries.some(c=>c.iso3==='USA') ? 'USA' : state.countries[1]?.iso3;
}

function renderPresets(){
  const presets = state.presets.presets || state.presets || [];
  const container = document.getElementById('preset-buttons');
  container.innerHTML = presets.map((p,i)=>`<button class="preset-btn ${i===0?'active':''}" data-slug="${esc(p.slug)}">${esc(state.lang==='pt' ? (p.label_pt||p.label_en) : (p.label_en||p.label_pt))}</button>`).join('');
  container.querySelectorAll('.preset-btn').forEach(btn=>btn.onclick=()=>applyPreset(btn.dataset.slug));
}

function applyPreset(slug){
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.toggle('active', b.dataset.slug===slug));
  const preset = (state.presets.presets || state.presets || []).find(p=>p.slug===slug);
  document.getElementById('search-input').value='';
  document.getElementById('region-filter').value = preset?.filters?.region || 'all';
  document.getElementById('trend-filter').value = 'all';
  document.getElementById('topic-filter').value = 'all';
  document.getElementById('quality-filter').value = 'all';
  document.getElementById('score-min').value = 0; document.getElementById('score-min-value').textContent = '0';
  state.filtered = state.countries.filter(c => {
    if (!preset) return true;
    if (preset.iso3) return preset.iso3.includes(c.iso3);
    if (preset.filters?.region) return c.region === preset.filters.region;
    if (preset.predicateKey === 'licensed') return /regulated|licensed/i.test(String(c.status?.exchanges || ''));
    if (preset.predicateKey === 'stablecoins') return !!c.status?.stablecoins && !/uncertain|unclear|banned/i.test(String(c.status.stablecoins));
    if (preset.predicateKey === 'cbdc') return !!c.status?.cbdc && !/not central|research only|unclear/i.test(String(c.status.cbdc));
    return true;
  });
  state.selected = state.filtered[0] || state.countries[0] || null;
  renderAll();
}

function filterCountries(){
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  const region = document.getElementById('region-filter').value;
  const trend = document.getElementById('trend-filter').value;
  const topic = document.getElementById('topic-filter').value;
  const quality = document.getElementById('quality-filter').value;
  const scoreMin = Number(document.getElementById('score-min').value || 0);
  document.getElementById('score-min-value').textContent = String(scoreMin);
  state.filtered = state.countries.filter(c => {
    if (q && !(`${c.country} ${c.summary_pt||''} ${c.summary_en||''}`.toLowerCase().includes(q))) return false;
    if (region !== 'all' && c.region !== region) return false;
    if (trend !== 'all' && c.trend !== trend) return false;
    if (quality !== 'all' && c.profile_quality !== quality) return false;
    if ((c.score || 0) < scoreMin) return false;
    if (topic !== 'all' && !c.status?.[topic]) return false;
    return true;
  });
  if (!state.selected || !state.filtered.some(c=>c.iso3===state.selected.iso3)) state.selected = state.filtered[0] || state.countries[0] || null;
  renderAll();
}

function renderKPIs(){
  const f = state.filtered.length ? state.filtered : state.countries;
  const avg = f.length ? (f.reduce((a,b)=>a+(b.score||0),0)/f.length).toFixed(1) : '0.0';
  const lic = f.filter(c => /regulated|licensed/i.test(String(c.status?.exchanges || ''))).length;
  const psrc = f.reduce((a,c)=>a+(c.primary_source_count||0),0);
  document.getElementById('stat-jurisdictions').textContent = String(f.length);
  document.getElementById('stat-score').textContent = avg;
  document.getElementById('stat-licensed').textContent = String(lic);
  document.getElementById('stat-sources').textContent = String(psrc);
}

function criterionValue(country,key){
  if(key==='defi'){
    const v = String(country.status?.defi||'').toLowerCase();
    if (v.includes('regulated') || v.includes('structured')) return 80;
    if (v.includes('indirect')) return 60;
    if (v.includes('uncertain')) return 40;
    if (v.includes('restricted')) return 20;
    return 35;
  }
  return country.criteria?.[key] || 0;
}
function renderCriteria(){
  const keys = ['legal_certainty','proportionality','exchanges','stablecoins','tokenization','taxation','mining_infrastructure','innovation_openness','anti_centralization','defi'];
  const f = state.filtered.length ? state.filtered : state.countries;
  const grid = document.getElementById('criteria-grid');
  grid.innerHTML = keys.map(k=>{
    const avg = f.length ? f.reduce((a,c)=>a+criterionValue(c,k),0)/f.length : 0;
    const pct = Math.max(0, Math.min(100, avg));
    return `<div class="criteria-item"><div class="name">${esc(t(k))}</div><div class="score">${avg.toFixed(1)}</div><div class="bar"><span style="width:${pct}%"></span></div></div>`;
  }).join('');
}

function renderTable(){
  const body = document.getElementById('countries-table-body');
  body.innerHTML = state.filtered.map(c=>`<tr data-iso3="${esc(c.iso3)}"><td>${esc(c.country)}</td><td>${esc(c.region)}</td><td><span class="score-chip" style="background:${colorForScore(c.score)}">${esc(c.score)}</span></td><td>${esc(classLabel(c.classification))}</td><td>${esc(trendLabel(c.trend))}</td></tr>`).join('');
  body.querySelectorAll('tr').forEach(tr=> tr.onclick = () => selectCountry(tr.dataset.iso3));
}

function renderRankings(){
  const list = document.getElementById('top-favorable');
  list.innerHTML = (state.rankings?.top_favorable || []).slice(0,10).map(c=>`<li><strong>${esc(c.country)}</strong> <span class="muted">${c.score}</span></li>`).join('');
  document.getElementById('latest-updates').innerHTML = (state.updates || []).slice(0,8).map(u=>`<li><strong>${esc(u.country)}</strong><br><span class="muted">${fmtDate(u.last_update)} · ${esc(trendLabel(u.trend))} · ${u.score}</span></li>`).join('');
}

function qualityLabel(q){ return t(q); }
function statusGrid(country){
  const pairs = [['exchanges','Exchanges'],['stablecoins','Stablecoins'],['tokenization','Tokenização'],['taxation','Tributação'],['mining','Mineração'],['cbdc','CBDC'],['defi','DeFi']];
  return `<div class="status-grid">` + pairs.map(([k,label])=>`<div class="status-item"><strong>${esc(label)}</strong>${esc(country.status?.[k] || t('noData'))}</div>`).join('') + `</div>`;
}
async function selectCountry(iso3){
  const c = state.countries.find(x=>x.iso3===iso3); if(!c) return; state.selected = c; renderCountry();
}
function renderCountry(){
  const el = document.getElementById('country-panel'); const c = state.selected;
  if(!c){ el.innerHTML = `<div class="empty-state"><h2>${t('selectCountry')}</h2><p>${t('selectHelp')}</p></div>`; return; }
  const srcs = c.references || [];
  el.innerHTML = `
    <div class="section-head"><div><h2>${esc(c.country)}</h2><div class="muted">${esc(c.region)}</div></div><div><span class="badge class-badge" style="background:${colorForScore(c.score)}">${esc(classLabel(c.classification))}</span></div></div>
    <div><span class="badge">Score ${c.score}</span><span class="badge quality-${esc(c.profile_quality)}">${esc(qualityLabel(c.profile_quality))}</span>${c.thesis_core ? `<span class="badge">Tese</span>`:''}</div>
    <p>${esc(state.lang==='pt' ? (c.summary_pt||c.summary_en||'') : (c.summary_en||c.summary_pt||''))}</p>
    <p class="muted"><strong>${t('lastUpdate')}:</strong> ${fmtDate(c.last_update)} · <strong>${t('trend')}:</strong> ${esc(trendLabel(c.trend))} · <strong>Fontes primárias:</strong> ${c.primary_source_count||0}</p>
    <h3>${t('status')}</h3>
    ${statusGrid(c)}
    <h3>${t('laws')}</h3>
    ${c.laws?.length ? `<ul class="list-tight">${c.laws.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${t('noData')}</p>`}
    <h3>${t('opportunities')}</h3>
    ${c[`opportunities_${state.lang}`]?.length ? `<ul class="list-tight">${c[`opportunities_${state.lang}`].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${t('noData')}</p>`}
    <h3>${t('risks')}</h3>
    ${c[`risks_${state.lang}`]?.length ? `<ul class="list-tight">${c[`risks_${state.lang}`].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${t('noData')}</p>`}
    <h3>${t('sourcesTitle')}</h3>
    ${srcs.length ? `<ul class="list-tight">${srcs.map(r=>`<li><a href="${esc(r.url||'#')}" target="_blank" rel="noopener">${esc(r.label||r.url||'Link')}</a></li>`).join('')}</ul>` : `<p class="muted">${t('noData')}</p>`}
  `;
}

function markerData(){
  return state.filtered.filter(c => MARKER_ONLY.has(c.iso3) || !c.iso2).map(c => ({ name:c.country, coords:[MARKER_COORDS[c.iso3]?.lat || 0, MARKER_COORDS[c.iso3]?.lng || 0], iso3:c.iso3, style:{fill:colorForScore(c.score), stroke:'#fff', r:5} } )).filter(m=>m.coords[0] || m.coords[1]);
}
function renderMap(){
  const values = {}; let filled = 0; state.filtered.forEach(c=>{ if(c.iso2 && !MARKER_ONLY.has(c.iso3)){ values[c.iso2.toLowerCase()] = c.score; filled += 1; } });
  const markers = markerData();
  const note = document.getElementById('map-note');
  note.textContent = t('mapNote').replace('{filled}', String(filled)).replace('{markers}', String(markers.length));
  document.getElementById('metadata').textContent = `${t('generatedAt')}: ${fmtDate(state.metrics?.generated_at)} · ${t('countriesCovered')}: ${state.countries.length}`;
  if (state.map) state.map.destroy();
  state.map = new jsVectorMap({
    selector: '#world-map', map: 'world', zoomButtons: true, markersSelectable: true,
    visualizeData: { scale:['#b91c1c','#14532d'], values },
    series: { regions:[{ attribute:'fill', values, scale:['#b91c1c','#14532d'], normalizeFunction:'polynomial' }] },
    markers,
    onRegionTooltipShow(_, tooltip, code){ const c = state.countries.find(x=>x.iso2 && x.iso2.toLowerCase()===code.toLowerCase()); if(c) tooltip.text(`${c.country} · Score ${c.score} · ${classLabel(c.classification)}`); },
    onMarkerTooltipShow(_, tooltip, index){ const marker = markers[index]; const c = state.countries.find(x=>x.iso3===marker.iso3); if(c) tooltip.text(`${c.country} · Score ${c.score} · ${classLabel(c.classification)}`); },
    onRegionClick(_, code){ const c = state.countries.find(x=>x.iso2 && x.iso2.toLowerCase()===code.toLowerCase()); if(c) selectCountry(c.iso3); },
    onMarkerClick(_, index){ const marker = markers[index]; if(marker) selectCountry(marker.iso3); }
  });
}

function renderCompare(){
  const a = state.countries.find(c=>c.iso3===document.getElementById('compare-a').value);
  const b = state.countries.find(c=>c.iso3===document.getElementById('compare-b').value);
  const rows = [
    ['País', a?.country, b?.country], ['Score', a?.score, b?.score], ['Classificação', classLabel(a?.classification||''), classLabel(b?.classification||'')],
    ['Exchanges', a?.status?.exchanges || '—', b?.status?.exchanges || '—'], ['Stablecoins', a?.status?.stablecoins || '—', b?.status?.stablecoins || '—'],
    ['Tokenização', a?.status?.tokenization || '—', b?.status?.tokenization || '—'], ['CBDC', a?.status?.cbdc || '—', b?.status?.cbdc || '—'], ['DeFi', a?.status?.defi || '—', b?.status?.defi || '—'],
    ['Qualidade do perfil', qualityLabel(a?.profile_quality||''), qualityLabel(b?.profile_quality||'')]
  ];
  document.getElementById('compare-body').innerHTML = rows.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(String(r[1]??'—'))}</td><td>${esc(String(r[2]??'—'))}</td></tr>`).join('');
}

function renderAll(){ renderKPIs(); renderCriteria(); renderTable(); renderRankings(); renderCountry(); renderMap(); renderCompare(); }

async function init(){
  try {
    const [countriesPayload, rankings, updates, metrics, metadata, presets] = await Promise.all([
      loadJson('api/countries.json'), loadJson('api/rankings.json'), loadJson('api/updates.json'), loadJson('api/metrics.json'), loadJson('api/metadata.json'), loadJson('data/presets.json')
    ]);
    state.countries = countriesPayload.countries || countriesPayload || [];
    state.filtered = [...state.countries];
    state.selected = state.countries.find(c=>c.iso3==='BRA') || state.countries[0] || null;
    state.rankings = rankings; state.updates = updates; state.metrics = metrics; state.metadata = metadata; state.presets = presets;
    populateFilters(); renderPresets(); applyLanguage();
    document.getElementById('search-input').addEventListener('input', filterCountries);
    ['region-filter','trend-filter','topic-filter','quality-filter'].forEach(id=>document.getElementById(id).addEventListener('change', filterCountries));
    document.getElementById('score-min').addEventListener('input', filterCountries);
    document.getElementById('compare-a').addEventListener('change', renderCompare); document.getElementById('compare-b').addEventListener('change', renderCompare);
    document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click', ()=>{ state.lang = btn.dataset.lang; applyLanguage(); }));
  } catch (err) {
    console.error(err);
    document.body.innerHTML = `<main style="padding:40px;font-family:Inter,sans-serif"><h1>Erro ao carregar o Atlas</h1><p>${err.message}</p><p>Verifique se os arquivos foram enviados na raiz do repositório e se a pasta <code>api/</code> está acessível.</p></main>`;
  }
}
init();
