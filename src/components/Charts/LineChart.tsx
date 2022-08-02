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

const BOTTOM_OFFSET = 12;

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
      .style("opacity", "0");

    focus.append("circle")
      .attr("r", 3);

    const tooltipRect = focus.append("rect")
      .attr("class", "price-chart-tooltip")
      .attr("width", 'auto')
      .attr("height", 'auto')
      .attr("fill", "red")
      .attr("x", 10)
      .attr("y", -22)
      .attr("rx", 4)
      .attr("ry", 4);

    const dateText = focus.append("text")
      .attr("class", "price-chart-tooltip-date")
      .attr("dominant-baseline", "center")
      .attr("text-anchor", "center")
      .attr("x", 20)
      .attr("y", -2);

    const priceText = focus.append("text")
      .attr("class", "price-chart-tooltip-price")
      .attr("dominant-baseline", "center")
      .attr("x", 18)
      .attr("y", 18);

    const bisectDate = d3.bisector<TokenData, Date>((d) => { return d.datetime; }).left

    const mousemove = (event: MouseEvent) => {
      const x0 = xScale.invert(d3.pointer(event)[0]);
      const i = bisectDate(data, x0, 1)
      const d0 = data[i - 1]
      const d1 = data[i]
      const d = x0.getDate() - d0.datetime.getDate() > d1.datetime.getDate() - x0.getDate() ? d1 : d0;

      focus.select(".price-chart-tooltip-date").text(d.datetime.toLocaleString());
      focus.select(".price-chart-tooltip-price").text(d.price);

      const x = xScale(d.datetime);
      const y = yScale(d.price) + BOTTOM_OFFSET;

      const dateTextBox = dateText.node()?.getBBox();
      const priceTextWidth = priceText.node()?.getBBox().width ?? 0;

      const tooltipWidth = (dateTextBox?.width ?? 0) + 20

      console.log(x, y, focus.node()?.getBBox().width);

      focus.attr("transform", `translate(${x}, ${y})`);
      tooltipRect.attr("width", tooltipWidth).attr("height", 46);

      priceText.attr("x", (tooltipWidth - priceTextWidth + 20) / 2)
    }

    svg.append("rect")
      .attr("class", "price-chart-overlay")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", `translate(0, ${margin.top})`)
      .on("mouseover", () => {
        focus.transition()
          .duration(250)
          .style('opacity', 1);
      })
      .on("mouseout", () => {
        focus.transition()
          .duration(250)
          .style('opacity', 0);
      })
      .on("mousemove", mousemove);

  }, [data, dimensions]);

  return <svg id="price_chart" ref={svgRef} width={svgWidth} height={svgHeight} />;
};

export default LineChart;
