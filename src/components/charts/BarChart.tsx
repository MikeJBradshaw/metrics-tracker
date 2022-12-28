import { FunctionComponent } from 'react';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'


interface BarChartOwnProps {
  data: any
}

const BarChart: FunctionComponent<BarChartOwnProps> = ({ data }) => {
  const common = {
    chart: {type: 'bar'},
    accessibility: {enabled: false},
  }
  const options = {...data, ...common}

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} />
      {/* <Chart config={options as any} /> */}
    </div>
  )
}

export default BarChart
