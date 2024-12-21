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
        data = eval(response.text)
        return data
    except requests.exceptions.RequestException as e:
        # print(f"Error fetching data from {device} ({ip}): {e}")
        return None

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device TEXT,
                datetime TEXT,
                temp REAL,
                hum REAL,
                heat_index REAL
            )
        """)
    print("check done %s" % DATABASE)

def store_data(device, data):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device TEXT,
            datetime TEXT,
            temp REAL,
            hum REAL,
            heat_index REAL
        )
    """)
    cursor.execute("""
        INSERT INTO sensor_data (device, datetime, temp, hum, heat_index)
        VALUES (?, ?, ?, ?, ?)
    """, (device, data['datetime'], data['temp'], data['hum'], data['HI']))
    conn.commit()
    conn.close()

def get_latest_data():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    latest_data = {}
    for device in arduino_ips.keys():
        cursor.execute("""
            SELECT datetime, temp, hum FROM sensor_data
            WHERE device = ? and datetime = (SELECT MAX(datetime) FROM sensor_data WHERE device = ?)
        """, (device, device,))
        res =  cursor.fetchall()

        deltatime = datetime.now() - datetime.strptime(res[0][0], '%d/%m/%Y %H:%M:%S') - timedelta(hours=1)
        minutes = deltatime.total_seconds() / 60

        latest_data[device] = {'datetime':  f"il y a {int(round(minutes, 0))} min" if minutes > 1 else "live" ,
                               'temp': res[0][1],
                               'hum': res[0][2],
                               }
    conn.close()
    return latest_data

def get_charts_data(device=None, time=12):
    # Get the current time and calculate 12 hours ago
    twelve_hours_ago = datetime.now() - timedelta(hours=time)

    # Convert the datetime to a string to use in the SQL query
    twelve_hours_ago_str = twelve_hours_ago.strftime('%d/%m/%Y %H:%M:%S')

    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # If a device name is provided, filter the query by that device
    if device:
        cursor.execute("""
            SELECT datetime, temp, hum
            FROM sensor_data
            WHERE datetime >= ? AND device = ?
            ORDER BY datetime ASC
        """, (twelve_hours_ago_str, device))
    else:
        cursor.execute("""
            SELECT datetime, temp, hum
            FROM sensor_data
            WHERE datetime >= ?
            ORDER BY datetime ASC
        """, (twelve_hours_ago_str,))

    # Fetch all the rows returned by the query
    rows = cursor.fetchall()
    conn.close()

    # Prepare data for Chart.js
    times = []
    temps = []
    hums = []

    for row in rows:
        # Convert the datetime string to a format that Chart.js can understand
        time_obj = datetime.strptime(row[0], '%d/%m/%Y %H:%M:%S')
        times.append(time_obj.isoformat())  # You can format it however you'd like
        temps.append(row[1])  # Temperature
        hums.append(row[2])  # Humidity

    # Return the data as a dictionary, which can be easily converted to JSON
    return {
        'times': times,
        'temps': temps,
        'hums': hums
    }

def fetch_and_store_data_periodically():
    i = 0
    while True:
        for name, ip in arduino_ips.items():
            if ip:
                data = fetch_device_data(name, ip)
                if data:
                    store_data(name, data)
        i = (i+1)%3
        if i:
            fetch_openWeatherAPI()
        time.sleep(60)

threading.Thread(target=fetch_and_store_data_periodically, daemon=True).start()

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
        print("Error fetching weather data:\n%s" % res.text)
@app.route('/')
def index():
    data_live = get_latest_data()

    return render_template('index2.html',
                           data_live=data_live,
                           )

# Route to fetch the latest device data for AJAX requests
@app.route('/latest_data')
def latest_data():
    data = get_latest_data()
    return jsonify(data)


# Route to fetch the latest device data for AJAX requests
@app.route('/charts_data')
def charts_data():
    device = request.args.get('device')
    period = request.args.get('period')
    # Call the function to get filtered data for that device
    data = get_charts_data(device, period if period else 24)
    # Return the data as JSON
    return jsonify(data)

@app.route('/init')
def init():
    init_db()
    return jsonify({"ok": True})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=7030)
