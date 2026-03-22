const DEFAULT_MAP = "visited";

const US_VISITED_STATES = [
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

const US_BEER_STATES = [
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

/**
 * Map entries can optionally specify highlight config for maps where the
 * geojson contains all features (e.g., all US state boundaries) but only some
 * should be visually emphasised. When set, applyHighlight() stamps a
 * "highlighted" property on each feature at load time, and the paint
 * expressions in addSourceAndLayers() use it to dim non-highlighted features.
 *
 *   highlightKey    - the feature property to match against (e.g., "NAME")
 *   highlightValues - array of values that count as highlighted
 *   file            - optional, geojson filename if different from the id
 */
const AVAILABLE_MAPS = [
  { id: "visited", label: "Visited" },
  { id: "countries", label: "Countries" },
  {
    id: "us-states",
    label: "US States",
    highlightKey: "NAME",
    highlightValues: US_VISITED_STATES,
  },
  {
    id: "us-states-beer",
    label: "US States (Beer)",
    file: "us-states",
    highlightKey: "NAME",
    highlightValues: US_BEER_STATES,
  },
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

function get_map_name() {
  var params = new URLSearchParams(window.location.search);
  return params.get("i") || DEFAULT_MAP;
}

function getMapConfig(mapId) {
  return AVAILABLE_MAPS.find(function (m) {
    return m.id === mapId;
  });
}

function loadAndShowGeoJSON(map, mapId) {
  var config = getMapConfig(mapId);
  var file = (config && config.file) || mapId;
  fetch(`geojson/${file}.geojson`)
    .then(function (response) {
      return response.json();
    })
    .then(function (geojson) {
      var flat = flattenFeatureCollection(geojson);
      if (config && config.highlightKey) {
        applyHighlight(flat, config.highlightKey, config.highlightValues);
      }
      var source = map.getSource("geojson-data");
      if (source) {
        source.setData(flat);
      } else {
        addSourceAndLayers(map, flat);
      }
      fitBounds(map, flat);
    });
}

/**
 * Mark each feature as highlighted or not, based on the map config.
 * Also copies the match key to "name" so popups work automatically.
 */
function applyHighlight(flat, key, values) {
  flat.features.forEach(function (feature) {
    if (feature.properties && feature.properties[key] !== undefined) {
      feature.properties.highlighted =
        values.indexOf(feature.properties[key]) !== -1;
      if (!feature.properties.name) {
        feature.properties.name = feature.properties[key];
      }
    }
  });
}

/**
 * Flatten nested FeatureCollections into a single flat FeatureCollection.
 * The GeoJSON files use FeatureCollections inside FeatureCollections (e.g.,
 * grouped by continent), which MapLibre does not support directly.
 */
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
      // Features with highlighted=false are dimmed; features without the
      // property (i.e., maps that don't use highlighting) get the default blue.
      "fill-color": [
        "case",
        ["==", ["get", "highlighted"], false],
        "#cccccc",
        "#3388ff",
      ],
      "fill-opacity": ["case", ["==", ["get", "highlighted"], false], 0.1, 0.2],
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
      "line-color": [
        "case",
        ["==", ["get", "highlighted"], false],
        "#999999",
        "#3388ff",
      ],
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
