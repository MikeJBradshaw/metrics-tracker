import { useState, useRef } from 'react'
import { connect } from 'react-redux';
import { Box, Button, CheckBox, Drop, Text } from 'grommet'
import { Clear, Filter, Close } from 'grommet-icons';
import { resetMenu, setChart, selectLabel, selectProject, unselectLabel, unselectProject } from '../actions/app'
import type { FunctionComponent } from 'react'
import type { ConnectedProps } from 'react-redux'
import type { RootState } from '../store'

interface FilterMenuOwnProps {
  section: string
}

const connector = connect(
  ({ app: { dashboardData }}: RootState) => ({ dashboardData }),
  { resetMenu, setChart, selectLabel, selectProject, unselectLabel, unselectProject }
)

const FilterMenu: FunctionComponent<ConnectedProps<typeof connector> & FilterMenuOwnProps> = (
  { section, dashboardData, resetMenu, setChart, selectLabel, selectProject, unselectLabel, unselectProject}
) => {
  const [ showMenu, setShowMenu ] = useState<boolean>(false)
  const optionsButtonRef = useRef<any>();
  const data = section === 'feature' ? 
    dashboardData?.breakdown.features 
      : (section === 'bug' 
        ? dashboardData?.breakdown.bugs 
        : dashboardData?.breakdown.techDebt)

  if (!data) {
    return (<div>ERROR</div>)
  }

  return (
    <>
      <Button
        className="settings-button"
        icon={<Filter />}
        onClick={() => setShowMenu(!showMenu)} 
        title="Filter Stories"
        ref={optionsButtonRef}
      />
      { showMenu && <Drop
        align={{ top: 'bottom', left: 'left' }}
        target={optionsButtonRef.current}
        className="drop-container"
      >
        <Box direction="column" className="settings-menu">
          <Box direction="row" className="settings-title">
            <Button
              className="settings-clear"
              title="Clear Selection"
              icon={ <Clear /> }
              onClick={() => resetMenu(section)}
            />
            <Text className="filter-settings-title" weight="bolder" alignSelf="center">Filter Stories</Text>
            <Button 
              className="settings-apply"
              title="Close"
              icon={<Close />}
              onClick={() => setShowMenu(!showMenu)}
            />
          </Box>
          <Box className="settings-content" gap="xsmall" pad="small">
            <Box direction="row" title="Filter Stories">
              <CheckBox
                checked={!data.showBarChart}
                label="Filter"
                disabled={data.projects.length === 0}
                onChange={() => setChart(section, {...data, showBarChart: !data.showBarChart})}
              />
            </Box>
            { data.projects.length > 0 && <Box direction="row" gap="medium">
              <Box gap="xsmall">
                <Text className="menu-header" weight="bolder">Projects</Text>
                { data.projects.length > 0 && data.projects.map((project, index) => (
                  <CheckBox
                    key={index}
                    label={project}
                    disabled={data.showBarChart}
                    checked={data.selectedProjects.includes(project)}
                    onChange={() => data.selectedProjects.includes(project) 
                      ? unselectProject(section, project)
                      : selectProject(section, project)}
                  />
                )) }
              </Box>
              <Box gap="xsmall">
                <Text className="menu-header" weight="bolder">Labels</Text>
                { data.labels.map((label, index) => (
                  <CheckBox
                    key={index}
                    label={label}
                    disabled={data.showBarChart}
                    checked={data.selectedLabels.includes(label)}
                    onChange={() => data.selectedLabels.includes(label) 
                      ? unselectLabel(section, label)
                      : selectLabel(section, label)
                    }
                  />
                )) }
              </Box>
            </Box>
            }
          </Box>
          { data.projects.length === 0 && <Box><Text>No Projects to Filter On</Text></Box> }
        </Box>
      </Drop> }
    </>
  )
}

export default connector(FilterMenu)
