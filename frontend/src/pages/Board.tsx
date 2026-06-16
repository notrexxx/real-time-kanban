import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/boardStore'; 
import { useAuth } from '../context/AuthContext';

export default function Board() {
  const { id } = useParams<{ id: string }>(); 
  const { user } = useAuth(); 
  const navigate = useNavigate(); // NEW: Needed to redirect after deleting a board
  
  const { 
    currentBoard, 
    isLoading, 
    socket, 
    cursors, 
    lockedCards,
    fetchBoardById, 
    createColumn, 
    createCard, 
    moveCard, 
    updateCard,     // NEW
    deleteCard,     // NEW
    updateBoard,    // NEW
    deleteBoard,    // NEW
    addCollaborator, 
    lockCard,
    unlockCard,
    initSocket, 
    disconnectSocket 
  } = useBoardStore();
  
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // NEW: State for Inline Editing
  const [isEditingBoardName, setIsEditingBoardName] = useState(false);
  const [editedBoardName, setEditedBoardName] = useState('');
  
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editedCardTitle, setEditedCardTitle] = useState('');

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

  // --- CRUD HANDLERS ---

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

  // --- END CRUD HANDLERS ---

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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Check if current user is the owner
  const isOwner = currentBoard.user && user?.email === currentBoard.user.email;

  return (
    <div className="flex h-screen flex-col bg-slate-50 relative overflow-hidden" onMouseMove={handleMouseMove}>
      
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 z-10">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-bold text-slate-500 transition-colors hover:text-blue-600">
            ← Dashboard
          </Link>

          {/* Inline Edit for Board Title (Only owner can edit) */}
          {isEditingBoardName ? (
            <input
              autoFocus
              className="text-xl font-bold text-slate-900 outline-none border-b-2 border-blue-500 bg-transparent"
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
              className={`text-xl font-bold text-slate-900 ${isOwner ? 'cursor-text hover:bg-slate-100 rounded px-2 -ml-2 py-0.5 transition-colors' : ''}`}
              title={isOwner ? "Click to edit title" : ""}
            >
              {currentBoard.name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 mr-2">
            
            {currentBoard.user && (
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white shadow-sm" title={`Owner: ${currentBoard.user.email}`}>
                  {currentBoard.user.email[0].toUpperCase()}
                </div>
                {isOnline(currentBoard.user.email) && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                )}
              </div>
            )}

            {currentBoard.collaborators?.map((collab: any) => (
              <div key={collab.id} className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-xs font-bold text-white shadow-sm" title={collab.email}>
                  {collab.email[0].toUpperCase()}
                </div>
                {isOnline(collab.email) && (
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Share
          </button>

          {/* Delete Board Button (Only for Owners) */}
          {isOwner && (
            <button 
              onClick={handleDeleteBoard}
              className="flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
              title="Delete Board"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          )}

        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                      className={`flex-1 overflow-y-auto transition-colors px-1 ${snapshot.isDraggingOver ? 'bg-slate-200/50 rounded-lg' : ''}`}
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
                                className={`group mb-3 relative flex cursor-grab flex-col justify-center rounded-lg border bg-white p-4 shadow-sm transition-all active:cursor-grabbing 
                                  ${snapshot.isDragging ? 'scale-105 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500' : 'hover:border-slate-300 hover:shadow-md'}
                                  ${isLockedByOther ? 'border-red-400 ring-1 ring-red-400 bg-red-50/60 opacity-75 cursor-not-allowed' : 'border-slate-200'}
                                  ${isEditingThisCard ? 'cursor-default ring-2 ring-blue-500 border-blue-500' : ''}
                                `}
                                style={provided.draggableProps.style}
                              >
                                {isEditingThisCard ? (
                                  <input
                                    autoFocus
                                    className="w-full text-sm font-medium text-slate-900 outline-none"
                                    value={editedCardTitle}
                                    onChange={(e) => setEditedCardTitle(e.target.value)}
                                    onBlur={() => saveCardTitle(col.id, card.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveCardTitle(col.id, card.id);
                                      if (e.key === 'Escape') setEditingCardId(null);
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium text-slate-700 break-words flex-1">{card.title}</p>
                                    
                                    {!isLockedByOther && (
                                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); startEditingCard(card); }}
                                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                                          title="Edit Card"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteCard(col.id, card.id); }}
                                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                          title="Delete Card"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isLockedByOther && (
                                  <span className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 selection:bg-transparent">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    {lockedBy.split('@')[0]} is editing
                                  </span>
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

      {isShareModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Share Board</h2>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 transition-colors hover:text-slate-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p className="mb-6 text-sm text-slate-500">Invite team members via email to collaborate in real-time.</p>
            
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email address"
                required
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              
              {inviteMessage && (
                <p className={`text-sm font-medium ${inviteMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
                  {inviteMessage}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cursor Render Engine */}
      {Object.entries(cursors).map(([socketId, cursorData]) => (
        <div
          key={socketId}
          className="pointer-events-none absolute z-40 flex flex-col items-start transition-all duration-75 ease-linear"
          style={{ 
            left: cursorData.x, 
            top: cursorData.y,
            transform: 'translate(-2px, -2px)' 
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.65376 21.2674L2.59376 3.19744C2.42376 2.22744 3.36376 1.44744 4.26376 1.84744L21.0538 9.38744C21.9938 9.80744 22.0138 11.1474 21.0938 11.5974L14.0738 14.9974L10.6638 22.0274C10.2138 22.9574 8.87376 22.9274 8.46376 21.9974L5.65376 21.2674Z" fill="#3B82F6" stroke="white" strokeWidth="2"/>
          </svg>
          <div className="ml-4 mt-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white shadow-md">
            {cursorData.email.split('@')[0]}
          </div>
        </div>
      ))}
    </div>
  );
}