const DEFAULT_MAP = 'visited';

function loadJSON(callback, geojson_location) {   
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', geojson_location, true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(JSON.parse(xobj.responseText));
    }
  };
  xobj.send(null);  
}
function createPopup(feature, layer) {
  if (feature.properties && feature.properties.name) {
    var popupContent = "<strong>" + feature.properties.name + "</strong>";
    if (feature.properties.description) {
      popupContent += "<br />" + feature.properties.description;
    }
    layer.bindPopup(popupContent);
  }
}
function handle_geojson(geojson) {
  var mymap = L.map('mapid').setView([39,-38], 3);
  // L.tileLayer('https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  // L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
  L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    subdomains: 'abcd',
    ext: 'png',
    maxZoom: 18,
  }).addTo(mymap);

  var geojsonLayer = L.geoJSON(geojson, { onEachFeature: createPopup }).addTo(mymap);
  mymap.fitBounds(geojsonLayer.getBounds());
}

// () -> String
function get_map_name() {
  var params = new URLSearchParams(window.location.search);
  var map_name = params.get('i') || DEFAULT_MAP;
  return `geojson/${map_name}.geojson`;
}

document.addEventListener('DOMContentLoaded', function() {
  loadJSON(handle_geojson, get_map_name());
});

