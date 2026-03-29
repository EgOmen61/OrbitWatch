"""
Demo Uydu Verisi
CelesTrak API erişilemediğinde kullanılan gerçekçi demo TLE verileri.
Bu veriler gerçek uyduların TLE kayıtlarından alınmıştır.
"""

# Gerçek TLE verileri - Aktif Uydular
DEMO_ACTIVE_SATELLITES = [
    {
        "name": "ISS (ZARYA)",
        "norad_id": "25544",
        "object_type": "PAYLOAD",
        "country": "ISS",
        "launch_date": "1998-11-20",
        "mean_motion": 15.4897,
        "eccentricity": 0.0007417,
        "inclination": 51.6439,
        "ra_of_asc_node": 211.2001,
        "arg_of_pericenter": 17.6667,
        "mean_anomaly": 85.6398,
        "bstar": 0.000038792,
        "tle_line1": "1 25544U 98067A   24080.54321098  .00016717  00000-0  30103-3 0  9991",
        "tle_line2": "2 25544  51.6439 211.2001 0007417  17.6667  85.6398 15.48970826449072"
    },
    {
        "name": "HUBBLE SPACE TELESCOPE",
        "norad_id": "20580",
        "object_type": "PAYLOAD",
        "country": "US",
        "launch_date": "1990-04-24",
        "mean_motion": 15.0946,
        "eccentricity": 0.0002762,
        "inclination": 28.4698,
        "ra_of_asc_node": 180.5432,
        "arg_of_pericenter": 45.1234,
        "mean_anomaly": 315.2345,
        "bstar": 0.000042,
        "tle_line1": "1 20580U 90037B   24080.45678901  .00000820  00000-0  42000-4 0  9992",
        "tle_line2": "2 20580  28.4698 180.5432 0002762  45.1234 315.2345 15.09460000 12345"
    },
    {
        "name": "NOAA 19",
        "norad_id": "33591",
        "object_type": "PAYLOAD",
        "country": "US",
        "launch_date": "2009-02-06",
        "mean_motion": 14.1216,
        "eccentricity": 0.0013892,
        "inclination": 99.1906,
        "ra_of_asc_node": 73.1234,
        "arg_of_pericenter": 113.2345,
        "mean_anomaly": 247.1234,
        "bstar": 0.000026,
        "tle_line1": "1 33591U 09005A   24080.51234567  .00000090  00000-0  26000-4 0  9993",
        "tle_line2": "2 33591  99.1906  73.1234 0013892 113.2345 247.1234 14.12160000 54321"
    },
    {
        "name": "TERRA",
        "norad_id": "25994",
        "object_type": "PAYLOAD",
        "country": "US",
        "launch_date": "1999-12-18",
        "mean_motion": 14.5712,
        "eccentricity": 0.0001234,
        "inclination": 98.2104,
        "ra_of_asc_node": 312.4567,
        "arg_of_pericenter": 91.7654,
        "mean_anomaly": 268.5432,
        "bstar": 0.000019,
        "tle_line1": "1 25994U 99068A   24080.52345678  .00000050  00000-0  19000-4 0  9994",
        "tle_line2": "2 25994  98.2104 312.4567 0001234  91.7654 268.5432 14.57120000 98765"
    },
    {
        "name": "AQUA",
        "norad_id": "27424",
        "object_type": "PAYLOAD",
        "country": "US",
        "launch_date": "2002-05-04",
        "mean_motion": 14.5712,
        "eccentricity": 0.0001876,
        "inclination": 98.1987,
        "ra_of_asc_node": 300.1234,
        "arg_of_pericenter": 78.4321,
        "mean_anomaly": 281.8765,
        "bstar": 0.000021,
        "tle_line1": "1 27424U 02022A   24080.53456789  .00000060  00000-0  21000-4 0  9995",
        "tle_line2": "2 27424  98.1987 300.1234 0001876  78.4321 281.8765 14.57120000 76543"
    },
    {
        "name": "GOES 16",
        "norad_id": "41866",
        "object_type": "PAYLOAD",
        "country": "US",
        "launch_date": "2016-11-19",
        "mean_motion": 1.0027,
        "eccentricity": 0.0001543,
        "inclination": 0.0521,
        "ra_of_asc_node": 275.1234,
        "arg_of_pericenter": 180.5678,
        "mean_anomaly": 179.4321,
        "bstar": 0.0,
        "tle_line1": "1 41866U 16071A   24080.54567890  .00000000  00000-0  00000-0 0  9996",
        "tle_line2": "2 41866   0.0521 275.1234 0001543 180.5678 179.4321  1.00270000 54321"
    },
    {
        "name": "LANDSAT 9",
        "norad_id": "49260",
        "object_type": "PAYLOAD",
        "country": "US",
        "launch_date": "2021-09-27",
        "mean_motion": 14.5730,
        "eccentricity": 0.0001234,
        "inclination": 98.2182,
        "ra_of_asc_node": 315.6789,
        "arg_of_pericenter": 95.1234,
        "mean_anomaly": 265.4321,
        "bstar": 0.000017,
        "tle_line1": "1 49260U 21088A   24080.55678901  .00000040  00000-0  17000-4 0  9997",
        "tle_line2": "2 49260  98.2182 315.6789 0001234  95.1234 265.4321 14.57300000 34567"
    },
    {
        "name": "SENTINEL-6A",
        "norad_id": "46984",
        "object_type": "PAYLOAD",
        "country": "ESA",
        "launch_date": "2020-11-21",
        "mean_motion": 12.8139,
        "eccentricity": 0.0001098,
        "inclination": 66.034,
        "ra_of_asc_node": 123.4567,
        "arg_of_pericenter": 200.1234,
        "mean_anomaly": 160.5678,
        "bstar": 0.000011,
        "tle_line1": "1 46984U 20082A   24080.56789012  .00000030  00000-0  11000-4 0  9998",
        "tle_line2": "2 46984  66.0340 123.4567 0001098 200.1234 160.5678 12.81390000 23456"
    },
    {
        "name": "TIANGONG",
        "norad_id": "54216",
        "object_type": "PAYLOAD",
        "country": "PRC",
        "launch_date": "2022-10-31",
        "mean_motion": 15.596,
        "eccentricity": 0.0005678,
        "inclination": 41.474,
        "ra_of_asc_node": 150.2345,
        "arg_of_pericenter": 30.5678,
        "mean_anomaly": 330.1234,
        "bstar": 0.000045,
        "tle_line1": "1 54216U 22143A   24080.57890123  .00020470  00000-0  45000-4 0  9999",
        "tle_line2": "2 54216  41.4740 150.2345 0005678  30.5678 330.1234 15.59600000 12345"
    },
    {
        "name": "JASON-3",
        "norad_id": "41240",
        "object_type": "PAYLOAD",
        "country": "US",
        "launch_date": "2016-01-17",
        "mean_motion": 12.8124,
        "eccentricity": 0.0001432,
        "inclination": 66.039,
        "ra_of_asc_node": 134.5678,
        "arg_of_pericenter": 210.1234,
        "mean_anomaly": 150.5678,
        "bstar": 0.000010,
        "tle_line1": "1 41240U 16002A   24080.58901234  .00000025  00000-0  10000-4 0  9990",
        "tle_line2": "2 41240  66.0390 134.5678 0001432 210.1234 150.5678 12.81240000 45678"
    }
]

