"""
Uzay Enkazı Yörünge Tahmin Modülü
SGP4 algoritması kullanarak uydu yörünge tahmini ve çarpışma analizi yapar.
"""

import math
import numpy as np
from sgp4.api import Satrec, WGS72
from datetime import datetime, timedelta, timezone


def tle_to_satrec(tle_line1, tle_line2):
    """TLE satırlarından SGP4 uydu nesnesi oluşturur."""
    try:
        satellite = Satrec.twoline2rv(tle_line1, tle_line2)
        return satellite
    except Exception as e:
        print(f"TLE parse hatası: {e}")
        return None


def datetime_to_jd(dt):
    """datetime nesnesini Julian Date'e çevirir."""
    # Julian Date hesaplama
    a = (14 - dt.month) // 12
    y = dt.year + 4800 - a
    m = dt.month + 12 * a - 3

    jdn = dt.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045

    jd = jdn + (dt.hour - 12) / 24.0 + dt.minute / 1440.0 + dt.second / 86400.0
    fr = 0.0

    return jd, fr


def teme_to_geodetic(x, y, z, gmst):
    """
    TEME (True Equator Mean Equinox) koordinatlarını geodetik (lat, lon, alt) koordinatlarına çevirir.
    x, y, z: km cinsinden TEME pozisyon
    gmst: Greenwich Mean Sidereal Time (radyan)
    """
    # Dünya yarıçapı (km)
    R_EARTH = 6371.0

    # TEME -> ECEF dönüşümü
    cos_gmst = math.cos(gmst)
    sin_gmst = math.sin(gmst)

    x_ecef = x * cos_gmst + y * sin_gmst
    y_ecef = -x * sin_gmst + y * cos_gmst
    z_ecef = z

    # ECEF -> Geodetik
    lon = math.atan2(y_ecef, x_ecef)
    r = math.sqrt(x_ecef**2 + y_ecef**2 + z_ecef**2)
    lat = math.asin(z_ecef / r) if r > 0 else 0
    alt = r - R_EARTH

    return math.degrees(lat), math.degrees(lon), alt


def calculate_gmst(dt):
    """Greenwich Mean Sidereal Time hesaplar (radyan)."""
    # J2000.0'dan itibaren Julian yüzyıllar
    jd, _ = datetime_to_jd(dt)
    t = (jd - 2451545.0) / 36525.0

    # GMST (saniye cinsinden)
    gmst_sec = (
        67310.54841
        + (876600.0 * 3600 + 8640184.812866) * t
        + 0.093104 * t**2
        - 6.2e-6 * t**3
    )

    # Radyana çevir (86400 saniye = 2*pi radyan)
    gmst = (gmst_sec % 86400) / 86400.0 * 2 * math.pi
    if gmst < 0:
        gmst += 2 * math.pi

    return gmst


def predict_orbit(tle_line1, tle_line2, hours=24, step_minutes=10):
    """
    SGP4 ile gelecek yörünge tahmini yapar.
    
    Args:
        tle_line1: TLE ilk satır
        tle_line2: TLE ikinci satır
        hours: Tahmin süresi (saat)
        step_minutes: Adım aralığı (dakika)
    
    Returns:
        Liste: [{time, lat, lon, alt, x, y, z}, ...]
    """
    sat = tle_to_satrec(tle_line1, tle_line2)
    if sat is None:
        return []

    positions = []
    now = datetime.now(timezone.utc)

    total_steps = int((hours * 60) / step_minutes)

    for i in range(total_steps + 1):
        dt = now + timedelta(minutes=i * step_minutes)
        jd, fr = datetime_to_jd(dt)

        error, position, velocity = sat.sgp4(jd, fr)

        if error != 0:
            continue

        x, y, z = position
        vx, vy, vz = velocity

        # TEME -> Geodetik dönüşüm
        gmst = calculate_gmst(dt)
        lat, lon, alt = teme_to_geodetic(x, y, z, gmst)

        # Hız hesaplama (km/s)
        speed = math.sqrt(vx**2 + vy**2 + vz**2)

        positions.append({
            'time': dt.isoformat(),
            'lat': round(lat, 4),
            'lon': round(lon, 4),
            'alt': round(alt, 2),
            'x': round(x, 4),
            'y': round(y, 4),
            'z': round(z, 4),
            'speed': round(speed, 4)
        })

    return positions


def get_current_position(tle_line1, tle_line2):
    """Uydunun şu anki pozisyonunu döndürür."""
    sat = tle_to_satrec(tle_line1, tle_line2)
    if sat is None:
        return None

    now = datetime.now(timezone.utc)
    jd, fr = datetime_to_jd(now)

    error, position, velocity = sat.sgp4(jd, fr)
    if error != 0:
        return None

    x, y, z = position
    vx, vy, vz = velocity

    gmst = calculate_gmst(now)
    lat, lon, alt = teme_to_geodetic(x, y, z, gmst)
    speed = math.sqrt(vx**2 + vy**2 + vz**2)

    return {
        'lat': round(lat, 4),
        'lon': round(lon, 4),
        'alt': round(alt, 2),
        'x': round(x, 4),
        'y': round(y, 4),
        'z': round(z, 4),
        'speed': round(speed, 4)
    }


