var mymap;
// State boundaries from <https://eric.clst.org/tech/usgeojson/>.
// What for overseas territories?
const VISITED_STATES = [
  "California",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Illinois",
  "Kansas",
  "Maryland",
  "Nevada",
  "New Jersey",
  "New York",
  "North Carolina",
  "Pennsylvania",
  "Puerto Rico",
  "Utah",
  "Virginia",
  "Wisconsin",
];
// I have had a beer from these states. Fill from Untappd.
const BEER_STATES = [
  "Alaska",
  "Arizona",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Missouri",
  "New Jersey",
  "New York",
  "North Carolina",
  "Ohio",
  "Oregon",
  "Pennsylvania",
  "South Carolina",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "Wisconsin",
];

function is_beer() {
  let beerparam = new URL(document.location).searchParams.get("beer");
  return (
    beerparam !== null &&
    beerparam !== undefined &&
    beerparam !== "false" &&
    beerparam !== "no"
  );
}

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
function handle_states(geojson, list_of_states) {
  var geojsonLayer = L.geoJSON(geojson, {
    // pointToLayer: create_point,
    style: (feature) => {
      if (list_of_states.includes(feature.properties.NAME)) {
        return {
          fillColor: "#00ff00",
          color: "#00ff44",
        };
      } else {
        return {
          fillOpacity: 0.1,
          opacity: 0.6,
        };
      }
    },
    onEachFeature: (feature, layer) =>
      create_popup(feature, layer, feature.properties.NAME),
  }).addTo(mymap);
}
function create_popup(feature, layer, country_name) {
  if (typeof country_name === "string" && country_name !== "") {
    layer.bindPopup(country_name);
  }
}
function create_map() {
  mymap = L.map("mapid").setView([39.83, -98.58], 4);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(mymap);
  L.control.scale({ metric: true, imperial: false }).addTo(mymap);
}

document.addEventListener("DOMContentLoaded", function () {
  create_map();

  loadJSON((geojson) => {
    if (is_beer()) {
      handle_states(geojson, BEER_STATES);
    } else {
      handle_states(geojson, VISITED_STATES);
    }
  }, `geojson/gz_2010_us_040_00_5m.geojson`);
});
