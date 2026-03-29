"""
Uzay Enkazı Takip Sistemi - Flask Backend
CelesTrak API'sinden uydu verilerini toplar, SGP4 ile yörünge tahmini yapar.
API erişilemezse demo verileriyle çalışır.
"""

import os
import json
import time
import math
import random
import requests
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from orbit_predictor import predict_orbit, find_close_approaches, get_current_position
from demo_data import get_demo_active, get_demo_debris

app = Flask(__name__)
CORS(app)

# --- Yapılandırma ---
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
CACHE_TTL = 7200  # 2 saat (saniye)
MAX_ACTIVE = 3000
MAX_DEBRIS = 3000

# Space-Track Kimlik Bilgileri
SPACETRACK_USERNAME = os.environ.get('SPACETRACK_USERNAME', 'etebabapiros@gmail.com')
SPACETRACK_PASSWORD = os.environ.get('SPACETRACK_PASSWORD', 'ETE-babapiros2026')

SPACETRACK_LOGIN_URL = 'https://www.space-track.org/ajaxauth/login'
SPACETRACK_ACTIVE_URL = f'https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/DECAY_DATE/null-val/orderby/NORAD_CAT_ID/limit/{MAX_ACTIVE}/format/json'
SPACETRACK_DEBRIS_URL = f'https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_TYPE/DEBRIS/DECAY_DATE/null-val/orderby/NORAD_CAT_ID/limit/{MAX_DEBRIS}/format/json'

# Cache dizinini oluştur
os.makedirs(CACHE_DIR, exist_ok=True)


def get_cached_data(cache_key):
    """Cache'ten veri okur. TTL aşılmışsa None döner."""
    cache_file = os.path.join(CACHE_DIR, f'{cache_key}.json')
    if os.path.exists(cache_file):
        file_age = time.time() - os.path.getmtime(cache_file)
        if file_age < CACHE_TTL:
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
    return None


def save_cache(cache_key, data):
    """Veriyi cache'e yazar."""
    cache_file = os.path.join(CACHE_DIR, f'{cache_key}.json')
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
    except IOError as e:
        print(f"Cache yazma hatası: {e}")


def fetch_spacetrack_data(session, url, cache_key, max_count):
    """
    Space-Track.org'dan GP (General Perturbation) verisini OMM JSON formatında çeker.
    """
    # Önce cache kontrol et
    cached = get_cached_data(cache_key)
    if cached is not None:
        print(f"[CACHE HIT] {cache_key}: {len(cached)} nesne")
        return cached

    print(f"[API] Space-Track'ten veri çekiliyor: {cache_key}...")
    try:
        response = session.get(url, timeout=45)
        response.raise_for_status()
        raw_data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Space-Track API hatası: {e}")
        # Eski cache varsa onu kullan (TTL'yi göz ardı et)
        cache_file = os.path.join(CACHE_DIR, f'{cache_key}.json')
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return None  # None döndür ki demo veriye geçilebilsin

    # OMM JSON -> İşlenmiş uydu verisi
    satellites = []
    for item in raw_data[:max_count]:
        try:
            sat = {
                'name': item.get('OBJECT_NAME', 'Bilinmeyen'),
                'norad_id': str(item.get('NORAD_CAT_ID', '')),
                'object_type': item.get('OBJECT_TYPE', 'UNKNOWN'),
                'country': item.get('COUNTRY_CODE', ''),
                'launch_date': item.get('LAUNCH_DATE', ''),
                'epoch': item.get('EPOCH', ''),
                'mean_motion': float(item.get('MEAN_MOTION') or 0.0),
                'eccentricity': float(item.get('ECCENTRICITY') or 0.0),
                'inclination': float(item.get('INCLINATION') or 0.0),
                'ra_of_asc_node': float(item.get('RA_OF_ASC_NODE') or 0.0),
                'arg_of_pericenter': float(item.get('ARG_OF_PERICENTER') or 0.0),
                'mean_anomaly': float(item.get('MEAN_ANOMALY') or 0.0),
                'rev_at_epoch': float(item.get('REV_AT_EPOCH') or 0.0),
                'bstar': float(item.get('BSTAR') or 0.0),
                'mean_motion_dot': float(item.get('MEAN_MOTION_DOT') or 0.0),
                'mean_motion_ddot': float(item.get('MEAN_MOTION_DDOT') or 0.0),
                'element_set_no': int(item.get('ELEMENT_SET_NO') or 0),
                'classification': item.get('CLASSIFICATION_TYPE', 'U'),
                'intl_designator': item.get('OBJECT_ID', ''),
                # TLE satırları oluştur
                'tle_line1': item.get('TLE_LINE1', ''),
                'tle_line2': item.get('TLE_LINE2', ''),
            }

            # Period hesapla (dakika)
            if sat['mean_motion'] > 0:
                sat['period'] = round(1440.0 / sat['mean_motion'], 2)
            else:
                sat['period'] = 0

            # Yaklaşık yükseklik hesapla (km)
            if sat['mean_motion'] > 0:
                mu = 398600.4418  # km³/s²
                n = sat['mean_motion'] * 2 * 3.14159265 / 86400  # rev/day -> rad/s
                a = (mu / (n**2))**(1/3)  # Yarı ana eksen (km)
                sat['approx_altitude'] = round(a - 6371.0, 2)
            else:
                sat['approx_altitude'] = 0

            satellites.append(sat)
        except Exception as e:
            continue

    # Cache'e kaydet
    save_cache(cache_key, satellites)
    print(f"[API] {cache_key}: {len(satellites)} nesne alındı ve cache'lendi")

    return satellites


