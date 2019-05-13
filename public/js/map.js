$(function() {
    var width = 960,
        height = 500;

    var projection = d3.geoAlbersUsa();
    var path = d3.geoPath()
        .projection(projection);

    var svg = d3.select("#d3-map").append("svg")
        .attr("width", width)
        .attr("height", height);


    // load up the json files, and when we're done, call ready
    d3.queue()
        .defer(d3_request.json, "states.json")
        .defer(d3_request.json, "us-state-centroids.json")
        .await(ready);

    // keep these around for later
    var us, centroid;

    function ready(error, u, c) {
        var tooltip = d3.select("#d3-map").append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden");

        // store the values so we can use them later
        var states = u;
        centroid = c;

        // draw the states
        svg.append("path")
            .attr("class", "states")
            .datum(topojson.feature(states, states.objects.usStates))
            .attr("d", path);


        // draw the symbols on top
        svg.selectAll(".symbol")
            .data(centroid.features.sort(function(a, b) {
                return b.properties.population - a.properties.population;
            }))
            .enter().append("path")
            .attr("class", "symbol")
            .attr("fill", "green")
            .attr("d", path.pointRadius(function(d) {
                return 10
            }))
            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);

                tooltip.html(`${ d.properties.name }: ${ d.properties.population }`)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0.9);
            });
    };

    function recolor(color) {

        // grab the symbol objects and modify their color
        // notice we don't need "enter" or "append" the objects are already there
        svg.selectAll(".symbol")
            .attr("fill", color);
    };
});