# GarminHouse

## Overview

GarminHouse is a simple project designed to fetch, store, and display data about the humidity and temperature in my 
house.
This project was created to monitor and understand the behavior of humidity and temperature across different rooms in 
the house.

## Context

In our house, we experienced some issues with humidity and temperature. 
To address this, we decided to develop an application that could provide real-time data on these parameters. 
We used ESP32 microcontrollers with DHT11 sensors placed in various rooms to collect the data.

## Features

- Fetches temperature and humidity data from ESP32 devices with DHT11 sensors.
- Stores the collected data in a SQLite database.
- Displays the data in a user-friendly web interface using Flask.
- Provides real-time updates and historical data visualization.

## Technologies Used

- Flask
- Tailwind CSS
- SQLite
- Chart.js

## Conclusion

GarminHouse was a simple and fun way to test using Flask for a real-world application. It helped us monitor and 
understand the humidity and temperature behavior in our house effectively. 
It can now runs 24/7 and provides real-time updates on the temperature and humidity in our house.