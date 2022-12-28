export interface Group {
  name: string
  id: string
}

export interface DateRange {
  start: Date
  end: Date 
}

export interface StoryDuration {
  id: number
  days: number
}

export interface Settings {
  displayGroup: Group
}

export interface FilterSettings {
  filterDates: DateRange
}

export interface Label {
  name: string
  id: number
}

export interface Project {
  abbreviation: string | null
  id: number
  name: string
}

export interface Story {
  app_url: string
  archived: boolean
  blocked: boolean
  blocker: boolean
  completed_at: string
  created_at: string
  description: string
  estimate: number
  id: number
  labels: Label[]
  name: string
  project_id: number | null
  started_at: string
  story_type: string
  updated_at: string
}

export interface StoryBucket {
  date: string
  data: {
    features: Story[]
    bugs: Story[]
    techDebt: Story[]
  }
}

export interface RangeBucket {
  date: Date
  stories: Story[]
}

export interface StoryResult {
  stories: Story[]
  totalPercent: number
}

export interface Stats {
  name: string
  total: number
  percent: number
}

// TODO: Rename
export interface StoriesFetch {
  allStoriesChart: { series: [{data: number[]}]}
  stats: Stats[]
  stories: Story[]
  storyBuckets: StoryBucket[]
  timeStats: {
    series: [{name: string, data: [number[], number[], number[]]}]
  }
  weeklySumBar: {
    series: [
      {data: number[]}
    ],
    xAxis: {categories: string[], crosshair: boolean}
  }
  weeklyStoriesChart: {
    series: [
      {name: string, data: number[]},
      {name: string, data: number[]},
      {name: string, data: number[]}
    ],
    xAxis: {categories: string[], crosshair: boolean}
  }
}

export interface BreakdownBarChart { 
  series: {data: number[]}[],
  xAxis: {categories: string[], crosshair: boolean}
}

export interface BreakdownShadowChart {
  series: [{
    name: string
    pointPlacement: number
    data: [string, number][]
  },
  {
    name: string
    data: [string, number][]
  }],
}
    // {
    //   name: 'Total',
    //   pointPlacement: -0.2,
    //   data: [['date 1', 12], ['date 2', 12], ['date 3', 17], ['date 4', 17], ['date 5', 19], ['date 6', 13], ['date 7', 9], ['date 8', 7]],
    // },
    // {
    //   name: 'Filtered',
    //   data: [['date 1', 8], ['date 2', 5], ['date 3', 6], ['date 4', 9], ['date 5', 8], ['date 6', 12], ['date 7', 4], ['date 8', 7]]
    // }

export interface BreakdownData {
  barChart: BreakdownBarChart
  filteredStories: Story[]
  labels: string[]
  projects: string[]
  selectedLabels: string[]
  selectedProjects: string[]
  shadowBarChart: any
  showBarChart: boolean
  stories: Story[]
}

export interface DashboardData extends StoriesFetch {
  breakdown: {
    features: BreakdownData
    bugs: BreakdownData
    techDebt: BreakdownData
  }
  pidToName: {[key: number]: string}
}


export const ERROR = 'ERROR_APP'
export type ErrorAction = {type: typeof ERROR, err: Error}
export const error = (err: Error): ErrorAction => ({type: ERROR, err})

export const INIT = 'INIT_APP'
export type InitAction = {type: typeof INIT}
export const init = (): InitAction => ({type: INIT})

export const RESET_MENU = 'RESET_MENU'
export type ResetMenuAction = {type: typeof RESET_MENU, section: string}
export const resetMenu = (section: string): ResetMenuAction => ({type: RESET_MENU, section})

export const SELECT_LABEL = 'SELECT_LABEL'
export type SelectLabelAction = {type: typeof SELECT_LABEL, section: string, label: string}
export const selectLabel = (section: string, label: string): SelectLabelAction => ({type: SELECT_LABEL, section, label})

export const SELECT_PROJECT = 'SELECT_PROJECT'
export type SelectProjectAction = {type: typeof SELECT_PROJECT, section: string, project: string}
export const selectProject = (section: string, project: string): SelectProjectAction => ({type: SELECT_PROJECT, section, project})

export const SET_GROUP = 'SET_GROUP'
export type SetGroupAction = {type: typeof SET_GROUP, name: string, id: string}
export const setGroup = (name: string, id: string): SetGroupAction => ({type: SET_GROUP, name, id})

export const SET_DARK = 'SET_DARK'
export type SetDarkAction = {type: typeof SET_DARK, dark: boolean}
export const setDark = (dark: boolean): SetDarkAction => ({ type: SET_DARK, dark })

export const SET_CHART = 'SET_CHART'
export type SetChartAction = {type: typeof SET_CHART, section: string, data: BreakdownData}
export const setChart = (section: string, data: BreakdownData): SetChartAction => ({type: SET_CHART, section, data})

export const SET_FILTER_DATES = 'SET_FILTER_DATES'
export type SetFilterDatesAction = {type: typeof SET_FILTER_DATES, data: DateRange}
export const setFilterDates = (data: DateRange): SetFilterDatesAction => ({type: SET_FILTER_DATES, data})

export const UNSELECT_LABEL = 'UNSELECT_LABEL'
export type UnselectLabelAction = {type: typeof UNSELECT_LABEL, section: string, label: string}
export const unselectLabel = (section: string, label: string): UnselectLabelAction => ({type: UNSELECT_LABEL, section, label})

export const UNSELECT_PROJECT = 'UNSELECT_PROJECT'
export type UnselectProjectAction = {type: typeof UNSELECT_PROJECT, section: string, project: string}
export const unselectProject = (section: string, project: string): UnselectProjectAction => ({type: UNSELECT_PROJECT, section, project})

export const UPDATE_DATA = 'UPDATE_DATA'
export type UpdateDataAction = {type: typeof UPDATE_DATA, data: DashboardData}
export const updateData = (data: DashboardData): UpdateDataAction => ({type: UPDATE_DATA, data})

export const UPDATE_GROUPS = 'UPDATE_GROUPS'
export type UpdateGroupsAction = {type: typeof UPDATE_GROUPS, groups: Group[]}
export const updateGroups = (groups: Group[]): UpdateGroupsAction => ({type: UPDATE_GROUPS, groups})

export type AppAction = ErrorAction           |
                        InitAction            |
                        ResetMenuAction       |
                        SelectLabelAction     |
                        SelectProjectAction   |
                        SetFilterDatesAction  |
                        SetChartAction        |
                        SetDarkAction         |
                        SetGroupAction        |
                        UpdateGroupsAction    |
                        UpdateDataAction      |
                        UnselectLabelAction   |
                        UnselectProjectAction; 
