(function($, w, d) {

  var templates = {},
      markers = [],
      query = {},
      where,
      map;

  function search() {
    console.log(query);
    if (!query.lat || !query.lng) return;
    $(markers).each(function() {
      marker.setMap(null);
    });
    markers = [];
    $.ajax({
      url: 'https://tomahock.com/cenas/amp/polygon.php',
      cors: true,
      method: 'POST',
      dataType: 'json',
      data: JSON.stringify(query),
      success: function(res) {
        $(res.points).each(function(idx, point) {
          var coords = point.loc.coordinates;
          markers.push(new google.maps.Marker({
            position: {lat: coords[0], lng: coords[1]},
            animation: google.maps.Animation.DROP,
            map: map,
            icon: '/assets/images/pin.svg'
          }));
        });
      },
      error: function() {
        console.log(arguments);
      }
    });
  }

  function buildQuery() {
    var elms = $('input, select', $('#search-form')), white = [], black = [];
    console.log('Build Query');
    elms.each(function (idx, elm) {
      elm = $(elm);
      switch (true) {
        case elm.is('[name^="search-condition"]'):
          var condition = elm.val(),
            value = elm.parent().find('[name^="search-rule"]').val();
          if (!value) return;
          if (condition === 'are') white.push(value);
          if (condition === 'are not') black.push(value);
          break;
        default:
          break;
      }
    });
    $.extend(query, {white: white, black: black});
    search();
  }

  function initMap() {
    var container = $('#map')[0], input = $('#search-where')[0];

    map = new google.maps.Map(container, {
      center: { lat: 41.154229, lng: -8.6193252 },
      zoom: 13,
      mapTypeId: 'roadmap'
    }),

    where = new google.maps.places.SearchBox(input);

    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
      where.setBounds(map.getBounds());
    });

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    where.addListener('places_changed', function () {
      var places = where.getPlaces();

      if (places.length == 0) {
        return;
      }

      // Clear out the old markers.
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function (place) {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        } else {
          var b = place.geometry.viewport.toJSON();
          $.extend(
            query,
            place.geometry.location.toJSON(),
            {boundaries: [b.east, b.south, b.west, b.north].join(',')}
          );
          search();
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

  /* SEARCH */
  $('#search-form').on('click', '.add-remove-rule', function() {
    var elm = $(this),
        rules = $('[data-search-rule]').length;
    if (elm.is('.disabled')) {
      elm.prev('select').focus();
    } else if (elm.is('.remove')) {
      elm.parent().remove();
      buildQuery();
    } else {
      $('#search-form').append(Mustache.render(templates['search-rule'], {index: rules}));
      rules === 1 ? elm.remove() : elm.addClass('remove');
    }
  });

  $('#search-form').on('change', 'select', function() {
    var elm = $(this);
    elm.next('.add-remove-rule').toggleClass('disabled', elm.val());
  });

  $('#search-form').on('input', function(evt) {
    buildQuery();
  });


  /* GOOGLE MAPS */
  $.ajax({
    url: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAMkJYJQ65lqcth6lpVlS2zjE5agP5PrJE&libraries=places',
    dataType: 'script',
    success: initMap
  });

  /* MUSTACHE */
  $('script[type="x-tmpl-mustache"]').each(function (idx, elm) {
    elm = $(elm);
    template = elm.attr('data-template');
    templates[template] = elm.html();
    Mustache.parse(templates[template]);
    elm.remove();
  });

}(jQuery, window, document))