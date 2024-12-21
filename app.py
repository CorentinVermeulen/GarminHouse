import requests
import sqlite3
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request
import threading
import time

app = Flask(__name__)

arduino_ips = {
    'pierre': '192.168.129.38',
    'coco': '192.168.129.39',
    'gui': '192.168.129.40',
    'sim': '192.168.129.41',
    'salon': '192.168.129.42',
    'MSG': False,
}

DATABASE = 'newDB.db'

def fetch_device_data(device, ip):
    try:
        response = requests.get(f'http://{ip}/data')
        return eval(response.text)
    except requests.exceptions.RequestException:
        return None

def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device TEXT,
                datetime TEXT,
                temp REAL,
                hum REAL,
                heat_index REAL
            )
        """)
    print(f"check done {DATABASE}")

def store_data(device, data):
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            INSERT INTO sensor_data (device, datetime, temp, hum, heat_index)
            VALUES (?, ?, ?, ?, ?)
        """, (device, data['datetime'], data['temp'], data['hum'], data['HI']))

def get_latest_data():
    latest_data = {}
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        for device in arduino_ips.keys():
            cursor.execute("""
                SELECT datetime, temp, hum FROM sensor_data
                WHERE device = ? AND datetime = (SELECT MAX(datetime) FROM sensor_data WHERE device = ?)
            """, (device, device))
            res = cursor.fetchone()
            if res:
                deltatime = datetime.now() - datetime.strptime(res[0], '%d/%m/%Y %H:%M:%S') - timedelta(hours=1)
                minutes = deltatime.total_seconds() / 60
                latest_data[device] = {
                    'datetime': f"il y a {int(round(minutes, 0))} min" if minutes > 1 else "live",
                    'temp': res[1],
                    'hum': res[2],
                }
    return latest_data

def get_charts_data(device=None, time=12):
    twelve_hours_ago_str = (datetime.now() - timedelta(hours=time)).strftime('%d/%m/%Y %H:%M:%S')
    query = """
        SELECT datetime, temp, hum FROM sensor_data
        WHERE datetime >= ? {device_filter} ORDER BY datetime ASC
    """.format(device_filter="AND device = ?" if device else "")
    params = (twelve_hours_ago_str, device) if device else (twelve_hours_ago_str,)

    with sqlite3.connect(DATABASE) as conn:
        rows = conn.execute(query, params).fetchall()

    return {
        'times': [datetime.strptime(row[0], '%d/%m/%Y %H:%M:%S').isoformat() for row in rows],
        'temps': [row[1] for row in rows],
        'hums': [row[2] for row in rows]
    }

def fetch_and_store_data_periodically():
    while True:
        for name, ip in arduino_ips.items():
            if ip:
                data = fetch_device_data(name, ip)
                if data:
                    store_data(name, data)
        fetch_openWeatherAPI()
        time.sleep(60)

def fetch_openWeatherAPI():
    lat, lon = 50.639599, 4.616600
    API_key = '*******'
    call = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_key}"
    res = requests.get(call)
    if res.status_code == 200:
        vals = res.json()
        data = {
            'datetime': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
            'temp': round(vals['main']['temp'] - 273.15, 1),
            'hum': round(vals['main']['humidity'], 1),
            'HI': -99,
        }
        store_data('MSG', data)
    else:
        print(f"Error fetching weather data:\n{res.text}")

@app.route('/')
def index():
    return render_template('index2.html', data_live=get_latest_data())

@app.route('/latest_data')
def latest_data():
    return jsonify(get_latest_data())

@app.route('/charts_data')
def charts_data():
    device = request.args.get('device')
    period = request.args.get('period', 24)
    return jsonify(get_charts_data(device, int(period)))

@app.route('/init')
def init():
    init_db()
    return jsonify({"ok": True})

if __name__ == '__main__':
    init_db()
    threading.Thread(target=fetch_and_store_data_periodically, daemon=True).start()
    app.run(host='0.0.0.0', port=7030)