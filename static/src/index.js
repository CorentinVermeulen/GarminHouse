
// DARK MODE SWITCHER

var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
var darkMode = true;

// Change the icons inside the button based on previous settings
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
}

var themeToggleBtn = document.getElementById('theme-toggle');

// CHART DATA

function fetchChartData(deviceId) {
    fetch(`/charts_data?device=${deviceId}`)
        .then(response => response.json())
        .then(data => {
            const times = data.times;
            const temps = data.temps;
            const hums = data.hums;
            // Create the chart with Chart.js
            const ctx = document.getElementById(`chart-${deviceId}`).getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: times.map((time) => new Date(time)),  //Time labels
                    datasets: [{
                        label: 'Temperature (°C)',
                        data: temps,  // Temperature values
                        borderColor: darkMode?'coral':'red',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: false,
                        tension: 0.4,  // Smooth curve
                        pointRadius: 0,  // Dot markers
                        pointBackgroundColor: darkMode?'coral':'red',  // Dot color
                        borderWidth: 2,  // Line width
                        pointHoverRadius: 8,  // Hover effect on dot
                        pointHoverBackgroundColor: darkMode?'coral':'red',  // Hover dot color
                        yAxisID: 'y',
                    }, {
                        label: 'Humidity (%)',
                        data: hums,  // Humidity values
                        borderColor: darkMode?'cyan':'blue',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: false,
                        tension: 0.4,  // Smooth curve
                        pointRadius: 0,  // Dot markers
                        pointBackgroundColor: darkMode?'cyan':'blue',  // Dot color
                        borderWidth: 2,  // Line width
                        pointHoverRadius: 8,  // Hover effect on dot
                        pointHoverBackgroundColor: darkMode?'cyan':'blue',  // Hover dot color
                        yAxisID: 'y1',
                    }]
                },
                options: {
                    responsive: true,
                    stacked: false,
                    plugins: {
                        tooltip: {
                            mode: 'index',  // Tooltip displays all dataset values for a single point
                            intersect: false,  // Tooltip will show for any series line when hovering over the point
                        },
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'minute',         // Use 'minute' as the unit for time
                                stepSize: 30,           // Display a tick every 15 minutes
                            },
                            ticks: {
                                autoSkip: true,         // Automatically skips ticks if there are too many
                                maxRotation: 0,         // Prevent tick labels from rotating
                                minRotation: 0,
                            },
                            grid: {
                                display: false,  // Remove grid
                            },
                        },

                        // Left axis for Temperature
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                display: false,  // Remove grid
                            },
                            ticks: {
                                color: darkMode?'coral':'red',  // Color of tick labels for Temperature
                            },
                            suggestedMin: 15,  // Set minimum value for Temperature Y-axis
                            suggestedMax: 25,  // Set maximum value for Temperature Y-axis
                            title: {
                                display: true,  // Display the title for the y-axis
                                text: 'Température °C',  // Axis title
                                font: {
                                    size: 16,  // Font size for the title
                                },
                                color: darkMode?'coral':'red',  // Title color
                            }
                        },
                        // Right axis for Humidity
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                display: false,  // Remove grid
                            },
                            ticks: {
                                color: darkMode?'cyan':'blue',  // Color of tick labels for Humidity
                            },
                            suggestedMin: 40, // Set minimum value for Temperature Y-axis
                            suggestedMax: 95,  // Set maximum value for Temperature Y-axis
                            title: {
                                display: true,  // Display the title for the y-axis
                                text: 'Humidité %',  // Axis title
                                font: {
                                    size: 16,  // Font size for the title
                                },
                                color: darkMode?'cyan':'blue',  // Title color
                            }
                        },
                    },
                    interaction: {
                        mode: 'index',  // Enable tooltip on both series
                        intersect: false,  // Show tooltip for any dataset when hovering over the point
                    },
                    elements: {
                        line: {
                            tension: 0.4,  // Smooth curve
                            borderWidth: 2,  // Line width
                        },
                        point: {
                            radius: 5,  // Dot size
                            hoverRadius: 8,  // Hover effect on dot
                            hitRadius: 10,  // Area around the dot to trigger hover
                        },
                    },
                }
            });

        })
        .catch(error => console.error(`Error fetching chart data ${deviceId}:`, error));

}

function updateChart(){
   const rooms = ['MSG', "salon", "pierre", "coco", "gui", "sim"];
    for (deviceId of rooms) {
        fetchChartData(deviceId);
    }
}

themeToggleBtn.addEventListener('click', function () {

    // toggle icons inside button
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    // if set via local storage previously
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

        // if NOT set via local storage previously
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


window.onload = updateChart

