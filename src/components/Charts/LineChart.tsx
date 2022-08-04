import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { roundPrice } from '../../utils/NumberUtils';
import { sessionState } from '../../recoil/atom';

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
}

const BOTTOM_OFFSET = 12;
const TOOLTIP_RECT_Y = -56;

const LineChart = ({ data, dimensions }: LineChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const [t] = useTranslation();

  const { width, height, margin } = dimensions;
  const session = useRecoilValue(sessionState);

  const svgWidth = width + margin.left + margin.right;
  const svgHeight = height + margin.top + margin.bottom;

  useEffect(() => {
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.datetime) as [Date, Date])
      .range([0, width - margin.left]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(data, d => d.price) ?? 0, d3.max(data, d => d.price) ?? 0])
      .range([height, 0]);

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll('*').remove();
    const svg = svgEl
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', width)
      .attr('height', height);

    svg
      .append('g')
      .call(d3.axisBottom(xScale))
      .attr('transform', `translate(0, ${height + margin.top + BOTTOM_OFFSET})`)
      .attr('color', 'grey');

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(-width + margin.right)
      .tickFormat(val => `${val}`);

    const yAxisGroup = svg
      .append('g')
      .attr('transform', `translate(0, ${margin.top})`)
      .call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('line').attr('stroke', 'lightGrey');

    yAxisGroup
      .selectAll('text')
      .attr('opacity', 0.5)
      .attr('color', 'black')
      .attr('font-size', '0.75rem');

    const line = d3
      .line<TokenData>()
      .x(d => xScale(d.datetime))
      .y(d => yScale(d.price));

    svg
      .append('path')
      .attr('transform', `translate(0, ${margin.top})`)
      .attr('stroke', '#57B1FE')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('d', line(data));

    const focus = svg
      .append('g')
      .style('font-size', '0.8rem')
      .style('opacity', '0');

    focus
      .append('circle')
      .style('fill', 'steelblue')
      .attr('r', 3);

    const tooltipRect = focus
      .append('rect')
      .attr('width', 'auto')
      .attr('height', 46)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('filter', 'drop-shadow(1px 1px 1px rgba(0, 0, 0, .3))')
      .style('fill', '#F5F7F9');

    const dateText = focus.append('text').style('font-weight', 400);

    const priceText = focus.append('text');

    const bisectDate = d3.bisector<TokenData, Date>(d => {
      return d.datetime;
    }).left;

    const mousemove = (event: MouseEvent) => {
      if (data.length < 1) {
        return;
      }

      const x0 = xScale.invert(d3.pointer(event)[0]);
      const i = bisectDate(data, x0, 1);

      const d0 = data[i - 1];
      const d1 = data[i];
      let d: TokenData;
      if (i === data.length) {
        d = d0;
      } else {
        d = x0.getDate() - d0.datetime.getDate() > d1.datetime.getDate() - x0.getDate() ? d1 : d0;
      }

      dateText.text(d.datetime.toLocaleString());
      priceText.text(`${t('general.price')} (${session.currency}) ${roundPrice(d.price)}`);

      const x = xScale(d.datetime);
      const y = yScale(d.price) + BOTTOM_OFFSET;

      const dateTextWidth = dateText.node()?.getBBox().width ?? 0;
      const priceTextWidth = priceText.node()?.getBBox().width ?? 0;

      const tooltipWidth = Math.max(dateTextWidth, priceTextWidth) + 20;
      focus.attr('transform', `translate(${x}, ${y})`);
      tooltipRect.attr('width', tooltipWidth);

      // prevent tooltip x-axis overflow
      const offsetRatio = (tooltipWidth - 60) / width;
      const offset = (x - width / 2) * offsetRatio;
      tooltipRect.attr('x', -tooltipWidth / 2 - offset);
      dateText.attr('x', -(dateTextWidth / 2) - offset);
      priceText.attr('x', -(priceTextWidth / 2) - offset);

      // prevent top overflow
      if (y < 80) {
        tooltipRect.attr('y', 20);
        dateText.attr('y', 40);
        priceText.attr('y', 58);
      } else {
        tooltipRect.attr('y', TOOLTIP_RECT_Y);
        dateText.attr('y', TOOLTIP_RECT_Y + 20);
        priceText.attr('y', TOOLTIP_RECT_Y + 38);
      }
    };

    svg
      .append('rect')
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('transform', `translate(0, 0)`)
      .on('mouseover', () => {
        if (data.length < 1) {
          return;
        }

        focus
          .transition()
          .duration(250)
          .style('opacity', 1);
      })
      .on('mouseout', () => {
        focus
          .transition()
          .duration(250)
          .style('opacity', 0);
      })
      .on('mousemove', mousemove);
  }, [data, dimensions]);

  return <svg id="price_chart" ref={svgRef} width={svgWidth} height={svgHeight} />;
};

export default LineChart;
