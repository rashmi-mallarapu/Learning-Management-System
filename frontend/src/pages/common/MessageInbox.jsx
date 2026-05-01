import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    HiSearch, HiFilter, HiPlus, HiChat,
    HiDotsVertical, HiPaperClip, HiPaperAirplane,
    HiEmojiHappy, HiChevronLeft, HiCheckCircle, HiMicrophone,
    HiX, HiLockClosed, HiBadgeCheck
} from 'react-icons/hi';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { fetchInbox, fetchSentMessages, sendMessageAPI, fetchMessageAccessStatus, markMessageAsRead, requestMessageAccess } from '../../services/learnerApi';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';

/* ─── Font settings ────────────────────────────────────────── */
const sora = { fontFamily: "'Sora', sans-serif" };
const mono = { fontFamily: "'DM Mono', monospace" };

/* ══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function MessageInbox() {
    const { user } = useSelector(s => s.auth);
    const location = useLocation();
    const { socket, onlineUsers } = useSocket();
    const recognitionRef = useRef(null);
    const readSyncRef = useRef(new Set());
    const currentUserId = String(user?._id || user?.id || '');
    const [selectedId, setSelectedId] = useState(null);
    const [inputText, setInputText] = useState('');
    const [isStartingNew, setIsStartingNew] = useState(false);
    const [chats, setChats] = useState([]);
    const [messagesMap, setMessagesMap] = useState({});
    const [showOptions, setShowOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [accessStatus, setAccessStatus] = useState('none');
    const [requestingAccess, setRequestingAccess] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [messageSearch, setMessageSearch] = useState('');
    const emojiPickerRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const commonEmojis = ['😀', '😂', '😊', '😍', '👍', '👏', '🙏', '🎉', '🔥', '💯', '📚', '✅'];


    useEffect(() => {
        if (!socket || !currentUserId) return;

        const handleIncomingMessage = ({ message }) => {
            if (!message) return;
            loadMessages({ keepSelection: true });
        };

        socket.on('message:new', handleIncomingMessage);

        return () => {
            socket.off('message:new', handleIncomingMessage);
        };
    }, [currentUserId, socket]);
    const scrollRef = useRef(null);
    const optionsRef = useRef(null);


    const normalizeBackendMessages = (items) => {
        const conversations = new Map();
        const history = new Map();

        items.forEach((msg) => {
            const sender = msg.senderId || msg.sender;
            const receiver = msg.receiverId || msg.receiver;
            const senderId = sender?._id || sender?.id || msg.senderId;
            const receiverId = receiver?._id || receiver?.id || msg.receiverId;
            const isOutgoing = currentUserId && senderId && String(senderId) === String(currentUserId);
            const otherParty = isOutgoing ? receiver : sender;
            const otherPartyId = otherParty?._id || otherParty?.id || (isOutgoing ? receiverId : senderId);

            if (!otherPartyId) return;

            const chatId = String(otherPartyId);
            const existing = conversations.get(chatId) || {
                id: chatId,
                receiverId: chatId,
                name: otherParty?.name || 'User',
                role: otherParty?.role || 'Student',
                status: 'online',
                lastMsg: '',
                time: '',
                unread: 0,
                updatedAt: '',
            };

            const createdAt = msg.createdAt ? new Date(msg.createdAt) : null;
            const time = createdAt
                ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : existing.time;

            existing.lastMsg = msg.subject ? `${msg.subject}: ${msg.content}` : (msg.content || existing.lastMsg);
            existing.time = time || existing.time;
            existing.updatedAt = createdAt?.toISOString?.() || existing.updatedAt;
            if (!isOutgoing && !msg.read) existing.unread += 1;

            conversations.set(chatId, existing);

            const thread = history.get(chatId) || [];
            thread.push({
                id: msg._id || msg.id || `${chatId}-${thread.length}`,
                messageId: msg._id || msg.id || null,
                text: msg.content,
                type: isOutgoing ? 'sent' : 'received',
                time: time || 'Now',
                read: Boolean(msg.read),
            });
            history.set(chatId, thread);
        });

        return {
            chats: Array.from(conversations.values()).sort(
                (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
            ),
            messagesMap: Object.fromEntries(history.entries()),
        };
    };

    const loadMessages = async ({ keepSelection = false } = {}) => {
        try {
            setIsLoadingMessages(true);
            const [inbox, sent] = await Promise.all([fetchInbox(), fetchSentMessages()]);
            const inboxItems = Array.isArray(inbox) ? inbox : [];
            const sentItems = Array.isArray(sent) ? sent : [];
            const merged = [...inboxItems, ...sentItems]
                .filter(Boolean)
                .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

            const normalized = normalizeBackendMessages(merged);
            const preselectedUser = location.state?.selectedUser;
            const preselectedChatId = preselectedUser?.id ? String(preselectedUser.id) : '';

            if (preselectedChatId && !normalized.chats.some((chat) => String(chat.id) === preselectedChatId)) {
                normalized.chats = [
                    {
                        id: preselectedChatId,
                        receiverId: preselectedChatId,
                        name: preselectedUser.name || 'User',
                        role: preselectedUser.role || 'User',
                        status: 'offline',
                        lastMsg: '',
                        time: '',
                        unread: 0,
                    },
                    ...normalized.chats,
                ];
                normalized.messagesMap = {
                    ...normalized.messagesMap,
                    [preselectedChatId]: normalized.messagesMap[preselectedChatId] || [],
                };
            }

            setChats(normalized.chats);
            setMessagesMap(normalized.messagesMap);

            const firstChatId = normalized.chats[0]?.id || null;
            const availableIds = new Set(normalized.chats.map((chat) => String(chat.id)));

            setSelectedId((currentSelectedId) => {
                if (preselectedChatId && availableIds.has(preselectedChatId)) {
                    return preselectedChatId;
                }
                if (keepSelection && currentSelectedId && availableIds.has(String(currentSelectedId))) {
                    return currentSelectedId;
                }
                if (currentSelectedId && availableIds.has(String(currentSelectedId))) {
                    return currentSelectedId;
                }
                return firstChatId;
            });
        } catch (err) {
            console.error('Failed to fetch live messages:', err);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (!currentUserId) return;

        loadMessages();

        const refreshTimer = window.setInterval(() => {
            loadMessages({ keepSelection: true });
        }, 3000);

        const handleFocusRefresh = () => {
            if (document.visibilityState === 'hidden') return;
            loadMessages({ keepSelection: true });
        };

        window.addEventListener('focus', handleFocusRefresh);
        document.addEventListener('visibilitychange', handleFocusRefresh);

        return () => {
            window.clearInterval(refreshTimer);
            window.removeEventListener('focus', handleFocusRefresh);
            document.removeEventListener('visibilitychange', handleFocusRefresh);
        };
    }, [currentUserId, location.state]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target) &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const activeChat = chats.find(c => String(c.id) === String(selectedId));
    const activeMessages = messagesMap[String(selectedId)] || messagesMap[selectedId] || [];
    const currentUserRole = String(user?.role || '').toLowerCase();
    const activeChatRole = String(activeChat?.role || '').toLowerCase();
    const isInstructorChat = activeChatRole === 'instructor';
    const requiresInstructorAccess = currentUserRole === 'learner' && isInstructorChat;

    useEffect(() => {
        const preselectedUser = location.state?.selectedUser;
        if (!preselectedUser?.id) return;
        setSelectedId(String(preselectedUser.id));
        setIsStartingNew(false);
    }, [location.state]);

    useEffect(() => {
        const instructorId = activeChat?.receiverId;
        if (!instructorId || !requiresInstructorAccess) {
            setAccessStatus('approved');
            return;
        }

        fetchMessageAccessStatus(instructorId)
            .then((data) => setAccessStatus(data?.status || 'none'))
            .catch(() => setAccessStatus('none'));
    }, [activeChat?.receiverId, requiresInstructorAccess]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        // Clear unread count for the selected chat only if necessary
        setChats(prev => {
            const hasUnread = prev.some(c => String(c.id) === String(selectedId) && c.unread > 0);
            if (!hasUnread) return prev;
            return prev.map(c =>
                String(c.id) === String(selectedId) ? { ...c, unread: 0 } : c
            );
        });
    }, [activeMessages.length, selectedId]);

    useEffect(() => {
        if (!selectedId || !activeMessages.length) return;

        const unreadReceived = activeMessages.filter(
            (message) => message.type === 'received' && !message.read && message.messageId
        );

        if (!unreadReceived.length) return;

        const pendingMessageIds = unreadReceived
            .map((message) => String(message.messageId))
            .filter((messageId) => !readSyncRef.current.has(messageId));

        if (!pendingMessageIds.length) return;

        pendingMessageIds.forEach((messageId) => readSyncRef.current.add(messageId));

        Promise.all(pendingMessageIds.map((messageId) => markMessageAsRead(messageId).catch(() => null)))
            .then(() => {
                loadMessages({ keepSelection: true });
            })
            .finally(() => {
                pendingMessageIds.forEach((messageId) => readSyncRef.current.delete(messageId));
            });
    }, [activeMessages, selectedId]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (requiresInstructorAccess && accessStatus !== 'approved') {
            toast.error('Request access from the instructor first');
            return;
        }

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (activeChat?.receiverId && currentUserId) {
            const trimmedInput = inputText.trim();
            sendMessageAPI({
                receiverId: activeChat.receiverId,
                subject: `Message from ${user?.name || 'User'}`,
                content: trimmedInput,
            })
                .then(() => {
                    setInputText('');
                    toast.success('Message sent');
                    loadMessages({ keepSelection: true });
                })
                .catch((err) => toast.error(err?.message || 'Failed to send message'));
            return;
        }

        toast.error('Select a valid contact before sending a message');
    };

    const handleRequestAccess = async () => {
        if (!activeChat?.receiverId) return;

        setRequestingAccess(true);
        try {
            await requestMessageAccess(activeChat.receiverId, `Please approve message and call access for ${activeChat.name}.`);
            setAccessStatus('pending');
            toast.success('Access request sent');
        } catch (err) {
            toast.error(err.message || 'Failed to request access');
        } finally {
            setRequestingAccess(false);
        }
    };

    const handleSelectContact = (contact) => {
        setSelectedId(contact.id);
        setIsStartingNew(false);
    };

    const handleEmojiInsert = (emoji) => {
        setInputText((prev) => `${prev}${emoji}`);
        setShowEmojiPicker(false);
    };

    const handleVoiceToggle = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error('Speech recognition is not supported in this browser');
            return;
        }

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;
        let finalTranscript = '';

        recognition.onstart = () => {
            setIsListening(true);
            toast.success('Voice input started');
        };

        recognition.onresult = (event) => {
            finalTranscript = event.results[event.results.length - 1]?.[0]?.transcript?.trim() || '';
        };

        recognition.onerror = () => {
            setIsListening(false);
            recognitionRef.current = null;
            toast.error('Voice input failed');
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
            if (finalTranscript) {
                setInputText((prev) => {
                    const separator = prev.trim() ? ' ' : '';
                    return `${prev}${separator}${finalTranscript}`.trim();
                });
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const filteredChats = chats.filter((chat) => {
        if (!messageSearch.trim()) return true;
        const searchValue = messageSearch.toLowerCase();
        return (
            String(chat.name || '').toLowerCase().includes(searchValue) ||
            String(chat.role || '').toLowerCase().includes(searchValue)
        );
    });

    return (
        <div className="flex h-[calc(100vh-160px)] bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden" style={sora}>

            {/* ── Sidebar: Contact List ────────────────────────── */}
            <aside className="w-80 md:w-96 border-r border-slate-100 flex flex-col bg-slate-50/30">

                {/* Search & Actions */}
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Messages</h2>
                        {!isStartingNew ? (
                            <button
                                onClick={() => setIsStartingNew(true)}
                                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                            >
                                <HiPlus className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={() => setIsStartingNew(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <HiX className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="relative group">
                        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                        <input
                            value={messageSearch}
                            onChange={(e) => setMessageSearch(e.target.value)}
                            placeholder="Find a contact..."
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Feed / New Message Selection */}
                <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
                    {isStartingNew ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Select Contact</p>
                            {filteredChats.map(contact => (
                                <div
                                    key={contact.id}
                                    onClick={() => handleSelectContact(contact)}
                                    className="p-4 rounded-[24px] cursor-pointer flex items-center gap-4 bg-white border border-indigo-50 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                                >
                                    <Avatar name={contact.name} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-slate-900 truncate">{contact.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{contact.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        filteredChats.map((chat, idx) => (
                            <div
                                key={`${chat.id}-${idx}`}
                                onClick={() => setSelectedId(chat.id)}
                                className={clsx(
                                    "p-4 rounded-[24px] cursor-pointer flex items-center gap-4 transition-all duration-300 group focus:outline-none",
                                    selectedId === chat.id
                                        ? "bg-white shadow-xl shadow-indigo-100/20 ring-1 ring-slate-100"
                                        : "hover:bg-white hover:shadow-lg hover:shadow-slate-100"
                                )}
                            >
                                <div className="relative">
                                    <Avatar name={chat.name} size="md" className="ring-2 ring-slate-50 group-hover:ring-indigo-50 transition-all" />
                                    {onlineUsers?.has(String(chat.id)) && !chat.isBlocked ? (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full">
                                            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
                                        </span>
                                    ) : (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-slate-300 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className={clsx("text-sm font-black truncate", chat.unread > 0 ? "text-slate-900" : "text-slate-600")}>
                                            {chat.name}
                                        </h3>
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest" style={mono}>{chat.time}</span>
                                    </div>
                                    <p className={clsx("text-xs truncate font-medium", chat.unread > 0 ? "text-indigo-600/80" : "text-slate-400")}>
                                        {chat.lastMsg}
                                    </p>
                                </div>
                                {chat.unread > 0 && (
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-indigo-100">
                                        {chat.unread}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* ── Main Chat Area ──────────────────────────────── */}
            <main className="flex-1 flex flex-col bg-white">
                {/* Header */}
                <header className="px-10 py-5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Avatar name={activeChat?.name} size="md" className="ring-4 ring-white shadow-sm" />
                        <div>
                            <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-1">
                                {activeChat?.name}
                                <HiBadgeCheck className="text-emerald-500 w-5 h-5 ml-0.5" />
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={clsx(
                                    "w-2 h-2 rounded-full",
                                    (activeChat?.status === 'online' && !activeChat?.isBlocked) ? "bg-emerald-500" : "bg-slate-300"
                                )} />
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{activeChat?.role}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 relative" ref={optionsRef}>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-3 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-xl hover:bg-indigo-50"
                        >
                            <HiDotsVertical className="w-5 h-5" />
                        </button>

                        {/* Options Dropdown */}
                        {showOptions && (
                            <div className="absolute right-0 top-16 w-56 bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-100/50 p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => {
                                        loadMessages({ keepSelection: true });
                                        toast.success('Chat refreshed from server.');
                                        setShowOptions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors uppercase tracking-widest"
                                >
                                    <HiX className="w-4 h-4 text-slate-400" /> Refresh Chat
                                </button>
                                <button
                                    onClick={() => {
                                        setChats(prev => prev.map(c =>
                                            c.id === selectedId ? { ...c, isBlocked: !c.isBlocked } : c
                                        ));
                                        if (activeChat?.isBlocked) {
                                            toast.success(`${activeChat?.name} has been unblocked.`);
                                        } else {
                                            toast.error(`${activeChat?.name} has been blocked.`);
                                        }
                                        setShowOptions(false);
                                    }}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-3 text-xs font-black rounded-2xl transition-colors uppercase tracking-widest",
                                        activeChat?.isBlocked ? "text-emerald-600 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"
                                    )}
                                >
                                    {activeChat?.isBlocked ? (
                                        <><HiCheckCircle className="w-4 h-4" /> Unblock User</>
                                    ) : (
                                        <><HiLockClosed className="w-4 h-4" /> Block User</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Messages Panel */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/20 custom-scrollbar scroll-smooth"
                >
                    {isLoadingMessages && activeMessages.length === 0 ? (
                        <div className="text-sm font-bold text-slate-400">Loading messages...</div>
                    ) : !activeChat ? (
                        <div className="text-sm font-bold text-slate-400">Select a contact to open the conversation.</div>
                    ) : activeMessages.length === 0 ? (
                        <div className="text-sm font-bold text-slate-400">No messages yet. Send the first message to start this chat.</div>
                    ) : activeMessages.map((msg, idx) => (
                        <div key={`${msg.id}-${idx}`} className={clsx("flex flex-col group animate-in slide-in-from-bottom-2 duration-300", msg.type === 'sent' ? "items-end" : "items-start")}>
                            <div className={clsx(
                                "max-w-[75%] px-6 py-4 text-sm font-medium shadow-sm transition-all duration-300",
                                msg.type === 'sent'
                                    ? "bg-indigo-600 text-white rounded-[24px] rounded-tr-none shadow-indigo-100"
                                    : "bg-white border border-slate-100 text-slate-700 rounded-[24px] rounded-tl-none group-hover:shadow-md"
                            )}>
                                {msg.text}
                            </div>
                            <div className="flex items-center gap-2 mt-2 px-1">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest" style={mono}>{msg.time}</span>
                                {msg.type === 'sent' && <HiCheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                            </div>
                        </div>
                    ))}
                    <div className="relative py-10">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100/50"></div></div>
                        <div className="relative flex justify-center">
                            <span className="bg-white/80 backdrop-blur-sm px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Secure end-to-end learning channel</span>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <footer className="p-8 border-t border-slate-50 bg-white">
                    {requiresInstructorAccess && accessStatus !== 'approved' ? (
                        <div className="max-w-4xl mx-auto p-6 bg-amber-50 border border-amber-200 rounded-[28px] text-center space-y-3">
                            <div className="flex items-center justify-center gap-2 text-amber-700">
                                <HiLockClosed className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {accessStatus === 'pending' ? 'Request pending' : 'Access required'}
                                </span>
                            </div>
                            <p className="text-xs text-amber-700/80 font-medium">
                                {accessStatus === 'pending'
                                    ? 'The instructor has not approved your request yet.'
                                    : 'Request access to start messaging or calling this instructor.'}
                            </p>
                            <Button
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={handleRequestAccess}
                                disabled={requestingAccess}
                            >
                                {requestingAccess ? 'Requesting...' : 'Request Access'}
                            </Button>
                        </div>
                    ) : activeChat?.isBlocked ? (
                        <div className="max-w-4xl mx-auto p-6 bg-slate-50 border border-slate-100 rounded-[28px] text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-rose-500">
                                <HiLockClosed className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Chat Restricted</span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">You have blocked this user. Unblock them to resume the conversation.</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50/50 border border-slate-100 p-2 rounded-[28px] focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white transition-all">
                            <button className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><HiPaperClip className="w-6 h-6" /></button>
                            <input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                placeholder="Share an insight or ask a question..."
                            />
                            <div className="flex items-center gap-1 pr-1">
                                <button
                                    onClick={handleVoiceToggle}
                                    className={clsx(
                                        "p-3 transition-colors",
                                        isListening ? "text-rose-500" : "text-slate-400 hover:text-indigo-600"
                                    )}
                                >
                                    <HiMicrophone className="w-6 h-6" />
                                </button>
                                <div className="relative">
                                    <button
                                        ref={emojiButtonRef}
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                        className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <HiEmojiHappy className="w-6 h-6" />
                                    </button>
                                    {showEmojiPicker && (
                                        <div
                                            ref={emojiPickerRef}
                                            className="absolute bottom-14 right-0 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
                                        >
                                            <div className="grid grid-cols-4 gap-2">
                                                {commonEmojis.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleEmojiInsert(emoji)}
                                                        className="rounded-xl p-2 text-xl hover:bg-slate-100 transition-colors"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSend}
                                    className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-orange-500 shadow-xl shadow-indigo-100 hover:shadow-orange-100 transition-all hover:scale-105 active:scale-95"
                                >
                                    <HiPaperAirplane className="w-6 h-6 rotate-90" />
                                </button>
                            </div>
                        </div>
                    )}
                </footer>
            </main>

        </div>
    );
}
