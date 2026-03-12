/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Music, 
  Instagram, 
  Facebook, 
  Twitter,
  Menu,
  X,
  Send,
  Globe,
  Share2,
  Trash2,
  Check,
  ChevronUp,
  AlertCircle,
  LogOut,
  LogIn,
  Youtube,
  Upload
} from 'lucide-react';
import { Track } from './types';
import { supabase, loginWithGoogle, logout, handleSupabaseError, OperationType } from './supabase';
import { User } from '@supabase/supabase-js';

// Translations
const translations = {
  en: {
    nav: { home: 'Home', music: 'Music', bio: 'Bio', contact: 'Contact' },
    hero: { subtitle: 'Composer • Arranger • Producer' },
    music: { title: 'LATEST RELEASES', subtitle: 'Original Compositions & Arrangements', share: 'Share' },
    bio: { 
      title: 'THE ARTIST', 
      subtitle: 'ZOZA El-Sheikh is a visionary composer and music producer based in Egypt. With a deep passion for cinematic soundscapes and ethnic fusion, he creates immersive musical experiences that transcend boundaries.',
      details: 'Specializing in film scoring, commercial jingles, and modern arrangements, ZOZA brings a unique blend of traditional Middle Eastern soul and contemporary electronic textures to every project.'
    },
    contact: { 
      title: 'WORK WITH ME', 
      subtitle: "Looking for a custom composition, arrangement, or professional music production? Let's bring your vision to life.",
      name: 'Full Name',
      email: 'Email Address',
      subject: 'Subject',
      message: 'Message',
      send: 'SEND MESSAGE',
      placeholderName: 'John Doe',
      placeholderEmail: 'john@example.com',
      placeholderSubject: 'Music Production Inquiry',
      placeholderMessage: 'Tell me about your project...'
    },
    footer: { rights: 'ALL RIGHTS RESERVED.' },
    toast: { copied: 'Link copied to clipboard!' }
  },
  ar: {
    nav: { home: 'الرئيسية', music: 'الموسيقى', bio: 'عني', contact: 'تواصل معي' },
    hero: { subtitle: 'مؤلف • موزع • منتج موسيقي' },
    music: { title: 'أحدث الأعمال', subtitle: 'ألحان وتوزيعات أصلية', share: 'مشاركة' },
    bio: { 
      title: 'عن الفنان', 
      subtitle: 'زوزا الشيخ مؤلف ومنتج موسيقي صاحب رؤية، مقره مصر. مع شغف عميق بالموسيقى التصويرية والدمج العرقي، يخلق تجارب موسيقية غامرة تتجاوز الحدود.',
      details: 'متخصص في التأليف الموسيقي للأفلام، الإعلانات، والتوزيعات الحديثة، يقدم زوزا مزيجاً فريداً من الروح الشرقية التقليدية واللمسات الإلكترونية المعاصرة في كل مشروع.'
    },
    contact: { 
      title: 'اطلب عملك الموسيقي', 
      subtitle: 'هل تبحث عن تأليف موسيقي خاص، توزيع، أو إنتاج موسيقي احترافي؟ دعنا نحول رؤيتك إلى واقع.',
      name: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      subject: 'الموضوع',
      message: 'الرسالة',
      send: 'إرسال الرسالة',
      placeholderName: 'الاسم هنا',
      placeholderEmail: 'بريدك الإلكتروني',
      placeholderSubject: 'استفسار عن إنتاج موسيقي',
      placeholderMessage: 'أخبرني عن مشروعك...'
    },
    footer: { rights: 'جميع الحقوق محفوظة.' },
    toast: { copied: 'تم نسخ الرابط!' }
  }
};

