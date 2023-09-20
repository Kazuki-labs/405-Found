let map;
let geocoder;
let directionsService;
let directionsRenderer = null;
let markers = [];
let userLocation;
let destinationLocation;

function initMap() {
  navigator.geolocation.getCurrentPosition(function (position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    userLocation = new google.maps.LatLng(userLat, userLng);

    map = new google.maps.Map(document.getElementById("map"), {
      center: userLocation,
      zoom: 15,
    });

    const userMarker = new google.maps.Marker({
      map: map,
      position: userLocation,
      title: "Your Location",
    });

    markers.push(userMarker);

    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();

    document.getElementById("searchButton").addEventListener("click", function () {
      searchPlace();
    });

    document.getElementById("showBikePointsButton").addEventListener("click", function () {
      showBikeStations();
    });

    document.getElementById("showBusLocationsButton").addEventListener("click", function () {
      showBusLocations();
    });

    document.getElementById("showTubeLocationsButton").addEventListener("click", function () {
      showTubeLocations();
    });

  });
}

function searchPlace() {
  if (directionsRenderer) {
    directionsRenderer.setMap(null);
  }
  clearMarkers();
  clearBikePointMarkers();

  const destinationName = document.getElementById("searchInput").value;

  geocoder.geocode({ address: destinationName }, function (results, status) {
    if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
      destinationLocation = results[0].geometry.location;

      const directionsRequest = {
        origin: userLocation,
        destination: destinationLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      };
      directionsService.route(directionsRequest, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
          if (!directionsRenderer) {
            directionsRenderer = new google.maps.DirectionsRenderer();
          }
          directionsRenderer.setMap(map);
          directionsRenderer.setDirections(response);

          // Calculate and display the distance
          calculateAndDisplayDistance(userLocation, destinationLocation);
        } else {
          alert("Oops, couldn't find directions due to " + status);
        }
      });

      const destinationMarker = new google.maps.Marker({
        map: map,
        position: destinationLocation,
        title: destinationName,
      });

      markers.push(destinationMarker);
    } else {
      alert("Oops, couldn't find that place. Try something else!");
    }
  });
}

function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
}

function showBikeStations() {
  clearMarkers();
  clearBikePointMarkers();
  const xhr = new XMLHttpRequest();
  const apiUrl = "https://tfl.gov.uk/tfl/syndication/feeds/cycle-hire/livecyclehireupdates.xml";

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const xmlDoc = xhr.responseXML;
      const stations = xmlDoc.getElementsByTagName("station");

      for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        const stationName = station.getElementsByTagName("name")[0].textContent;
        const stationLat = parseFloat(station.getElementsByTagName("lat")[0].textContent);
        const stationLng = parseFloat(station.getElementsByTagName("long")[0].textContent);

        const stationLocation = new google.maps.LatLng(stationLat, stationLng);

        const isWithinRange = checkDistanceToRoute(stationLocation);

        if (isWithinRange) {
          const stationMarker = new google.maps.Marker({
            map: map,
            position: stationLocation,
            title: stationName,
            icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            },
          });

          markers.push(stationMarker);
        }
      }
    }
  };

  xhr.open("GET", apiUrl, true);
  xhr.send();
}

function showBusLocations() {
  clearMarkers();
  clearBikePointMarkers();

  // Replace 'bus_locations.xml' with the actual path to your XML file
  const xmlFile = "bus_locations.xml";
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const xmlDoc = xhr.responseXML;
      const locationElements = xmlDoc.getElementsByTagName("location");

      if (directionsRenderer && directionsRenderer.getDirections()) {
        const route = directionsRenderer.getDirections().routes[0];

        for (let i = 0; i < locationElements.length; i++) {
          const location = locationElements[i];
          const stopName = location.getElementsByTagName("name")[0].textContent;
          const stopLat = parseFloat(location.getElementsByTagName("latitude")[0].textContent);
          const stopLng = parseFloat(location.getElementsByTagName("longitude")[0].textContent);

          const busStopLocation = new google.maps.LatLng(stopLat, stopLng);

          const isWithinRange = checkDistanceToRoute(busStopLocation, route);

          if (isWithinRange) {
            const busStopMarker = new google.maps.Marker({
              map: map,
              position: busStopLocation,
              title: stopName,
            });

            markers.push(busStopMarker);
          }
        }
      }
    }
  };

  xhr.open("GET", xmlFile, true);
  xhr.send();
}

