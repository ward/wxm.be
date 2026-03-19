const DEFAULT_MAP = "visited";

const AVAILABLE_MAPS = [
  { id: "visited", label: "Visited" },
  { id: "countries", label: "Countries" },
  { id: "westcoast2019", label: "West Coast 2019" },
];

class MapSelectorControl {
  constructor(currentMapId, onSelect) {
    this._currentMapId = currentMapId;
    this._onSelect = onSelect;
  }

  onAdd() {
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl";

    var select = document.createElement("select");
    select.style.padding = "4px 8px";
    select.style.fontSize = "14px";

    AVAILABLE_MAPS.forEach(
      function (m) {
        var option = document.createElement("option");
        option.value = m.id;
        option.textContent = m.label;
        if (m.id === this._currentMapId) {
          option.selected = true;
        }
        select.appendChild(option);
      }.bind(this),
    );

    select.addEventListener(
      "change",
      function (e) {
        this._onSelect(e.target.value);
      }.bind(this),
    );

    this._container.appendChild(select);
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
  }
}

class ProjectionToggleControl {
  constructor(map) {
    this._map = map;
  }

  onAdd() {
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl";

    var button = document.createElement("button");
    button.style.padding = "4px 8px";
    button.style.fontSize = "14px";
    button.style.cursor = "pointer";
    // TODO: make this an icon (black and white, maybe pinhead?)
    button.textContent = "Globe";
    button.title = "Toggle projection";

    // TODO: Should probably read state of the map instead?
    this._globe = false;

    button.addEventListener(
      "click",
      function () {
        this._globe = !this._globe;
        this._map.setProjection({ type: this._globe ? "globe" : "mercator" });
        button.textContent = this._globe ? "Mercator" : "Globe";
      }.bind(this),
    );

    this._container.appendChild(button);
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
  }
}

// () -> String
function get_map_name() {
  var params = new URLSearchParams(window.location.search);
  return params.get("i") || DEFAULT_MAP;
}

function loadAndShowGeoJSON(map, mapId) {
  fetch(`geojson/${mapId}.geojson`)
    .then(function (response) {
      return response.json();
    })
    .then(function (geojson) {
      var flat = flattenFeatureCollection(geojson);
      var source = map.getSource("geojson-data");
      if (source) {
        source.setData(flat);
      } else {
        addSourceAndLayers(map, flat);
      }
      fitBounds(map, flat);
    });
}

// Flatten nested FeatureCollections into a single flat FeatureCollection.
// The GeoJSON files use FeatureCollections inside FeatureCollections (e.g.,
// grouped by continent), which MapLibre does not support directly.
function flattenFeatureCollection(geojson) {
  var features = [];
  function collect(obj) {
    if (obj.type === "FeatureCollection") {
      (obj.features || []).forEach(collect);
    } else if (obj.type === "Feature") {
      features.push(obj);
    }
  }
  collect(geojson);
  return { type: "FeatureCollection", features: features };
}

function fitBounds(map, flat) {
  var bounds = new maplibregl.LngLatBounds();
  flat.features.forEach(function (feature) {
    var geom = feature.geometry;
    if (!geom) return;
    if (geom.type === "Point") {
      bounds.extend(geom.coordinates);
    } else if (geom.type === "LineString" || geom.type === "MultiPoint") {
      geom.coordinates.forEach(function (c) {
        bounds.extend(c);
      });
    } else if (geom.type === "Polygon" || geom.type === "MultiLineString") {
      geom.coordinates.forEach(function (ring) {
        ring.forEach(function (c) {
          bounds.extend(c);
        });
      });
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach(function (polygon) {
        polygon.forEach(function (ring) {
          ring.forEach(function (c) {
            bounds.extend(c);
          });
        });
      });
    }
  });
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 40 });
  }
}

function addSourceAndLayers(map, flat) {
  map.addSource("geojson-data", {
    type: "geojson",
    data: flat,
  });

  // Layer for lines (LineString, MultiLineString)
  map.addLayer({
    id: "geojson-lines",
    type: "line",
    source: "geojson-data",
    filter: [
      "any",
      ["==", ["geometry-type"], "LineString"],
      ["==", ["geometry-type"], "MultiLineString"],
    ],
    paint: {
      "line-color": "#3388ff",
      "line-width": 3,
    },
  });

  // Layer for polygons (Polygon, MultiPolygon)
  map.addLayer({
    id: "geojson-polygons-fill",
    type: "fill",
    source: "geojson-data",
    filter: [
      "any",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["geometry-type"], "MultiPolygon"],
    ],
    paint: {
      "fill-color": "#3388ff",
      "fill-opacity": 0.2,
    },
  });
  map.addLayer({
    id: "geojson-polygons-outline",
    type: "line",
    source: "geojson-data",
    filter: [
      "any",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["geometry-type"], "MultiPolygon"],
    ],
    paint: {
      "line-color": "#3388ff",
      "line-width": 2,
    },
  });

  // Layer for points
  map.addLayer({
    id: "geojson-points",
    type: "circle",
    source: "geojson-data",
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": 6,
      "circle-color": "#3388ff",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#ffffff",
    },
  });

  // Popups and cursor for clickable layers
  ["geojson-points", "geojson-lines", "geojson-polygons-fill"].forEach(
    function (layerId) {
      map.on("click", layerId, function (e) {
        var feature = e.features[0];
        var html = popupHTML(feature);
        if (html) {
          new maplibregl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
        }
      });
      map.on("mouseenter", layerId, function () {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, function () {
        map.getCanvas().style.cursor = "";
      });
    },
  );
}

function popupHTML(feature) {
  if (feature.properties && feature.properties.name) {
    var html = "<strong>" + feature.properties.name + "</strong>";
    if (feature.properties.description) {
      html += "<br />" + feature.properties.description;
    }
    return html;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", function () {
  var map = new maplibregl.Map({
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: [0, 30],
    zoom: 2,
    container: "map",
  });

  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));
  map.addControl(
    new maplibregl.NavigationControl({ showZoom: false, visualizePitch: true }),
  );

  map.addControl(new ProjectionToggleControl(map));

  var currentMapId = get_map_name();
  map.addControl(
    new MapSelectorControl(currentMapId, function (mapId) {
      loadAndShowGeoJSON(map, mapId);
    }),
    "top-left",
  );

  map.on("load", function () {
    loadAndShowGeoJSON(map, currentMapId);
  });
});