// Mock data
const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Midnight Echoes',
    artist: 'ZOZA El-Sheikh',
    coverurl: 'https://picsum.photos/seed/music1/400/400',
    audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '6:12',
    genre: 'Cinematic'
  },
  {
    id: '2',
    title: 'Desert Wind',
    artist: 'ZOZA El-Sheikh',
    coverurl: 'https://picsum.photos/seed/music2/400/400',
    audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '7:05',
    genre: 'Ethnic'
  },
  {
    id: '3',
    title: 'Urban Pulse',
    artist: 'ZOZA El-Sheikh',
    coverurl: 'https://picsum.photos/seed/music3/400/400',
    audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: '5:45',
    genre: 'Electronic'
  }
];

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [contacts, setContacts] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      const isUserAdmin = user?.email?.toLowerCase() === 'karikaturi111@gmail.com';
      setIsAdmin(isUserAdmin);
      setIsAuthReady(true);
      if (isUserAdmin) {
        setToast('Welcome back, Admin!');
        setTimeout(() => setToast(null), 5000);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      setIsAdmin(user?.email?.toLowerCase() === 'karikaturi111@gmail.com');
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch tracks from Supabase
  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'tracks');
      } else if (data) {
        setTracks(data as Track[]);
      }
    };

    fetchTracks();

    // Real-time subscription
    const channel = supabase
      .channel('tracks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, () => {
        fetchTracks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch contacts if admin
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'contacts');
      } else if (data) {
        setContacts(data);
      }
    };

    fetchContacts();

    // Real-time subscription
    const channel = supabase
      .channel('contacts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.style.scrollBehavior = 'smooth';
  }, [lang, isRtl]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const handleTrackSelect = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (Number(e.target.value) / 100) * (audioRef.current?.duration || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
    }
  };

  const handleShare = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#track-${track.id}`;
    navigator.clipboard.writeText(url);
    setToast(t.toast.copied);
    setTimeout(() => setToast(null), 3000);
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const contactData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string
    };

    try {
      // 1. Save to Supabase (for admin panel)
      const { error } = await supabase
        .from('contacts')
        .insert([contactData]);
      
      if (error) throw error;
      
      // 2. Submit to Formspree (silent)
      const response = await fetch("https://formspree.io/f/xwvrooeg", {
        method: "POST",
        body: JSON.stringify({
          name: contactData.name,
          email: contactData.email,
          subject: contactData.subject,
          message: contactData.message
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error("Formspree error:", await response.text());
      }

      setIsSubmitting(false);
      setShowSuccessModal(true);
      form.reset();
    } catch (error) {
      setIsSubmitting(false);
      handleSupabaseError(error, OperationType.CREATE, 'contacts');
    }
  };

  const genres = ['All', ...new Set(tracks.map(t => t.genre))];
  const filteredTracks = selectedGenre && selectedGenre !== 'All' 
    ? tracks.filter(t => t.genre === selectedGenre)
    : tracks;

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 ${isRtl ? 'font-arabic' : ''}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] glass-morphism px-6 py-3 rounded-full flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Check size={16} className="text-emerald-400" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full glass-morphism flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">ZOZA <span className="text-white/40">EL-SHEIKH</span></div>
        
        <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse text-sm font-medium uppercase tracking-widest">
          <a href="#home" className="hover:text-white/60 transition-colors">{t.nav.home}</a>
          <a href="#music" className="hover:text-white/60 transition-colors">{t.nav.music}</a>
          <a href="#bio" className="hover:text-white/60 transition-colors">{t.nav.bio}</a>
          <a href="#contact" className="hover:text-white/60 transition-colors">{t.nav.contact}</a>
          <button 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center space-x-2 rtl:space-x-reverse bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <Globe size={14} />
            <span className="text-[10px]">{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col space-y-8 text-3xl font-light">
              <a href="#home" onClick={() => setIsMenuOpen(false)}>{t.nav.home}</a>
              <a href="#music" onClick={() => setIsMenuOpen(false)}>{t.nav.music}</a>
              <a href="#bio" onClick={() => setIsMenuOpen(false)}>{t.nav.bio}</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)}>{t.nav.contact}</a>
              <button 
                onClick={() => { setLang(lang === 'en' ? 'ar' : 'en'); setIsMenuOpen(false); }}
                className="text-xl text-white/40"
              >
                {lang === 'en' ? 'العربية' : 'English'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        {tracks.length === 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="bg-white text-black p-8 rounded-3xl text-center max-w-md shadow-2xl border-4 border-white">
              <h2 className="text-2xl font-bold mb-4">قاعدة البيانات فارغة!</h2>
              <p className="mb-6 text-gray-600">إضغط على الزر أدناه لإضافة 12 مقطوعة موسيقية لـ ZOZA تلقائياً في قاعدة بيانات Supabase الخاصة بك.</p>
              <button 
                onClick={async () => {
                  const sampleTracks = [
                    { title: 'Desert Mirage', artist: 'ZOZA', genre: 'Ethnic Fusion', duration: '4:20', coverurl: 'https://picsum.photos/seed/desert/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                    { title: 'Cairo Nights', artist: 'ZOZA', genre: 'Cinematic', duration: '3:45', coverurl: 'https://picsum.photos/seed/cairo/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
                    { title: 'Nile Echoes', artist: 'ZOZA', genre: 'Ambient', duration: '5:12', coverurl: 'https://picsum.photos/seed/nile/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
                    { title: 'Ancient Secrets', artist: 'ZOZA', genre: 'Orchestral', duration: '4:50', coverurl: 'https://picsum.photos/seed/ancient/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
                    { title: 'Urban Pulse', artist: 'ZOZA', genre: 'Electronic', duration: '3:30', coverurl: 'https://picsum.photos/seed/urban/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
                    { title: 'Golden Hour', artist: 'ZOZA', genre: 'Chillout', duration: '4:15', coverurl: 'https://picsum.photos/seed/golden/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
                    { title: 'Mystical Journey', artist: 'ZOZA', genre: 'World', duration: '6:05', coverurl: 'https://picsum.photos/seed/mystic/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
                    { title: 'Sandstorm', artist: 'ZOZA', genre: 'Dramatic', duration: '3:55', coverurl: 'https://picsum.photos/seed/sand/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
                    { title: 'Oasis Dream', artist: 'ZOZA', genre: 'New Age', duration: '4:40', coverurl: 'https://picsum.photos/seed/oasis/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
                    { title: 'Midnight in Giza', artist: 'ZOZA', genre: 'Jazz Fusion', duration: '5:25', coverurl: 'https://picsum.photos/seed/giza/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
                    { title: 'Eternal Spirit', artist: 'ZOZA', genre: 'Spiritual', duration: '7:10', coverurl: 'https://picsum.photos/seed/spirit/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
                    { title: 'Beyond Horizon', artist: 'ZOZA', genre: 'Epic', duration: '4:35', coverurl: 'https://picsum.photos/seed/horizon/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
                  ];
                  try {
                    const { error } = await supabase.from('tracks').insert(sampleTracks);
                    if (error) throw error;
                    alert('تم إضافة 12 مقطوعة بنجاح! سيتم تحديث الصفحة الآن.');
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    alert('خطأ في الإضافة. تأكد أن الجدول "tracks" موجود في Supabase وأن RLS معطل.');
                  }
                }}
                className="w-full bg-black text-white px-6 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-xl"
              >
                إضغط هنا لإضافة 12 مقطوعة لـ ZOZA
              </button>
              <p className="mt-4 text-[10px] text-gray-400">ملاحظة: لا تضغط على Admin Login حتى يتم تفعيل Google Auth من لوحة تحكم Supabase.</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://l.top4top.io/p_3722wp7nd1.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-9xl font-bold tracking-tighter mb-6"
          >
            ZOZA <br className="md:hidden" /> EL-SHEIKH
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto uppercase tracking-[0.3em] font-light mb-12"
          >
            {t.hero.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <a 
              href="#music" 
              className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              {lang === 'en' ? 'LISTEN NOW' : 'استمع الآن'}
            </a>
            <button className="px-8 py-4 glass-morphism border border-white/10 font-bold rounded-full hover:bg-white/10 transition-colors">
              {lang === 'en' ? 'FOLLOW ARTIST' : 'تابع الفنان'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Music Section */}
      <section id="music" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-2">{t.music.title}</h2>
            <p className="text-white/40 uppercase tracking-widest text-xs">{t.music.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${
                  (selectedGenre === genre || (genre === 'All' && !selectedGenre))
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredTracks.map((track) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={track.id}
                whileHover={{ y: -10 }}
                className="group relative glass-morphism rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => handleTrackSelect(track)}
              >
              <div className="aspect-square overflow-hidden relative">
                {track.id === '1' && (
                  <div className="absolute top-4 left-4 z-10 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                    {lang === 'en' ? 'Featured' : 'مميز'}
                  </div>
                )}
                <img 
                  src={track.coverurl} 
                  alt={track.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center">
                    {currentTrack?.id === track.id && isLoading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full"
                      />
                    ) : (
                      currentTrack?.id === track.id && isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className={`${isRtl ? 'mr-1' : 'ml-1'}`} />
                    )}
                  </div>
                </div>
                <button 
                  onClick={(e) => handleShare(e, track)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-black transition-all opacity-0 group-hover:opacity-100"
                >
                  <Share2 size={16} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xl font-bold tracking-tight">{track.title}</h3>
                  <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded">{track.genre}</span>
                </div>
                <p className="text-white/40 text-sm">{track.artist}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>

      {/* Bio Section */}
      <section id="bio" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-4xl font-bold tracking-tight mb-6">{t.bio.title}</h2>
            <p className="text-xl text-white/80 mb-6 leading-relaxed">
              {t.bio.subtitle}
            </p>
            <p className="text-white/40 leading-relaxed">
              {t.bio.details}
            </p>
          </div>
          <div className="order-1 md:order-2 aspect-[4/5] rounded-3xl overflow-hidden glass-morphism p-2">
            <img 
              src="https://l.top4top.io/p_3722wp7nd1.png" 
              alt="ZOZA El-Sheikh" 
              className="w-full h-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.contact.title}</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              {t.contact.subtitle}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleContactSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/40">{t.contact.name}</label>
                  <input 
                    required
                    name="name"
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder={t.contact.placeholderName}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/40">{t.contact.email}</label>
                  <input 
                    required
                    name="email"
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder={t.contact.placeholderEmail}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-white/40">{t.contact.subject}</label>
                <input 
                  required
                  name="subject"
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder={t.contact.placeholderSubject}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-white/40">{t.contact.message}</label>
                <textarea 
                  required
                  name="message"
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40 transition-colors resize-none"
                  placeholder={t.contact.placeholderMessage}
                />
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full"
                  />
                ) : (
                  <>
                    <span>{t.contact.send}</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="space-y-6">
            <div className="text-2xl font-bold tracking-tighter">ZOZA <span className="text-white/40">EL-SHEIKH</span></div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              {lang === 'en' ? 'Creating cinematic soundscapes and modern arrangements that transcend boundaries.' : 'خلق مساحات صوتية سينمائية وتوزيعات حديثة تتجاوز الحدود.'}
            </p>
            <div className="flex justify-center md:justify-start space-x-6 rtl:space-x-reverse">
              <a href="https://instagram.com/zozaelkedd" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="https://facebook.com/zozaelkedd" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="https://x.com/zozaelkedd" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="https://tiktok.com/@zozaelkedd" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors"><Music size={20} /></a>
              <a href="https://www.youtube.com/@zozaelkedd" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors"><Youtube size={20} /></a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-white/60">{lang === 'en' ? 'QUICK LINKS' : 'روابط سريعة'}</h4>
            <div className="flex flex-col space-y-4 text-sm text-white/40">
              <a href="#home" className="hover:text-white transition-colors">{t.nav.home}</a>
              <a href="#music" className="hover:text-white transition-colors">{t.nav.music}</a>
              <a href="#bio" className="hover:text-white transition-colors">{t.nav.bio}</a>
              <a href="#contact" className="hover:text-white transition-colors">{t.nav.contact}</a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-white/60">{lang === 'en' ? 'NEWSLETTER' : 'النشرة الإخبارية'}</h4>
            <p className="text-white/40 text-sm">
              {lang === 'en' ? 'Subscribe to get the latest releases and updates.' : 'اشترك للحصول على أحدث الإصدارات والتحديثات.'}
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder={lang === 'en' ? 'Email' : 'البريد الإلكتروني'}
                className="flex-1 bg-white/5 border border-white/10 rounded-l-xl rtl:rounded-l-none rtl:rounded-r-xl px-4 py-2 focus:outline-none focus:border-white/40 transition-colors text-sm"
              />
              <button className="bg-white text-black px-4 py-2 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl font-bold text-sm hover:bg-white/90 transition-colors">
                {lang === 'en' ? 'JOIN' : 'انضم'}
              </button>
            </form>
          </div>
        </div>
          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-[10px] tracking-widest uppercase">© 2024 ZOZA EL-SHEIKH. {t.footer.rights}</p>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {isAdmin && (
              <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2 border border-white/10"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Admin Dashboard
              </button>
            )}
            {user ? (
              <button 
                onClick={logout}
                className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 border border-white/5"
              >
                <LogOut size={12} />
                <span>{user.email}</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="text-[10px] text-white/40 hover:text-white flex items-center space-x-1 rtl:space-x-reverse uppercase tracking-widest"
              >
                <LogIn size={12} />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Admin Panel</h2>
                <button onClick={() => setIsAdminPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-12">
                {/* Add Track Form */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-white/40">Add New Track</h3>
                    <button 
                      onClick={async () => {
                        const sampleTracks = [
                          { title: 'Desert Mirage', artist: 'ZOZA', genre: 'Ethnic Fusion', duration: '4:20', coverurl: 'https://picsum.photos/seed/desert/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                          { title: 'Cairo Nights', artist: 'ZOZA', genre: 'Cinematic', duration: '3:45', coverurl: 'https://picsum.photos/seed/cairo/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
                          { title: 'Nile Echoes', artist: 'ZOZA', genre: 'Ambient', duration: '5:12', coverurl: 'https://picsum.photos/seed/nile/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
                          { title: 'Ancient Secrets', artist: 'ZOZA', genre: 'Orchestral', duration: '4:50', coverurl: 'https://picsum.photos/seed/ancient/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
                          { title: 'Urban Pulse', artist: 'ZOZA', genre: 'Electronic', duration: '3:30', coverurl: 'https://picsum.photos/seed/urban/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
                          { title: 'Golden Hour', artist: 'ZOZA', genre: 'Chillout', duration: '4:15', coverurl: 'https://picsum.photos/seed/golden/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
                          { title: 'Mystical Journey', artist: 'ZOZA', genre: 'World', duration: '6:05', coverurl: 'https://picsum.photos/seed/mystic/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
                          { title: 'Sandstorm', artist: 'ZOZA', genre: 'Dramatic', duration: '3:55', coverurl: 'https://picsum.photos/seed/sand/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
                          { title: 'Oasis Dream', artist: 'ZOZA', genre: 'New Age', duration: '4:40', coverurl: 'https://picsum.photos/seed/oasis/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
                          { title: 'Midnight in Giza', artist: 'ZOZA', genre: 'Jazz Fusion', duration: '5:25', coverurl: 'https://picsum.photos/seed/giza/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
                          { title: 'Eternal Spirit', artist: 'ZOZA', genre: 'Spiritual', duration: '7:10', coverurl: 'https://picsum.photos/seed/spirit/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
                          { title: 'Beyond Horizon', artist: 'ZOZA', genre: 'Epic', duration: '4:35', coverurl: 'https://picsum.photos/seed/horizon/800/800', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
                        ];
                        try {
                          const { error } = await supabase.from('tracks').insert(sampleTracks);
                          if (error) throw error;
                          setToast('12 Tracks added successfully!');
                          setTimeout(() => setToast(null), 3000);
                        } catch (err) {
                          handleSupabaseError(err, OperationType.CREATE, 'tracks');
                        }
                      }}
                      className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors uppercase tracking-widest"
                    >
                      Seed 12 Tracks
                    </button>
                  </div>
                  <form 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmitting(true);
                      const formData = new FormData(e.currentTarget);
                      const coverFile = formData.get('coverFile') as File;
                      const audioFile = formData.get('audioFile') as File;
                      
                      let coverUrl = formData.get('coverurl') as string;
                      let audioUrl = formData.get('audiourl') as string;

                      try {
                        // Upload Cover if file exists
                        if (coverFile && coverFile.size > 0) {
                          const fileExt = coverFile.name.split('.').pop();
                          const fileName = `${Math.random()}.${fileExt}`;
                          const { error: uploadError } = await supabase.storage
                            .from('music')
                            .upload(`covers/${fileName}`, coverFile);
                          
                          if (uploadError) throw uploadError;
                          
                          const { data: { publicUrl } } = supabase.storage
                            .from('music')
                            .getPublicUrl(`covers/${fileName}`);
                          coverUrl = publicUrl;
                        }

                        // Upload Audio if file exists
                        if (audioFile && audioFile.size > 0) {
                          const fileExt = audioFile.name.split('.').pop();
                          const fileName = `${Math.random()}.${fileExt}`;
                          const { error: uploadError } = await supabase.storage
                            .from('music')
                            .upload(`audio/${fileName}`, audioFile);
                          
                          if (uploadError) throw uploadError;
                          
                          const { data: { publicUrl } } = supabase.storage
                            .from('music')
                            .getPublicUrl(`audio/${fileName}`);
                          audioUrl = publicUrl;
                        }

                        const trackData = {
                          title: formData.get('title') as string,
                          artist: formData.get('artist') as string,
                          coverurl: coverUrl,
                          audiourl: audioUrl,
                          duration: formData.get('duration') as string,
                          genre: formData.get('genre') as string
                        };

                        const { error } = await supabase
                          .from('tracks')
                          .insert([trackData]);
                        
                        if (error) throw error;

                        (e.target as HTMLFormElement).reset();
                        setToast('Track added successfully!');
                        setTimeout(() => setToast(null), 3000);
                      } catch (err) {
                        console.error(err);
                        alert('Error uploading files or adding track. Make sure "music" bucket exists and is public.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Title</label>
                      <input name="title" placeholder="Track Title" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/40" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Artist</label>
                      <input name="artist" placeholder="Artist Name" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/40" />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Cover Image (JPG/PNG)</label>
                      <div className="flex gap-2">
                        <input name="coverurl" placeholder="Or paste Image URL here" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/40 text-sm" />
                        <label className="cursor-pointer bg-white text-black hover:bg-white/90 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest">
                          <Upload size={14} />
                          Browse
                          <input type="file" name="coverFile" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const input = e.target.closest('div')?.querySelector('input[name="coverurl"]') as HTMLInputElement;
                              if (input) input.value = `SELECTED: ${file.name}`;
                            }
                          }} />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Audio File (MP3)</label>
                      <div className="flex gap-2">
                        <input name="audiourl" placeholder="Or paste Audio URL here" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/40 text-sm" />
                        <label className="cursor-pointer bg-white text-black hover:bg-white/90 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest">
                          <Upload size={14} />
                          Browse
                          <input type="file" name="audioFile" accept="audio/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const input = e.target.closest('div')?.querySelector('input[name="audiourl"]') as HTMLInputElement;
                              if (input) input.value = `SELECTED: ${file.name}`;
                            }
                          }} />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Duration</label>
                      <input name="duration" placeholder="e.g. 4:20" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/40" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Genre</label>
                      <input name="genre" placeholder="e.g. Cinematic" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/40" />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="md:col-span-2 bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                          UPLOADING...
                        </>
                      ) : (
                        'ADD NEW TRACK'
                      )}
                    </button>
                  </form>
                </section>

                {/* Track Management */}
                <section>
                  <h3 className="text-sm uppercase tracking-widest font-bold text-white/40 mb-6">Manage Tracks ({tracks.length})</h3>
                  <div className="space-y-2">
                    {tracks.map((track) => (
                      <div key={track.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          <img src={track.coverurl} alt={track.title} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold text-sm">{track.title}</p>
                            <p className="text-xs text-white/40">{track.artist}</p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (confirm(`Delete track "${track.title}"?`)) {
                              try {
                                const { error } = await supabase
                                  .from('tracks')
                                  .delete()
                                  .eq('id', track.id);
                                
                                if (error) throw error;

                                setToast('Track deleted');
                                setTimeout(() => setToast(null), 3000);
                              } catch (err) {
                                handleSupabaseError(err, OperationType.DELETE, 'tracks');
                              }
                            }
                          }}
                          className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contacts List */}
                <section>
                  <h3 className="text-sm uppercase tracking-widest font-bold text-white/40 mb-6">Contact Messages ({contacts.length})</h3>
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group">
                        <button 
                          onClick={async () => {
                            if (confirm('Delete this message?')) {
                              try {
                                const { error } = await supabase
                                  .from('contacts')
                                  .delete()
                                  .eq('id', contact.id);
                                
                                if (error) throw error;
                              } catch (err) {
                                handleSupabaseError(err, OperationType.DELETE, 'contacts');
                              }
                            }
                          }}
                          className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold">{contact.name}</h4>
                            <p className="text-xs text-white/40">{contact.email}</p>
                          </div>
                          <span className="text-[10px] text-white/20">
                            {contact.created_at ? new Date(contact.created_at).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-sm font-bold mb-2">{contact.subject}</p>
                        <p className="text-sm text-white/60 whitespace-pre-wrap">{contact.message}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
                <Check size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  شكراً على تواصلكم مع ZOZA EL-SHEIKH
                </h3>
                <p className="text-white/60">
                  وسنقوم بالرد عليكم في أسرع وقت
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = '/';
                }}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Admin Login</h3>
                <button onClick={() => setIsLoginModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Email</label>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@example.com" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-2">Password</label>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (isSubmitting) return;
                    setLoginError(null);
                    
                    if (!loginEmail || !loginPassword) {
                      setLoginError('Please enter both email and password');
                      return;
                    }

                    try {
                      setIsSubmitting(true);
                      
                      // 1. Try to Sign In first
                      const { data, error: signInError } = await supabase.auth.signInWithPassword({
                        email: loginEmail.trim(),
                        password: loginPassword,
                      });

                      // 2. If sign in fails
                      if (signInError) {
                        if (signInError.message.includes('Email not confirmed')) {
                          setLoginError(
                            <div className="flex flex-col gap-2">
                              <span>Email not confirmed. Please check your inbox or spam folder.</span>
                              <button 
                                onClick={async () => {
                                  const { error } = await supabase.auth.resend({
                                    type: 'signup',
                                    email: loginEmail.trim(),
                                  });
                                  if (error) alert(error.message);
                                  else alert('Confirmation email resent!');
                                }}
                                className="text-white underline text-[10px] font-bold uppercase tracking-widest"
                              >
                                Resend Confirmation Email
                              </button>
                            </div>
                          );
                          setIsSubmitting(false);
                          return;
                        }
                        
                        if (signInError.message.includes('Invalid login credentials')) {
                          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                            email: loginEmail.trim(),
                            password: loginPassword,
                            options: {
                              emailRedirectTo: window.location.origin,
                            }
                          });

                          if (signUpError) throw signUpError;

                          if (signUpData.user && !signUpData.session) {
                            setLoginError('Account created! Please check your email to confirm your account before logging in.');
                            setIsSubmitting(false);
                            return;
                          }
                          
                          if (signUpData.session) {
                            setIsLoginModalOpen(false);
                            setToast('Account created and logged in!');
                            if (signUpData.user?.email?.toLowerCase() === 'karikaturi111@gmail.com') {
                              setIsAdminPanelOpen(true);
                            }
                            setTimeout(() => setToast(null), 3000);
                            return;
                          }
                        } else {
                          throw signInError;
                        }
                      } else {
                        // Sign in succeeded
                        setIsLoginModalOpen(false);
                        setToast('Logged in successfully!');
                        if (data.user?.email?.toLowerCase() === 'karikaturi111@gmail.com') {
                          setIsAdminPanelOpen(true);
                        }
                        setTimeout(() => setToast(null), 3000);
                      }
                    } catch (err: any) {
                      console.error('Auth error:', err);
                      setLoginError(err.message || 'Authentication failed');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isSubmitting 
                      ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                      />
                      PROCESSING...
                    </>
                  ) : 'LOGIN / CREATE ACCOUNT'}
                </button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#111] px-2 text-white/20">Or</span></div>
                </div>

                <button 
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                    } catch (err: any) {
                      alert(err.message || 'Google login failed.');
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Globe size={18} />
                  GOOGLE LOGIN
                </button>
              </div>
              <p className="text-[10px] text-center text-white/20 uppercase tracking-widest">Default password: zoza2026</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Admin Button */}
      {isAdmin && (
        <motion.button
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdminPanelOpen(true)}
          className="fixed bottom-32 right-6 z-[60] bg-emerald-500 text-white font-bold px-8 py-5 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center gap-4 border-2 border-white/20 group"
        >
          <div className="relative">
            <div className="w-4 h-4 bg-white rounded-full animate-ping absolute inset-0" />
            <div className="w-4 h-4 bg-white rounded-full relative z-10" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] opacity-70 uppercase tracking-tighter leading-none mb-1">System Active</span>
            <span className="uppercase tracking-[0.2em] text-sm leading-none">Admin Dashboard</span>
          </div>
        </motion.button>
      )}

      {/* Audio Player Bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 w-full z-50 glass-morphism px-6 py-4 md:py-6 no-select"
          >
            <button 
              onClick={() => {
                setCurrentTrack(null);
                setIsPlaying(false);
              }}
              className="absolute top-2 right-2 md:top-4 md:right-4 text-white/40 hover:text-white transition-colors p-2 z-10"
              title="Close Player"
            >
              <X size={20} />
            </button>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Track Info */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse w-full md:w-1/3">
                <img 
                  src={currentTrack.coverurl} 
                  alt={currentTrack.title} 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <h4 className="font-bold truncate">{currentTrack.title}</h4>
                  <p className="text-xs text-white/40 truncate uppercase tracking-widest">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center w-full md:w-1/3 space-y-2">
                <div className="flex items-center space-x-6 rtl:space-x-reverse">
                  <button className="text-white/40 hover:text-white transition-colors"><SkipBack size={20} /></button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform relative"
                  >
                    {isLoading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                      />
                    ) : (
                      isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className={`${isRtl ? 'mr-1' : 'ml-1'}`} />
                    )}
                  </button>
                  <button className="text-white/40 hover:text-white transition-colors"><SkipForward size={20} /></button>
                </div>
                
                <div className="flex items-center space-x-3 rtl:space-x-reverse w-full">
                  <span className="text-[10px] text-white/40 font-mono w-10 text-right rtl:text-left">
                    {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
                  </span>
                  <input 
                    type="range" 
                    value={progress}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-[10px] text-white/40 font-mono w-10">
                    {currentTrack.duration}
                  </span>
                </div>
              </div>

              {/* Volume/Extra */}
              <div className="hidden md:flex items-center justify-end space-x-4 rtl:space-x-reverse w-1/3">
                <Volume2 size={18} className="text-white/40" />
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full bg-white" 
                    style={{ width: `${volume * 100}%` }}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <audio 
              ref={audioRef}
              src={currentTrack.audiourl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onLoadStart={() => setIsLoading(true)}
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const self = this as any;
    if (self.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-white/60 mb-8">
              {self.state.error?.message?.startsWith('{') 
                ? "A database error occurred. Please try again later." 
                : "An unexpected error occurred."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return self.props.children;
  }
}

export function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
