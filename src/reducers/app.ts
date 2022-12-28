import {
  ERROR,
  RESET_MENU,
  SET_GROUP,
  SET_FILTER_DATES,
  SELECT_LABEL,
  SELECT_PROJECT,
  SET_DARK,
  SET_CHART,
  UNSELECT_LABEL,
  UNSELECT_PROJECT,
  UPDATE_GROUPS,
  UPDATE_DATA
} from '../actions/app';
import { subWeeks } from 'date-fns'
import type { Reducer } from 'redux';
import type { AppAction, BreakdownData, Group, FilterSettings, DashboardData, Settings, Story } from '../actions/app';

interface AppState {
  loading: boolean
  dark: boolean
  filterSettings: FilterSettings
  settings?: Settings
  group?: Group
  error?: Error
  groups?: Group[]
  dashboardData?: DashboardData
}

const standardize = (s: string) => s.toUpperCase().replace(' ', '_')

const createLabels = (section: string, stories: Story[], pidToName: {[key: number]: string}, project: string, select: boolean, oldLabels?: string[]) => {
  const labelSet = new Set<string>()
  const evalProject = select ? 
    (s: Story) => s.project_id && pidToName[s.project_id] === project : 
    (s: Story) => s.project_id && pidToName[s.project_id] !== project
  
  // add old labels if provided
  if (oldLabels) {
    for (const l of oldLabels) {
      labelSet.add(l)
    }
  }

  for (const story of stories) {
    if (evalProject(story)) {
      for (const label of story.labels) {
        if (!labelSet.has(label.name.toUpperCase().replace(' ', '_'))) {
          labelSet.add(label.name.toUpperCase().replace(' ', '_'))
        }
      }
    }
  }

  return [...labelSet].sort((a, b) => a.localeCompare(b))
}

const getDataFromSection = (data: {[key: string]: BreakdownData}, section: string) => section === 'feature' ? data.features : (section === 'bug' ? data.bugs : data.techDebt)

const initState: AppState = {
  loading: true,
  dark: false,
  filterSettings: {
    filterDates: {start: subWeeks(new Date(), 8), end: new Date()}
  }
}

