const axios = require('axios');
const { google } = require('googleapis');

// Initialize  Google Maps Directions API client
const googleMapsClient = google.maps({
  version: '3',
  auth: 'AIzaSyAW6uop0Hsjat7YxpCNMYhNZDQ-OTH17mM',
});

// Define different modes of transportation
const modesOfTransportation = ['driving', 'bicycling', 'transit'];

// Function to find the shortest route
async function findShortestRoute(origin, destination) {
  let shortestRoute = null;
  let shortestDuration = Infinity;

  for (const mode of modesOfTransportation) {
    const response = await googleMapsClient.directions({
      origin,
      destination,
      mode,
    });

    if (response.data.routes.length > 0) {
      const duration = response.data.routes[0].legs[0].duration.value;
      if (duration < shortestDuration) {
        shortestDuration = duration;
        shortestRoute = response.data;
      }
    }
  }

  return shortestRoute;
}

// Example usage
const origin = 'Start Location';
const destination = 'End Location';

findShortestRoute(origin, destination)
  .then((shortestRoute) => {
    if (shortestRoute) {
      console.log('Shortest Route:', shortestRoute);
    } else {
      console.log('No route found.');
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
