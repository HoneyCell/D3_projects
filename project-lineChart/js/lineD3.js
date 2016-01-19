/*
  Define 
*/
/* define svg container */
var margin = {top: 50, right: 100, bottom: 30, left: 40};
var width = document.body.clientWidth - margin.left - margin.right; // adjust to user's window size
var height = 500 - margin.top - margin.bottom;

var container = d3.select('body')
                  .append('svg')
                  .attr('width', width + margin.left + margin.right)
                  .attr('height', height + margin.top + margin.bottom);

var svg = container.append('g') // group
                    .attr('class', 'content')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

/* define scale */
var xScale = d3.time.scale()
                .range([0, width]);

var yScale = d3.scale.linear()
                .range([height, 0]);

// define axis
var xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient("bottom")
                  .ticks(10)
                  .tickFormat(d3.time.format('%I:%M:%S'));


var yAxis = d3.svg.axis()
                  .scale(yScale)
                  .orient("left")
                  .ticks(30);

/* define difference tip: call d3.tip api */
var twoPointInfo = []; // max length should be 2
var differenceTip = d3.tip(twoPointInfo)
                      .attr('class', 'differenceTip')
                      .offset([-10, 0]);

// define line
var line = d3.svg.line()
                  .x(function(d) {return xScale(+d.timestamp); })
                  .y(function(d) {return yScale(+d.value); })
                  .interpolate('monotone');



/* Define data attributes*/
/* read two data from cvs files */
var remaining = 2;
var timeset = [];
var dataset = []; // dataset[0] = data1,  dataset[1] = data2, 
var lineName = ['Power', 'Impedance'];
var lineColor = ['darkblue', 'red'];
readData();

/*
  Read Data
*/
function readData() {

  d3.csv("data/power.csv", function(error, csvdata) {
      if (error) {
          console.log(error);
      }

      var data1 = []
      csvdata.forEach(function(d, i) {
        var myDate = new Date(+d.timestamp);
        // console.log(myDate);

        timeset.push(myDate);
        data1.push({timestamp: myDate, value: +d.power})

        // timeset.push(+d.timestamp);
        // data1.push({timestamp: +d.timestamp, value: +d.power})
      });
      dataset.push(data1);

      if (!--remaining) createCharts();
  });

  d3.csv("data/impedance.csv", function(error, csvdata) {
      if (error) {
          console.log(error);
      }

      var data2 = [];
      csvdata.forEach(function(d) {
        var myDate = new Date(+d.timestamp);
        data2.push({timestamp: myDate, value: +d.impedance})
        // data2.push({timestamp: +d.timestamp, value: +d.impedance})
      });
      dataset.push(data2);

      if (!--remaining) createCharts();
  });

}


/*
  Draw 
*/
function createCharts() {

    drawAdditionalInfo();

    // refind axis
    xScale.domain([d3.min(timeset), d3.max(timeset)])
    yScale.domain([0, getMaxY(dataset)]);

    drawMainAxis();

    for (var i = 0; i < dataset.length; i++) {
      drawLineAndPoints(i);
    }
    
    drawNavChart();
}


/*
  draw legend
*/
function drawAdditionalInfo() {
  svg.append('g')
      .selectAll('text')
      .data(lineName)
      .enter()
      .append('text')
      .text(function(d){ return d; })
      .attr('x', function(d,i){ return width/2 + i*width/5;})
      .attr('y', 8)
      .attr('fill', function(d,i){ return lineColor[i]; });

  svg.append('g')
      .selectAll('rect')
      .data(lineName)
      .enter()
      .append('rect')
      .attr("width",12)
      .attr("height",12)
      .attr('x', function(d, i) { return width/2 + i*width/5 - 20;}) 
      .attr('y', 0)
      .attr('fill', function(d,i){ return lineColor[i]; });  
}



/*
  return the max Y value for yScale
*/
function getMaxY(dataset) {
  var max = 0;
  for (var i = 0; i < dataset.length; i++) {
    var temp = d3.max(dataset[i], function(d) { return +d.value });
    max = temp > max ? temp : max;
  }
  return max;
}