def login_spacetrack():
    """Space-Track API'sine giriş yapar ve session döndürür."""
    session = requests.Session()
    login_data = {
        'identity': SPACETRACK_USERNAME,
        'password': SPACETRACK_PASSWORD
    }
    print("[API] Space-Track.org oturumu açılıyor...")
    try:
        response = session.post(SPACETRACK_LOGIN_URL, data=login_data, timeout=15)
        response.raise_for_status()
        # Eğer hatalı şifreyse 401 verebilir veya error json dönebilir.
        if "error" in response.text.lower() and "incorrect" in response.text.lower():
            print("[API] Hata: Geçersiz Space-Track şifresi.")
            return None
        print("[API] Space-Track oturumu başarıyla açıldı.")
        return session
    except requests.exceptions.RequestException as e:
        print(f"[API] Space-Track login hatası: {e}")
        return None


# Bellekte uydu verileri (uygulama başlangıcında yüklenecek)
_satellites_cache = {
    'active': None,
    'debris': None,
    'last_load': 0
}


def load_all_satellites():
    """Tüm uydu verilerini yükler/günceller. API erişilemezse demo verisi kullanır."""
    now = time.time()
    if _satellites_cache['active'] is not None and (now - _satellites_cache['last_load']) < CACHE_TTL:
        return

    # Space-Track giriş yap
    session = login_spacetrack()
    
    if session:
        active_data = fetch_spacetrack_data(
            session, SPACETRACK_ACTIVE_URL, 'active_satellites', MAX_ACTIVE
        )
        debris_data = fetch_spacetrack_data(
            session, SPACETRACK_DEBRIS_URL, 'debris_satellites', MAX_DEBRIS
        )
        # Login işlemi sonrası session kapatılabilir
        session.close()
    else:
        active_data = None
        debris_data = None

    # Space-Track erişilemezse demo verisi kullan
    if active_data is None or len(active_data) == 0:
        print("[DEMO] Space-Track erişilemedi — demo aktif uydu verisi kullanılıyor")
        active_data = get_demo_active(MAX_ACTIVE)
        # Yükseklik ve periyot hesapla
        for sat in active_data:
            if 'approx_altitude' not in sat and sat.get('mean_motion', 0) > 0:
                mu = 398600.4418
                n = sat['mean_motion'] * 2 * math.pi / 86400
                a = (mu / (n**2))**(1/3)
                sat['approx_altitude'] = round(a - 6371.0, 2)
                sat['period'] = round(1440.0 / sat['mean_motion'], 2)

    if debris_data is None or len(debris_data) == 0:
        print("[DEMO] Space-Track erişilemedi — demo enkaz verisi kullanılıyor")
        debris_data = get_demo_debris(MAX_DEBRIS)
        for sat in debris_data:
            if 'approx_altitude' not in sat and sat.get('mean_motion', 0) > 0:
                mu = 398600.4418
                n = sat['mean_motion'] * 2 * math.pi / 86400
                a = (mu / (n**2))**(1/3)
                sat['approx_altitude'] = round(a - 6371.0, 2)
                sat['period'] = round(1440.0 / sat['mean_motion'], 2)

    _satellites_cache['active'] = active_data
    _satellites_cache['debris'] = debris_data
    _satellites_cache['last_load'] = now


