/* define svg container */
var margin = {top: 100, right: 100, bottom: 30, left: 40};
var width = document.body.clientWidth - margin.left - margin.right; // adjust to user's window size
var height = 500 - margin.top - margin.bottom;

var container = d3.select('body')
                  .append('svg')
                  .attr('width', width + margin.left + margin.right)
                  .attr('height', height + margin.top + margin.bottom);

var svg = container.append('g') // group
                    .attr('class', 'content')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


/* read two data from cvs files */
var data1 = [], data2 = [], remaining = 2;
var timeset = [];
var dataset = []; // dataset[0] = data1,  dataset[1] = data2, 

d3.csv("data/power.csv", function(error, csvdata) {
    if (error) {
        console.log(error);
    }
    // data1 = csvdata;
    dataset.push(csvdata);
    csvdata.forEach(function(d) {
      timeset.push(+d.timestamp);
      data1.push(+d.power);
    });

    if (!--remaining) createLines();
});

d3.csv("data/impedance.csv", function(error, csvdata) {
    if (error) {
        console.log(error);
    }
    data2 = csvdata;
    dataset.push(csvdata);
    if (!--remaining) createLines();
});

function createLines() {
    // console.log(data1);
    // console.log(data2);
    // var dataset = [];
    // getData();


    /* define axis */
    var xScale = d3.scale.linear()
                    .domain([d3.min(timeset), d3.max(timeset)])
                    .range([0, width]);

    var yScale = d3.scale.linear()
                    .domain([0, d3.max(data1)])
                    .range([height, 0]);

    var xAxis = d3.svg.axis()
                      .scale(xScale)
                      .orient("bottom")
                      .ticks(5);


    var yAxis = d3.svg.axis()
                      .scale(yScale)
                      .orient("left")
                      .ticks(30);

    /* define difference tip: call d3.tip api */
    var twoPointInfo = []; // max length should be 2
    var differenceTip = d3.tip(twoPointInfo)
                          .attr('class', 'differenceTip')
                          .offset([-10, 0])
                          .html(function(d) {
                            var output = "<strong>Point1 Power:</strong> <span style='color:white'>" + d[0].power + "</span> </br>"
                                          + "<strong>Point2 Power:</strong> <span style='color:white'>" + d[1].power + "</span> </br>"
                                          + "<strong>Difference:</strong> <span style='color:red'>" + Math.abs(d[1].power - d[0].power)+ "</span>";
                            return output;
                          });

    /* draw axis: add axis into svg */
    // x axis
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis) // equals: xAxis(svg.append('g'))
        // add instruction of x axis
        .append('text') 
        .text('Timestamp')
        .attr('transform', 'translate(' + width + ', 0)');

    // y axis
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .text('Power');

    /* draw data line */
    var line = d3.svg.line()
                      .x(function(d) {return xScale(+d.timestamp); })
                      .y(function(d) {return yScale(+d.power); })
                      .interpolate('monotone');

    var path = svg.append('path')
                   .attr('class', 'line')
                   .attr('d', line(dataset[0]));

    // var choosePath = svg.select('.line')
    //                  .on('mouseover', function() {console.log("yes"); });


    /* add points */
    var g = svg.selectAll('circle') // reserve several <circle> position 
                .data(dataset[0])
                .enter()
                // once dataset[0] is coming, we add each circle into every g
                .append('g') 
                .append('circle') 
                .attr('class', 'linecircle')
                .attr('cx', line.x()) // (x, y) centre coordinate of circle
                .attr('cy', line.y())
                .attr('r', 1.5) // radius
                .on('mouseover', function(d) { 
                  // important! remove all disabled infoTips before showInfoTip
                    removeInfoTip(); 
                    showInfoTip(d);
                    d3.select(this).transition().attr('r', 5);
                })
                .on('mouseout', function() {
                    d3.select(this).transition().attr('r', 1.5);
                    removeInfoTip();
                })
                .on('click', function(d) {
                    d3.select(this).transition().attr('r', 10)
                                    .attr('id', 'twoPointInfo');
                    d3.select(this).on('mouseover', null); // disable 'mouseout' event listener
                    d3.select(this).on('mouseout', null); // disable 'mouseout' event listener
                    showDifferenceTip(d);
                });

    /* 
      show Difference tip: show difference between two points
    */
    function showDifferenceTip(d) {

      if (twoPointInfo.length < 1) { 
        twoPointInfo.push(d); 
      }
      else if (twoPointInfo.length == 1) { // calculate difference
        twoPointInfo.push(d); 
        removeInfoTip();

        /* draw difference line & tip */
        var differenceLine = d3.svg.line()
                                  .x(function(d) {return xScale(+d.timestamp); })
                                  .y(function(d) {return yScale(+d.power); })
                                  .interpolate('monotone');

        var differencePath = svg.append('path')
                       .attr('class', 'differenceLine')
                       .attr('id', 'differenceLine')
                       .attr('d', line(twoPointInfo));

        // pop-up difference tip
        svg.call(differenceTip);
        differenceTip.show(twoPointInfo);
        

      }
      else if (twoPointInfo.length >= 2) { 
        /* reset previous actions */
        d3.select('#differenceLine').remove();
        differenceTip.hide();
        d3.selectAll('#twoPointInfo')
          .transition()
          .attr('r', '1.5');

        twoPointInfo = [];
        twoPointInfo.push(d);
      }
    }  


    /* 
      Show infoTips: show exact value of a particular data point 
    */
    function showInfoTip(d) {
      // define infoTip
      var infoTip = svg.append('g')
                    .attr('class', 'infoTip');

      infoTip.append('rect') // add rect
          .attr('class', 'infoTip-border')
          .attr('width', 200)
          .attr('height', 50)
          .attr('rx', 10) // equals border-radius
          .attr('ry', 10);

      var wording1 = infoTip.append('text')
                          .attr('class', 'infoTip-text')
                          .attr('x', 10)
                          .attr('y', 20)
                          .text('Timestamp: ' + d.timestamp);

      var wording2 = infoTip.append('text')
                          .attr('class', 'infoTip-text')
                          .attr('x', 10)
                          .attr('y', 40)
                          .text('Power: ' + d.power);

      var x1 = xScale(+d.timestamp),
          y1 = yScale(+d.power);

      // change direction of infoTip if out of bound
      var dx = x1 > width ? x1 - width + 200 : x1 + 200 > width ? 200 : 0;
      var dy = y1 > height ? y1 - height + 50 : y1 + 50 > height ? 50 : 0;

      x1 -= dx;
      y1 -= dy;

      d3.select('.infoTip') 
        .style('display', 'block')
        .attr('transform', 'translate(' + x1 + ',' + y1 + ')'); // translate rec by (x1, y1)
    }


    function removeInfoTip() {
      d3.select('.infoTip')
        .style('display', 'none')
        .remove();
    }
   

    var range_x = [];
    slider();

    /*
      using jQuery to set up slider
    */
    function slider() {
      // set up slider 
      $("#slider-range-x").width(width);
      $("#slider-range-x").css('margin-left', margin.left + 'px');

      // slider function
      $( "#slider-range-x" ).slider({
        range: true,
        min: d3.min(timeset),
        max: d3.max(timeset),
        values: [ d3.min(timeset), d3.max(timeset)],
        slide: function( event, ui ) {
          $( "#amount" ).val( "$" + ui.values[0] + " - $" + ui.values[1] );
          var x_index_min = parseInt(xScale(ui.values[0]));
          var x_index_max = parseInt(xScale(ui.values[1]));
          console.log("x_index_min " + x_index_min);
          console.log("x_index_max " + x_index_max);
          var newTimeset = timeset.slice(x_index_min, x_index_max+1);
          console.log("length " + newTimeset.length);

        }
      });

      $( "#amount" ).val( "$" + $( "#slider-range-x" ).slider( "values", 0 ) +
        " - $" + $( "#slider-range-x" ).slider( "values", 1 ) );

    };
}