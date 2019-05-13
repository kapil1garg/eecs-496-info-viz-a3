$(function() {
    const margin = {top: 0, right: 0, bottom: 0, left: 0};
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select('#d3-map')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('class', 'map');

    const projection = d3.geoRobinson()
      .scale(148)
      .rotate([352, 0, 0])
      .translate( [width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    queue()
      .defer(d3.json, 'world-topo.json')
      .await(ready);

    function ready(error, data, population) {
        // const populationById = {};
        //
        // population.forEach(d => { populationById[d.country_code] = +d.count_total; });
        // data.features.forEach(d => { d.count_total = populationById[d.country_code] });

        // svg.append('g')
        //   .attr('class', 'countries')
        //   .selectAll('path')
        //   .data(data.features)
        //   .enter().append('path')
        //   .attr('d', path)
        //   .style('fill', d => color(populationById[d.country_code]))
        //   .style('stroke', 'white')
        //   .style('opacity', 0.8)
        //   .style('stroke-width', 0.3);
        console.log(data)

        svg.append('path')
          .datum(topojson.feature(data, data.objects))
          .attr('class', 'names')
          .attr('d', path);
    }
});