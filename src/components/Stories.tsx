import { FunctionComponent } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { Story } from '../actions/app'

const columnDefs = [
  {field: "name", headerName: "Name", flex: 1},
  {field: "story_type", headerName: "Story Type", flex: 1},
  {field: "started_at", headerName: "Started At", flex: 1, sortable: true},
  {field: "completed_at", headerName: "Completed At", flex: 1, sortable: true},
]

interface StoryOwnProps {
  stories: Story[]
}

const Metrics: FunctionComponent<StoryOwnProps> = ({ stories }) => (
  <div className="ag-theme-alpine" style={{height: 400, width: '100%'}}>
    <AgGridReact
      rowData={stories ?? []}
      columnDefs={columnDefs}
    />
  </div>
)

export default Metrics;
