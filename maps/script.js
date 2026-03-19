const DEFAULT_MAP = "visited";

// () -> String
function get_map_name() {
  var params = new URLSearchParams(window.location.search);
  var map_name = params.get("i") || DEFAULT_MAP;
  return `geojson/${map_name}.geojson`;
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

function handle_geojson(map, geojson) {
  var flat = flattenFeatureCollection(geojson);

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

  // Popups on click for points
  map.on("click", "geojson-points", function (e) {
    var feature = e.features[0];
    var html = popupHTML(feature);
    if (html) {
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    }
  });

  // Popups on click for lines
  map.on("click", "geojson-lines", function (e) {
    var feature = e.features[0];
    var html = popupHTML(feature);
    if (html) {
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    }
  });

  // Popups on click for polygons
  map.on("click", "geojson-polygons-fill", function (e) {
    var feature = e.features[0];
    var html = popupHTML(feature);
    if (html) {
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    }
  });

  // Change cursor to pointer on hover over clickable features
  ["geojson-points", "geojson-lines", "geojson-polygons-fill"].forEach(
    function (layerId) {
      map.on("mouseenter", layerId, function () {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, function () {
        map.getCanvas().style.cursor = "";
      });
    },
  );

  // Fit map to the data bounds
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

  map.on("load", function () {
    fetch(get_map_name())
      .then(function (response) {
        return response.json();
      })
      .then(function (geojson) {
        handle_geojson(map, geojson);
      });
  });
});