/* 
  draw axis: add axis into svg 
*/
function drawMainAxis() {

  // x axis
  svg.append('g')
      .attr('id', 'x_axis')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis) // equals: xAxis(svg.append('g'))
      // add instruction of x axis
      .append('text') 
      .text('Time: H:M:S')
      .attr('transform', 'translate(' + width + ', 0)');

  // y axis
  svg.append('g')
      .attr('id', 'y_axis')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .text('Power/Impedance');
}


/* 
  add points 
*/
function drawLineAndPoints(index) {

  // define main chart
  var mainChart = svg.append('g')
                      .attr('id', 'mainChart')
                      // using clip-path to make sure that 
                      // line will not grow beyond chart x-axis when using brush
                      .attr('clip-path', 'url(#plotAreaClip)') ;

  mainChart.append('clipPath')
            .attr('id', 'plotAreaClip') // related to 'clip-path' by id
            .append('rect')
            .attr({ width: width, height: height });


  // draw data line
  var path = mainChart.append('path')
                .attr('id', 'line'+index)
                .attr('class', 'line'+index)
                .datum(dataset[index])
                .attr('d', line); // or .attr('d', line(dataset[0]))


  var points = mainChart.selectAll('circle') // reserve several <circle> position 
              .data(dataset[index])
              .enter()
              // once dataset[0] is coming, we add each circle into every g
              .append('g') 
              .attr('id', 'g_circle')
              .append('circle') 
              .attr('class', 'linecircle'+index)
              .attr('cx', line.x()) // (x, y) centre coordinate of circle
              .attr('cy', line.y())
              .attr('r', 1.5) // radius
              .on('mouseover', function(d) { 
                  // important! remove all disabled infoTips before showInfoTip
                  removeInfoTip(); 
                  showInfoTip(d, index);
                  d3.select(this).transition().attr('r', 5);
              })
              .on('mouseout', function() {
                  d3.select(this).transition().attr('r', 1.5);
                  removeInfoTip();
              })
              .on('click', function(d) {
                  d3.select(this).transition().attr('r', 10)
                                  .attr('id', 'twoPointInfo');
                  // console.log("click: " + d3.select(this).attr('id'));
                  d3.select(this).on('mouseover', null); // disable 'mouseout' event listener
                  d3.select(this).on('mouseout', null); // disable 'mouseout' event listener
                  showDifferenceTip(d, index);
              });
}




