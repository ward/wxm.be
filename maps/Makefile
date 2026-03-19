# Country data from https://github.com/georgique/world-geojson. Only
# downloaded those countries I have been in at the time of writing.
# Note that this path is also mentioned in the Python snippet below!
COUNTRY_SOURCES := $(wildcard geojson/countries/*.geojson)

all: geojson/countries.geojson

geojson/countries.geojson: $(COUNTRY_SOURCES)
	python3 -c '\
import json, glob, os; \
features = []; \
[features.extend( \
    [dict(f, properties=dict(f.get("properties", {}), name=os.path.splitext(os.path.basename(p))[0])) \
     for f in json.load(open(p))["features"]] \
) for p in sorted(glob.glob("geojson/countries/*.geojson"))]; \
json.dump({"type": "FeatureCollection", "features": features}, open("$@", "w"))'
