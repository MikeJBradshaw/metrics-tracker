import { connect } from 'react-redux'
import { Button, Header, Text, Select, Box } from 'grommet'
import DatePicker from "react-datepicker"
import { Sun, Moon } from 'grommet-icons';
import { setGroup, setFilterDates, setDark } from '../actions/app'
import type { FunctionComponent } from 'react'
import type { ConnectedProps } from 'react-redux'
import type { RootState } from '../store'

const connector = connect(
  ({app: {dark, group, groups, filterSettings: {filterDates: { start, end }}}}: RootState) => ({ dark, group, groups, start, end }),
  { setGroup, setFilterDates, setDark }
);

const AppBar: FunctionComponent<ConnectedProps<typeof connector>> = (
  { dark, group, groups, start, end, setGroup, setFilterDates, setDark }
) => (
  <Header gridArea="header" className="app-header" direction="row">
    <Text className="app-name">Metrics Tracker</Text>
    <Select
      className="team-select"
      value={group?.name}
      options={groups ? groups.map(({ name, id }) => ({ name, id })) : []}
      onChange={({value: { name, id }}) => setGroup(name, id)}
      placeholder="Select Team"
      dropHeight="300px"
    />
    <Box direction="row" align="center" gap="small">
      <Box direction="row" gap="small">
        <DatePicker 
          title="Start Date"
          selected={start}
          maxDate={new Date()}
          onChange={(start: Date) => setFilterDates({ start, end })}
        />
        <DatePicker 
          selected={end}
          title="End Date"
          minDate={start}
          maxDate={new Date()}
          onChange={(end: Date) => setFilterDates({ start, end })}
        />
      </Box>
      { false && <Button
        disabled
        onClick={() => setDark(!dark)}
      >
        {dark ? <Sun color='plain' size="medium" /> : <Moon color='plain' size="medium" /> }
      </Button>
      }
    </Box>
  </Header>
);

export default connector(AppBar);
