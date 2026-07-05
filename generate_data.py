import json, random, math
from datetime import datetime, timedelta

random.seed(42)

airports = {
    "YYZ": {"city": "Toronto",     "country": "Canada"},
    "YVR": {"city": "Vancouver",   "country": "Canada"},
    "YUL": {"city": "Montreal",    "country": "Canada"},
    "JFK": {"city": "New York",    "country": "USA"},
    "LAX": {"city": "Los Angeles", "country": "USA"},
    "SFO": {"city": "San Francisco","country": "USA"},
    "ORD": {"city": "Chicago",     "country": "USA"},
    "MIA": {"city": "Miami",       "country": "USA"},
    "LHR": {"city": "London",      "country": "UK"},
    "CDG": {"city": "Paris",       "country": "France"},
    "FRA": {"city": "Frankfurt",   "country": "Germany"},
    "AMS": {"city": "Amsterdam",   "country": "Netherlands"},
    "DXB": {"city": "Dubai",       "country": "UAE"},
    "HKG": {"city": "Hong Kong",   "country": "Hong Kong"},
    "NRT": {"city": "Tokyo",       "country": "Japan"},
    "ICN": {"city": "Seoul",       "country": "South Korea"},
    "PVG": {"city": "Shanghai",    "country": "China"},
    "PEK": {"city": "Beijing",     "country": "China"},
    "SIN": {"city": "Singapore",   "country": "Singapore"},
    "SYD": {"city": "Sydney",      "country": "Australia"},
    "DEL": {"city": "Delhi",       "country": "India"},
    "GRU": {"city": "Sao Paulo",   "country": "Brazil"},
}

routes = [
    ("YYZ", "PVG"), ("YYZ", "PEK"), ("YYZ", "NRT"), ("YYZ", "LHR"), ("YYZ", "CDG"),
    ("YVR", "PVG"), ("YVR", "NRT"), ("YVR", "SYD"), ("YVR", "LHR"),
    ("YUL", "CDG"), ("YUL", "LHR"),
    ("JFK", "LHR"), ("JFK", "CDG"), ("JFK", "NRT"), ("JFK", "PVG"), ("JFK", "DEL"),
    ("LAX", "NRT"), ("LAX", "PVG"), ("LAX", "SYD"), ("LAX", "LHR"),
    ("SFO", "NRT"), ("SFO", "PVG"), ("SFO", "SYD"), ("SFO", "LHR"),
    ("ORD", "LHR"), ("ORD", "NRT"), ("ORD", "PVG"),
    ("LHR", "DXB"), ("LHR", "HKG"), ("LHR", "SIN"),
    ("CDG", "DXB"), ("CDG", "NRT"), ("CDG", "PVG"),
    ("FRA", "PVG"), ("FRA", "NRT"), ("FRA", "SIN"),
    ("AMS", "PVG"), ("AMS", "NRT"), ("AMS", "SIN"),
    ("SYD", "PVG"), ("SYD", "NRT"), ("SYD", "HKG"),
    ("SIN", "NRT"), ("SIN", "PVG"), ("SIN", "HKG"),
    ("DXB", "PVG"), ("DXB", "NRT"), ("DXB", "LHR"),
    ("HKG", "PVG"), ("HKG", "NRT"), ("HKG", "SFO"),
    ("ICN", "PVG"), ("ICN", "NRT"), ("ICN", "LHR"),
]

airlines_by_region = {
    "Canada": ["Air Canada", "WestJet"],
    "USA": ["United", "Delta", "American", "Southwest"],
    "UK": ["British Airways", "Virgin Atlantic"],
    "France": ["Air France"],
    "Germany": ["Lufthansa"],
    "Netherlands": ["KLM"],
    "UAE": ["Emirates", "Etihad"],
    "Hong Kong": ["Cathay Pacific"],
    "Japan": ["ANA", "Japan Airlines"],
    "South Korea": ["Korean Air", "Asiana"],
    "China": ["China Eastern", "China Southern", "Air China", "Hainan Airlines"],
    "Singapore": ["Singapore Airlines"],
    "Australia": ["Qantas"],
    "India": ["Air India"],
    "Brazil": ["LATAM"],
}

def get_airlines(origin, dest):
    out = []
    o = airports[origin]
    d = airports[dest]
    if o["country"] in airlines_by_region:
        out.extend(airlines_by_region[o["country"]])
    if d["country"] in airlines_by_region:
        out.extend(airlines_by_region[d["country"]])
    out.append("Various")
    return list(set(out))

