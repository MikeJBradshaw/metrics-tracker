import { useEffect, useRef } from 'react'
import Highcharts from 'highcharts'
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official'
import Variwide from 'highcharts/modules/variwide'
import Heatmap from 'highcharts/modules/heatmap'
import Sankey from 'highcharts/modules/sankey'
import DependencyWheel from 'highcharts/modules/dependency-wheel'
import Exporting from 'highcharts/modules/exporting'
import OfflineExporting from 'highcharts/modules/offline-exporting'
import ExportData from 'highcharts/modules/export-data'
import Boost from 'highcharts/modules/boost'
import type { FunctionComponent } from 'react'
import type { Options, Chart as HChart } from 'highcharts'

// Applying required extra modules
Variwide(Highcharts)
Heatmap(Highcharts)
Sankey(Highcharts)
DependencyWheel(Highcharts)
Exporting(Highcharts)
OfflineExporting(Highcharts)
ExportData(Highcharts)
HighchartsMore(Highcharts)

// Enable boost but only for non-Mozilla browsers
if (!navigator.userAgent.toLowerCase().includes('firefox')) {
  Boost(Highcharts)
}

// set certain general options for the Highcharts graphs
Highcharts.setOptions({
  chart: { styledMode: true },
  /* plotOptions: { series: { animation: false } }, */
  // exporting: { libURL: process.env.PUBLIC_URL + '/static/js/', enabled: false },
  credits: { enabled: false }
})

// a shortcut to update a timezone
export const setTimezone = (timezoneOffset: number): void => Highcharts.setOptions({ time: { timezoneOffset } })

// our shared resize observer and corresponding data
const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    (entry.target as any)?.handleResize(entry)
  }
})
let nextId: number = 1
const targets: {[key: string]: Element} = {}

export interface ChartProps
  extends Omit<HighchartsReact.Props, 'options' | 'highcharts' | 'constructorType' | 'containerProps'> {
  config: Options
  update?: Options
};

const Chart: FunctionComponent<ChartProps> = ({ config, update, children, ...chartProps }) => {
  const wrapperRef = useRef(null)
  const firstRenderRef = useRef<boolean>(true)
  const chartRef = useRef<{chart: HChart, container: React.RefObject<HTMLDivElement>}>(null)

  useEffect(() => {
    // handle resize events
    const id: string = `${nextId++}`;

    (wrapperRef.current as any).handleResize = (entry: ResizeObserverEntry) => {
      if (targets[id] === undefined) {
        targets[id] = entry.target
        return
      }

      if (entry.contentRect.width) { // eslint-disable-line
        chartRef.current?.chart.reflow()
      }
    }

    // add the current component to observe
    resizeObserver.observe(wrapperRef.current as any)

    return () => {
      const target = targets[id]

      if (target !== undefined) {
        resizeObserver.unobserve(target)
        delete targets[id] // eslint-disable-line
      }
    }
  }, [])

  return (
    <div className='highcharts-wrapper' ref={wrapperRef}>
      <HighchartsReact
        {...chartProps}
        /* containerProps={{ style: { position: 'absolute', width: '100%', height: '100%' } }} */
        highcharts={Highcharts}
        ref={chartRef}
        options={firstRenderRef.current ? config : (update ?? {})}
        callback={(chart: HChart) => {
          // do an extra config update for the initial merge
          if (update !== undefined) {
            chart.update(update)
          }

          // mark first render complete
          firstRenderRef.current = false
        }}
      />
    </div>
  )
}

export default Chart
export type { Options, HChart as Chart }
