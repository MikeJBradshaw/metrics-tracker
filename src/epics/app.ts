import { of, forkJoin  } from 'rxjs'
import { switchMap, catchError, map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { eachWeekOfInterval, format, compareAsc, differenceInDays } from 'date-fns'
import _ from 'lodash'
import { INIT, SET_GROUP, SET_FILTER_DATES, Settings, error, setGroup, updateGroups, updateData } from '../actions/app'
import {
  ALL_GROUPS_PATH,
  ALL_STORIES_PATH,
  SHORTCUT_URL,
  PROJECTS_PATH,
  fromRequest,
  fromPost,
  LABELS_PATH,
  quantile
} from '../helpers'
import type { Observable } from 'rxjs'
import type { StateObservable } from 'redux-observable'
import type { RootState } from '../store'
import type {
  AppAction,
  Group,
  Label,
  Story,
  StoryDuration,
  SetGroupAction,
  SetFilterDatesAction,
  DateRange,
  StoriesFetch,
  StoryBucket,
  Project
} from '../actions/app'


const compareDates = (date1: Date, date2: Date) => compareAsc(date1, date2)
const compareNumbers = (num1: number, num2: number) => {
  if (num1 === num2) {
    return 0
  }
  if (num1 > num2) {
    return 1
  }
  return -1
}

const storiesByType = (stories: Story[]) => {
  const techDebts: Story[] = []
  const features: Story[] = []
  const bugs: Story[] = []

  for (const story of stories) {
    const type = story.story_type

    if (type === 'chore') {
      techDebts.push(story)
    }
    else if (type === 'feature') {
      features.push(story) 
    }
    else if (type === 'bug') {
      bugs.push(story) 
    }
    else {
      console.log('missing type:', type)
    }
  }

  return { techDebts, features, bugs }
}

// data manipulation for lifetime
const durationByType = (features: Story[], bugs: Story[], techDebts: Story[]) => {
  const featuresDuration = features.map(({ started_at, completed_at, id }): StoryDuration => ({ id, days: differenceInDays(new Date(completed_at), new Date(started_at)) }))
  featuresDuration.sort((sd1, sd2) => compareNumbers(sd1.days, sd2.days))
  const filteredFeatures = featuresDuration.filter(({days}) => days > 0 && days <= 14)

  const bugsDuration = bugs.map(({ started_at, completed_at, id }): StoryDuration => ({ id, days: differenceInDays(new Date(completed_at), new Date(started_at)) }))
  bugsDuration.sort((sd1, sd2) => sd1.days - sd2.days)
  const filteredBugs = bugsDuration.filter(({days}) => days > 0 && days <= 14)

  const techDebtDuration = techDebts.map(({ started_at, completed_at, id }): StoryDuration => ({ id, days: differenceInDays(new Date(completed_at), new Date(started_at)) }))
  techDebtDuration.sort((sd1, sd2) => sd1.days - sd2.days)
  const filteredTDs = techDebtDuration.filter(({days}) => days > 0 && days <= 14)

  return { filteredFeatures, filteredBugs, filteredTDs }
}

const storiesByWeek = (start: Date, end: Date, stories: Story[]) => {
  const dateBuckets = eachWeekOfInterval({ start, end })
  const storyBuckets: StoryBucket[] = dateBuckets.map(date => ({
    date: format(date, 'MMMM do'),
    data: {
      features: [],
      bugs: [],
      techDebt: []
    }
  }))

  // start at one since we are making sure the date of the story is always below the date of the next bucket
  let bucketIndex = 0
  let currentEnd = dateBuckets[bucketIndex + 1]

  for (const story of stories) { 
    // this story does not fall into the current week
    const dateCompleted = new Date(story.completed_at)
    if (dateCompleted > currentEnd && bucketIndex + 1 !== dateBuckets.length) {
      while (dateCompleted > currentEnd && bucketIndex < dateBuckets.length) {
        ++bucketIndex
        currentEnd =  dateBuckets[bucketIndex + 1]
      }
    }

    const currentBucket = storyBuckets[bucketIndex]
    const type = story.story_type
    if (type === 'chore') {
      currentBucket.data.techDebt.push(story)
    }
    else if (type === 'feature') {
      currentBucket.data.features.push(story)
    }
    else if (type === 'bug') {
      currentBucket.data.bugs.push(story)
    }
    else {
      console.log('missing type:', type)
    }
  }

  return { storyBuckets }
}

const storyLabels = (stories: Story[]) => {
  const uniqueLabels: Set<number> = new Set()

  for (const story of stories) {
    let labels = story.labels
    for (const label of labels) {
      if (!uniqueLabels.has(label.id)) {
        uniqueLabels.add(label.id)
      }
    }
  }

  return [...uniqueLabels]
}

const projectIds = (stories: Story[]) => {
  const projectsSet: Set<number> = new Set()
  for (const story of stories) {
    if (story.project_id && !projectsSet.has(story.project_id)) {
      projectsSet.add(story.project_id)
    }
  }

  return [...projectsSet]
}

const fetchAndProcessStories = ({ id }: Group, { start, end }: DateRange): Observable<[StoriesFetch, number[], number[]]> => fromPost<Story[]>(
  `${SHORTCUT_URL}/${ALL_STORIES_PATH}`,
  // {group_id: id, completed_at_start: start}
  {group_id: id, completed_at_start: start, completed_at_end: end}
).pipe(
  map(stories => {
    // sort the stories based on created date
    stories.sort((s1, s2) => compareDates(new Date(s1.completed_at), new Date(s2.completed_at)))

    const { techDebts, features, bugs } = storiesByType(stories)
    const { storyBuckets} = storiesByWeek(start, end, stories)
    const { filteredFeatures, filteredBugs, filteredTDs } = durationByType(features, bugs, techDebts)

    // only keeping this if i need to display something
    const uniqueLabels = storyLabels(stories)
    const uniqueProjects = projectIds(stories)

    console.log('uniqueLabels', uniqueLabels)
    console.log('uniqueProjects', uniqueProjects)
    return [
      {
        stories,
        storyBuckets,
        allStoriesChart: {
          series: [{
            data: [features.length, bugs.length, techDebts.length]
          }]
        }, 
        timeStats: {
          series: [{
            name: 'Work Time',
            data: [[filteredFeatures.length ? filteredFeatures[0].days : 0, filteredFeatures.length ? quantile(filteredFeatures, .25) : 0, filteredFeatures.length ? quantile(filteredFeatures, .50) : 0, filteredFeatures.length ? quantile(filteredFeatures, .75) : 0, filteredFeatures.length >= 1 ? filteredFeatures[filteredFeatures.length - 1]?.days : 0], [filteredBugs.length ? filteredBugs[0].days : 0, filteredBugs.length ? quantile(filteredBugs, .25) : 0, filteredBugs.length ? quantile(filteredBugs, .50) : 0, filteredBugs.length ? quantile(filteredBugs, .75) : 0, filteredBugs.length >= 1? filteredBugs[filteredBugs.length - 1].days : 0], [filteredTDs.length ? filteredTDs[0].days : 0, filteredTDs.length ? quantile(filteredTDs, .25) : 0, filteredTDs.length ? quantile(filteredTDs, .50) : 0, filteredTDs.length ? quantile(filteredTDs, .75) : 0, filteredTDs.length >= 1 ? filteredTDs[filteredTDs.length - 1].days : 0]]
          }]
        },
        weeklySumBar: {
          series: [{data: storyBuckets.map(({ data: {bugs, features, techDebt}}) => bugs.length + features.length + techDebt.length)}],
          xAxis: {categories: storyBuckets.map(({date, data}) => date), crosshair: true}
        },
        weeklyStoriesChart: {
          series: [{name: 'Features', data: storyBuckets.map(({date, data}) => data.features.length)}, {name: 'Bugs', data: storyBuckets.map(({date, data}) => data.bugs.length)}, {name: 'Tech Debt', data: storyBuckets.map(({date, data}) => data.techDebt.length)}],
          xAxis: {categories: storyBuckets.map(({date, data}) => date), crosshair: true},
        },
        stats: [
          {name: 'Feature', total: features.length, percent: _.round((features.length / stories.length) * 100, 1)},
          {name: 'Bug', total: bugs.length, percent: _.round((bugs.length / stories.length) * 100, 1)},
          {name: 'Tech Debt', total: techDebts.length, percent: _.round((techDebts.length / stories.length) * 100, 1)}
        ]
      },
      uniqueProjects,
      uniqueLabels
    ]
  })
)

const initEpic = (action$: Observable<AppAction>) => action$.pipe(
  ofType(INIT),
  switchMap(() => fromRequest<Group[]>(`${SHORTCUT_URL}/${ALL_GROUPS_PATH}`).pipe(
    switchMap(groups => {
      const settingsString = window.localStorage.getItem('settings')
      if (!settingsString) {
        return of(updateGroups(groups))
      }

      const {displayGroup: { name, id }}: Settings = JSON.parse(settingsString)
      return of(updateGroups(groups), setGroup(name, id))
    }),
    catchError(err => of(error(err)))
  ))
)

const fetchDataEpic = (action$: Observable<SetGroupAction | SetFilterDatesAction>, state$: StateObservable<RootState>) => action$.pipe(
  ofType(SET_GROUP, SET_FILTER_DATES),
  switchMap(() => fetchAndProcessStories(
    state$.value.app.group as Group,
    state$.value.app.filterSettings.filterDates
  ).pipe(
    switchMap(([dashboardData, uProjects, uLabels]) => forkJoin(
      of(dashboardData),
      uProjects.length > 0 ? forkJoin(uProjects.map(id => fromRequest(`${SHORTCUT_URL}/${PROJECTS_PATH}${id}`))) : of([]),
      uLabels.length > 0 ? forkJoin(uLabels.map(id => fromRequest(`${SHORTCUT_URL}/${LABELS_PATH}${id}`))) : of([])
      // forkJoin(uProjects.map(id => fromRequest(`${SHORTCUT_URL}/${PROJECTS_PATH}${id}`))),
      // forkJoin(uLabels.map(id => fromRequest(`${SHORTCUT_URL}/${LABELS_PATH}${id}`)))
    ).pipe(
      map(([dashboardData, projects, labels]: [StoriesFetch, Project[], Label[]]) => {
        // create a map to hold all the projects and labels by id
        const mProjects: {[key: number]: string} = {}
        for(const p of projects) {
          mProjects[p.id] = p.name
        }

        const featureProjects = new Set<string>()
        const bugProjects = new Set<string>()
        const techDebtProjects = new Set<string>()

        for(const s of dashboardData.stories) {
          const pId = s.project_id
          if (!pId) {
            continue
          }
          
          const projectName: string = mProjects[pId]
          if (s.story_type === 'chore') {
            if (!techDebtProjects.has(projectName)) {
              techDebtProjects.add(projectName)
            }
          }
          else if (s.story_type === 'feature') {
            if (!featureProjects.has(projectName)) {
              featureProjects.add(projectName)
            }
          }
          else {
            if (!bugProjects.has(projectName)) {
              bugProjects.add(projectName)
            }
          }
        }

        const breakdown = {
          features: {
            barChart: {
              series: [{data: dashboardData.storyBuckets.map(({data: { features }}) => features.length)}],
              xAxis: {categories: dashboardData.storyBuckets.map(({date, data}) => date), crosshair: true}
            },
            filteredStories: dashboardData.stories.filter((story) => story.story_type === 'feature'),
            labels: [],
            projects: [...featureProjects],
            selectedLabels: [],
            selectedProjects: [],
            shadowBarChart: {
              series: [
                {name: 'Total', pointPlacement: -0.2, data: dashboardData.storyBuckets.map(({date, data: { features }}) => [date, features.length])},
                {name: 'Filtered', data: dashboardData.storyBuckets.map(({date}) => [date, 0])}
              ]
            },
            showBarChart: true,
            stories: dashboardData.stories.filter((story) => story.story_type === 'feature')
          },
          bugs: {
            barChart: {
              series: [{data: dashboardData.storyBuckets.map(({data: { bugs }}) => bugs.length)}],
              xAxis: {categories: dashboardData.storyBuckets.map(({date, data}) => date), crosshair: true}
            },
            filteredStories: dashboardData.stories.filter((story) => story.story_type === 'bug'),
            labels: [],
            projects: [...bugProjects],
            selectedLabels: [],
            selectedProjects: [],
            shadowBarChart: {
              series: [
                {name: 'Total', pointPlacement: -0.2, data: dashboardData.storyBuckets.map(({date, data: { bugs }}) => [date, bugs.length])},
                {name: 'Filtered', data: dashboardData.storyBuckets.map(({date}) => [date, 0])}
              ]
            },
            showBarChart: true,
            stories: dashboardData.stories.filter((story) => story.story_type === 'bug')
          },
          techDebt: {
            barChart: {
              series: [{data: dashboardData.storyBuckets.map(({data: { techDebt }}) => techDebt.length)}],
              xAxis: {categories: dashboardData.storyBuckets.map(({date, data}) => date), crosshair: true}
            },
            filteredStories: dashboardData.stories.filter((story) => story.story_type === 'ug'),
            labels: [],
            projects: [...techDebtProjects],
            selectedLabels: [],
            selectedProjects: [],
            shadowBarChart: {
              series: [
                {name: 'Total', pointPlacement: -0.2, data: dashboardData.storyBuckets.map(({date, data: { techDebt }}) => [date, techDebt.length])},
                {name: 'Filtered', data: dashboardData.storyBuckets.map(({date}) => [date, 0])}
              ]
            },
            showBarChart: true,
            stories: dashboardData.stories.filter((story) => story.story_type === 'chore')
          }
        }

        return updateData({...dashboardData, pidToName: mProjects, breakdown})
      }),
      catchError(err => of(error(err)))
    ))
  ))
)

export default combineEpics(initEpic as any, fetchDataEpic as any)
