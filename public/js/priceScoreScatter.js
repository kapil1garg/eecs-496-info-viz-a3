$(function() {

  queue()
    .defer(d3.json, 'wine_reviews_small.json')
    .await(ready);

  function ready(error, data) {
    // Variables
    const $scatterDiv = $('#d3-scatter');
    const destElement = d3.select('#d3-scatter');

    const margin = { top: 30, right: 50, bottom: 50, left: 50 };
    const h = $scatterDiv.innerHeight() - margin.top - margin.bottom;
    const w = $scatterDiv.innerWidth() - margin.left - margin.right;

    // Scales
    const xScale = d3.scaleLinear()
      .domain([80, 100])
      .range([0, w]);

    const yScale = d3.scaleLinear()
      .domain([0, 500])
      .range([h, 0]);

    // color for background and text
    const bgColor = d3.scaleOrdinal()
      .domain(['Red', 'Rose', 'White'])
      .range(['#722F37', '#FDBCB4', '#ECCD13']);

    const txtColor = d3.scaleOrdinal()
      .domain(['Red', 'Rose', 'White'])
      .range(['#FFFFFF', '#333333', '#333333']);

    // SVG
    const svg = destElement.append('svg')
      .attr('height', h + margin.top + margin.bottom)
      .attr('width', w + margin.left + margin.right)
      .append('g')
      .attr('transform',
        `translate(${ margin.left }, ${ margin.top })`);

    // X-axis
    const xAxis = d3.axisBottom(xScale);

    // Y-axis
    const yAxis = d3.axisLeft(yScale);

    // tooltip (needs to be attached to body element, NOT destElement)
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // x-axis
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

    // y-axis
    svg.append('g')
      .attr('class', 'axis')
      .call(yAxis);

    svg.append('text') // y-axis Label
      .attr('class','label')
      .attr('x', 175)
      .attr('y', -10)
      .style('text-anchor','end')
      .text('Price per Bottle (in $USD)');

    // legend
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
      d3.selectAll('circle').transition()
        .duration(400)
        .style('opacity', 0)
        .filter(function(d){
          return d.color === selectedColor;
        })
        .style('opacity', 1);
    }).on('mouseout', function(selectedColor) {
      d3.selectAll('circle').transition()
        .duration(250)
        .style('opacity', 0.85)
    });

    // circles
    const circles = svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', function (d, i) { // add a tiny amount of jitter on x-axis
          let scaledPoints = xScale(d.points);
          let jitter = i % 2 === 0 ? +Math.random() * 10 : -Math.random() * 10;
          return scaledPoints + jitter;
        })
        .attr('cy', function (d) { return yScale(d.price) })
        .attr('r', '5')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .style('fill', function (d) { return bgColor(d.color); })
        .style('opacity', 0.85)
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
  }
});