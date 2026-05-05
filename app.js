const weatherIcon = document.getElementById('weather-icon');
const weatherTemp = document.getElementById('weather-temp');
const weatherSummary = document.getElementById('weather-summary');
const weatherLocation = document.getElementById('weather-location');
const weatherPlace = document.getElementById('weather-place');
const forecastGrid = document.getElementById('forecast-grid');

function weatherEmoji(code) {
    if (code === 0) return '☀️';
    if ([1, 2, 3].includes(code)) return '⛅';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
    if ([56, 57, 66, 67].includes(code)) return '🌨️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌤️';
}

function weatherLabel(code) {
    if (code === 0) return 'Clear';
    if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Rainy';
    if ([56, 57, 66, 67].includes(code)) return 'Freezing Rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snowy';
    if ([95, 96, 99].includes(code)) return 'Thunderstorms';
    return 'Weather';
}

function showError(message) {
    weatherTemp.textContent = '--°F';
    weatherSummary.textContent = message;
    weatherLocation.textContent = '';
    weatherIcon.textContent = '⚠️';
    document.getElementById('weather-card').classList.add('weather-error');
}

function updateWeather(data, coords, placeName) {
    if (!data || !data.current_weather) {
        showError('Unable to load weather');
        return;
    }

    const { temperature, weathercode } = data.current_weather;
    weatherIcon.textContent = weatherEmoji(weathercode);
    weatherTemp.textContent = `${Math.round(temperature)}°F`;
    weatherSummary.textContent = weatherLabel(weathercode);
    weatherLocation.textContent = `Lat ${coords.latitude.toFixed(2)} · Lon ${coords.longitude.toFixed(2)}`;
    weatherPlace.textContent = placeName || '';
    renderForecast(data.daily);
}

function getPlaceName(latitude, longitude) {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&count=1`;
    return fetch(geocodeUrl)
        .then(response => response.json())
        .then(result => {
            const place = result?.results?.[0];
            if (!place) return null;
            const city = place.name || '';
            const region = place.admin1 || '';
            const country = place.country || '';
            return [city, region, country].filter(Boolean).join(', ');
        })
        .catch(() => null);
}

function dayLabel(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function renderForecast(daily) {
    if (!daily || !daily.time || !daily.time.length) {
        forecastGrid.innerHTML = '<div class="forecast-card forecast-loading">Forecast unavailable</div>';
        return;
    }

    const days = daily.time.slice(0, 5);
    forecastGrid.innerHTML = days.map((date, index) => {
        const code = daily.weathercode[index];
        const maxTemp = Math.round(daily.temperature_2m_max[index]);
        const minTemp = Math.round(daily.temperature_2m_min[index]);
        return `
            <div class="forecast-card">
                <div class="forecast-day">${dayLabel(date)}</div>
                <div class="forecast-icon">${weatherEmoji(code)}</div>
                <div class="forecast-summary">${weatherLabel(code)}</div>
                <div class="forecast-temps">${maxTemp}° / ${minTemp}°</div>
            </div>
        `;
    }).join('');
}

function loadWeather(position) {
    const { latitude, longitude } = position.coords;
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&timezone=auto&daily=weathercode,temperature_2m_max,temperature_2m_min`;

    Promise.all([
        fetch(endpoint).then(response => response.json()),
        getPlaceName(latitude, longitude)
    ])
        .then(([data, placeName]) => updateWeather(data, { latitude, longitude }, placeName))
        .catch(() => showError('Weather service unavailable'));
}

if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
        loadWeather,
        () => showError('Enable location to see your weather')
    );
} else {
    showError('Geolocation not supported');
}
