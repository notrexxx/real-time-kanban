import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/boardStore'; 

export default function Board() {
  const { id } = useParams<{ id: string }>(); 
  
  const { currentBoard, isLoading, fetchBoardById, createColumn, createCard, moveCard, initSocket, disconnectSocket } = useBoardStore();
  
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchBoardById(id);
      initSocket(id);
    }
    
    return () => disconnectSocket();
  }, [id]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    moveCard(draggableId, source.droppableId, destination.droppableId, destination.index);
  };

  const handleAddColumn = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newColumnTitle.trim() && currentBoard) {
      await createColumn(currentBoard.id, newColumnTitle);
      setNewColumnTitle('');
    }
  };

  const handleAddCard = async (e: React.KeyboardEvent<HTMLInputElement>, columnId: string) => {
    const title = newCardTitles[columnId];
    if (e.key === 'Enter' && title?.trim()) {
      await createCard(columnId, title);
      setNewCardTitles({ ...newCardTitles, [columnId]: '' });
    }
  };

  if (isLoading || !currentBoard) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex items-center gap-6 border-b border-slate-200 bg-white px-6 py-4">
        <Link to="/" className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{currentBoard.name}</h1>
      </header>

      <main className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full items-start gap-6">
            
            {currentBoard.columns?.map((col: any) => (
              <div key={col.id} className="flex h-full max-h-[90%] w-80 shrink-0 flex-col rounded-xl bg-slate-100 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900">{col.title}</h2>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                    {col.cards?.length || 0}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/50 rounded-lg' : ''}`}
                    >
                      {col.cards?.map((card: any, index: number) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              // Added the 'group' class and flexbox layout to hold the text and icon perfectly
                              className={`group mb-3 flex cursor-grab items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all active:cursor-grabbing ${
                                snapshot.isDragging ? 'scale-105 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500' : 'hover:border-slate-300 hover:shadow-md'
                              }`}
                              style={provided.draggableProps.style}
                            >
                              <p className="text-sm font-medium text-slate-700">{card.title}</p>
                              
                              {/* The SVG Drag Handle */}
                              <div className="text-slate-300 transition-colors group-hover:text-slate-500">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="3" y1="12" x2="21" y2="12"></line>
                                  <line x1="3" y1="6" x2="21" y2="6"></line>
                                  <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <input
                  type="text"
                  placeholder="+ Add a card..."
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={newCardTitles[col.id] || ''}
                  onChange={(e) => setNewCardTitles({ ...newCardTitles, [col.id]: e.target.value })}
                  onKeyDown={(e) => handleAddCard(e, col.id)}
                />
              </div>
            ))}

            <div className="w-80 shrink-0">
              <input
                type="text"
                placeholder="+ Add a list..."
                className="w-full rounded-xl border border-slate-200 bg-white p-4 font-medium outline-none transition-all focus:border-blue-500 focus:shadow-md"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={handleAddColumn}
              />
            </div>
            
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}