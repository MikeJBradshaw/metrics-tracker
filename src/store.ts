import { createStore, combineReducers, applyMiddleware } from 'redux';
// import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { createEpicMiddleware } from 'redux-observable';
import app from './reducers/app';
import appEpic from './epics/app';


const reducers = combineReducers({ app });
const epicMiddleware = createEpicMiddleware();

const store = createStore(reducers, applyMiddleware(epicMiddleware));
epicMiddleware.run(appEpic as any);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

