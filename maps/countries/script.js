var mymap;
const VISITED_COUNTRIES = [
  "belgium",
  "netherlands",
  "luxembourg",
  "france",
  "germany",
  "united_kingdom",
  "spain",
  "monaco",
  "italy",
  "slovenia",
  "denmark",
  "sweden",
  "norway",
  "greece",
  "malta",
  "cyprus",
  "usa",
  "switzerland",
  "austria",
  "ireland",
  "argentina",
  "hungary",
  "czech", // No GPS tracks alas
  "finland",
  "estonia",
  "colombia",
  "slovakia",
  "croatia",
];
// Country data from https://github.com/georgique/world-geojson. Only
// downloaded those countries I have been in at the time of writing.

function loadJSON(callback, geojson_location) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", geojson_location, true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(JSON.parse(xobj.responseText));
    }
  };
  xobj.send(null);
}
function handle_country(country_name, geojson) {
  var geojsonLayer = L.geoJSON(geojson, {
    // pointToLayer: create_point,
    onEachFeature: (feature, layer) =>
      create_popup(feature, layer, country_name),
  }).addTo(mymap);
}
function create_popup(feature, layer, country_name) {
  if (typeof country_name === "string" && country_name !== "") {
    layer.bindPopup(country_name);
  }
}
function create_map() {
  mymap = L.map("mapid").setView([39, -38], 3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(mymap);
  L.control.scale({ metric: true, imperial: false }).addTo(mymap);
}

document.addEventListener("DOMContentLoaded", function () {
  create_map();

  for (let country of VISITED_COUNTRIES) {
    // TODO: Also output a list or table under the map?
    console.log(country);
    loadJSON(
      (geojson) => handle_country(country, geojson),
      `geojson/${country}.geojson`,
    );
  }
});