# ==================== ROUTES ====================

@app.route('/')
def index():
    """Ana sayfa — 3D Dünya Simülasyonu"""
    return render_template('index.html')


@app.route('/api/satellites')
def get_all_satellites():
    """Tüm uydu verilerini döndürür (aktif + enkaz)."""
    load_all_satellites()

    active = _satellites_cache.get('active', []) or []
    debris = _satellites_cache.get('debris', []) or []

    # Tip bilgisi ekle
    for sat in active:
        sat['category'] = 'active'
    for sat in debris:
        sat['category'] = 'debris'

    return jsonify({
        'active': active,
        'debris': debris,
        'total_active': len(active),
        'total_debris': len(debris),
        'total': len(active) + len(debris)
    })


@app.route('/api/satellites/active')
def get_active_satellites():
    """Sadece aktif uyduları döndürür."""
    load_all_satellites()
    active = _satellites_cache.get('active', []) or []
    return jsonify({'satellites': active, 'count': len(active)})


@app.route('/api/satellites/debris')
def get_debris_satellites():
    """Sadece enkaz uyduları döndürür."""
    load_all_satellites()
    debris = _satellites_cache.get('debris', []) or []
    return jsonify({'satellites': debris, 'count': len(debris)})


@app.route('/api/search')
def search_satellites():
    """Uydu ismi veya NORAD ID ile arama yapar."""
    load_all_satellites()

    query = request.args.get('q', '').strip().upper()
    if not query or len(query) < 2:
        return jsonify({'results': [], 'count': 0})

    results = []
    for sat in (_satellites_cache.get('active', []) or []):
        if query in (sat.get('name', '') or '').upper() or query in str(sat.get('norad_id', '')):
            results.append({**sat, 'category': 'active'})
    for sat in (_satellites_cache.get('debris', []) or []):
        if query in (sat.get('name', '') or '').upper() or query in str(sat.get('norad_id', '')):
            results.append({**sat, 'category': 'debris'})

    # Maksimum 20 sonuç
    results = results[:20]

    return jsonify({'results': results, 'count': len(results), 'query': query})


@app.route('/api/predict/<norad_id>')
def predict_satellite(norad_id):
    """
    Belirli bir uydunun gelecek yörünge tahmini.
    Query params: hours (default 24), step (default 10)
    """
    load_all_satellites()

    hours = request.args.get('hours', 24, type=int)
    step = request.args.get('step', 10, type=int)

    # Limitleri uygula
    hours = min(hours, 72)
    step = max(step, 5)

    # Uyduyu bul
    sat = find_satellite_by_norad(norad_id)
    if sat is None:
        return jsonify({'error': 'Uydu bulunamadı'}), 404

    if not sat.get('tle_line1') or not sat.get('tle_line2'):
        return jsonify({'error': 'TLE verisi mevcut değil'}), 400

    positions = predict_orbit(sat['tle_line1'], sat['tle_line2'], hours=hours, step_minutes=step)

    return jsonify({
        'satellite': {
            'name': sat['name'],
            'norad_id': sat['norad_id'],
            'category': sat.get('category', 'unknown')
        },
        'prediction': positions,
        'hours': hours,
        'step_minutes': step,
        'total_points': len(positions)
    })


