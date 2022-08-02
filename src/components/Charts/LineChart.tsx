import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import "./style.less"

export interface TokenData {
  datetime: Date;
  price: number;
  marketCapacity: number;
}

interface Margin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Dimensions {
  width: number;
  height: number;
  margin: Margin;
}

interface LineChartProps {
  data: TokenData[];
  dimensions: Dimensions;
  headers: string[];
}

const BOTTOM_OFFSET = 10;

const LineChart = ({ data, dimensions }: LineChartProps) => {

  const svgRef = useRef<SVGSVGElement>(null);

  const { width, height, margin } = dimensions;

  const svgWidth = width + margin.left + margin.right;
  const svgHeight = height + margin.top + margin.bottom;

  useEffect(() => {
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.datetime) as [Date, Date])
      .range([0, width - margin.left]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.price) ?? 0,
        d3.max(data, (d) => d.price) ?? 0
      ])
      .range([height, 0]);


    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();
    const svg = svgEl
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    // x axis
    svg.append('g')
      .call(d3.axisBottom(xScale))
      .attr("transform", `translate(0, ${height + margin.top + BOTTOM_OFFSET})`)
      .attr("color", "grey");

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(-width + margin.right)
      .tickFormat((val) => `${val}`);

    const yAxisGroup = svg.append("g").attr("transform", `translate(0, ${margin.top})`).call(yAxis);
    yAxisGroup.select(".domain").remove();
    yAxisGroup.selectAll("line").attr("stroke", "lightGrey");

    yAxisGroup
      .selectAll("text")
      .attr("opacity", 0.5)
      .attr("color", "black")
      .attr("font-size", "0.75rem");

    const line = d3
      .line<TokenData>()
      .x((d) => xScale(d.datetime))
      .y((d) => yScale(d.price));

    svg
      .append("path")
      .attr("transform", `translate(0, ${margin.top})`)
      .attr("stroke", "#57B1FE")
      .attr("stroke-width", 2)
      .attr("fill", 'none')
      .attr("d", line(data));

    const focus = svg.append("g")
      .attr("class", "price-chart-focus")
      .style("z-index", 10)
      .style("display", "none");

    focus.append("circle")
      .attr("r", 3);

    focus.append("rect")
      .attr("class", "price-chart-tooltip")
      .attr("width", 100)
      .attr("height", 50)
      .attr("x", 10)
      .attr("y", -22)
      .attr("rx", 4)
      .attr("ry", 4);

    focus.append("text")
      .attr("class", "price-chart-tooltip-date")
      .attr("x", 18)
      .attr("y", -2);

    focus.append("text")
      .attr("class", "price-chart-tooltip-price")
      .attr("x", 18)
      .attr("y", 18);

    const bisectDate = d3.bisector<TokenData, Date>((d) => { return d.datetime; }).left

    const mousemove = (event: MouseEvent) => {
      const x0 = xScale.invert(d3.pointer(event)[0]);
      const i = bisectDate(data, x0, 1)
      const d0 = data[i - 1]
      const d1 = data[i]
      const d = x0.getDate() - d0.datetime.getDate() > d1.datetime.getDate() - x0.getDate() ? d1 : d0;
      focus.attr("transform", `translate(${xScale(d.datetime)}, ${yScale(d.price) + BOTTOM_OFFSET})`);
      focus.select(".price-chart-tooltip-date").text(d.datetime.toLocaleString());
      focus.select(".price-chart-tooltip-price").text(d.price);
    }

    svg.append("rect")
      .attr("class", "price-chart-overlay")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", `translate(0, ${margin.top})`)
      .on("mouseover", function () { focus.style("display", null); })
      .on("mouseout", function () { focus.style("display", "none"); })
      .on("mousemove", mousemove);

  }, [data, dimensions]);

  return <svg id="price_chart" ref={svgRef} width={svgWidth} height={svgHeight} />;
};

export default LineChart;
