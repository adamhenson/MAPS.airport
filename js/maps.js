var MAPS = window.MAPS || [];

MAPS.currentLocation = { // default location to NYC... we'll do the geolocation thing upon MAPS initialization
	lat: 40.714352999999996,
	lng: -74.005973
}

MAPS.airport = (function(){
	
	var directionsService,
		directionsDisplay,
		input,
		infoWindow = [],
		mapOptions = {},
		map;

	function attachAutocomplete(el, submitField) {
		// vars
		var autocomplete = new google.maps.places.Autocomplete(el, { types: ['geocode'], componentRestrictions: {country: 'us'} }),
			marker = new google.maps.Marker({
			map: map
		}),
			infowindow = new google.maps.InfoWindow();

		//bindings and listeners
		autocomplete.bindTo('bounds', map);
		google.maps.event.addListener(autocomplete, 'place_changed', function() {
			marker.setVisible(false);
			el.className = '';
			var place = autocomplete.getPlace();
			var isAirport = false;
			if(place.types) {
				for (var i = 0; i < place.types.length; i++) {
					if(place.types[i] == 'airport') {
						isAirport = true;
						break;
					}
				}
			}
			if (!place.geometry || isAirport == false) {
				// Inform the user that the place was not found and return.
				var msg = (isAirport == false) ? 'nice try, but that isn\'t an airport :(' : 'not found :o';
				alert(msg);
				el.className = 'notfound';
				return;
			}
			// If the place has a geometry, then present it on a map.
			if (place.geometry.viewport) {
				map.fitBounds(place.geometry.viewport);
			} else {
				map.setCenter(place.geometry.location);
				map.setZoom(17);  // Why 17? Because it looks good.
			}
			marker.setIcon(({
				url: place.icon,
				size: new google.maps.Size(71, 71),
				origin: new google.maps.Point(0, 0),
				anchor: new google.maps.Point(17, 34),
				scaledSize: new google.maps.Size(35, 35)
			}));
			marker.setPosition(place.geometry.location);
			marker.setVisible(true);
			
			var address = '';
			if (place.address_components) {
				address = [
					(place.address_components[0] && place.address_components[0].short_name || ''),
					(place.address_components[1] && place.address_components[1].short_name || ''),
					(place.address_components[2] && place.address_components[2].short_name || '')
				].join(' ');
			}
			infoWindow.push(new google.maps.InfoWindow());
			infoWindow[infoWindow.length - 1].setContent('<div><strong>' + place.name + '</strong><br>' + address);
			infoWindow[infoWindow.length - 1].open(map, marker);
			
			if(submitField == true) {
				calcRoute(input[0].value, input[1].value);
				calculateDistances(input[0].value, input[1].value);
			}
		});
	}

	function calcRoute(start, end) {
		if(infoWindow.length) {
			for (var i = 0; i < infoWindow.length; i++) {
				infoWindow[i].close();
			}
		}
		var request = {
			origin:start,
			destination:end,
			travelMode: google.maps.DirectionsTravelMode.DRIVING
		};
		directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
			}
		});
	}


	function calculateDistances(destinationA, destinationB) {
	var service = new google.maps.DistanceMatrixService();
	service.getDistanceMatrix({
		origins: [destinationA],
		destinations: [destinationB],
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.IMPERIAL,
		avoidHighways: false,
		avoidTolls: false
	}, distanceCallback);}

	function distanceCallback(response, status) {
		if (status != google.maps.DistanceMatrixStatus.OK) {
			alert('Error was: ' + status);
		} else {
			var origins = response.originAddresses;
			var destinations = response.destinationAddresses;
			var outputDiv = document.getElementById('airport-dist');
			outputDiv.innerHTML = '';
			for (var i = 0; i < origins.length; i++) {
				var results = response.rows[i].elements;
				for (var j = 0; j < results.length; j++) outputDiv.innerHTML =  results[j].distance.text;
				for (var k = 0; k < input.length; k++) input[k].value = '';
			}
		}
	}

	function setUpMap(loc) {
		mapOptions = {
			center: new google.maps.LatLng(loc.lat, loc.lng),
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
		for (var i = 0; i < input.length; i++) {
			if(i == 0) attachAutocomplete(input[i], false);
			else attachAutocomplete(input[i], true);
		}
		directionsDisplay.setMap(map);
	}
	
	return {
		init: function(){
			// if HTML5 GeoLocation
			if(navigator.geolocation.getCurrentPosition) {
				navigator.geolocation.getCurrentPosition(function (position) {
					MAPS.currentLocation.lat = position.coords.latitude;
					MAPS.currentLocation.lng = position.coords.longitude;
					setUpMap(MAPS.currentLocation);
				});
			} else {
				setUpMap(MAPS.currentLocation);
			}
			directionsService = new google.maps.DirectionsService();
			directionsDisplay = new google.maps.DirectionsRenderer();
			input = [(document.getElementById('airport-from')), (document.getElementById('airport-to'))];	
		}
		
	};
	
})();

google.maps.event.addDomListener(window, 'load', MAPS.airport.init);