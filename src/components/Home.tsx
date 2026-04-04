import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove, getDocs, where, limit } from 'firebase/firestore';
import { 
  Bell, MessageCircle, UserPlus, LogOut, Users, MoreHorizontal, 
  Heart, MessageSquare, Share2, Send, Smile, ThumbsUp, Laugh, Frown, Angry, Zap,
  Settings, Edit2, Trash2, Globe, Lock, User as UserIcon, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { playNotificationSound, cn } from '../lib/utils';
import ChatBubble from './ChatBubble';
import { WILAYAS, SPECIALTIES, LEVELS } from '../constants';

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUsersListOpen, setIsUsersListOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'online'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOnlineUsers(snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter(u => u.uid !== user?.uid)
      );
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!authLoading && profile?.incomplete) {
      setIsProfileOpen(true);
    }
  }, [profile, authLoading]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user?.uid,
        authorName: profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : (user?.displayName || 'أستاذ'),
        authorPhoto: profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${profile?.firstName || 'User'}+${profile?.lastName || ''}&background=6b21a8&color=fff`,
        content: newPost,
        createdAt: new Date().toISOString(),
        reactions: {},
        commentsCount: 0,
        privacy: 'public'
      });
      setNewPost('');
      playNotificationSound('notification');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dz-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-zinc-800 rounded-full text-dz-red transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1 cursor-pointer hover:text-dz-purple transition-colors">
              <Users className="w-5 h-5 text-zinc-500" />
              <span className="text-xs text-zinc-500">تبديل الحساب</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div 
              onClick={() => setIsUsersListOpen(true)}
              className="relative cursor-pointer group"
            >
              <UserPlus className="w-7 h-7 text-zinc-400 group-hover:text-dz-purple transition-colors" />
              {onlineUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-zinc-900">
                  {onlineUsers.length}
                </span>
              )}
            </div>
            <div 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="relative cursor-pointer group"
            >
              <MessageCircle className="w-7 h-7 text-zinc-400 group-hover:text-dz-purple transition-colors" />
            </div>
            <div className="relative cursor-pointer group">
              <Bell className="w-7 h-7 text-zinc-400 group-hover:text-dz-purple transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">
                {profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : (user?.displayName || '...')}
              </p>
              <p className="text-[10px] text-zinc-500">
                {profile?.specialty ? `${profile.specialty} - ${profile.level}` : 'جاري التحميل...'}
              </p>
            </div>
            <img 
              src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${profile?.firstName || 'User'}&background=6b21a8&color=fff`} 
              alt="Profile" 
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 rounded-full border-2 border-dz-purple object-cover cursor-pointer hover:scale-110 transition-transform active:scale-95"
            />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Create Post */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <div className="flex gap-3 mb-4">
            <img 
              src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${profile?.firstName || 'User'}&background=6b21a8&color=fff`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full"
            />
            <textarea 
              placeholder={`بماذا تفكر يا ${profile?.gender === 'female' ? 'أستاذة' : 'أستاذ'} ${profile?.lastName || ''}؟`}
              className="flex-1 bg-black/30 rounded-xl p-3 text-sm outline-none border border-transparent focus:border-dz-purple/50 resize-none min-h-[80px]"
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-zinc-500 hover:text-dz-purple text-sm">
                <Smile className="w-5 h-5" /> شعور
              </button>
            </div>
            <button 
              onClick={handleCreatePost}
              disabled={loading || !newPost.trim()}
              className="bg-dz-purple hover:bg-dz-purple/80 text-white px-6 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
            >
              نشر
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>

      <ChatBubble 
        isOpen={isChatOpen} 
        setIsOpen={setIsChatOpen} 
        selectedUser={selectedChatUser}
        setSelectedUser={setSelectedChatUser}
      />

      {/* Users List Modal */}
      <AnimatePresence>
        {isUsersListOpen && (
          <UsersListModal 
            onClose={() => setIsUsersListOpen(false)} 
            onSelectUser={(u) => {
              setSelectedChatUser(u);
              setIsChatOpen(true);
              setIsUsersListOpen(false);
            }}
            onlineUsers={onlineUsers}
          />
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal onClose={() => setIsProfileOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function UsersListModal({ onClose, onSelectUser, onlineUsers }: any) {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-dz-purple/30 rounded-3xl p-6 w-full max-w-md h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-dz-gold">الأساتذة المتصلون</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-10 text-zinc-500">جاري البحث عن أساتذة...</div>
          ) : allUsers.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">لا يوجد أساتذة مسجلون حالياً</div>
          ) : (
            allUsers.map(u => (
              <div 
                key={u.uid}
                onClick={() => onSelectUser(u)}
                className="flex items-center justify-between p-3 bg-black/30 rounded-2xl hover:bg-dz-purple/10 cursor-pointer transition-colors border border-transparent hover:border-dz-purple/30"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={u.photoURL || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=6b21a8&color=fff`} 
                      className="w-12 h-12 rounded-full border border-zinc-800"
                    />
                    <span className={cn(
                      "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-900",
                      u.status === 'online' ? "bg-green-500" : "bg-zinc-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{u.firstName} {u.lastName}</p>
                    <p className="text-[10px] text-zinc-500">{u.specialty} | {u.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[8px] px-2 py-0.5 rounded-full",
                    u.status === 'online' ? "bg-green-500/20 text-green-500" : "bg-zinc-500/20 text-zinc-500"
                  )}>
                    {u.status === 'online' ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({ 
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    wilaya: profile?.wilaya || WILAYAS[0],
    specialty: profile?.specialty || SPECIALTIES[0],
    level: profile?.level || LEVELS[0],
    experience: profile?.experience || 0,
    gender: profile?.gender || 'male'
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        ...formData,
        incomplete: false
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isIncomplete = profile?.incomplete;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-dz-purple/30 rounded-3xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-dz-gold">
            {isIncomplete ? 'أكمل معلومات الأستاذ' : 'تعديل الملف الشخصي'}
          </h3>
          {!isIncomplete && (
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-6 h-6" /></button>
          )}
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" placeholder="الاسم" required className="bg-black/50 border border-zinc-800 rounded-xl p-2.5 outline-none focus:border-dz-purple"
              value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
            <input 
              type="text" placeholder="اللقب" required className="bg-black/50 border border-zinc-800 rounded-xl p-2.5 outline-none focus:border-dz-purple"
              value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
          <select 
            className="w-full bg-black/50 border border-zinc-800 rounded-xl p-2.5 outline-none focus:border-dz-purple"
            value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}
          >
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <select 
              className="bg-black/50 border border-zinc-800 rounded-xl p-2.5 outline-none focus:border-dz-purple"
              value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}
            >
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              className="bg-black/50 border border-zinc-800 rounded-xl p-2.5 outline-none focus:border-dz-purple"
              value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" placeholder="سنوات الخبرة" required className="w-full bg-black/50 border border-zinc-800 rounded-xl p-2.5 outline-none focus:border-dz-purple"
              value={formData.experience || ''} onChange={e => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
            />
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setFormData({...formData, gender: 'male'})}
                className={cn("flex-1 rounded-xl border text-xs", formData.gender === 'male' ? "border-dz-purple bg-dz-purple/20" : "border-zinc-800")}
              >
                ذكر
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, gender: 'female'})}
                className={cn("flex-1 rounded-xl border text-xs", formData.gender === 'female' ? "border-dz-magenta bg-dz-magenta/20" : "border-zinc-800")}
              >
                أنثى
              </button>
            </div>
          </div>
          <button 
            disabled={loading}
            className="w-full bg-dz-purple py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
          >
            {isIncomplete ? 'إتمام التسجيل' : 'حفظ التغييرات'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function PostCard({ post }: any) {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isShort = post.content.length < 100;
  
  const handleReaction = async (type: string) => {
    const postRef = doc(db, 'posts', post.id);
    const currentReactions = post.reactions || {};
    const userReaction = currentReactions[user?.uid || ''];

    if (userReaction === type) {
      const updated = { ...currentReactions };
      delete updated[user?.uid || ''];
      await updateDoc(postRef, { reactions: updated });
    } else {
      await updateDoc(postRef, {
        [`reactions.${user?.uid}`]: type
      });
      playNotificationSound('notification');
    }
    setShowReactions(false);
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      await deleteDoc(doc(db, 'posts', post.id));
    }
  };

  const reactionIcons: any = {
    like: <ThumbsUp className="w-4 h-4 text-blue-500" />,
    love: <Heart className="w-4 h-4 text-dz-red fill-dz-red" />,
    haha: <Laugh className="w-4 h-4 text-dz-yellow" />,
    wow: <Zap className="w-4 h-4 text-dz-magenta" />,
    sad: <Frown className="w-4 h-4 text-dz-gold" />,
    angry: <Angry className="w-4 h-4 text-dz-red" />
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}&background=6b21a8&color=fff`} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <h4 className="text-sm font-bold">
              {(!post.authorName || post.authorName === 'undefined undefined') ? 'أستاذ جزائري' : post.authorName}
            </h4>
            <p className="text-[10px] text-zinc-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}
            </p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute left-0 top-full mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden"
              >
                {post.authorId === user?.uid && (
                  <>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors">
                      <Edit2 className="w-4 h-4" /> تعديل المنشور
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-700 text-dz-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> حذف المنشور
                    </button>
                  </>
                )}
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors">
                  <Globe className="w-4 h-4" /> تعديل الخصوصية
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={cn(
        "px-6 py-8 text-center",
        isShort ? "bg-gradient-to-br from-dz-purple/40 to-dz-magenta/40 text-xl font-bold" : "text-right text-sm leading-relaxed bg-black/20"
      )}>
        {post.content}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
          <div className="flex items-center gap-1">
            {Object.values(post.reactions || {}).length > 0 && <ThumbsUp className="w-3 h-3 text-dz-purple" />}
            <span>{Object.values(post.reactions || {}).length} تفاعل</span>
          </div>
          <span>{post.commentsCount} تعليق</span>
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="flex-1 relative">
            <button 
              onMouseEnter={() => setShowReactions(true)}
              className="w-full flex items-center justify-center gap-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-sm"
            >
              {post.reactions?.[user?.uid || ''] ? reactionIcons[post.reactions[user!.uid]] : <ThumbsUp className="w-5 h-5" />}
              <span>تفاعل</span>
            </button>

            <AnimatePresence>
              {showReactions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -50, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onMouseLeave={() => setShowReactions(false)}
                  className="absolute bottom-full left-0 bg-zinc-800 p-2 rounded-full flex gap-3 shadow-2xl border border-zinc-700 z-20"
                >
                  {Object.keys(reactionIcons).map(type => (
                    <button 
                      key={type}
                      onClick={() => handleReaction(type)}
                      className="hover:scale-150 transition-transform p-1"
                    >
                      {reactionIcons[type]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-sm">
            <MessageSquare className="w-5 h-5" />
            <span>تعليق</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-sm">
            <Share2 className="w-5 h-5" />
            <span>مشاركة</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
