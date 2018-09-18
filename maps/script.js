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
  L.tileLayer('https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
  }).addTo(mymap);

  L.geoJSON(geojson, { onEachFeature: createPopup }).addTo(mymap);
}

document.addEventListener('DOMContentLoaded', function() {
  loadJSON(handle_geojson, "geojson/visited.geojson");
});

