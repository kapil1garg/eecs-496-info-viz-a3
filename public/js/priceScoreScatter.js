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
    vintage: new Set(),
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

  // load data and start plotting when ready
  d3.json('wine_reviews_small.json').then(data => {
    ready(data);
  }).catch(err => {
    console.log('Error with loading data into D3: ', err);
  });

  function ready(data) {
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
    function makeCheckBox(filterName, value, styleClasses) {
      if (styleClasses === undefined) {
        styleClasses = '';
      }

      return `<div class="form-check">
        <input class="form-check-input" type="checkbox" value="${ value }" id="${ filterName }-${ value }" checked>
          <label class="form-check-label ${ styleClasses }" for="${ filterName }-${ value }">
            ${ value }
          </label>
        </div>`
    }

    // get data for filters, with a special holder for grape variety
    let varietyObj = [];
    data.forEach(function (d) {
      // add country
      filterVals.country.add(d.country);

      // add province
      filterVals.province.add(d.province);

      // add variety
      if (!filterVals.variety.has(d.variety)) {
        filterVals.variety.add(d.variety);
        varietyObj.push({
          'name': d.variety,
          'color': d.color
        });
      }

      // add color
      filterVals.color.add(d.color);

      // add vintage
      filterVals.vintage.add(d.vintage.toString());
    });

    // add sorted data to DOM
    let countries = [...filterVals.country];
    countries.sort();
    countries.forEach(country => {
      $('#filter-country').append(makeCheckBox('country', country));
    });

    let provinces = [...filterVals.province];
    provinces.sort();
    provinces.forEach(province => {
      $('#filter-province').append(makeCheckBox('province', province));
    });

    varietyObj.sort(function (x, y) {
      // sort first by wine color
      if (x.color > y.color) return 1;
      if (x.color < y.color) return -1;

      // sort second by name
      if (x.name > y.name) return 1;
      if (x.name < y.name) return -1;
    });

    varietyObj.forEach(variety => {
      let varietyColorClass = '';
      switch (variety.color) {
        case 'Red':
          varietyColorClass = 'text-red-wine';
          break;
        case 'Rose':
          varietyColorClass = 'text-rose-wine';
          break;
        case 'White':
          varietyColorClass = 'text-white-wine';
          break;
        default:
          break;
      }
      $('#filter-variety').append(makeCheckBox('variety', variety.name, varietyColorClass));
    });

    let colors = [...filterVals.color];
    colors.sort();
    colors.forEach(color => {
      let colorClass = '';
      switch (color) {
        case 'Red':
          colorClass = 'text-red-wine';
          break;
        case 'Rose':
          colorClass = 'text-rose-wine';
          break;
        case 'White':
          colorClass = 'text-white-wine';
          break;
        default:
          break;
      }
      $('#filter-color').append(makeCheckBox('color', color, colorClass));
    });

    let vintages = [...filterVals.vintage];
    vintages.sort((a, b) => { return b - a });
    vintages.forEach(vintage => {
      $('#filter-vintage').append(makeCheckBox('vintage', vintage));
    });

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
      vintage: [...filterVals.vintage],
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

    // vintage
    $('#selectall-vintage').on('click', function() {
      checkAllInFilter('vintage');
      filterVals.vintage = new Set(originalFilterVals.vintage);
      update(filterData());
    });
    $('#deselectall-vintage').on('click', function() {
      uncheckAllInFilter('vintage');
      filterVals.vintage = new Set();
      update(filterData());
    });

    // listen for clicks on any checkbox
    $('.form-check-input').on('click', function(e) {
      let [filterName, filterValue] = e.currentTarget.id.split(/-(.+)/);
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
        (filterVals.vintage.has(wine.vintage.toString())) &&
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
      .style('opacity', 0.85)
      .attr('cx', function (d) { // add a tiny amount of jitter on x-axis
        let scaledPoints = xScale(d.points);
        return scaledPoints + d.jitter;
      })
      .attr('cy', function (d) { return yScale(d.price) })
      .style('fill', function (d) { return bgColor(d.color); })
      .on('mouseover', function(d) {
      // active tooltip
      tooltip.transition()
        .duration(0)
        .style('opacity', 1.0)
        .style('text-align', 'left');
      tooltip.html(`
        <b>${ d.title }</b><br>
        ${ d.province }, ${ d.country } (${ d.vintage })<br>
        $${ d.price }; ${ d.points } / 100 points
        `)
        .style('left', `${ d3.event.pageX }px`)
        .style('top', `${ d3.event.pageY - 28 }px`)
        .style('background', bgColor(d.color))
        .style('color', txtColor(d.color));
    })
      .on('mouseout', function(d) {
        // deactivate tooltip
        tooltip.transition()
          .duration(0)
          .style('opacity', 0);
      });

    circles.exit().remove();
  }
});