@app.route('/api/collision/<norad_id>')
def collision_analysis(norad_id):
    """
    Belirli bir uydu için çarpışma riski analizi.
    En yakın 5 uydu ile olan mesafeleri hesaplar.
    """
    load_all_satellites()

    hours = request.args.get('hours', 24, type=int)
    hours = min(hours, 48)

    # Hedef uyduyu bul
    target = find_satellite_by_norad(norad_id)
    if target is None:
        return jsonify({'error': 'Uydu bulunamadı'}), 404

    if not target.get('tle_line1') or not target.get('tle_line2'):
        return jsonify({'error': 'TLE verisi mevcut değil'}), 400

    # Tüm uyduları topla (hedef hariç)
    all_sats = []
    for sat in (_satellites_cache.get('active', []) or []):
        if sat['norad_id'] != norad_id and sat.get('tle_line1') and sat.get('tle_line2'):
            all_sats.append({
                'tle_line1': sat['tle_line1'],
                'tle_line2': sat['tle_line2'],
                'name': sat['name'],
                'norad_id': sat['norad_id']
            })
    for sat in (_satellites_cache.get('debris', []) or []):
        if sat['norad_id'] != norad_id and sat.get('tle_line1') and sat.get('tle_line2'):
            all_sats.append({
                'tle_line1': sat['tle_line1'],
                'tle_line2': sat['tle_line2'],
                'name': sat['name'],
                'norad_id': sat['norad_id']
            })

    # Performans için örnekleme + yükseklik filtresi
    # Önce bir altitude lookup dict oluştur (N+1 sorgu yerine)
    alt_lookup = {}
    for sat in (_satellites_cache.get('active', []) or []):
        alt_lookup[str(sat['norad_id'])] = sat.get('approx_altitude', 0)
    for sat in (_satellites_cache.get('debris', []) or []):
        alt_lookup[str(sat['norad_id'])] = sat.get('approx_altitude', 0)

    if len(all_sats) > 800:
        target_alt = target.get('approx_altitude', 0)
        # Benzer yükseklikteki uyduları öncelikle seç (±400 km)
        nearby_alt = [s for s in all_sats
                     if abs(alt_lookup.get(s['norad_id'], 0) - target_alt) < 400]

        if len(nearby_alt) > 500:
            sample = random.sample(nearby_alt, 500)
        else:
            sample = nearby_alt
            remaining = [s for s in all_sats if s not in nearby_alt]
            extra = min(500 - len(sample), len(remaining))
            if extra > 0:
                sample.extend(random.sample(remaining, extra))
    else:
        sample = all_sats

    # Çarpışma analizi
    results = find_close_approaches(
        target['tle_line1'], target['tle_line2'],
        sample,
        hours=hours,
        threshold_km=200.0,
        max_results=30
    )

    return jsonify({
        'target': {
            'name': target['name'],
            'norad_id': target['norad_id'],
            'category': target.get('category', 'unknown')
        },
        'analysis_hours': hours,
        'close_approaches': results,
        'analyzed_satellites': len(sample),
        'total_risks': len(results)
    })


@app.route('/api/position/<norad_id>')
def get_position(norad_id):
    """Uydunun anlık pozisyonunu döndürür."""
    load_all_satellites()

    sat = find_satellite_by_norad(norad_id)
    if sat is None:
        return jsonify({'error': 'Uydu bulunamadı'}), 404

    if not sat.get('tle_line1') or not sat.get('tle_line2'):
        return jsonify({'error': 'TLE verisi mevcut değil'}), 400

    pos = get_current_position(sat['tle_line1'], sat['tle_line2'])
    if pos is None:
        return jsonify({'error': 'Pozisyon hesaplanamadı'}), 500

    return jsonify({
        'satellite': {'name': sat['name'], 'norad_id': sat['norad_id']},
        'position': pos
    })


def find_satellite_by_norad(norad_id):
    """NORAD ID ile uydu verisi bulur."""
    norad_id = str(norad_id)

    for sat in (_satellites_cache.get('active', []) or []):
        if str(sat['norad_id']) == norad_id:
            sat['category'] = 'active'
            return sat

    for sat in (_satellites_cache.get('debris', []) or []):
        if str(sat['norad_id']) == norad_id:
            sat['category'] = 'debris'
            return sat

    return None


if __name__ == '__main__':
    print("=" * 60)
    print("  🛰️  UZAY ENKAZI TAKİP SİSTEMİ")
    print("  3D Dünya Simülasyonu ile Uydu Takibi")
    print("=" * 60)
    print()
    print("Uygulama başlatılıyor...")
    print("Uydu verileri yükleniyor (Space-Track veya demo)...")

    # İlk yüklemede verileri al
    load_all_satellites()

    active_count = len(_satellites_cache.get('active', []) or [])
    debris_count = len(_satellites_cache.get('debris', []) or [])
    print(f"✅ Yüklenen uydular: {active_count} aktif, {debris_count} enkaz")
    print()
    print("🌐 Sunucu http://127.0.0.1:5000 adresinde çalışıyor")
    print("📌 Tarayıcınızda açın: http://127.0.0.1:5000")
    print("=" * 60)

    app.run(debug=True, host='127.0.0.1', port=5000)
