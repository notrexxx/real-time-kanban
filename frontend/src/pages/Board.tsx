import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/boardStore'; 
import { useAuth } from '../context/AuthContext';

export default function Board() {
  const { id } = useParams<{ id: string }>(); 
  const { user, logout } = useAuth(); 
  const navigate = useNavigate(); 
  
  const { 
    currentBoard, isLoading, socket, cursors, lockedCards,
    fetchBoardById, createColumn, createCard, moveCard, 
    updateCard, deleteCard, updateBoard, deleteBoard, 
    addCollaborator, lockCard, unlockCard, initSocket, disconnectSocket,
    updateColumn, deleteColumn // <-- Hooked up the new store methods
  } = useBoardStore();
  
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const [isEditingBoardName, setIsEditingBoardName] = useState(false);
  const [editedBoardName, setEditedBoardName] = useState('');
  
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editedCardTitle, setEditedCardTitle] = useState('');

  // NEW: UI State for Editing Columns
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editedColumnTitle, setEditedColumnTitle] = useState('');

  useEffect(() => {
    if (id) {
      fetchBoardById(id);
      initSocket(id);
    }
    return () => disconnectSocket();
  }, [id]);

  useEffect(() => {
    if (socket && id && user) {
      socket.emit('cursor-move', { boardId: id, x: -1000, y: -1000, email: user.email });
    }
  }, [socket, id, user]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (socket && id && user) {
      socket.emit('cursor-move', { boardId: id, x: e.clientX, y: e.clientY, email: user.email });
    }
  };

  const handleDragStart = (start: any) => {
    if (user) lockCard(start.draggableId, user.email);
  };

  const handleDragEnd = (result: DropResult) => {
    unlockCard(result.draggableId);

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

  // NEW: Handlers for Column Management
  const startEditingColumn = (col: any) => {
    setEditedColumnTitle(col.title);
    setEditingColumnId(col.id);
  };

  const saveColumnTitle = async (columnId: string) => {
    if (editedColumnTitle.trim() && editedColumnTitle !== currentBoard.columns.find((c:any) => c.id === columnId)?.title) {
      await updateColumn(columnId, editedColumnTitle);
    }
    setEditingColumnId(null);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (window.confirm("Are you sure you want to delete this list and all its cards?")) {
      await deleteColumn(columnId);
    }
  };

  const handleAddCard = async (e: React.KeyboardEvent<HTMLInputElement>, columnId: string) => {
    const title = newCardTitles[columnId];
    if (e.key === 'Enter' && title?.trim()) {
      await createCard(columnId, title);
      setNewCardTitles({ ...newCardTitles, [columnId]: '' });
    }
  };

  const handleDeleteBoard = async () => {
    if (window.confirm("Are you sure you want to permanently delete this board? This action cannot be undone.")) {
      await deleteBoard(currentBoard.id);
      navigate('/');
    }
  };

  const saveBoardName = async () => {
    if (editedBoardName.trim() && editedBoardName !== currentBoard.name) {
      await updateBoard(currentBoard.id, editedBoardName);
    }
    setIsEditingBoardName(false);
  };

  const startEditingCard = (card: any) => {
    setEditedCardTitle(card.title);
    setEditingCardId(card.id);
  };

  const saveCardTitle = async (columnId: string, cardId: string) => {
    if (editedCardTitle.trim() && editedCardTitle !== currentBoard.columns.find((c:any) => c.id === columnId)?.cards.find((c:any) => c.id === cardId)?.title) {
      await updateCard(columnId, cardId, editedCardTitle);
    }
    setEditingCardId(null);
  };

  const handleDeleteCard = async (columnId: string, cardId: string) => {
    if (window.confirm("Delete this card?")) {
      await deleteCard(columnId, cardId);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentBoard) return;

    setInviteMessage('Sending invite...');
    const result = await addCollaborator(currentBoard.id, inviteEmail);
    
    if (result.success) {
      setInviteMessage('Invite sent successfully!');
      setTimeout(() => {
        setIsShareModalOpen(false);
        setInviteEmail('');
        setInviteMessage('');
      }, 1500);
    } else {
      setInviteMessage(result.message || 'Error sending invite.');
    }
  };

  const isOnline = (email: string) => {
    if (user?.email === email) return true; 
    return Object.values(cursors).some(c => c.email === email);
  };

  if (isLoading || !currentBoard) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-[5px] border-indigo-100 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400"></div>
      </div>
    );
  }

  const isOwner = currentBoard.user && user?.email === currentBoard.user.email;

  return (
    <div className="flex h-screen flex-col bg-zinc-50/50 dark:bg-zinc-950 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100 relative overflow-hidden transition-colors duration-300" onMouseMove={handleMouseMove}>
      
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-zinc-100 dark:from-zinc-900 to-transparent pointer-events-none z-0"></div>

      <header className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl px-8 py-5 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-2.5 text-zinc-500 dark:text-zinc-400 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </Link>

          <div className="flex items-center gap-3">
            {isEditingBoardName ? (
              <input
                autoFocus
                className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 outline-none border-b-[3px] border-indigo-500 bg-transparent py-1"
                value={editedBoardName}
                onChange={(e) => setEditedBoardName(e.target.value)}
                onBlur={saveBoardName}
                onKeyDown={(e) => e.key === 'Enter' && saveBoardName()}
              />
            ) : (
              <h1 
                onClick={() => {
                  if (isOwner) {
                    setEditedBoardName(currentBoard.name);
                    setIsEditingBoardName(true);
                  }
                }} 
                className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-50 dark:to-zinc-300 bg-clip-text text-transparent ${isOwner ? 'cursor-text hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded-xl px-3 -ml-3 py-1 transition-colors' : ''}`}
                title={isOwner ? "Click to edit title" : ""}
              >
                {currentBoard.name}
              </h1>
            )}

            {isOwner && !isEditingBoardName && (
              <button 
                onClick={handleDeleteBoard}
                className="rounded-lg p-2 text-zinc-300 dark:text-zinc-600 transition-all hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400"
                title="Delete Board"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex -space-x-3 mr-4">
            
            {currentBoard.user && (
              <div className="relative z-10 hover:z-20 transition-transform hover:scale-110 cursor-default">
                <div className="flex h-11 w-11 items-center justify-center rounded-full ring-[3px] ring-white dark:ring-zinc-950 bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md" title={`Owner: ${currentBoard.user.email}`}>
                  {currentBoard.user.email[0].toUpperCase()}
                </div>
                {isOnline(currentBoard.user.email) && (
                  <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-400 ring-[3px] ring-white dark:ring-zinc-950 shadow-sm"></span>
                )}
              </div>
            )}

            {currentBoard.collaborators?.map((collab: any) => (
              <div key={collab.id} className="relative z-10 hover:z-20 transition-transform hover:scale-110 cursor-default">
                <div className="flex h-11 w-11 items-center justify-center rounded-full ring-[3px] ring-white dark:ring-zinc-950 bg-zinc-300 dark:bg-zinc-700 text-sm font-bold text-white shadow-md" title={collab.email}>
                  {collab.email[0].toUpperCase()}
                </div>
                {isOnline(collab.email) && (
                  <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-400 ring-[3px] ring-white dark:ring-zinc-950 shadow-sm"></span>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2.5 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Share
          </button>

          <div className="h-8 w-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full mx-1"></div>
          
          <button onClick={logout} className="rounded-2xl bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-300 shadow-sm border border-zinc-200/60 dark:border-zinc-800 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white">
            Log Out
          </button>

        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-8 relative z-10">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex h-full items-start gap-8 pb-8">
            
            {currentBoard.columns?.map((col: any) => (
              <div key={col.id} className="relative flex h-full max-h-full w-[340px] shrink-0 flex-col">
                
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-100/60 dark:bg-zinc-800/30 backdrop-blur-md shadow-sm"></div>

                <div className="relative flex h-full flex-col p-5">
                  
                  {/* UPDATED: Hover-to-Reveal Column Controls */}
                  <div className="group/col-header mb-6 flex items-center justify-between px-2 pt-2 h-8">
                    {editingColumnId === col.id ? (
                      <input
                        autoFocus
                        className="text-lg font-bold text-zinc-800 dark:text-zinc-100 outline-none bg-transparent border-b-[2px] border-indigo-500 w-full mr-3"
                        value={editedColumnTitle}
                        onChange={(e) => setEditedColumnTitle(e.target.value)}
                        onBlur={() => saveColumnTitle(col.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveColumnTitle(col.id);
                          if (e.key === 'Escape') setEditingColumnId(null);
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-between w-full overflow-hidden">
                        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight truncate pr-2">{col.title}</h2>
                        
                        <div className="flex items-center opacity-0 group-hover/col-header:opacity-100 transition-opacity shrink-0">
                          <button 
                            onClick={() => startEditingColumn(col)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Rename List"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteColumn(col.id)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Delete List"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Hide the card count badge while actively editing to keep the layout clean */}
                    {editingColumnId !== col.id && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 text-[11px] font-extrabold text-zinc-600 dark:text-zinc-300 shadow-sm ml-2 group-hover/col-header:opacity-0 transition-opacity">
                        {col.cards?.length || 0}
                      </span>
                    )}
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className={`flex-1 overflow-y-auto px-1 transition-colors rounded-2xl ${snapshot.isDraggingOver ? 'bg-indigo-50/60 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20 dark:ring-indigo-500/30' : ''}`}
                      >
                        {col.cards?.map((card: any, index: number) => (
                          <Draggable 
                            key={card.id} 
                            draggableId={card.id} 
                            index={index}
                            isDragDisabled={!!lockedCards[card.id] || editingCardId === card.id}
                          >
                            {(provided, snapshot) => {
                              const lockedBy = lockedCards[card.id];
                              const isLockedByOther = !!lockedBy;
                              const isEditingThisCard = editingCardId === card.id;

                              return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`group mb-4 relative flex cursor-grab flex-col justify-center rounded-2xl border bg-white dark:bg-zinc-900 p-5 shadow-sm transition-colors transition-shadow duration-300 active:cursor-grabbing 
                                    ${snapshot.isDragging ? 'scale-105 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] ring-[3px] ring-indigo-500 border-transparent z-[100]' : 'border-zinc-200/60 dark:border-zinc-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'}
                                    ${isLockedByOther ? 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-300 dark:ring-rose-800 bg-rose-50/80 dark:bg-rose-900/20 opacity-80 cursor-not-allowed' : ''}
                                    ${isEditingThisCard ? 'cursor-default ring-[3px] ring-indigo-500 border-transparent shadow-md' : ''}
                                  `}
                                  style={provided.draggableProps.style}
                                >
                                  {isEditingThisCard ? (
                                    <input
                                      autoFocus
                                      className="w-full text-base font-semibold text-zinc-900 dark:text-zinc-50 outline-none bg-transparent"
                                      value={editedCardTitle}
                                      onChange={(e) => setEditedCardTitle(e.target.value)}
                                      onBlur={() => saveCardTitle(col.id, card.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveCardTitle(col.id, card.id);
                                        if (e.key === 'Escape') setEditingCardId(null);
                                      }}
                                    />
                                  ) : (
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-base font-medium leading-relaxed text-zinc-800 dark:text-zinc-200 break-words flex-1">{card.title}</p>
                                      
                                      {!isLockedByOther && (
                                        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); startEditingCard(card); }}
                                            className="rounded-lg p-2 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            title="Edit Card"
                                          >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCard(col.id, card.id); }}
                                            className="rounded-lg p-2 text-zinc-400 dark:text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                            title="Delete Card"
                                          >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {isLockedByOther && (
                                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/60 dark:bg-zinc-950/60 p-2">
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                      </div>
                                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest selection:bg-transparent">
                                        {lockedBy.split('@')[0]} is editing
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <input
                    type="text"
                    placeholder="+ Add a card..."
                    className="mt-4 w-full rounded-2xl border border-transparent bg-white/50 dark:bg-zinc-900/50 p-4 text-sm font-bold text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all hover:bg-white dark:hover:bg-zinc-900 focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-indigo-500/10 focus:shadow-sm"
                    value={newCardTitles[col.id] || ''}
                    onChange={(e) => setNewCardTitles({ ...newCardTitles, [col.id]: e.target.value })}
                    onKeyDown={(e) => handleAddCard(e, col.id)}
                  />
                </div>
              </div>
            ))}

            <div className="w-[340px] shrink-0">
              <input
                type="text"
                placeholder="+ Add another list"
                className="w-full rounded-[2rem] border-[3px] border-dashed border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/50 p-6 text-lg font-bold text-zinc-700 dark:text-zinc-300 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-900 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:focus:shadow-none focus:text-zinc-900 dark:focus:text-zinc-50"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={handleAddColumn}
              />
            </div>
            
          </div>
        </DragDropContext>
      </main>

      {isShareModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-zinc-950/60 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-md rounded-[2rem] bg-white dark:bg-zinc-900 p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-none border border-zinc-100 dark:border-zinc-800">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Share Board</h2>
              <button onClick={() => setIsShareModalOpen(false)} className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-2.5 text-zinc-500 dark:text-zinc-400 transition-all hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:rotate-90">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p className="mb-8 text-base font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">Invite team members via email to collaborate in real-time. They will receive instant access.</p>
            
            <form onSubmit={handleInvite} className="flex flex-col gap-6">
              <div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 text-base font-medium text-zinc-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-indigo-500/10"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                
                {inviteMessage && (
                  <p className={`mt-3 text-sm font-bold ${inviteMessage.includes('successfully') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {inviteMessage}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 py-5 text-base font-extrabold text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] transition-all hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(99,102,241,0.23),0_8px_15px_rgba(99,102,241,0.25)] active:translate-y-0"
              >
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}

      {Object.entries(cursors).map(([socketId, cursorData]) => (
        <div
          key={socketId}
          className="pointer-events-none absolute z-[100] flex flex-col items-start transition-all duration-100 ease-linear"
          style={{ 
            left: cursorData.x, 
            top: cursorData.y,
            transform: 'translate(-2px, -2px)' 
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
            <path d="M5.65376 21.2674L2.59376 3.19744C2.42376 2.22744 3.36376 1.44744 4.26376 1.84744L21.0538 9.38744C21.9938 9.80744 22.0138 11.1474 21.0938 11.5974L14.0738 14.9974L10.6638 22.0274C10.2138 22.9574 8.87376 22.9274 8.46376 21.9974L5.65376 21.2674Z" fill="#4F46E5" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
          </svg>
          <div className="ml-5 mt-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-lg">
            {cursorData.email.split('@')[0]}
          </div>
        </div>
      ))}
    </div>
  );
}