function showTubeLocations() {
  clearMarkers();
  clearBikePointMarkers();
  console.log("TUBE WORKS");

  const ttmlUrl = "tube.ttml";

  fetch(ttmlUrl)
    .then((response) => response.text())
    .then((ttmlData) => {
      // Parse the TTML data
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(ttmlData, "application/xml");
      const paragraphs = xmlDoc.getElementsByTagName("p");

      console.log("Parsed TTML data:", paragraphs); // Debugging line

      if (directionsRenderer && directionsRenderer.getDirections()) {
        const route = directionsRenderer.getDirections().routes[0];

        for (let i = 1; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i];
          const values = paragraph.textContent.split(",");
          const stationName = values[0].trim();
          const coordinates = values[3].split(",");
          const latitude = parseFloat(coordinates[0].split(" ")[1].trim());
          const longitude = parseFloat(coordinates[1].split(" ")[1].trim());

          console.log("Station Name:", stationName); // Debugging line
          console.log("Latitude:", latitude);         // Debugging line
          console.log("Longitude:", longitude);       // Debugging line

          const tubeStopLocation = new google.maps.LatLng(latitude, longitude);

          const isWithinRange = checkDistanceToRoute(tubeStopLocation, route);

          console.log("Is Within Range:", isWithinRange); // Debugging line

          if (isWithinRange) {
            const tubeStopMarker = new google.maps.Marker({
              map: map,
              position: tubeStopLocation,
              title: stationName,
            });

            markers.push(tubeStopMarker);
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching or parsing TTML data: ", error);
    });
}
// ... (your existing code)

function showAccessiblePlatforms() {
  const xhr = new XMLHttpRequest();
  const apiUrl = "https://content.tfl.gov.uk/lrad-v2.xml";

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const xmlDoc = xhr.responseXML;
      const platforms = xmlDoc.getElementsByTagName("Platform");

      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        const platformName = platform.getElementsByTagName("PlatformName")[0].textContent;
        const isAccessible = platform.getElementsByTagName("IsAccessible")[0].textContent === "true";

        if (isAccessible) {
          const platformLat = parseFloat(platform.getElementsByTagName("Latitude")[0].textContent);
          const platformLng = parseFloat(platform.getElementsByTagName("Longitude")[0].textContent);
          const platformLocation = new google.maps.LatLng(platformLat, platformLng);

          const platformMarker = new google.maps.Marker({
            map: map,
            position: platformLocation,
            title: platformName,
          });

          markers.push(platformMarker);
        }
      }
    }
  };

  xhr.open("GET", apiUrl, true);
  xhr.send();
}

// ... (the rest of your existing code)

function calculateAndDisplayDistance(origin, destination) {
  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
    },
    function (response, status) {
      if (status === google.maps.DistanceMatrixStatus.OK) {
        const distanceText = response.rows[0].elements[0].distance.text;
        document.getElementById("distanceText").textContent = `Distance to destination: ${distanceText}`;
      } else {
        alert("Error calculating distance: " + status);
      }
    }
  );
}

function checkDistanceToRoute(location) {
  if (directionsRenderer && directionsRenderer.getDirections()) {
    const route = directionsRenderer.getDirections().routes[0];
    for (let i = 0; i < route.legs.length; i++) {
      const leg = route.legs[i];
      const steps = leg.steps;
      for (let j = 0; j < steps.length; j++) {
        const step = steps[j];
        const path = step.path;
        for (let k = 0; k < path.length; k++) {
          const point = path[k];
          const distance = google.maps.geometry.spherical.computeDistanceBetween(location, point);
          if (distance <= 300) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function clearBikePointMarkers() {
  markers.forEach((marker) => {
    if (marker.getTitle()) {
      marker.setMap(null);
    }
  });

  markers = markers.filter((marker) => !marker.getTitle());
}