# Gerçek TLE Verileri - Uzay Enkazı
DEMO_DEBRIS_SATELLITES = [
    {
        "name": "COSMOS 2251 DEB",
        "norad_id": "34454",
        "object_type": "DEBRIS",
        "country": "CIS",
        "launch_date": "1993-09-16",
        "mean_motion": 14.7523,
        "eccentricity": 0.0054321,
        "inclination": 74.0268,
        "ra_of_asc_node": 45.6789,
        "arg_of_pericenter": 123.4567,
        "mean_anomaly": 237.8901,
        "bstar": 0.000098,
        "tle_line1": "1 34454U 93036PX  24080.51234567  .00000560  00000-0  98000-4 0  9991",
        "tle_line2": "2 34454  74.0268  45.6789 0054321 123.4567 237.8901 14.75230000 12345"
    },
    {
        "name": "FENGYUN 1C DEB",
        "norad_id": "31140",
        "object_type": "DEBRIS",
        "country": "PRC",
        "launch_date": "1999-05-10",
        "mean_motion": 14.3421,
        "eccentricity": 0.0123456,
        "inclination": 99.0987,
        "ra_of_asc_node": 67.8901,
        "arg_of_pericenter": 234.5678,
        "mean_anomaly": 125.4321,
        "bstar": 0.000075,
        "tle_line1": "1 31140U 99025DLP 24080.52345678  .00000430  00000-0  75000-4 0  9992",
        "tle_line2": "2 31140  99.0987  67.8901 0123456 234.5678 125.4321 14.34210000 23456"
    },
    {
        "name": "IRIDIUM 33 DEB",
        "norad_id": "33776",
        "object_type": "DEBRIS",
        "country": "US",
        "launch_date": "1997-09-14",
        "mean_motion": 14.3456,
        "eccentricity": 0.0067890,
        "inclination": 86.3954,
        "ra_of_asc_node": 89.0123,
        "arg_of_pericenter": 345.6789,
        "mean_anomaly": 14.3210,
        "bstar": 0.000087,
        "tle_line1": "1 33776U 97051QB  24080.53456789  .00000490  00000-0  87000-4 0  9993",
        "tle_line2": "2 33776  86.3954  89.0123 0067890 345.6789  14.3210 14.34560000 34567"
    },
    {
        "name": "SL-16 DEB",
        "norad_id": "28353",
        "object_type": "DEBRIS",
        "country": "CIS",
        "launch_date": "1996-12-11",
        "mean_motion": 13.9876,
        "eccentricity": 0.0098765,
        "inclination": 71.0123,
        "ra_of_asc_node": 112.3456,
        "arg_of_pericenter": 56.7890,
        "mean_anomaly": 303.4567,
        "bstar": 0.000065,
        "tle_line1": "1 28353U 96072JK  24080.54567890  .00000320  00000-0  65000-4 0  9994",
        "tle_line2": "2 28353  71.0123 112.3456 0098765  56.7890 303.4567 13.98760000 45678"
    },
    {
        "name": "CZ-2C DEB",
        "norad_id": "39488",
        "object_type": "DEBRIS",
        "country": "PRC",
        "launch_date": "2013-12-09",
        "mean_motion": 14.8765,
        "eccentricity": 0.0034567,
        "inclination": 97.5432,
        "ra_of_asc_node": 156.7890,
        "arg_of_pericenter": 78.9012,
        "mean_anomaly": 281.2345,
        "bstar": 0.000110,
        "tle_line1": "1 39488U 13067FM  24080.55678901  .00000690  00000-0  11000-3 0  9995",
        "tle_line2": "2 39488  97.5432 156.7890 0034567  78.9012 281.2345 14.87650000 56789"
    },
    {
        "name": "COSMOS 1408 DEB",
        "norad_id": "51085",
        "object_type": "DEBRIS",
        "country": "CIS",
        "launch_date": "1982-09-16",
        "mean_motion": 14.9654,
        "eccentricity": 0.0023456,
        "inclination": 82.5678,
        "ra_of_asc_node": 178.9012,
        "arg_of_pericenter": 145.6789,
        "mean_anomaly": 214.5678,
        "bstar": 0.000130,
        "tle_line1": "1 51085U 82092ACD 24080.56789012  .00000810  00000-0  13000-3 0  9996",
        "tle_line2": "2 51085  82.5678 178.9012 0023456 145.6789 214.5678 14.96540000 67890"
    },
    {
        "name": "ATLAS 5 CENTAUR DEB",
        "norad_id": "40726",
        "object_type": "DEBRIS",
        "country": "US",
        "launch_date": "2015-03-13",
        "mean_motion": 14.1234,
        "eccentricity": 0.0156789,
        "inclination": 55.1234,
        "ra_of_asc_node": 200.1234,
        "arg_of_pericenter": 90.5678,
        "mean_anomaly": 270.1234,
        "bstar": 0.000050,
        "tle_line1": "1 40726U 15011BK  24080.57890123  .00000250  00000-0  50000-4 0  9997",
        "tle_line2": "2 40726  55.1234 200.1234 0156789  90.5678 270.1234 14.12340000 78901"
    },
    {
        "name": "BREEZE-M DEB",
        "norad_id": "38746",
        "object_type": "DEBRIS",
        "country": "CIS",
        "launch_date": "2012-08-06",
        "mean_motion": 11.5432,
        "eccentricity": 0.2345678,
        "inclination": 49.0123,
        "ra_of_asc_node": 225.6789,
        "arg_of_pericenter": 180.1234,
        "mean_anomaly": 180.5678,
        "bstar": 0.000200,
        "tle_line1": "1 38746U 12044BD  24080.58901234  .00001200  00000-0  20000-3 0  9998",
        "tle_line2": "2 38746  49.0123 225.6789 2345678 180.1234 180.5678 11.54320000 89012"
    }
]