def check_collision(sat1_tle1, sat1_tle2, sat2_tle1, sat2_tle2, hours=24, step_minutes=1):
    """
    İki uydu arasındaki çarpışma riskini analiz eder.
    
    Returns:
        dict: {min_distance, min_time, risk_level, approaches}
    """
    sat1 = tle_to_satrec(sat1_tle1, sat1_tle2)
    sat2 = tle_to_satrec(sat2_tle1, sat2_tle2)

    if sat1 is None or sat2 is None:
        return None

    now = datetime.now(timezone.utc)
    total_steps = int((hours * 60) / step_minutes)

    min_distance = float('inf')
    min_time = None
    approaches = []

    for i in range(total_steps + 1):
        dt = now + timedelta(minutes=i * step_minutes)
        jd, fr = datetime_to_jd(dt)

        e1, r1, _ = sat1.sgp4(jd, fr)
        e2, r2, _ = sat2.sgp4(jd, fr)

        if e1 != 0 or e2 != 0:
            continue

        # Öklid mesafesi
        dist = math.sqrt(
            (r1[0] - r2[0])**2 +
            (r1[1] - r2[1])**2 +
            (r1[2] - r2[2])**2
        )

        if dist < min_distance:
            min_distance = dist
            min_time = dt.isoformat()

        # Yakın geçiş kaydı (< 100 km)
        if dist < 100:
            approaches.append({
                'time': dt.isoformat(),
                'distance': round(dist, 4)
            })

    # Risk seviyesi belirleme
    if min_distance < 1:
        risk_level = 'YÜKSEK'
        risk_color = 'red'
    elif min_distance < 10:
        risk_level = 'ORTA'
        risk_color = 'yellow'
    elif min_distance < 50:
        risk_level = 'DÜŞÜK'
        risk_color = 'green'
    else:
        risk_level = 'MİNİMAL'
        risk_color = 'gray'

    return {
        'min_distance': round(min_distance, 4),
        'min_time': min_time,
        'risk_level': risk_level,
        'risk_color': risk_color,
        'approaches': approaches[:10]  # En fazla 10 yakın geçiş
    }


def find_close_approaches(target_tle1, target_tle2, satellites_data, hours=24, threshold_km=50.0, max_results=5):
    """
    Hedef uyduya en yakın uyduları bulur ve çarpışma risklerini hesaplar.
    
    Args:
        target_tle1, target_tle2: Hedef uydu TLE
        satellites_data: Diğer uyduların listesi [{tle_line1, tle_line2, name, norad_id}, ...]
        hours: Analiz süresi
        threshold_km: Eşik mesafe
        max_results: Maksimum sonuç sayısı
    
    Returns:
        Yakın geçiş listesi
    """
    target_sat = tle_to_satrec(target_tle1, target_tle2)
    if target_sat is None:
        return []

    now = datetime.now(timezone.utc)
    # Performans için daha geniş adım
    step_minutes = 5
    total_steps = int((hours * 60) / step_minutes)

    # Hedef uydu pozisyonlarını önceden hesapla
    target_positions = []
    time_points = []
    for i in range(total_steps + 1):
        dt = now + timedelta(minutes=i * step_minutes)
        jd, fr = datetime_to_jd(dt)
        error, position, _ = target_sat.sgp4(jd, fr)
        if error == 0:
            target_positions.append(position)
            time_points.append((jd, fr, dt))

    if not target_positions:
        return []

    results = []

    for sat_data in satellites_data:
        try:
            other_sat = tle_to_satrec(sat_data['tle_line1'], sat_data['tle_line2'])
            if other_sat is None:
                continue

            local_min_dist = float('inf')
            local_min_time = None

            for idx, (jd, fr, dt) in enumerate(time_points):
                error, other_pos, _ = other_sat.sgp4(jd, fr)
                if error != 0:
                    continue

                t_pos = target_positions[idx]
                dist = math.sqrt(
                    (t_pos[0] - other_pos[0])**2 +
                    (t_pos[1] - other_pos[1])**2 +
                    (t_pos[2] - other_pos[2])**2
                )

                if dist < local_min_dist:
                    local_min_dist = dist
                    local_min_time = dt.isoformat()

            if local_min_dist < threshold_km:
                if local_min_dist < 1:
                    risk = 'YÜKSEK'
                    risk_color = 'red'
                elif local_min_dist < 10:
                    risk = 'ORTA'
                    risk_color = 'yellow'
                elif local_min_dist < 50:
                    risk = 'DÜŞÜK'
                    risk_color = 'green'
                else:
                    risk = 'MİNİMAL'
                    risk_color = 'gray'

                results.append({
                    'name': sat_data.get('name', 'Bilinmeyen'),
                    'norad_id': sat_data.get('norad_id', ''),
                    'min_distance': round(local_min_dist, 4),
                    'min_time': local_min_time,
                    'risk_level': risk,
                    'risk_color': risk_color
                })

        except Exception:
            continue

    # En yakın geçişlere göre sırala
    results.sort(key=lambda x: x['min_distance'])
    return results[:max_results]
