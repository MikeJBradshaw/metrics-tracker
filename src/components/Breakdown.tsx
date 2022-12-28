import { Box, Card, CardBody } from 'grommet'
import type { FunctionComponent } from 'react'
import type { BreakdownBarChart, Story } from '../actions/app'
import Chart from '../utils/Chart'
import Stories from './Stories'
import FilterMenu from './FilterMenu'


const featureBar = {
  chart: {type: 'column'},
  accessibility: {enabled: false},
  title: {text: ''},
  yAxis: {min: 0, labels: {overflow: 'justify'}},
  plotOptions: {bar: {dataLabels: {enabled: true}}},
  series: [{name: 'Cards'}],
} as any

const shadowBar = {
  chart: {type: 'column'},
  title: {text: 'Filtered Stories By Timeframe'},
  plotOptions: {series: {grouping: false, borderWidth: 0}},
  legend: {enabled: false},
  tooltip: {shared: true},
  xAxis: {
    type: 'category',
    accessibility: {enabled: false},
    labels: {
      useHTML: true,
      animate: true,
      style: {textAlign: 'center'}
    }
  },
  yAxis: [{title: {text: 'Stories'}, showFirstLabel: false}],
  series: [{name: 'Total', pointPlacement: -0.2, data: [[]]}, {name: 'Filtered', data: [[]]}]
} as any

interface BreakdownOwnProps {
  title: string
  section: string
  data: {
    barChart: BreakdownBarChart
    filteredStories: Story[]
    stories: Story[]
    showBarChart: boolean
    shadowBarChart: any
    selectedLabels: string[]
  }
}

const Breakdown: FunctionComponent<BreakdownOwnProps> = ({ title, data, section }) => {
  featureBar.title.text = `Total Completed ${title} Cards By Week`
  shadowBar.title.text = `Total Completed ${title} Cards By Week`

  return (
    <Box direction="row" className={`chart-box-tabs`}>
      <Card className="dashboard-card">
        <CardBody className="dashboard-card-body">
          <FilterMenu section={section} />
          {data.showBarChart && <Chart config={featureBar} update={data.barChart as any} />}
          {!data.showBarChart && <Chart config={shadowBar} update={data.shadowBarChart as any} />}
        </CardBody>
      </Card>
      <Card className="dashboard-card">
        <CardBody>
          <Stories stories={data.showBarChart ? data.stories : data.filteredStories} />
        </CardBody>
      </Card>
    </Box>
  )
}

export default Breakdown
