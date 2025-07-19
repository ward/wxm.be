const DEFAULT_MAP = "visited";
var mymap;

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
function createPopup(feature, layer) {
  if (feature.properties && feature.properties.name) {
    var popupContent = "<strong>" + feature.properties.name + "</strong>";
    if (feature.properties.description) {
      popupContent += "<br />" + feature.properties.description;
    }
    layer.bindPopup(popupContent);
  }
}
// Enable placing custom points. By default just use the L.marker, which is
// what Leaflet would do normally.
function create_point(geo_json_point, latlng) {
  if (geo_json_point.properties && geo_json_point.properties.unicode_icon) {
    let unicode_icon = L.divIcon({
      html: geo_json_point.properties.unicode_icon,
      iconSize: [30, 30],
      className: "unicode_icon",
    });
    return L.marker(latlng, { icon: unicode_icon });
  } else {
    return L.marker(latlng);
  }
}
// Uses global mymap variable
function handle_geojson(geojson) {
  // The style option is for lines and polygons, not for points. Instead, use pointToLayer.
  var geojsonLayer = L.geoJSON(geojson, {
    pointToLayer: create_point,
    onEachFeature: createPopup,
  }).addTo(mymap);
  L.control.scale({ metric: true, imperial: false }).addTo(mymap);
  mymap.fitBounds(geojsonLayer.getBounds());
}
// Overrides global mymap variable
function create_map() {
  mymap = L.map("mapid").setView([39, -38], 3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(mymap);
}

// () -> String
function get_map_name() {
  var params = new URLSearchParams(window.location.search);
  var map_name = params.get("i") || DEFAULT_MAP;
  return `geojson/${map_name}.geojson`;
}

document.addEventListener("DOMContentLoaded", function () {
  create_map();
  loadJSON(handle_geojson, get_map_name());
});
