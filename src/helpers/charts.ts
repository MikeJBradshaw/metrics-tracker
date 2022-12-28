export const allStoriesOptions = (bugs: number, features: number, techdebts: number) => ({
  series: [{
    data: [
      ['Bugs', bugs],
      ['Features', features],
      ['Tech Debt', techdebts]
    ]
  }],
  legend: {
    enabled: false
  },
  title: {text: 'Total Cards For Time Period'},
  xAxis: {categories: ['Bugs', 'Features', 'Tech Debt']},
  yAxis: {title: {text: 'Card Count'}}
})

export const weeklyOptions = (bugs: number[], features: number[], techdebts: number[], categories: string[]) => ({
  series: [
    {name: 'Bugs', data: bugs},
    {name: 'Features', data: features},
    {name: 'Tech Debt', data: techdebts}
  ],
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'top',
    x: -40,
    y: 80,
    floating: true,
    borderWidth: 1,
    shadow: true
  },
  title: {text: 'Completed Story Types By Week'},
  plotOptions: {bar: {dataLabels: {enabled: true}}},
  xAxis: {categories},
  yAxis: {title: {text: 'Completed Stories'}}
})
