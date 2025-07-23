const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

const API_KEY = "92d96435984d109b204dfce4606d8f45";

let isFahrenheit = localStorage.getItem("tempUnit") === "F";
let lastCity = null;
let lastLat = null;
let lastLon = null;

const toggle = document.getElementById("unitToggle");
const unitLabel = document.getElementById("unitLabel");

if (isFahrenheit) toggle.checked = true;
unitLabel.textContent = isFahrenheit ? "°F" : "°C";

// Create weather card (current + forecast)
const createWeatherCard = (cityName, weatherItem, index) => {
  const date = weatherItem.dt_txt.split(" ")[0];
  const temp = isFahrenheit
    ? ((weatherItem.main.temp - 273.15) * 9) / 5 + 32
    : weatherItem.main.temp - 273.15;
  const tempUnit = isFahrenheit ? "°F" : "°C";

  const tempDisplay = `Temp: ${temp.toFixed(1)}${tempUnit}`;
  const windDisplay = `Wind: ${weatherItem.wind.speed} m/s`;
  const humidityDisplay = `Humidity: ${weatherItem.main.humidity}%`;
  const iconURL = `https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png`;

  if (index === 0) {
    return `
      <div class="details">
        <h2>${cityName} (${date})</h2>
        <h4>${tempDisplay}</h4>
        <h4>${windDisplay}</h4>
        <h4>${humidityDisplay}</h4>
      </div>
      <div class="icon">
        <img src="${iconURL}" alt="weather-icon">
        <h4>${weatherItem.weather[0].description}</h4>
      </div>
    `;
  }

  return `
    <li class="card">
      <h3>(${date})</h3>
      <img src="${iconURL}" alt="weather-icon">
      <h4>${tempDisplay}</h4>
      <h4>${windDisplay}</h4>
      <h4>${humidityDisplay}</h4>
    </li>
  `;
};

// Fetch weather by coordinates
const getWeatherDetails = (cityName, lat, lon) => {
  lastCity = cityName;
  lastLat = lat;
  lastLon = lon;

  const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  fetch(WEATHER_API_URL)
    .then((res) => res.json())
    .then((data) => {
      const uniqueForecastDays = [];
      const fiveDaysForecast = data.list.filter((forecast) => {
        const forecastDate = new Date(forecast.dt_txt).getDate();
        if (!uniqueForecastDays.includes(forecastDate)) {
          uniqueForecastDays.push(forecastDate);
          return true;
        }
        return false;
      });

      cityInput.value = "";
      currentWeatherDiv.innerHTML = "";
      weatherCardsDiv.innerHTML = "";

      fiveDaysForecast.forEach((weatherItem, index) => {
        const html = createWeatherCard(cityName, weatherItem, index);
        if (index === 0) {
          currentWeatherDiv.insertAdjacentHTML("beforeend", html);
        } else {
          weatherCardsDiv.insertAdjacentHTML("beforeend", html);
        }
      });
    })
    .catch(() => {
      alert("An error occurred while fetching the weather forecast!");
    });
};

// Get coordinates by city
const getCityCoordinates = () => {
  const cityName = cityInput.value.trim();
  if (!cityName) return;

  const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

  fetch(GEOCODING_API_URL)
    .then((res) => res.json())
    .then((data) => {
      if (!data.length) return alert(`No coordinates found for ${cityName}`);
      const { name, lat, lon } = data[0];
      getWeatherDetails(name, lat, lon);
    })
    .catch(() => {
      alert("An error occurred while fetching the coordinates!");
    });
};

// Get current location
const getUserCoordinates = () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
      fetch(REVERSE_GEOCODING_URL)
        .then((res) => res.json())
        .then((data) => {
          const { name } = data[0];
          getWeatherDetails(name, latitude, longitude);
        })
        .catch(() => {
          alert("An error occurred while fetching the city!");
        });
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        alert("Geolocation denied. Please allow location access.");
      }
    }
  );
};

// Temperature toggle handler
toggle.addEventListener("change", () => {
  isFahrenheit = toggle.checked;
  localStorage.setItem("tempUnit", isFahrenheit ? "F" : "C");
  unitLabel.textContent = isFahrenheit ? "°F" : "°C";

  // Re-fetch weather with new unit
  if (lastCity && lastLat && lastLon) {
    getWeatherDetails(lastCity, lastLat, lastLon);
  }
});

// Event listeners
locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", (e) => e.key === "Enter" && getCityCoordinates());

// Load initial toggle state
if (isFahrenheit) {
  unitLabel.textContent = "°F";
}