const appReducer: Reducer<AppState, AppAction> = (state = initState, action) => {
  // console.log('action', action)
  switch(action.type) {
    case ERROR:
      return {...state, error: action.err, loading: false}

    case RESET_MENU: {
      const { dashboardData, ...newState } = state
      if (!dashboardData) {
        return state
      }

      const section = action.section
      const {features, bugs, techDebt} = dashboardData.breakdown

      const showBarChart = true
      const selectedProjects: string[] = []
      const selectedLabels: string[] = []
      const labels: string[] = []
      const filteredStories: Story[] = []

      return {
        ...newState,
        dashboardData: {
          ...dashboardData,
          breakdown: {
            features: section === 'feature' ? {...features, showBarChart, selectedProjects, labels, selectedLabels, filteredStories} : features,
            bugs: section === 'bug' ? {...bugs, showBarChart, selectedProjects, labels, selectedLabels, filteredStories} : bugs,
            techDebt: section === 'techdebt' ? {...techDebt, showBarChart, selectedProjects, labels, selectedLabels, filteredStories} : techDebt
          }
        }
      }
    }

    case SET_GROUP: {
      const { dashboardData, ...newState } = state
      if (newState.settings) {
        newState.settings.displayGroup.name = action.name  
        newState.settings.displayGroup.id = action.id  
      }
      else {
        newState.settings = {displayGroup: {name: action.name, id: action.id}}
      }
      newState.group = {name: action.name, id: action.id}
      newState.loading = true

      // store in local storage selected group name and selected group id
      window.localStorage.setItem('settings', JSON.stringify(newState.settings))

      return newState
    }

    case UPDATE_GROUPS:
      return {...state, groups: action.groups, loading: false}

    case UPDATE_DATA:
      return {...state, dashboardData: action.data, loading: false}

    case SET_FILTER_DATES: {
      const { filterSettings, ...newState } = state
      filterSettings.filterDates = action.data
      return {...newState, filterSettings}
    }

    case SET_DARK:
      return { ...state, dark: action.dark }

    case SET_CHART: {
      const {dashboardData, ...newState } = state
      if (!dashboardData) {
        return state
      }

      const {features, bugs, techDebt} = dashboardData.breakdown
      const section = action.section

      return {
        ...newState,
        dashboardData: {
          ...dashboardData,
          breakdown: {
            features: section === 'feature' ? action.data : features,
            bugs: section === 'bug' ? action.data : bugs,
            techDebt: section === 'techdebt' ? action.data : techDebt
          }
        }
      }
    }

    case SELECT_LABEL: {
      const {dashboardData, ...newState} = state
      if (!dashboardData) {
        return state
      }

      const section = action.section
      const breakdownData = getDataFromSection(dashboardData.breakdown, section)
      const { features, bugs, techDebt } = dashboardData.breakdown

      // get any other selected labels, and add the new one
      const selectedLabels = section === 'feature' 
        ? features.selectedLabels 
        : (section === 'bug' ? bugs.selectedLabels : techDebt.selectedLabels)
      selectedLabels.push(action.label)

      // get stories for selected labels -- display in the table
      const oldStories = section === 'feature' 
        ? features.stories 
        : (section === 'bug' ? bugs.stories : techDebt.stories)
      const filteredStories: Story[] = []
      const filteredStoriesSet = new Set<number>()

      for (const story of oldStories) {
        for (const label of story.labels) {
          if (selectedLabels.indexOf(standardize(label.name)) > -1) {
            if (!filteredStoriesSet.has(story.id)) {
              filteredStories.push(story)
              filteredStoriesSet.add(story.id)
              break
            }
          }
        }
      }

      // create graph data
      const filterData = dashboardData.storyBuckets.map(({ date, data }) => {
        const stories = section === 'feature' ? data.features : (section === 'bug' ? data.bugs : data.techDebt)
        let count = 0
        for (const story of stories) {
          for (const label of story.labels) {
            if (selectedLabels.includes(standardize(label.name))) {
              ++count
              break
            }
          }
        }
        return ([date, count])
      })

      const shadowBarChart = {series: [breakdownData.shadowBarChart.series[0], {data: filterData, name: 'Filtered'}]}

      return {
        ...newState,
        dashboardData: {
          ...dashboardData,
          breakdown: {
            features: section === 'feature' ? {...features, filteredStories, selectedLabels, shadowBarChart} : features,
            bugs: section === 'bug' ? {...bugs, filteredStories, selectedLabels, shadowBarChart} : bugs,
            techDebt: section === 'techdebt' ? {...techDebt, filteredStories, selectedLabels, shadowBarChart} : techDebt
          }
        }
      }
    }

    case SELECT_PROJECT: {
      const {dashboardData, ...newState} = state
      if (!dashboardData) {
        return state
      }

      const section = action.section
      const { features, bugs, techDebt } = dashboardData.breakdown

      const stories = section === 'feature' ? features.stories : (section === 'bug' ? bugs.stories : techDebt.stories)
      const oldLabels = section === 'feature' ? features.labels : (section === 'bug' ? bugs.labels : techDebt.labels)
      const labels = createLabels(section, stories, dashboardData.pidToName, action.project, true, oldLabels)

      // add selected project into the selected projects list
      const selectedProjects = section === 'feature' ? features.selectedProjects : (section === 'bug' ? bugs.selectedProjects : techDebt.selectedProjects)
      selectedProjects.push(action.project)

      return {
        ...newState,
        dashboardData: {
          ...dashboardData,
          breakdown: {
            features: section === 'feature' ? {...features, labels, selectedProjects} : features,
            bugs: section === 'bug' ? {...bugs, labels, selectedProjects} : bugs,
            techDebt: section === 'techdebt' ? {...techDebt, labels, selectedProjects} : techDebt
          }
        }
      }
    }

    case UNSELECT_LABEL: {
      const {dashboardData, ...newState} = state
      if (!dashboardData) {
        return state
      }

      const section = action.section
      const breakdownData = getDataFromSection(dashboardData.breakdown, section)
      const { features, bugs, techDebt } = dashboardData.breakdown

      // get any other selected labels, and add the new one
      const oldSelectedLabels = section === 'feature' 
        ? features.selectedLabels 
        : (section === 'bug' ? bugs.selectedLabels : techDebt.selectedLabels)
      const selectedLabels = oldSelectedLabels.filter((label_name) => label_name !== action.label )

      // get stories for selected labels -- display in the table
      const oldStories = section === 'feature' 
        ? features.stories 
        : (section === 'bug' ? bugs.stories : techDebt.stories)
      const filteredStories: Story[] = []  // TODO: clean up by making its own fx call
      const filteredStoriesSet = new Set<number>()

      for (const story of oldStories) {
        for (const label of story.labels) {
          if (selectedLabels.indexOf(standardize(label.name)) > -1) {
            if (!filteredStoriesSet.has(story.id)) {
              filteredStories.push(story)
              filteredStoriesSet.add(story.id)
              break
            }
          }
        }
      }

      // create graph data
      const filterData = dashboardData.storyBuckets.map(({ date, data }) => {
        const stories = section === 'feature' ? data.features : (section === 'bug' ? data.bugs : data.techDebt)
        let count = 0
        for (const story of stories) {
          for (const label of story.labels) {
            if (selectedLabels.includes(standardize(label.name))) {
              ++count
              break
            }
          }
        }
        return ([date, count])
      })

      const shadowBarChart = {series: [breakdownData.shadowBarChart.series[0], {data: filterData, name: 'Filtered'}]}

      return {
        ...newState,
        dashboardData: {
          ...dashboardData,
          breakdown: {
            features: section === 'feature' ? {...features, filteredStories, selectedLabels, shadowBarChart} : features,
            bugs: section === 'bug' ? {...bugs, filteredStories, selectedLabels, shadowBarChart} : bugs,
            techDebt: section === 'techdebt' ? {...techDebt, filteredStories, selectedLabels, shadowBarChart} : techDebt
          }
        }
      }
    }

    case UNSELECT_PROJECT: {
      const {dashboardData, ...newState} = state
      if (!dashboardData) {
        return state
      }
      
      const section = action.section
      const { features, bugs, techDebt } = dashboardData.breakdown

      const oldProjects = section === 'feature' ? features.selectedProjects : (section === 'bug' ? bugs.selectedProjects : techDebt.selectedProjects)
      const selectedProjects = oldProjects.filter((project_name) => project_name !== action.project)
      const stories = section === 'feature' ? features.stories : (section === 'bug' ? bugs.stories : techDebt.stories)

      let labels: string[] = []
      if (selectedProjects.length > 0) {
        const storiesOfSelectedProjects = stories.filter(
          (story) => story.project_id && oldProjects.indexOf(dashboardData.pidToName[story.project_id]) > -1
        )
        labels = createLabels(section, storiesOfSelectedProjects, dashboardData.pidToName, action.project, false)
      }

      return {
        ...newState,
        dashboardData: {
          ...dashboardData,
          breakdown: {
            features: section === 'feature' ? {...features, labels, selectedProjects} : features,
            bugs: section === 'bug' ? {...bugs, labels, selectedProjects} : bugs,
            techDebt: section === 'techdebt' ? {...techDebt, labels, selectedProjects} : techDebt
          }
        }
      }
    }

    default:
      return state
  }
}

export default appReducer;
