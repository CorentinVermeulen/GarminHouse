// DARK MODE SWITCHER

const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
let darkMode = true;

// Change the icons inside the button based on previous settings
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
}

const themeToggleBtn = document.getElementById('theme-toggle');

// CHART DATA

function fetchChartData(deviceId) {
    fetch(`/charts_data?device=${deviceId}`)
        .then(response => response.json())
        .then(data => {
            const { times, temps, hums } = data;
            const ctx = document.getElementById(`chart-${deviceId}`).getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: times.map(time => new Date(time)),
                    datasets: [
                        {
                            label: 'Temperature (°C)',
                            data: temps,
                            borderColor: darkMode ? 'coral' : 'red',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            tension: 0.4,
                            pointRadius: 0,
                            pointBackgroundColor: darkMode ? 'coral' : 'red',
                            borderWidth: 2,
                            pointHoverRadius: 8,
                            pointHoverBackgroundColor: darkMode ? 'coral' : 'red',
                            yAxisID: 'y',
                        },
                        {
                            label: 'Humidity (%)',
                            data: hums,
                            borderColor: darkMode ? 'cyan' : 'blue',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: false,
                            tension: 0.4,
                            pointRadius: 0,
                            pointBackgroundColor: darkMode ? 'cyan' : 'blue',
                            borderWidth: 2,
                            pointHoverRadius: 8,
                            pointHoverBackgroundColor: darkMode ? 'cyan' : 'blue',
                            yAxisID: 'y1',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    stacked: false,
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        },
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'minute',
                                stepSize: 30,
                            },
                            ticks: {
                                autoSkip: true,
                                maxRotation: 0,
                                minRotation: 0,
                            },
                            grid: {
                                display: false,
                            },
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                display: false,
                            },
                            ticks: {
                                color: darkMode ? 'coral' : 'red',
                            },
                            suggestedMin: 15,
                            suggestedMax: 25,
                            title: {
                                display: true,
                                text: 'Température °C',
                                font: {
                                    size: 16,
                                },
                                color: darkMode ? 'coral' : 'red',
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                display: false,
                            },
                            ticks: {
                                color: darkMode ? 'cyan' : 'blue',
                            },
                            suggestedMin: 40,
                            suggestedMax: 95,
                            title: {
                                display: true,
                                text: 'Humidité %',
                                font: {
                                    size: 16,
                                },
                                color: darkMode ? 'cyan' : 'blue',
                            }
                        },
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    elements: {
                        line: {
                            tension: 0.4,
                            borderWidth: 2,
                        },
                        point: {
                            radius: 5,
                            hoverRadius: 8,
                            hitRadius: 10,
                        },
                    },
                }
            });
        })
        .catch(error => console.error(`Error fetching chart data ${deviceId}:`, error));
}

function updateChart() {
    const rooms = ['MSG', 'salon', 'pierre', 'coco', 'gui', 'sim'];
    rooms.forEach(deviceId => fetchChartData(deviceId));
}

themeToggleBtn.addEventListener('click', () => {
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            darkMode = true;
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
            darkMode = false;
        }
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
            darkMode = false;
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
            darkMode = true;
        }
    }

    updateChart();
});

window.onload = updateChart;