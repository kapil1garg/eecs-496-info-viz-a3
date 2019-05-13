$(function() {
  // hashing function for key
  function hashCode(str) {
    return str.split('').reduce((prevHash, currVal) =>
      (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
  }

  // store original data and filters globally
  let originalData = null;
  let originalFilterVals = {};

  // store filter values from UI
  let filterVals = {
    country: new Set(),
    province: new Set(),
    variety: new Set(),
    color: new Set(),
    vintage: [0, 0],
    price: [0, 0],
    points: [0, 0]
  };

  // other things to store globally
  let svg = null,
    tooltip = null,
    xScale = null,
    yScale = null,
    bgColor = null,
    txtColor = null;

  queue()
    .defer(d3.json, 'wine_reviews_small.json')
    .await(ready);

  function ready(error, data) {
    // set original data variable
    originalData = [...data]; // deep copy to remove references

    // add jitter and key that is always the same
    for (let i = 0; i < originalData.length; i++) {
      originalData[i]['jitter'] = i % 2 === 0 ? +Math.random() * 10 : -Math.random() * 10;
      originalData[i]['key'] = hashCode(originalData[i]['title']);
    }

    // setup filters
    setupFilters(data);

    // setup click handlers on select/deselect statements
    handleSelectClick();

    // setup plot
    setupPlot(data);

    // plot original data
    update(data);
  }

  function setupPlot(data) {
    // store DOM elements to modify
    const $scatterDiv = $('#d3-scatter');
    const destElement = d3.select('#d3-scatter');

    // setup plotting area
    const margin = { top: 30, right: 50, bottom: 50, left: 50 };
    const h = $scatterDiv.innerHeight() - margin.top - margin.bottom;
    const w = $scatterDiv.innerWidth() - margin.left - margin.right;

    // scales (x = number points, y = price)
    xScale = d3.scaleLinear()
      .domain([80, 100])
      .range([0, w]);

    yScale = d3.scaleLinear()
      .domain([0, Math.round(d3.max(data, function(d) { return d.price; }) / 50) * 50])
      .range([h, 0]);

    // color for background and text
    bgColor = d3.scaleOrdinal()
      .domain(['Red', 'Rose', 'White'])
      .range(['#722F37', '#FDBCB4', '#ECCD13']);

    txtColor = d3.scaleOrdinal()
      .domain(['Red', 'Rose', 'White'])
      .range(['#FFFFFF', '#333333', '#333333']);

    // x-axis
    const xAxis = d3.axisBottom(xScale);

    // y-axis
    const yAxis = d3.axisLeft(yScale);

    // tooltip (needs to be attached to body element, NOT destElement)
    tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // setup svg
    svg = destElement.append('svg')
      .attr('height', h + margin.top + margin.bottom)
      .attr('width', w + margin.left + margin.right)
      .append('g')
      .attr('transform',
        `translate(${ margin.left }, ${ margin.top })`);

    // add x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${ h })`)
      .attr('class','axis')
      .call(xAxis);


    svg.append('text') // x-axis label
      .attr('class','label')
      .attr('x', w)
      .attr('y',h - 10)
      .style('text-anchor','end')
      .text('Reviewer Score');

    // add y-axis
    svg.append('g')
      .attr('class', 'axis')
      .call(yAxis);

    svg.append('text') // y-axis Label
      .attr('class','label')
      .attr('x', 175)
      .attr('y', -10)
      .style('text-anchor','end')
      .text('Price per Bottle (in $USD)');

    // add legend
    const legend = svg.selectAll('legend')
      .data(bgColor.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d, i) { return `translate(0, ${ i * 30})`; });

    legend.append('rect')
      .attr('x', w)
      .attr('width', 25)
      .attr('height', 25)
      .style('fill', bgColor);

    legend.append('text')
      .attr('x', w - 6)
      .attr('y', 9)
      .attr('dy', '10px')
      .style('text-anchor', 'end')
      .text(function(d) { return d; });

    legend.on('mouseover', function(selectedColor) {
      d3.selectAll('circle')
        .style('opacity', 0)
        .filter(function(d){
          return d.color === selectedColor;
        })
        .style('opacity', 1);
    }).on('mouseout', function() {
      d3.selectAll('circle')
        .style('opacity', 0.85)
    });
  }

  function setupFilters(data) {
    // make a function to create check boxes
    function makeCheckBox(filterName, value) {
      return `<div class="form-check">
        <input class="form-check-input" type="checkbox" value="${ value }" id="${ filterName }-${ value }" checked>
          <label class="form-check-label" for="defaultCheck1">
            ${ value }
          </label>
        </div>`
    }

    data.forEach(function (d) {
      // add country
      if (!filterVals.country.has(d.country)) {
        filterVals.country.add(d.country);
        $('#filter-country').append(makeCheckBox('country', d.country));
      }

      // add province
      if (!filterVals.province.has(d.province)) {
        filterVals.province.add(d.province);
        $('#filter-province').append(makeCheckBox('province', d.province));
      }

      // add variety
      if (!filterVals.variety.has(d.variety)) {
        filterVals.variety.add(d.variety);
        $('#filter-variety').append(makeCheckBox('variety', d.variety));
      }

      // add color
      if (!filterVals.color.has(d.color)) {
        filterVals.color.add(d.color);
        $('#filter-color').append(makeCheckBox('color', d.color));
      }
    });

    // setup sliders
    const $sliderVintage = $("#slider-vintage"),
      $amountVintage = $( "#amount-vintage" );
    filterVals.vintage = [d3.min(data, function(d) { return d.vintage; }), d3.max(data, function(d) { return d.vintage; })];

    $sliderVintage.slider({
      range: true,
      min: filterVals.vintage[0],
      max: filterVals.vintage[1],
      values: [filterVals.vintage[0], filterVals.vintage[1]],
      slide: function(event, ui) {
        // set UI text
        $amountVintage.val( `${ ui.values[0] } - ${ ui.values[1] }`);

        // update filter values
        filterVals.vintage = [ui.values[0], ui.values[1]];

        // dynamically filter data and re-draw plot
        update(filterData());
      }
    });
    $amountVintage.val( `${ $sliderVintage.slider("values", 0) } - ${ $sliderVintage.slider( "values", 1 ) }`);

    const $sliderPrice = $("#slider-price"),
      $amountPrice = $( "#amount-price" );
    filterVals.price = [d3.min(data, function(d) { return d.price; }), d3.max(data, function(d) { return d.price; })];

    $sliderPrice.slider({
      range: true,
      min: filterVals.price[0],
      max: filterVals.price[1],
      values: [filterVals.price[0], filterVals.price[1]],
      slide: function(event, ui) {
        // set UI text
        $amountPrice.val( `$${ ui.values[ 0 ] } - $${ ui.values[ 1 ] }`);

        // update filter values
        filterVals.price = [ui.values[0], ui.values[1]];

        // dynamically filter data and re-draw plot
        update(filterData());
      }
    });
    $amountPrice.val( `$${ $sliderPrice.slider( "values", 0 ) } - $${ $sliderPrice.slider( "values", 1 ) }`);

    const $sliderRating = $("#slider-rating"),
      $amountRating = $( "#amount-rating" );
    filterVals.points = [d3.min(data, function(d) { return d.points; }), d3.max(data, function(d) { return d.points; })];

    $sliderRating.slider({
      range: true,
      min: filterVals.points[0],
      max: filterVals.points[1],
      values: [filterVals.points[0], filterVals.points[1]],
      slide: function(event, ui) {
        // set UI text
        $amountRating.val( `${ ui.values[ 0 ] } - ${ ui.values[ 1 ] }`);

        // update filter values
        filterVals.points = [ui.values[0], ui.values[1]];

        // dynamically filter data and re-draw plot
        update(filterData());
      }
    });
    $amountRating.val( `${ $sliderRating.slider( "values", 0 ) } - ${ $sliderRating.slider( "values", 1 ) }`);

    // store original filters
    originalFilterVals = {
      country: [...filterVals.country],
      province: [...filterVals.province],
      variety: [...filterVals.variety],
      color: [...filterVals.color],
      vintage: [filterVals.vintage[0], filterVals.vintage[1]],
      price: [filterVals.price[0], filterVals.price[1]],
      points: [filterVals.points[0], filterVals.points[1]]
    };
  }

  function handleSelectClick() {
    // country
    $('#selectall-country').on('click', function() {
      checkAllInFilter('country');
      filterVals.country = new Set(originalFilterVals.country);
      update(filterData());
    });
    $('#deselectall-country').on('click', function() {
      uncheckAllInFilter('country');
      filterVals.country = new Set();
      update(filterData());
    });

    // province
    $('#selectall-province').on('click', function() {
      checkAllInFilter('province');
      filterVals.province = new Set(originalFilterVals.province);
      update(filterData());
    });
    $('#deselectall-province').on('click', function() {
      uncheckAllInFilter('province');
      filterVals.province = new Set();
      update(filterData());
    });

    // variety
    $('#selectall-variety').on('click', function() {
      checkAllInFilter('variety');
      filterVals.variety = new Set(originalFilterVals.variety);
      update(filterData());
    });
    $('#deselectall-variety').on('click', function() {
      uncheckAllInFilter('variety');
      filterVals.variety = new Set();
      update(filterData());
    });

    // listen for clicks on any checkbox
    $('.form-check-input').on('click', function(e) {
      let [filterName, filterValue] = e.currentTarget.id.split('-');
      let isChecked = e.currentTarget.checked;

      // update based on if checked or not
      if (isChecked) {
        filterVals[filterName].add(filterValue);
      } else {
        filterVals[filterName].delete(filterValue);
      }

      update(filterData());
    });
  }

  function checkAllInFilter(filterName) {
    $(`#filter-${ filterName } input`).prop('checked', true);
  }

  function uncheckAllInFilter(filterName) {
    $(`#filter-${ filterName } input`).prop('checked', false);
  }

  function filterData() {
    // filter data and return
    return originalData.filter(wine => {
      return (filterVals.country.has(wine.country)) && (filterVals.province.has(wine.province)) &&
        (filterVals.variety.has(wine.variety)) && (filterVals.color.has(wine.color)) &&
        (wine.vintage >= filterVals.vintage[0] && wine.vintage <= filterVals.vintage[1]) &&
        (wine.price >= filterVals.price[0] && wine.price <= filterVals.price[1]) &&
        (wine.points >= filterVals.points[0] && wine.points <= filterVals.points[1]);
    });
  }

  function update(data) {
    // make circles
    let circles = svg.selectAll('circle')
      .data(data, function (d) { return d.key; });

    circles.enter()
      .append('circle')
      .attr('class', 'scatterDot')
      .attr('r', '5')
      // .attr('stroke', 'black')
      // .attr('stroke-width', 0)
      .style('opacity', 0.85)
      .attr('cx', function (d) { // add a tiny amount of jitter on x-axis
        let scaledPoints = xScale(d.points);
        return scaledPoints + d.jitter;
      })
      .attr('cy', function (d) { return yScale(d.price) })
      .style('fill', function (d) { return bgColor(d.color); })
      .on('mouseover', function(d) {
      // add data to sidebar
      const $wineDom = $('.wine-information');
      $wineDom.css('visibility', 'visible');
      $wineDom.css('color', bgColor(d.color));
      $('#wine-instruction').hide();

      $('#wine-title').text(d.title);
      $('#wine-country').text(`${ d.province }, ${ d.country }`);
      $('#wine-vintage').text(`Vintage: ${ d.vintage }`);
      $('#wine-price').text(`Price: $${ d.price }`);
      $('#wine-rating').text(`Rating: ${ d.points }/100 points`);

      // active tooltip
      tooltip.transition()
        .duration(0)
        .style('opacity', 1.0);
      tooltip.html(d.title)
        .style('left', `${ d3.event.pageX }px`)
        .style('top', `${ d3.event.pageY - 28 }px`)
        .style('background', bgColor(d.color))
        .style('color', txtColor(d.color));
    })
      .on('mouseout', function(d) {
        // hide all jquery text
        $('.wine-information').css('visibility', 'hidden');
        $('#wine-instruction').show();

        // deactivate tooltip
        tooltip.transition()
          .duration(0)
          .style('opacity', 0);
      });

    circles.exit().remove();
  }
});