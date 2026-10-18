import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { candidatesApi } from '../api'
import { Skeleton } from '../components/ui'
import CandidateDrawer from '../components/CandidateDrawer'
import { STAGE_COLORS, getApiError } from '../utils'

const PIPELINE_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']

export default function Pipeline() {
  const [columns, setColumns] = useState({})
  const [loading, setLoading] = useState(true)
  const [drawerCandidateId, setDrawerCandidateId] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const cols = {}
      await Promise.all(PIPELINE_STAGES.map(async stage => {
        const res = await candidatesApi.search({ stage, size: 100, sortBy: 'createdAt', sortDir: 'desc' })
        cols[stage] = res.data.content
      }))
      setColumns(cols)
    } catch {
      toast.error('Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || source.droppableId === destination.droppableId) return

    const fromStage = source.droppableId
    const toStage = destination.droppableId
    const previous = columns

    const srcItems = [...columns[fromStage]]
    const [moved] = srcItems.splice(source.index, 1)
    const dstItems = [...columns[toStage]]
    dstItems.splice(destination.index, 0, { ...moved, currentStage: toStage })
    setColumns({ ...columns, [fromStage]: srcItems, [toStage]: dstItems })

    try {
      await candidatesApi.moveStage(Number(draggableId), { targetStage: toStage, changedBy: 'Recruiter' })
      toast.success(`${moved.name} moved to ${toStage}`)
    } catch (err) {
      setColumns(previous)
      toast.error(getApiError(err))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Pipeline</h2>
          <p>Drag candidates between stages</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadAll}>Refresh</button>
      </div>

      {loading ? (
        <div className="pipeline-grid">
          {PIPELINE_STAGES.map(s => (
            <div key={s} className="kanban-col">
              <div className="kanban-header">
                <span className="kanban-title" style={{ color: STAGE_COLORS[s] }}>{s}</span>
              </div>
              <div className="kanban-cards">
                {[1, 2, 3].map(i => <Skeleton key={i} height={80} style={{ borderRadius: 8 }} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="pipeline-grid">
            {PIPELINE_STAGES.map(stage => {
              const cards = columns[stage] || []
              return (
                <div key={stage} className="kanban-col">
                  <div className="kanban-header">
                    <span className="kanban-title" style={{ color: STAGE_COLORS[stage] }}>{stage}</span>
                    <span className="kanban-count">{cards.length}</span>
                  </div>
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        className="kanban-cards"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          background: snapshot.isDraggingOver ? 'rgba(79,142,247,0.05)' : undefined,
                          transition: 'background 0.15s',
                        }}
                      >
                        {!cards.length && !snapshot.isDraggingOver && (
                          <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textAlign: 'center', padding: '16px 0' }}>
                            No candidates
                          </div>
                        )}
                        {cards.map((c, i) => (
                          <Draggable key={String(c.id)} draggableId={String(c.id)} index={i}>
                            {(prov, snap) => (
                              <div
                                className={`kanban-card ${snap.isDragging ? 'dragging' : ''}`}
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                onClick={() => setDrawerCandidateId(c.id)}
                              >
                                <h4>{c.name}</h4>
                                <div className="card-meta">{c.email}</div>
                                {c.jobTitle && <div className="card-job">{c.jobTitle}</div>}
                                {c.experienceYears != null && (
                                  <div className="card-meta" style={{ marginTop: 4 }}>{c.experienceYears} yr exp</div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {drawerCandidateId && (
        <CandidateDrawer
          candidateId={drawerCandidateId}
          onClose={() => setDrawerCandidateId(null)}
          onStageChange={loadAll}
        />
      )}
    </div>
  )
}