def base_price(origin, dest):
    dist = {
        ("YYZ","PVG"): 12000, ("YYZ","PEK"): 11500, ("YYZ","NRT"): 10500, ("YYZ","LHR"): 6000, ("YYZ","CDG"): 6200,
        ("YVR","PVG"): 10000, ("YVR","NRT"): 8500, ("YVR","SYD"): 12500, ("YVR","LHR"): 7500,
        ("YUL","CDG"): 5800, ("YUL","LHR"): 5500,
        ("JFK","LHR"): 5500, ("JFK","CDG"): 6000, ("JFK","NRT"): 11000, ("JFK","PVG"): 12000, ("JFK","DEL"): 12500,
        ("LAX","NRT"): 9500, ("LAX","PVG"): 10500, ("LAX","SYD"): 12000, ("LAX","LHR"): 7000,
        ("SFO","NRT"): 9000, ("SFO","PVG"): 10000, ("SFO","SYD"): 11500, ("SFO","LHR"): 6500,
        ("ORD","LHR"): 6000, ("ORD","NRT"): 10500, ("ORD","PVG"): 11500,
        ("LHR","DXB"): 6000, ("LHR","HKG"): 10000, ("LHR","SIN"): 11000,
        ("CDG","DXB"): 6500, ("CDG","NRT"): 10500, ("CDG","PVG"): 9500,
        ("FRA","PVG"): 9000, ("FRA","NRT"): 9500, ("FRA","SIN"): 10000,
        ("AMS","PVG"): 8500, ("AMS","NRT"): 9500, ("AMS","SIN"): 10000,
        ("SYD","PVG"): 8500, ("SYD","NRT"): 7500, ("SYD","HKG"): 7000,
        ("SIN","NRT"): 7500, ("SIN","PVG"): 6000, ("SIN","HKG"): 3500,
        ("DXB","PVG"): 7500, ("DXB","NRT"): 9000, ("DXB","LHR"): 5500,
        ("HKG","PVG"): 2500, ("HKG","NRT"): 4000, ("HKG","SFO"): 8000,
        ("ICN","PVG"): 1500, ("ICN","NRT"): 2500, ("ICN","LHR"): 9000,
    }
    return dist.get((origin, dest), dist.get((dest, origin), 8000))

def seasonal_factor(month, dest_region, origin_region):
    if dest_region in ("China", "Hong Kong") and month in (1, 2):
        return 1.4
    if dest_region in ("Japan", "South Korea") and month in (3, 4):
        return 1.3
    if dest_region == "Australia" and month in (11, 12, 1):
        return 1.35
    if origin_region == "Canada" and month in (7, 8):
        return 1.25
    if dest_region in ("UK", "France", "Germany", "Netherlands") and month in (6, 7, 8):
        return 1.3
    if dest_region == "UAE" and month in (11, 12):
        return 1.2
    if month in (11, 12):
        return 1.15
    return 1.0

def gen_route_data(origin, dest, start_date, end_date):
    records = []
    d = start_date
    base = base_price(origin, dest)
    al = get_airlines(origin, dest)
    dest_region = airports[dest]["country"]
    origin_region = airports[origin]["country"]
    
    while d <= end_date:
        season = seasonal_factor(d.month, dest_region, origin_region)
        day_of_week = d.weekday()
        dow_factor = 1.1 if day_of_week >= 4 else 1.0
        noise = random.gauss(0, 0.08)
        price = int(base * season * dow_factor * (1 + noise))
        price = max(price, 300)
        price = (price // 10) * 10
        airline = random.choice(al)
        records.append({"date": d.strftime("%Y-%m-%d"), "price": price, "airline": airline})
        d += timedelta(days=1)
    return records

today = datetime.today()
start = today - timedelta(days=730)
end = today

all_routes_data = []
for orig, dest in routes:
    key = f"{orig}-{dest}"
    label = f"{airports[orig]['city']} ({orig}) →  {airports[dest]['city']} ({dest})"
    print(f"Generating {label}...")
    prices = gen_route_data(orig, dest, start, end)
    with open(f"data/{key}.json", "w") as f:
        json.dump({"route": key, "origin": orig, "dest": dest, "label": label, "prices": prices}, f, indent=2)
    all_routes_data.append({
        "key": key, "origin": orig, "dest": dest,
        "originCity": airports[orig]["city"], "destCity": airports[dest]["city"],
        "originCountry": airports[orig]["country"], "destCountry": airports[dest]["country"],
        "label": label
    })

with open("data/routes.json", "w") as f:
    json.dump(all_routes_data, f, indent=2)

print(f"\nGenerated {len(routes)} routes with price data from {start.date()} to {end.date()}")
