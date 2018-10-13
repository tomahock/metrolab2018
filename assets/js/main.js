(function($, w, d) {

  var templates = {};

  /* SEARCH */
  (function() {
    $('#search-add-rule').on('click', function() {
      $(this).before(Mustache.render(templates['search-near'], {index: $('[data-name="search-near"]').length}));
    });
  }());

  /* GOOGLE MAPS */
  (function() {
    $.ajax({
      url: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAMkJYJQ65lqcth6lpVlS2zjE5agP5PrJE&libraries=places',
      dataType: 'script',
      success: function () {
        var container = $('#search-map')[0],
            input = $('#search-where')[0],
            map = new google.maps.Map(container, {
              center: { lat: 41.154229, lng: -8.6193252 },
              zoom: 13,
              mapTypeId: 'roadmap'
            }),
            searchBox = new google.maps.places.SearchBox(input);
        
        // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function () {
          searchBox.setBounds(map.getBounds());
        });

        var markers = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function () {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          // Clear out the old markers.
          markers.forEach(function (marker) {
            marker.setMap(null);
          });
          markers = [];

          // For each place, get the icon, name and location.
          var bounds = new google.maps.LatLngBounds();
          places.forEach(function (place) {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }
            var icon = {
              url: place.icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
              map: map,
              icon: icon,
              title: place.name,
              position: place.geometry.location
            }));

            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });
      }
    });
  }());

  /* MUSTACHE */
  $('script[type="x-tmpl-mustache"]').each(function (idx, elm) {
    elm = $(elm);
    template = elm.attr('data-template');
    templates[template] = elm.html();
    Mustache.parse(templates[template]);
    elm.remove();
  });

}(jQuery, window, document))