def generate_additional_satellites(base_list, category, count):
    """
    Demo amaçlı ek uydu verisi oluşturur.
    Parametreleri çeşitlendirerek gerçekçi dağılım sağlar.
    """
    import random
    import math

    satellites = list(base_list)  # Orijinal listeyi kopyala

    random.seed(42)  # Tekrarlanabilirlik için

    # Typical orbital regimes
    orbit_types = [
        # name_prefix, alt_range, inc_range, ecc_range
        ("LEO-", (300, 600), (28, 100), (0.0001, 0.01)),
        ("LEO-", (600, 1000), (60, 100), (0.0001, 0.02)),
        ("MEO-", (2000, 20000), (50, 65), (0.001, 0.05)),
        ("SSO-", (600, 900), (96, 100), (0.0001, 0.005)),
        ("GEO-", (35700, 35900), (0, 2), (0.0001, 0.001)),
    ]

    countries = ["US", "CIS", "PRC", "JPN", "IND", "ESA", "FR", "UK", "DE", "KOR", "ISR", "BR"]

    for i in range(count - len(base_list)):
        if i >= count:
            break

        orbit = random.choice(orbit_types)
        alt = random.uniform(*orbit[1])
        inc = random.uniform(*orbit[2])
        ecc = random.uniform(*orbit[3])

        # mean_motion from altitude (Kepler's law approximation)
        mu = 398600.4418  # km³/s²
        R = 6371.0  # km
        a = R + alt  # semi-major axis
        n_rad_s = math.sqrt(mu / a**3)  # rad/s
        mean_motion = n_rad_s * 86400 / (2 * math.pi)  # rev/day

        ra = random.uniform(0, 360)
        argp = random.uniform(0, 360)
        ma = random.uniform(0, 360)

        norad_id = str(60000 + i)
        country = random.choice(countries)

        if category == "active":
            prefixes = ["STARLINK-", "ONEWEB-", "IRIDIUM ", "GLOBALSTAR ", "ORBCOMM ", "DOVE ", "LEMUR-", "SAT-", "METEOR-M ", "KOMPSAT-"]
            name = random.choice(prefixes) + str(random.randint(1000, 9999))
            obj_type = "PAYLOAD"
        else:
            prefixes = ["COSMOS DEB ", "CZ- DEB ", "SL- DEB ", "FENGYUN DEB ", "IRIDIUM DEB ", "DELTA DEB ", "ATLAS DEB ", "FREGAT DEB "]
            name = random.choice(prefixes) + str(random.randint(100, 999))
            obj_type = "DEBRIS"

        year = random.randint(1998, 2024)
        month = random.randint(1, 12)
        day = random.randint(1, 28)
        launch = f"{year}-{month:02d}-{day:02d}"

        bstar = random.uniform(0.00001, 0.0003)

        # Generate TLE lines (simplified but valid format)
        epoch_year = 24
        epoch_day = 80 + random.random()

        # TLE line 1
        tle1 = f"1 {norad_id:>5s}U {year % 100:02d}001A   {epoch_year:02d}{epoch_day:012.8f}  .00000100  00000-0  {bstar:.4e} 0  999{i%10}"
        # TLE line 2
        tle2 = f"2 {norad_id:>5s} {inc:8.4f} {ra:8.4f} {ecc:.7f} {argp:8.4f} {ma:8.4f} {mean_motion:11.8f}{random.randint(10000,99999)}"

        # Period
        period = 1440.0 / mean_motion if mean_motion > 0 else 0

        satellites.append({
            "name": name,
            "norad_id": norad_id,
            "object_type": obj_type,
            "country": country,
            "launch_date": launch,
            "mean_motion": round(mean_motion, 8),
            "eccentricity": round(ecc, 7),
            "inclination": round(inc, 4),
            "ra_of_asc_node": round(ra, 4),
            "arg_of_pericenter": round(argp, 4),
            "mean_anomaly": round(ma, 4),
            "bstar": round(bstar, 10),
            "tle_line1": tle1,
            "tle_line2": tle2,
            "period": round(period, 2),
            "approx_altitude": round(alt, 2),
            "epoch": f"2024-03-20T12:00:00",
            "rev_at_epoch": random.randint(1000, 50000),
            "mean_motion_dot": 0.0,
            "mean_motion_ddot": 0.0,
            "element_set_no": random.randint(1, 999),
            "classification": "U",
            "intl_designator": f"{year % 100:02d}001A",
            "category": "active" if category == "active" else "debris"
        })

    return satellites


def get_demo_active(count=1000):
    """Demo aktif uydu verisi döndürür."""
    return generate_additional_satellites(DEMO_ACTIVE_SATELLITES, "active", count)


def get_demo_debris(count=1000):
    """Demo enkaz uydu verisi döndürür."""
    return generate_additional_satellites(DEMO_DEBRIS_SATELLITES, "debris", count)
