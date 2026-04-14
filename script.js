
function getCountriesArray(data){
  if(Array.isArray(data)) return data;
  if(Array.isArray(data?.countries)) return data.countries;
  return [];
}

async function loadAndRender(){
  const raw = await fetch("api/countries.json").then(r=>r.json());
  const countries = getCountriesArray(raw);
  window.state = window.state || {};
  state.countries = countries;
  state.filtered = countries;

  const mapEl = document.getElementById("world-map");
  if(!mapEl) return;

  mapEl.innerHTML = "";

  try{
    new jsVectorMap({
      selector:"#world-map",
      map:"world"
    });
  }catch(err){
    console.error("Map failed:", err);
  }
}

loadAndRender();