/* 
  Show infoTips: show exact value of a particular data point 
*/
function showInfoTip(d, index) {

  // define infoTip
  var infoTip = svg.append('g')
                .attr('class', 'infoTip');

  infoTip.append('rect') // add rect
      .attr('class', 'infoTip-border')
      .attr('width', 220)
      .attr('height', 50)
      .attr('rx', 10) // equals border-radius
      .attr('ry', 10);

  var wording1 = infoTip.append('text')
                      .attr('class', 'infoTip-text')
                      .attr('x', 10)
                      .attr('y', 20);
                      

  var wording2 = infoTip.append('text')
                      .attr('class', 'infoTip-text')
                      .attr('x', 10)
                      .attr('y', 40);

  var format = d3.time.format("%Y-%m-%d %H:%M:%L");
  wording1.text('Time: ' + format(d.timestamp));
  wording2.text(lineName[index] + ': ' + d.value);

  var x1 = xScale(+d.timestamp),
      y1 = yScale(+d.value);

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



/* 
  show Difference tip: show difference between two points
*/
function showDifferenceTip(d, index) {

  if (twoPointInfo.length < 1) { 
    twoPointInfo.push({index: index, timestamp: d.timestamp, value: d.value}); 
  
  }
  else if (twoPointInfo.length == 1) { // calculate difference
    twoPointInfo.push({index: index, timestamp: d.timestamp, value: d.value}); 

    // error case
    if (twoPointInfo[1].index != twoPointInfo[0].index) {
      
      removeInfoTip();
      alert("ATTENTION: You have to choose two points on same line!");
      d3.selectAll('circle').transition().attr('r', '1.5');
      twoPointInfo = [];

    }
    else { 

      removeInfoTip();

      /* draw difference line & tip */
      var differenceLine = d3.svg.line()
                                .x(function(d) {return xScale(+d.timestamp); })
                                .y(function(d) {return yScale(+d.value); })
                                .interpolate('monotone');

      var differencePath = svg.append('path')
                     .attr('class', 'differenceLine')
                     .attr('id', 'differenceLine')
                     .attr('d', differenceLine(twoPointInfo));


      differenceTip.html(function(d) {
        var output = "<strong>Point1 " + lineName[index] + ":</strong> <span style='color:white'>" + d[0].value + "</span> </br>"
                      + "<strong>Point2 " + lineName[index] + ":</strong> <span style='color:white'>" + d[1].value + "</span> </br>"
                      + "<strong>Difference:</strong> <span style='color:red'>" + Math.abs(d[1].value - d[0].value)+ "</span>";
        return output;
      });

      // pop-up difference tip
      svg.call(differenceTip);
      differenceTip.show(twoPointInfo);
    }
    
  }
  else if (twoPointInfo.length >= 2) { 
    // reset previous actions 
    twoPointInfo = [];
    d3.select('#differenceLine').remove();
    differenceTip.hide();
    d3.selectAll('#twoPointInfo').transition().attr('r', '1.5');

    twoPointInfo.push({index: index, timestamp: d.timestamp, value: d.value}); 
  }
}  



/*
  Navigation chart
*/
function drawNavChart() {
  // define nav 
  var navMargin = {top: 20, right: 100, bottom: 80, left: 40};

  var navWidth = width,
      navHeight = 150 - navMargin.top - navMargin.bottom;

  // add nav
  var navChart = d3.select('#navChart')
                    .append('svg')
                    .classed('navigator', true)
                    .attr('width', navWidth + margin.left + margin.right)
                    .attr('height', navHeight + navMargin.top + navMargin.bottom)
                    .append('g')
                    .attr('transform', 'translate(' + navMargin.left + ',' + navMargin.top + ')');

  var navXScale = d3.time.scale()
                    .domain([d3.min(timeset), d3.max(timeset)])
                    .range([0, navWidth]),
      navYScale = d3.scale.linear()
                    .domain([0, getMaxY(dataset)])
                    .range([navHeight, 0]);

  var navXAxis = d3.svg.axis()
                      .scale(navXScale)
                      .orient('bottom')
                      .ticks(8);

  navChart.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + navHeight + ')')
          .call(navXAxis)
          .append('text')
          .text('Time: :S')
          .attr('transform', 'translate(' + navWidth + ', 0)');

  // draw nav legend
  navChart.append('text') 
      .attr('transform', 'translate(' + navWidth/2 + ',' + navHeight*2 + ')')
      .text('Navigator')
      .attr('fill', 'red');


  // add data
  var navData = d3.svg.area()
                  .x(function (d) { return navXScale(+d.timestamp); })
                  .y0(navHeight)
                  .y1(function (d) { return navYScale(+d.value); });

  var navLine = d3.svg.line()
                  .x(function (d) { return navXScale(+d.timestamp); })
                  .y(function (d) { return navYScale(+d.value); })
                  .interpolate('monotone');


  for (var i = 0; i < dataset.length; i++) {
    navChart.append('path')
            .attr('class', 'area')
            .attr('d', navData(dataset[i]));

    navChart.append('path')
            .attr('class', 'line' + i)
            .attr('d', navLine(dataset[i]));
  }


  // Viewport on navigation chart
  var viewport = d3.svg.brush()
                        .x(navXScale)
                        .on("brush", function () {
                            xScale.domain(viewport.empty() ? navXScale.domain() : viewport.extent());
                            redrawChart();
                        });
  navChart.append("g")
          .attr("class", "viewport")
          .call(viewport)
          .selectAll("rect")
          .attr("height", navHeight);

}


/*
  remove everything and redraw
*/
function redrawChart() {
    // remove everything 
    d3.select('#differenceLine').remove();
    removeInfoTip();
    differenceTip.hide();

    // remove axis
    d3.selectAll('#x_axis').remove();
    d3.selectAll('#y_axis').remove();
    drawMainAxis();

    // remove data line & points
    d3.selectAll('#mainChart').remove();
    // d3.selectAll('#line').remove();
    // svg.selectAll('#g_circle').remove();
    for (var i = 0; i < dataset.length; i++) {
      drawLineAndPoints(i);
    }
    
}





    

