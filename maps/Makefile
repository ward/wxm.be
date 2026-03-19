COUNTRY_SOURCES := $(wildcard countries/geojson/*.geojson)

all: geojson/countries.geojson

geojson/countries.geojson: $(COUNTRY_SOURCES)
	python3 -c '\
import json, glob, os; \
features = []; \
[features.extend( \
    [dict(f, properties=dict(f.get("properties", {}), name=os.path.splitext(os.path.basename(p))[0])) \
     for f in json.load(open(p))["features"]] \
) for p in sorted(glob.glob("countries/geojson/*.geojson"))]; \
json.dump({"type": "FeatureCollection", "features": features}, open("$@", "w"))'
