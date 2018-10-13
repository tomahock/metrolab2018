(function($, w, d) {

  var templates = {},
      markers = [],
      query = {},
      where,
      map;

  function search() {
    console.log('query', query);
    if (!query.lat || !query.lng) return;

    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    $('#search-results').addClass('d-none').find('dl').html('');

    $.ajax({
      url: 'https://tomahock.com/cenas/amp/polygon.php',
      cors: true,
      method: 'POST',
      dataType: 'json',
      data: JSON.stringify(query),
      success: function(res) {
        console.log('res', res);
        /* WHITELIST */
        res.points.forEach(function(point) {
          var location = {lat: point.loc.coordinates[0], lng: point.loc.coordinates[1]},
              marker = new google.maps.Marker({
                position: location,
                animation: google.maps.Animation.DROP,
                map: map,
                icon: '/assets/images/pin-whitelist.svg'
              });
          markers.push(marker);
        });
        /* BLACKLIST */
        res.blackPoints.forEach(function(point) {
          var location = {lat: point.loc.coordinates[0], lng: point.loc.coordinates[1]},
              marker = new google.maps.Marker({
                position: location,
                animation: google.maps.Animation.DROP,
                map: map,
                icon: '/assets/images/pin-blacklist.svg'
              });
          markers.push(marker);
        });
        $('#search-results').removeClass('d-none').find('dl').html(
          Mustache.render(templates['search-results'], {
            age: res.averageAge,
            imi: res.imi,
            weather: res.weather
          })
        );
      },
      error: function() {
        console.log(arguments);
      }
    });
  }

  function buildQuery() {
    var elms = $('input, select', $('#search-form')), white = [], black = [];
    elms.each(function() {
      elm = $(this);
      if (elm.is('[name^="search-condition"]')) {
        var condition = elm.val(), value = elm.parent().find('[name^="search-rule"]').val();
        if (!value) return;
        condition === 'are' && white.push(value);
        condition === 'are not' && black.push(value);
      }
    });
    $.extend(query, {white: white, black: black});
    search();
  }

  function initMap() {
    var container = $('#map')[0],
        input = $('#search-where')[0],
        markers = [];

    map = new google.maps.Map(container, {
      center: {lat: 41.154229, lng: -8.6193252},
      zoom: 13,
      mapTypeId: 'roadmap'
    }),

    where = new google.maps.places.SearchBox(input);

    map.addListener('bounds_changed', function() {
      where.setBounds(map.getBounds());
    });

    where.addListener('places_changed', function() {
      var places = where.getPlaces();
      if (places.length == 0) return;
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function (place) {
        if (!place.geometry) {
          return;
        } else {
          var b = place.geometry.viewport.toJSON();
          $.extend(query, place.geometry.location.toJSON(), {boundaries: [b.east, b.south, b.west, b.north].join(',')});
          search();
        }
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };
        markers.push(new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location
        }));
        if (place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });
  }

  /* SEARCH */
  $('#search-form')
  .on('input', buildQuery)
  .on('click', '.add-remove-rule', function() {
    var elm = $(this), rules = $('[data-search-rule]').length;
    if (elm.is('.disabled')) {
      elm.prev('select').focus();
    } else if (elm.is('.remove')) {
      elm.parent().remove();
      buildQuery();
    } else {
      $('#search-form').append(Mustache.render(templates['search-rule'], {index: rules}));
      rules === 1 ? elm.remove() : elm.addClass('remove');
    }
  })
  .on('change', 'select', function() {
    var elm = $(this);
    elm.next('.add-remove-rule').toggleClass('disabled', !elm.val());
  });

  /* GOOGLE MAPS */
  $.ajax({
    url: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAMkJYJQ65lqcth6lpVlS2zjE5agP5PrJE&libraries=places',
    dataType: 'script',
    success: initMap
  });

  /* MUSTACHE */
  $('script[type="x-tmpl-mustache"]').each(function() {
    elm = $(this);
    template = elm.attr('data-template');
    templates[template] = elm.html();
    Mustache.parse(templates[template]);
    elm.remove();
  });

}(jQuery, window, document))