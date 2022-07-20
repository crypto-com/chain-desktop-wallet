import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

// import _ from "lodash";

interface LineChartProps {
    data: Array<React.ReactNode>;
    dimensions: object;
    headers: Array<React.ReactNode>;

}

const LineChart: React.FC<LineChartProps> = props => {

    const { data, dimensions, headers} = props;
    const svgRef = useRef(null);
    let { width } = dimensions;
    const {height, margin } = dimensions;
    const { header01, header02 } = headers;

    if(width === "100%"){
        width = svgRef?.current ? svgRef?.current?.offsetWidth : 0;
    }

    const svgWidth = width - margin - margin;
    const svgHeight = height - margin - margin;
    // const formatValue = d3.format(",.2~s");



    useEffect(() => {

        const xScale = d3.scalePoint()
        .domain((data.map((d) => d[header01] )))
        .range([0, svgWidth]);

        const yScale = d3.scaleLinear()
        .domain([
        d3.min(data, (d) => d[header02]) - 50,
        d3.max(data, (d) => d[header02]) + 50
        ])
        .range([svgHeight, 0]);


        // Create root container where we will append all other chart elements
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove(); // Clear svg content before adding new elements 

        const svg = svgEl
        .attr("id","curchart")
        .append("g")
        .attr('class','mainPart')
        .attr("transform", `translate(${margin},0)`);

        // Add X grid lines with labels
        const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickSize(-svgHeight + margin.bottom);

        const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0, ${svgHeight - margin})`)
        .call(xAxis);
        xAxisGroup.select(".domain").remove();
        xAxisGroup.selectAll("line").attr("stroke", "rgba(255, 255, 255, 0.2)");
        xAxisGroup.selectAll("text")
        .attr("opacity", 0.5)
        .attr("color", "white")
        .attr("font-size", "0.75rem");


        // Add Y grid lines with labels
        const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-width)
        .tickFormat((val) => `${val}%`);


        const yAxisGroup = svg.append("g").call(yAxis);

        yAxisGroup.select(".domain").remove();

        yAxisGroup.selectAll("line").attr("stroke", "rgba(255, 255, 255, 0.2)");

        yAxisGroup.selectAll("text")
        .attr("opacity", 0.5)
        .attr("color", "white")
        .attr("font-size", "0.75rem");

        // Draw the lines
        const line = d3.line()
        .x((d) => xScale(d[header01]))
        .y((d) => yScale(d[header02]));

        svg
        .selectAll(".line")
        .data(data)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "rgba(200,200,200,1)")
        .attr("stroke-width", 3)
        .attr("d", (d) => line(d));

    }, [data]);

    return <svg ref={svgRef} width={svgWidth} height={svgHeight} />;
};

export default LineChart;