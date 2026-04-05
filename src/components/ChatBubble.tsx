import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, limit } from 'firebase/firestore';
import { Phone, Video, Send, X, Minimize2, Maximize2, User, MessageCircle, Users } from 'lucide-react';
import { playNotificationSound } from '../lib/utils';

export default function ChatBubble({ isOpen, setIsOpen, selectedUser, setSelectedUser }: { 
  isOpen: boolean, 
  setIsOpen: (val: boolean) => void,
  selectedUser: any,
  setSelectedUser: (u: any) => void
}) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const dragControls = useDragControls();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all users to show in selection list, sorted by online status
  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }
    
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Chat Raw users snapshot size:", snapshot.size);
      const users = snapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log(`User ${doc.id}:`, data);
          return { uid: doc.id, ...data };
        })
        .filter(u => u.uid !== user.uid);
      
      console.log("Chat Filtered users count:", users.length);
      
      const sortedUsers = [...users].sort((a: any, b: any) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return 0;
      });
      
      setOnlineUsers(sortedUsers);
    }, (error) => {
      console.error("Chat User Selection Snapshot Error:", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !selectedUser) return;
    
    // Query messages between current user and selected user
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((m: any) => m.participants.includes(selectedUser.uid));
        
      setMessages(msgs);
      
      if (msgs.length > 0 && !isOpen) {
        const lastMsg: any = msgs[msgs.length - 1];
        if (lastMsg.senderId !== user.uid) {
          setHasUnread(true);
          playNotificationSound('message');
        }
      }
      
      setTimeout(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }, 100);
    });
    
    return () => unsubscribe();
  }, [user, selectedUser, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUser) return;
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user?.uid,
        receiverId: selectedUser.uid,
        participants: [user?.uid, selectedUser.uid],
        text: newMsg,
        createdAt: new Date().toISOString(),
        read: false
      });
      setNewMsg('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Floating Bubble */}
      <motion.div 
        drag
        dragControls={dragControls}
        dragMomentum={false}
        className="pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <button 
          onClick={() => {
            setIsOpen(!isOpen);
            setHasUnread(false);
          }}
          className="w-16 h-16 rounded-full bg-dz-purple messenger-bubble flex items-center justify-center relative overflow-hidden group shadow-2xl border-2 border-dz-purple/30"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: hasUnread ? [0, 10, -10, 0] : 0
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-3xl"
          >
            {selectedUser ? (
              <img src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.firstName}&background=a21caf&color=fff`} className="w-full h-full object-cover" />
            ) : (
              hasUnread ? '💬' : '😴'
            )}
          </motion.div>
          
          {hasUnread && (
            <span className="absolute top-0 right-0 bg-dz-red w-5 h-5 rounded-full border-2 border-dz-black flex items-center justify-center text-[10px] font-bold">
              !
            </span>
          )}
        </button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-4 w-[90vw] max-w-[400px] h-[70vh] bg-zinc-900 rounded-3xl border border-dz-purple/50 shadow-2xl pointer-events-auto flex flex-col overflow-hidden"
          >
            {selectedUser ? (
              <>
                {/* Header with Friend Info */}
                <div className="bg-gradient-to-r from-dz-purple to-dz-magenta p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.firstName}+${selectedUser.lastName}&background=a21caf&color=fff`} 
                          alt="" 
                          className="w-12 h-12 rounded-full border-2 border-white/30" 
                        />
                        <span className={cn(
                          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dz-purple",
                          selectedUser.status === 'online' ? "bg-green-500" : "bg-zinc-500"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">
                          {selectedUser.gender === 'female' ? 'الأستاذة' : 'الأستاذ'} {selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email?.split('@')[0] || 'جديد'}
                        </h3>
                        <p className="text-[10px] opacity-90 font-medium">
                          {selectedUser.subject || selectedUser.specialty} • {selectedUser.level} • {selectedUser.wilaya}
                        </p>
                        <p className="text-[9px] opacity-70">
                          الخبرة: {selectedUser.experience} سنوات
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <User className="w-5 h-5" />
                      </button>
                      <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-dz-black/50"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                      <MessageCircle className="w-12 h-12 opacity-20" />
                      <p className="text-sm">ابدأ المحادثة مع {selectedUser.firstName}</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div 
                        key={msg.id || idx}
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.senderId === user?.uid ? "mr-auto items-end" : "ml-auto items-start"
                        )}
                      >
                        <div className={cn(
                          "px-4 py-2 rounded-2xl text-sm",
                          msg.senderId === user?.uid 
                            ? "bg-dz-purple text-white rounded-br-none" 
                            : "bg-zinc-800 text-zinc-200 rounded-bl-none"
                        )}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="اكتب رسالة..."
                    className="flex-1 bg-black/50 border border-zinc-800 rounded-full px-4 py-2 text-sm outline-none focus:border-dz-purple"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="bg-dz-purple p-2 rounded-full hover:scale-110 transition-transform"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col p-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-dz-gold">اختر أستاذاً للدردشة</h3>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {onlineUsers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center space-y-4">
                      <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 opacity-20" />
                      </div>
                      <p className="text-sm font-bold">لا يوجد أساتذة متصلون حالياً</p>
                      <p className="text-xs opacity-60">بمجرد دخول أستاذ آخر سيظهر هنا بنقطة خضراء</p>
                    </div>
                  ) : (
                    onlineUsers.map(u => (
                      <div 
                        key={u.uid}
                        onClick={() => setSelectedUser(u)}
                        className="flex items-center gap-3 p-3 bg-black/30 rounded-2xl hover:bg-dz-purple/10 cursor-pointer transition-colors border border-transparent hover:border-dz-purple/30"
                      >
                        <div className="relative">
                          <img 
                            src={u.photoURL || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=6b21a8&color=fff`} 
                            className="w-12 h-12 rounded-full border border-zinc-800 object-cover"
                          />
                          <span className={cn(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-900",
                            u.status === 'online' ? "bg-green-500" : "bg-zinc-600"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-dz-gold">
                            {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.displayName || 'أستاذ جديد')}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {u.incomplete ? 'بانتظار إكمال الملف' : `${u.subject || u.specialty} • ${u.level}`}
                          </p>
                          <p className="text-[9px] text-zinc-500">
                            {u.incomplete ? 'سجل دخول للتو' : `الخبرة: ${u.experience} سنوات`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
