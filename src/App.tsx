import { FunctionComponent, useEffect } from 'react';
import { connect } from 'react-redux';
import { Box, Grommet, Grid, Text } from 'grommet';
import { init } from './actions/app';
import AppBar from './components/AppBar';
import Metrics from './components/Metrics';
import type { ConnectedProps } from 'react-redux';
import type { RootState } from './store';
import './App.scss';

const connector = connect(
  ({app: { dark, group, error }}: RootState) => ({ dark, group, error }),
  { init }
);


const App: FunctionComponent<ConnectedProps<typeof connector>> = ({ dark, group, error, init }) => {
  useEffect(() => {
    init();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Grommet className={dark ? 'dark app' : 'app'}>
      <Grid
        rows={['auto', 'auto']}
        columns={['auto']}
        areas={[
          { name: 'header', start: [0, 0], end: [1, 0] },
          { name: 'main', start: [0, 1], end: [1, 1] },
        ]}
      >
        <AppBar />
        <Box gridArea="main">
          {!group && 
            <Box className="select-group" justify="center" align="center">
              <Text className="display-text">Select A Team To See Metrics</Text>
            </Box>
          }
          {group && <Metrics />}
        </Box>
      </Grid>
    </Grommet>
  );
}

export default connector(App);
