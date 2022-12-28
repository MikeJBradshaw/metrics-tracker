import { useState } from 'react';
import { connect } from 'react-redux';
import { Box, Card, CardBody, Notification, Spinner, Tabs, Tab, Text } from 'grommet';
import type { FunctionComponent } from 'react'
import type { ConnectedProps } from 'react-redux'
import type { RootState } from '../store'
import Chart from '../utils/Chart'
import Breakdown from './Breakdown'
import Stories from './Stories'

const allStories = {
  chart: {type: 'bar'},
  accessibility: {enabled: false},
  series: [{name: '# of Cards'}],
  legend: {enabled: false},
  title: {text: 'Total Cards For Time Period'},
  xAxis: {type: 'category', categories: ['Features', 'Bugs', 'Tech Debt']},
  yAxis: {title: {text: 'Card Count'}},
  plotOptions: {
    series: {dataLabels: {enabled: true}}
  }
} as any

const weeklySumBar = {
  chart: {type: 'column'},
  accessibility: {enabled: false},
  title: {text: 'Total Completed Feature Cards By Week'},
  subtitle: {text: 'Unclassified'},
  yAxis: {min: 0, labels: {overflow: 'justify'}},
  plotOptions: {bar: {dataLabels: {enabled: true}}},
  series: [{name: 'Cards'}],
} as any

const weeklyOptions = {
  chart: {type: 'column'},
  accessibility: {enabled: false},
  series: [{name: 'Features'}, {name: 'Bugs'}, {name: 'Tech Debt'}],
  title: {text: 'Total Completed Card by Time Period'},
  yAxis: {title: {text: 'Stories Completed'}},
  xAxis: {type: 'category'},
  legend: {layout: 'vertical', align: 'right', verticalAlign: 'middle'},
} as any

const timeStatsOptions = {
  chart: {type: 'boxplot'},
  accessibility: {enabled: false},
  title: {text: 'Story Lifetime'},
  legend: {enabled: false},
  xAxis: {categories: ['Features', 'Bugs', 'Tech Debt'], title: {text: 'Story Type'}},
  yAxis: {title: {text: 'Lifetime Distribution (Days)'}},
  plotOptions: {boxplot: {boxDashStyle: 'Dash', fillColor: '#F0F0E0', lineWidth: 2, medianColor: '#0C5DA5', medianDashStyle: 'ShortDot', medianWidth: 3, stemColor: '#A63400', stemDashStyle: 'dot', stemWidth: 1, whiskerColor: '#3D9200', whiskerLength: '20%', whiskerWidth: 3}},
  series: [{data: [[], [], []]}]
} as any

const connector = connect(
  ({ app: { error, loading, dashboardData }}: RootState) => ({ error, loading, dashboardData }),
)

const Metrics: FunctionComponent<ConnectedProps<typeof connector>> = ({ error, loading, dashboardData}) => {
  const [index, setIndex] = useState<number>(0)

  if (loading) {
    return (
      <Box width="100%" height={{ min: '1000px' }} justify="center" align="center">
        <Spinner size="large" />
      </Box>
    )
  }

  if (error) {
    return (
      <Notification
        toast
        title="Error"
        message={error.message} />
      )
  }

  if (!dashboardData?.stories.length) {
    return (
      <Box width="100%" height={{ min: '1000px' }} justify="center" align="center">
        <Text size="50px" color="#BDBDBD">No Data To Display</Text>
      </Box>
    )
  }

  return (
    <Box className="metrics" direction="column">
      <Box direction="row" className="stats-box">
        <Card className="dashboard-card">
          <CardBody>
            <Box align="center" gap="medium">
              <Text className="card-title no-stats">Total Stories</Text>
              <Text className="card-data">{dashboardData.stories.length}</Text>
            </Box>
          </CardBody>
        </Card>
        {
          dashboardData.stats.map(({name, percent, total}, i) => (
          <Card key={i} className="dashboard-card">
            <CardBody>
              <Box pad="small" align="center" gap="medium">
                <Text className="card-title">{name} Stories</Text>
                <Text className="card-data">{total}</Text>
                <Text className="card-stats">{percent}% of total stories</Text>
              </Box>
            </CardBody>
          </Card>
          ))
        }
      </Box>
      <Box direction="row" className="chart-box">
        <Card className="dashboard-card">
          <CardBody>
            <Chart config={allStories} update={dashboardData.allStoriesChart as any} />
          </CardBody>
        </Card>
        <Card className="dashboard-card">
          <CardBody>
            <Chart config={weeklyOptions} update={dashboardData.weeklyStoriesChart as any } />
          </CardBody>
        </Card>
        <Card className="dashboard-card">
          <CardBody>
            <Chart config={timeStatsOptions} update={dashboardData.timeStats as any} />
          </CardBody>
        </Card>
      </Box>
      <Box>
        <Box className="actually-working-tabs" direction="row" >
          <Tabs activeIndex={index} onActive={setIndex} >
            <Tab className={index === 0 ? 'active-metrics-tab' : 'metrics-tab'} title="All"/>
            <Tab className={index === 1 ? 'active-metrics-tab' : 'metrics-tab'} title="Feature"/>
            <Tab className={index === 2 ? 'active-metrics-tab' : 'metrics-tab'} title="Bug"/>
            <Tab className={index === 3 ? 'active-metrics-tab' : 'metrics-tab'} title="Tech Debt"/>
          </Tabs>
        </Box>
        <Box className="breakdown-box">
          { index === 0 && <Box direction="row" className={`chart-box-tabs`}>
            <Card className="dashboard-card">
              <CardBody>
                <Chart config={weeklySumBar} update={dashboardData.weeklySumBar as any} />
              </CardBody>
            </Card>
            <Card className="dashboard-card">
              <CardBody>
                <Stories stories={dashboardData.stories} />
              </CardBody>
            </Card>
          </Box>}
          {index === 1 && <Breakdown title="Feature" section="feature" data={dashboardData.breakdown.features} />}
          {index === 2 && <Breakdown title="Bug" section="bug" data={dashboardData.breakdown.bugs} />}
          {index === 3 && <Breakdown title="Tech Debt" section="techdebt" data={dashboardData.breakdown.techDebt} />}
        </Box>
      </Box>
    </Box>
  )
}

export default connector(Metrics)
