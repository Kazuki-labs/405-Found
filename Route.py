from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

GOOGLE_MAPS_API_KEY = ''

@app.route('/calculate_route', methods=['POST'])
def calculate_route():
    # Get transportation mode and destination from the POST request
    mode = request.form.get('mode')
    destination = request.form.get('destination')

    # Define transportation modes
    transportation_modes = ['bike', 'tube', 'bus', 'disabled_accessible']

    # Initialize variables to store the best route data
    best_route = None
    best_route_duration = float('inf')

    # Iterate through each transportation mode and find routes
    for transport_mode in transportation_modes:
        route = find_route(mode, transport_mode, destination)
        if route['duration'] < best_route_duration:
            best_route = route
            best_route_duration = route['duration']

    return jsonify(best_route)

def find_route(user_mode, transport_mode, destination):
    url = f'https://maps.googleapis.com/maps/api/directions/json?origin=user_location&destination={destination}&mode={transport_mode}&key={AIzaSyAW6uop0Hsjat7YxpCNMYhNZDQ-OTH17mM}'

    # Make an API request
    response = requests.get(url)
    data = response.json()

    # Parse the response to extract route information
    if 'routes' in data and len(data['routes']) > 0:
        route = data['routes'][0]
        duration = route['legs'][0]['duration']['text']
        distance = route['legs'][0]['distance']['text']
        steps = [step['html_instructions'] for step in route['legs'][0]['steps']]
        return {
            'mode': transport_mode,
            'duration': duration,
            'distance': distance,
            'steps': steps
        }
    else:
        return {
            'mode': transport_mode,
            'duration': 'N/A',
            'distance': 'N/A',
            'steps': []
        }

if __name__ == '__main__':
    app.run(debug=True)
 
    
