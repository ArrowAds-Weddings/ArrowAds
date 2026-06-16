import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { driveService } from './driveService';
import {
  Camera,
  Video,
  Heart,
  Mail,
  MapPin,
  Calendar,
  Instagram,
  Facebook,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Phone,
  Loader2,
  Maximize
} from 'lucide-react';

// --- Types ---
interface GalleryImage {
  id: string | number;
  url: string;
  title: string;
  category: string;
  description?: string;
  size: 'normal' | 'tall' | 'short';
  order?: number;
}

// --- Data ---
const FALLBACK_IMAGES = [
  '/images/1.jpeg',
  '/images/2.jpeg',
  '/images/3.jpeg',
  '/images/4.jpeg',
  '/images/5.jpeg',
  '/images/6.jpeg',
  '/images/7.jpeg',
  '/images/8.jpeg',
];


// --- Components ---

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div
        className="cursor-follower"
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
          x: '-50%',
          y: '-50%',
          scale: isHovering ? 2.5 : 1,
        }}
      />
      <motion.div
        className="cursor-dot"
        style={{
          translateX: cursorX,
          translateY: cursorY,
          x: '-50%',
          y: '-50%',
        }}
      />
    </>
  );
};

const LoadingScreen = ({ onComplete, isDataLoaded }: { onComplete: () => void, isDataLoaded: boolean }) => {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && isDataLoaded) {
      onComplete();
    }
  }, [minTimeElapsed, isDataLoaded, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center px-6"
      >
        <h2 className="text-2xl md:text-5xl font-serif tracking-widest text-slate-900 mb-4">
          ARROW ADS <span className="text-gold italic">Wedding</span>
        </h2>
        <div className="w-32 md:w-48 h-[1px] bg-slate-100 mx-auto relative overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gold"
          />
        </div>
        <p className="text-slate-400 uppercase tracking-[0.3em] text-[8px] md:text-[10px] mt-6">Capturing Timeless Stories</p>
      </motion.div>
    </motion.div>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const sections = ['home', 'about', 'photographer', 'gallery', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home', id: 'home' },
    { name: 'Our Story', href: '#about', id: 'about' },
    { name: 'The Artist', href: '#photographer', id: 'photographer' },
    { name: 'Gallery', href: '#gallery', id: 'gallery' },
    { name: 'Contact', href: '#contact', id: 'contact' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/70 backdrop-blur-lg py-3 md:py-4 shadow-sm' : 'bg-transparent py-6 md:py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#home" className="flex items-center group">
          <img
            src="/logo.png"
            alt="Arrow Ads Wedding"
            className={`h-8 md:h-12 w-auto transition-all duration-500 ${isScrolled ? 'invert' : ''}`}
            referrerPolicy="no-referrer"
          />
          <span className={`text-lg md:text-xl font-serif tracking-widest transition-colors duration-300 ml-3 inline-block ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
            ARROW ADS <span className="text-gold italic">Wedding</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:text-gold relative group ${activeSection === link.id
                ? 'text-gold'
                : (isScrolled ? 'text-slate-600' : 'text-white/80')
                }`}
            >
              {link.name}
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-gold transition-all duration-300 ${activeSection === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </a>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu className={isScrolled ? 'text-slate-900' : 'text-white'} />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl py-6 flex flex-col items-center space-y-4 md:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm uppercase tracking-widest font-bold transition-colors w-full text-center py-4 border-b border-slate-50 last:border-0 ${activeSection === link.id ? 'text-gold' : 'text-slate-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        <img
          src="/images/1.jpeg"
          alt="Wedding Hero"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="eager"
          style={{ fetchPriority: 'high' } as any}
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <span className="text-white/80 uppercase tracking-[0.3em] text-[10px] md:text-sm mb-4 block">Photography</span>
          <h1 className="text-3xl sm:text-4xl md:text-8xl text-white mb-2 font-serif leading-tight">
            ARROW ADS <br />
            <span className="text-gold italic">Wedding</span>
          </h1>
          <a
            href="#gallery"
            className="inline-block px-10 py-4 bg-white text-slate-900 uppercase tracking-widest text-xs font-semibold hover:bg-gold hover:text-white transition-all duration-300 rounded-sm"
          >
            View Our Work
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60"
      >
        <div className="w-[1px] h-12 bg-white/30 mx-auto"></div>
      </motion.div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-16 md:py-24 px-6 relative overflow-hidden">
      <div className="section-overlay"></div>
      <div className="bg-blob bg-blob-1 opacity-10"></div>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="relative order-2 md:order-1"
        >
          <img
            src="/images/2.jpeg"
            alt="Photographer at work"
            className="w-full h-auto rounded-sm shadow-2xl"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute -bottom-10 -right-10 hidden lg:block w-64 h-64 bg-champagne -z-10"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="order-1 md:order-2"
        >
          <span className="text-gold uppercase tracking-widest text-[10px] md:text-xs font-semibold mb-4 block">Our Story</span>
          <h2 className="text-3xl md:text-5xl mb-6 md:mb-8 leading-tight">
            More Than Just <br />
            <span className="italic">A Photograph</span>
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6 text-base md:text-lg">
            At Arrow Ads Wedding, we believe that every wedding is a unique masterpiece waiting to be unveiled. Our philosophy is rooted in the art of observation—capturing the unscripted laughter, the quiet tears of joy, and the electric energy of your celebration.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8 md:mb-10 text-sm md:text-base">
            With over a decade of experience in high-end cinematography and photography, we don't just document events; we craft cinematic legacies. Our style is airy, romantic, and deeply personal, ensuring that your memories feel as vibrant fifty years from now as they do today.
          </p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Camera className="text-gold w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm font-medium uppercase tracking-tighter">Photography</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Photographer = () => {
  return (
    <section id="photographer" className="py-20 md:py-32 relative overflow-hidden">
      <div className="section-overlay"></div>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] md:aspect-square lg:aspect-[4/5]">
              <img
                src="/images/photographer.jpeg"
                alt="Lead Photographer"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-gold/10 rounded-full -z-0 blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gold/5 rounded-full -z-0 blur-3xl"></div>
            <div className="absolute top-1/2 -right-4 w-1 h-32 bg-gold/20 -translate-y-1/2"></div>
          </motion.div>

          {/* Text Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2"
          >
            <span className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">The Visionary</span>
            <h2 className="text-4xl md:text-6xl font-serif mb-8 text-slate-900 leading-tight">
              Meet <span className="italic">Riyas Arrow Ads</span>
            </h2>
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
              <p>
                As the lead photographer and founder of Arrow Ads Wedding, Riyas brings a unique cinematic perspective to every frame. With a background in visual arts and a passion for storytelling, he doesn't just take pictures—he preserves emotions.
              </p>
              <p>
                "My goal is to make you feel as beautiful and comfortable as you truly are. I believe the best shots happen in between the poses, when the real magic of your connection shines through."
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-gold font-serif text-3xl mb-1">10+</h4>
                <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Years Experience</p>
              </div>
              <div>
                <h4 className="text-gold font-serif text-3xl mb-1">500+</h4>
                <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Weddings Captured</p>
              </div>
            </div>

            <div className="mt-12 flex items-center space-x-4">
              <div className="w-12 h-[1px] bg-slate-200"></div>
              <p className="font-serif italic text-slate-400 italic">"Capturing the soul of your celebration"</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Gallery = ({ images }: { images: GalleryImage[] }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const handleNext = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    setSelectedImage(images[(currentIndex + 1) % images.length]);
  };

  const handlePrev = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    setSelectedImage(images[(currentIndex - 1 + images.length) % images.length]);
  };

  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStart.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  if (images.length === 0) return null;

  return (
    <section id="gallery" className="py-16 md:py-24 px-6 relative overflow-hidden">
      <div className="bg-blob bg-blob-2 opacity-10"></div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto mb-12 md:mb-16 text-center"
      >
        <span className="text-gold uppercase tracking-widest text-[10px] md:text-xs font-semibold mb-4 block">The Gallery</span>
        <h2 className="text-3xl md:text-5xl italic">Captured Moments</h2>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            layoutId={`image-${image.id}`}
            onClick={() => setSelectedImage(image)}
            className={`relative overflow-hidden cursor-pointer group rounded-sm ${
              image.size === 'tall' ? 'aspect-[2/3]' :
              image.size === 'short' ? 'aspect-[3/2]' : 
              'aspect-[4/5]'
            }`}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-full h-full bg-slate-100 animate-pulse overflow-hidden rounded-sm">
              <img
                src={image.url}
                alt={image.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-0"
                referrerPolicy="no-referrer"
                onLoad={(e) => {
                  (e.target as HTMLImageElement).classList.remove('opacity-0');
                  (e.target as HTMLImageElement).parentElement?.classList.remove('animate-pulse', 'bg-slate-100');
                }}
                onError={(e) => {
                  // Fallback to picsum if local image not found
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
                  (e.target as HTMLImageElement).classList.remove('opacity-0');
                  (e.target as HTMLImageElement).parentElement?.classList.remove('animate-pulse', 'bg-slate-100');
                }}
              />
              <div className={`absolute inset-0 transition-all duration-500 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm bg-slate-950/60 opacity-0 group-hover:opacity-100`}>
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {image.title && <h3 className="text-white font-serif italic text-xl md:text-2xl mb-1">{image.title}</h3>}
                  {image.category && <p className="text-gold uppercase tracking-[0.2em] text-[8px] md:text-[10px] font-bold mb-3">{image.category}</p>}
                  {image.description && (
                    <p className="text-white/90 text-xs md:text-sm font-light italic leading-relaxed max-w-[280px]">
                      "{image.description}"
                    </p>
                  )}
                  <div className="w-12 h-[1px] bg-gold/50 mx-auto mt-4"></div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[110]"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <X size={32} />
            </button>

            <button 
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 hidden md:block"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            >
              <ChevronLeft size={48} />
            </button>

            <button 
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 hidden md:block"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
            >
              <ChevronRight size={48} />
            </button>

            <motion.img
              layoutId={`image-${selectedImage.id}`}
              key={selectedImage.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={`https://drive.google.com/thumbnail?id=${selectedImage.id}&sz=w1600`}
              alt={selectedImage.title}
              className="max-w-full max-h-full object-contain shadow-2xl"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const index = images.findIndex(img => img.id === selectedImage.id);
                (e.target as HTMLImageElement).src = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
              }}
            />
            <div className="absolute bottom-8 md:bottom-12 text-center text-white px-6">
              {selectedImage.title && (
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl md:text-4xl font-serif italic"
                >
                  {selectedImage.title}
                </motion.h3>
              )}
              {selectedImage.category && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-gold uppercase tracking-[0.3em] text-[10px] md:text-xs mt-3"
                >
                  {selectedImage.category}
                </motion.p>
              )}
              {selectedImage.description && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/70 text-sm md:text-base italic mt-4 max-w-2xl mx-auto"
                >
                  {selectedImage.description}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const AlbumSlideshow = ({ albums, fetchAlbumImages }: { albums: any[], fetchAlbumImages: (id: string) => Promise<any[]> }) => {
  const [activeAlbum, setActiveAlbum] = useState<any | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const touchStart = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStart.current = null;
  };

  useEffect(() => {
    if (albums.length > 0 && !activeAlbum) {
      setActiveAlbum(albums[0]);
    }
  }, [albums, activeAlbum]);

  useEffect(() => {
    if (activeAlbum) {
      setLoading(true);
      fetchAlbumImages(activeAlbum.id).then(imgs => {
        // Find gallery folder config to get descriptions if this is the gallery folder
        // Actually, slideshow images are usually different from main gallery, 
        // but let's assume they might have descriptions in their own folder if we implement it later.
        // For now, we do not show the file name as title.
        setImages(imgs.map(img => ({
          ...img,
          title: '', // Don't show filename as title
          description: '' // Albums don't have descriptions in the same way yet
        })));
        setCurrentIndex(0);
        setLoading(false);
      });
    }
  }, [activeAlbum]);

  const handleNext = () => setCurrentIndex(prev => (prev + 1) % images.length);
  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    if (images.length > 1) {
      // Preload next image to eliminate loading delays during transitions
      const nextIndex = (currentIndex + 1) % images.length;
      const img = new Image();
      img.src = `https://drive.google.com/thumbnail?id=${images[nextIndex].id}&sz=w1600`;
      
      // Also preload the previous image in case user clicks back
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      const prevImg = new Image();
      prevImg.src = `https://drive.google.com/thumbnail?id=${images[prevIndex].id}&sz=w1600`;
    }
  }, [currentIndex, images]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowRight') {
        handleNext();
        setSelectedImage(images[(currentIndex + 1) % images.length]);
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
        setSelectedImage(images[(currentIndex - 1 + images.length) % images.length]);
      }
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentIndex, images]);

  return (
    <>
    <section id="slideshow" className="py-16 md:py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h2 className="text-3xl md:text-5xl italic mb-8">Albums</h2>
        {albums.length === 0 && (
          <p className="text-slate-400 italic text-sm">No albums available yet.</p>
        )}
        {albums.length > 1 && (
          <div className="flex flex-wrap justify-center gap-4">
            {albums.map(album => (
              <button
                key={album.id}
                onClick={() => setActiveAlbum(album)}
                className={`px-6 py-2 rounded-full text-xs uppercase tracking-widest font-bold transition-all ${activeAlbum?.id === album.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-gold'}`}
              >
                {album.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {albums.length > 0 && (
        <div 
          className="max-w-5xl mx-auto relative aspect-video bg-white/50 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl group border border-slate-100"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
             </div>
          ) : (
            <AnimatePresence mode="wait">
              {images.length > 0 ? (
                <div className="absolute inset-0 w-full h-full">
                  <motion.img
                    key={currentIndex}
                    src={`https://drive.google.com/thumbnail?id=${images[currentIndex].id}&sz=w1600`}
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '-100%', opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0 w-full h-full object-contain bg-black/5 backdrop-blur-sm p-4 cursor-zoom-in"
                    referrerPolicy="no-referrer"
                    onClick={() => setSelectedImage(images[currentIndex])}
                  />
                  {/* Slideshow Info Overlay */}
                  {(images[currentIndex].title || images[currentIndex].description) && (
                    <div className="absolute bottom-16 left-0 w-full text-center z-20 pointer-events-none">
                      <motion.div
                        key={`info-${currentIndex}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/20 backdrop-blur-md inline-block px-8 py-4 rounded-2xl border border-white/10"
                      >
                        {images[currentIndex].title && <h3 className="text-white font-serif italic text-xl">{images[currentIndex].title}</h3>}
                        {images[currentIndex].description && (
                          <p className="text-white/70 text-xs italic mt-1 font-light">{images[currentIndex].description}</p>
                        )}
                      </motion.div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic">No images in this album.</div>
              )}
            </AnimatePresence>
          )}

          {images.length > 1 && !loading && (
            <>
              <div className="absolute top-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => setSelectedImage(images[currentIndex])} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all">
                    <Maximize size={20} />
                 </button>
              </div>
              <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="pointer-events-auto p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="pointer-events-auto p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all">
                  <ChevronRight size={24} />
                </button>
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIndex(i)} className={`w-2 h-2 rounded-full transition-all ${currentIndex === i ? 'bg-gold w-6' : 'bg-white/50 hover:bg-white'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
    <AnimatePresence>
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[110]"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          
          <button 
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 hidden md:block"
            onClick={(e) => { e.stopPropagation(); handlePrev(); setSelectedImage(images[(currentIndex - 1 + images.length) % images.length]); }}
          >
            <ChevronLeft size={48} />
          </button>

          <button 
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 hidden md:block"
            onClick={(e) => { e.stopPropagation(); handleNext(); setSelectedImage(images[(currentIndex + 1) % images.length]); }}
          >
            <ChevronRight size={48} />
          </button>

          <motion.img
            key={selectedImage.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={`https://drive.google.com/thumbnail?id=${selectedImage.id}&sz=w1600`}
            alt="Full view"
            className="max-w-full max-h-full object-contain shadow-2xl"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};


const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    venue: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct WhatsApp message
    const message = `Hi Arrow Ads Wedding!%0A%0AI'd like to inquire about your services.%0A%0A*Details:*%0A- *Name:* ${formData.name}%0A- *Mobile:* ${formData.phone}%0A- *Date:* ${formData.date || 'TBD'}%0A- *Venue:* ${formData.venue || 'TBD'}%0A%0A*Story/Message:*%0A${formData.message}%0A%0ALooking forward to hearing from you!`;

    const whatsappUrl = `https://wa.me/919947894205?text=${message}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');

    alert('Redirecting to WhatsApp to send your message...');
    setFormData({ name: '', phone: '', date: '', venue: '', message: '' });
  };

  return (
    <section id="contact" className="py-16 md:py-24 px-6 relative overflow-hidden">
      <div className="section-overlay"></div>
      <div className="bg-blob bg-blob-3 opacity-10"></div>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-gold uppercase tracking-widest text-[10px] md:text-xs font-semibold mb-4 block">Get In Touch</span>
          <h2 className="text-3xl md:text-5xl mb-6 md:mb-8 leading-tight">
            Let's Start Your <br />
            <span className="italic">Journey Together</span>
          </h2>
          <p className="text-slate-600 mb-8 md:mb-12 text-base md:text-lg">
            We'd love to hear about your vision for your big day. Whether it's an intimate elopement or a grand celebration, we're here to capture it all.
          </p>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-champagne rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="text-gold w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold uppercase tracking-widest text-xs mb-1">Email Us</h4>
                <p className="text-slate-600">arrowadswedding@gmail.com</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-champagne rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="text-gold w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold uppercase tracking-widest text-xs mb-1">Call / WhatsApp</h4>
                <p className="text-slate-600">+91 99478 94205</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-champagne rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="text-gold w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold uppercase tracking-widest text-xs mb-1">Studio</h4>
                <p className="text-slate-600">Arrow Ads Wedding Studio<br />Palashery Complex, Near KSEB Building<br />Vengara, Malappuram, Kerala 676304</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex space-x-6">
            <a href="https://instagram.com/arrow_ads_wedding" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold transition-colors"><Instagram size={20} /></a>
            <a href="https://wa.me/919947894205" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold transition-colors">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="inline-block">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a href="tel:+919947894205" className="text-slate-400 hover:text-gold transition-colors"><Phone size={20} /></a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/60 backdrop-blur-md p-8 md:p-12 rounded-2xl shadow-sm border border-white/40"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border-b border-slate-200 py-3 px-0 focus:border-gold outline-none transition-colors"
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border-b border-slate-200 py-3 px-0 focus:border-gold outline-none transition-colors"
                  placeholder="Your Mobile Number"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Wedding Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border-b border-slate-200 py-3 px-0 focus:border-gold outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Venue / Location</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full bg-white border-b border-slate-200 py-3 px-0 focus:border-gold outline-none transition-colors"
                  placeholder="Where is the magic happening?"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Tell Us Your Story</label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-white border-b border-slate-200 py-3 px-0 focus:border-gold outline-none transition-colors resize-none"
                placeholder="Share some details about your big day..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 text-white uppercase tracking-widest text-xs font-bold py-5 hover:bg-gold transition-colors duration-300 rounded-sm mt-4"
            >
              Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-slate-100/50 relative overflow-hidden">
      <div className="bg-blob bg-blob-1 bottom-0 right-0 opacity-5 w-64 h-64"></div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left flex flex-col items-center md:items-start">
          <p className="text-2xl font-serif tracking-widest text-slate-900">
            ARROW ADS <span className="text-gold italic">Wedding</span>
          </p>
          <p className="text-slate-400 text-xs uppercase tracking-widest mt-2">© 2026 Arrow Ads Wedding. All Rights Reserved.</p>
        </div>

        <div className="flex space-x-8">
          <a href="#home" className="text-xs uppercase tracking-widest font-medium text-slate-600 hover:text-gold transition-colors">Home</a>
          <a href="#gallery" className="text-xs uppercase tracking-widest font-medium text-slate-600 hover:text-gold transition-colors">Gallery</a>
          <a href="#contact" className="text-xs uppercase tracking-widest font-medium text-slate-600 hover:text-gold transition-colors">Contact</a>
        </div>

        <div className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
          Handcrafted for Timeless Memories
        </div>
      </div>
    </footer>
  );
};

export default function MainSite() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
      const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

      try {
        if (folderId && apiKey) {
          // 1. Fetch albums first to find if 'Gallery' folder exists
          const fetchedAlbums = await driveService.listAlbums(folderId, apiKey);
          const galleryAlbum = fetchedAlbums.find(a => a.name.toLowerCase() === 'gallery');
          const targetFolderId = galleryAlbum ? galleryAlbum.id : folderId;
          
          const albumsForSlideshow = fetchedAlbums.filter(a => a.name.toLowerCase() !== 'gallery');
          setAlbums(albumsForSlideshow);

          // 2. Fetch config and files from the target folder
          const [config, folderImages] = await Promise.all([
            driveService.getGalleryConfig(targetFolderId, apiKey),
            driveService.listFiles(targetFolderId, apiKey)
          ]);
          
          const configImages = config?.images || [];
          const isMobile = window.innerWidth < 768;
          
          const driveImages: GalleryImage[] = folderImages
            .filter(f => f.name !== 'gallery.json')
            .map(file => {
              const savedConfig = configImages.find(ci => ci.id === file.id);
              
              return {
                id: file.id,
                url: `https://drive.google.com/thumbnail?id=${file.id}&sz=${isMobile ? 'w400' : 'w800'}`,
                title: savedConfig?.title || '',
                category: savedConfig?.category || '',
                description: savedConfig?.description || '',
                size: savedConfig?.size || 'normal',
                order: savedConfig?.order ?? 9999
              };
            }).sort((a, b) => a.order - b.order);

          setGalleryImages(driveImages);
        } else {
          setGalleryImages([]);
        }
      } catch (error) {
        console.error('Gallery Fetch Error:', error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    fetchGallery();
  }, []);

  const fetchAlbumImages = async (albumId: string) => {
    const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
    if (!apiKey) return [];
    return await driveService.listAlbumImages(albumId, apiKey);
  };

  return (
    <div className="min-h-screen selection:bg-gold/30 selection:text-gold">
      <AnimatePresence>
        {!isDataLoaded && <LoadingScreen isDataLoaded={isDataLoaded} onComplete={() => {}} />}
      </AnimatePresence>

      {isDataLoaded && (
        <div className="relative">
          <div className="grain-overlay"></div>
          <CustomCursor />
          <Navbar />
          <main>
            <Hero />
            <About />
            <Photographer />
            <div id="gallery" className="pt-16">
              <Gallery images={galleryImages} />
              <AlbumSlideshow albums={albums} fetchAlbumImages={fetchAlbumImages} />
            </div>
            
            <Contact />
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
}
