(() => {
    'use strict';

    // ═══════════════════════════════════════════════════
    // AUDIO CONTEXT — SOUND EFFECTS
    // ═══════════════════════════════════════════════════
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    let soundEnabled = true;

    function initAudio() {
        if (!audioCtx) audioCtx = new AudioCtx();
    }

    function playTone(freq, duration, type, vol) {
        if (!soundEnabled || !audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(vol || 0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration || 0.3));
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + (duration || 0.3));
        } catch (e) { }
    }

    function playClick() { playTone(800, 0.08, 'sine', 0.04); setTimeout(() => playTone(1200, 0.06, 'sine', 0.03), 40); }
    function playHover() { playTone(600, 0.05, 'sine', 0.02); }
    function playWhoosh() { playTone(200, 0.4, 'sine', 0.03); setTimeout(() => playTone(400, 0.3, 'sine', 0.02), 100); }
    function playSplash() {
        [440, 554, 659, 880].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.6, 'sine', 0.04), i * 200);
        });
    }

    // Sound Toggle
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            initAudio();
            soundEnabled = !soundEnabled;
            soundToggle.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
            playClick();
        });
    }

    // ═══════════════════════════════════════════════════
    // SPLASH SCREEN / BYPASS CHECK
    // ═══════════════════════════════════════════════════
    const splash = document.getElementById('splash');
    const splashArrow = document.getElementById('splashArrow');
    const dedication = document.getElementById('dedication');

    // Check if we should skip splash (e.g. coming back from another page)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('nosplash') === 'true') {
        if (splash) splash.style.display = 'none';
        if (dedication) dedication.style.display = 'none';
        document.body.classList.add('ready');
        // Small delay to ensure particles container exists
        setTimeout(() => { if (typeof initParticles === 'function') initParticles(); }, 100);
    }

    if (splash && splashArrow && dedication) {
        splashArrow.addEventListener('click', () => {
            initAudio();
            playWhoosh();
            splash.classList.add('hide');
            setTimeout(() => {
                dedication.classList.add('show');
                playSplash();
            }, 600);
        });
    }

    // ═══════════════════════════════════════════════════
    // DEDICATION → MAIN SITE
    // ═══════════════════════════════════════════════════
    const welcomeBtn = document.getElementById('welcomeBtn');
    if (welcomeBtn) {
        welcomeBtn.addEventListener('click', () => {
            initAudio();
            playClick();
            playWhoosh();
            dedication.classList.add('hide');
            setTimeout(() => {
                document.body.classList.add('ready');
                if (splash) splash.style.display = 'none';
                if (dedication) dedication.style.display = 'none';
                initParticles();
            }, 800);
        });
    }

    // ═══════════════════════════════════════════════════
    // CUSTOM CURSOR
    // ═══════════════════════════════════════════════════
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;

    if (dot && ring) {
        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            dot.style.left = mx - 4 + 'px';
            dot.style.top = my - 4 + 'px';
        });
    }

    function animCursor() {
        if (!ring) return;
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.left = rx - 20 + 'px';
        ring.style.top = ry - 20 + 'px';
        requestAnimationFrame(animCursor);
    }
    if (ring) animCursor();

    // Hover effect on interactive elements
    const interactiveEls = 'a, button, .major-card, .journey-card, .stat-card, .story-card, .partner-item, .leader-card, .support-card, .faq-item, .support-link, .chat-float';
    document.querySelectorAll(interactiveEls).forEach(el => {
        el.addEventListener('mouseenter', () => { 
            if (ring) ring.classList.add('hover'); 
            playHover(); 
        });
        el.addEventListener('mouseleave', () => {
            if (ring) ring.classList.remove('hover');
        });
    });

    // ═══════════════════════════════════════════════════
    // PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════
    function initParticles() {
        const canvas = document.getElementById('particles');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h;
        const particles = [];
        const COUNT = 55;
        const CONNECT = 140;

        function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);

        class P {
            constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.r = Math.random() * 2 + 0.5;
                this.a = Math.random() * 0.35 + 0.1;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212,175,55,${this.a})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < COUNT; i++) particles.push(new P());

        let pmx = 0, pmy = 0;
        document.addEventListener('mousemove', e => { pmx = e.clientX; pmy = e.clientY; });

        function loop() {
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                // Mouse attract
                const dx = pmx - p.x, dy = pmy - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) { p.vx += dx * 0.00004; p.vy += dy * 0.00004; }
                p.update(); p.draw();
                // Connections
                for (let j = i + 1; j < particles.length; j++) {
                    const dx2 = p.x - particles[j].x, dy2 = p.y - particles[j].y;
                    const d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if (d < CONNECT) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(212,175,55,${(1 - d / CONNECT) * 0.12})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(loop);
        }
        loop();
    }

    // ═══════════════════════════════════════════════════
    // HEADER SCROLL
    // ═══════════════════════════════════════════════════
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });

    // ═══════════════════════════════════════════════════
    // MOBILE MENU
    // ═══════════════════════════════════════════════════
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinks.classList.toggle('open');
        playClick();
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navLinks.classList.remove('open');
            playClick();
        });
    });

    // ═══════════════════════════════════════════════════
    // THEME TOGGLE (DARK/LIGHT MODE)
    // ═══════════════════════════════════════════════════
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');

        // Apply saved theme on load
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            playClick();

            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                localStorage.setItem('theme', 'light');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // SMOOTH SCROLL
    // ═══════════════════════════════════════════════════
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const id = anchor.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                window.scrollTo({ top: target.offsetTop - (header.offsetHeight + 20), behavior: 'smooth' });
            }
        });
    });

    // ═══════════════════════════════════════════════════
    // SCROLL SPY
    // ═══════════════════════════════════════════════════
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', () => {
        const sy = window.scrollY + 250;
        sections.forEach(sec => {
            const id = sec.getAttribute('id');
            if (sy >= sec.offsetTop && sy < sec.offsetTop + sec.offsetHeight) {
                navItems.forEach(a => {
                    a.classList.remove('active');
                    if (a.getAttribute('href') === '#' + id) a.classList.add('active');
                });
            }
        });
    }, { passive: true });

    // ═══════════════════════════════════════════════════
    // REVEAL ON SCROLL (IntersectionObserver)
    // ═══════════════════════════════════════════════════
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // ═══════════════════════════════════════════════════
    // COUNTERS
    // ═══════════════════════════════════════════════════
    let counted = false;
    const counters = document.querySelectorAll('.counter');
    const statsEl = document.querySelector('.stats');

    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function animCounters() {
        counters.forEach(c => {
            const target = +c.dataset.target;
            const dur = 2500;
            const start = performance.now();
            function step(now) {
                const p = Math.min((now - start) / dur, 1);
                c.textContent = Math.floor(easeOutExpo(p) * target);
                if (p < 1) requestAnimationFrame(step);
                else c.textContent = target;
            }
            requestAnimationFrame(step);
        });
    }

    if (statsEl) {
        const sObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && !counted) { counted = true; animCounters(); }
            });
        }, { threshold: 0.25 });
        sObs.observe(statsEl);
    }

    // ═══════════════════════════════════════════════════
    // 3D TILT ON MAJOR CARDS
    // ═══════════════════════════════════════════════════
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const cx = r.width / 2, cy = r.height / 2;
            const x = e.clientX - r.left, y = e.clientY - r.top;
            const rotX = ((y - cy) / cy) * -12;
            const rotY = ((x - cx) / cx) * 12;
            card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px) scale3d(1.04,1.04,1.04)`;
            card.style.setProperty('--mx', ((x / r.width) * 100).toFixed(1) + '%');
            card.style.setProperty('--my', ((y / r.height) * 100).toFixed(1) + '%');
        });
        card.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
            card.style.transform = '';
        });
    });

    // ═══════════════════════════════════════════════════
    // MAGNETIC BUTTONS
    // ═══════════════════════════════════════════════════
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    // ═══════════════════════════════════════════════════
    // PARALLAX LAYERS ON SCROLL
    // ═══════════════════════════════════════════════════
    window.addEventListener('scroll', () => {
        const sy = window.scrollY;
        // Hero depth
        const heroBg = document.querySelector('.hero-bg');
        const heroContent = document.querySelector('.hero-content');
        if (heroBg && sy < window.innerHeight) {
            heroBg.style.transform = `scale(${1 + sy * 0.0003}) translateY(${sy * 0.3}px)`;
            if (heroContent) {
                heroContent.style.opacity = 1 - sy / (window.innerHeight * 0.7);
                heroContent.style.transform = `translateY(${sy * 0.4}px)`;
            }
        }
        // Shapes parallax
        document.querySelectorAll('.shape').forEach((s, i) => {
            s.style.transform = `translateY(${sy * (0.04 + i * 0.02)}px)`;
        });
    }, { passive: true });

    // ═══════════════════════════════════════════════════
    // SHIMMER ON HERO ACCENT TEXT
    // ═══════════════════════════════════════════════════
    const accent = document.querySelector('.hero h1 .accent');
    if (accent) {
        let angle = 0;
        function shimmer() {
            angle = (angle + 0.4) % 360;
            accent.style.backgroundImage = `linear-gradient(${angle}deg, #D4AF37 0%, #F2D06B 30%, #D4AF37 60%, #e8cc6e 80%, #D4AF37 100%)`;
            requestAnimationFrame(shimmer);
        }
        setTimeout(shimmer, 1500);
    }

    // ═══════════════════════════════════════════════════
    // SCROLL PROGRESS BAR
    // ═══════════════════════════════════════════════════
    const progressBar = document.getElementById('progressBar');
    window.addEventListener('scroll', () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = ((window.scrollY / h) * 100) + '%';
    }, { passive: true });

    // ═══════════════════════════════════════════════════
    // BACK TO TOP
    // ═══════════════════════════════════════════════════
    const backTop = document.getElementById('backTop');
    backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        playClick();
    });
    window.addEventListener('scroll', () => {
        backTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });

    // ═══════════════════════════════════════════════════
    // CHAT WIDGET
    // ═══════════════════════════════════════════════════
    const chatFloat = document.getElementById('chatFloat');
    const chatPopup = document.getElementById('chatPopup');
    chatFloat.addEventListener('click', () => {
        chatPopup.classList.toggle('open');
        playClick();
    });

    // Close popup when clicking FAQ item
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
            playClick();
            // Navigate to relevant section
            const text = item.textContent;
            if (text.includes('أسجل')) window.scrollTo({ top: document.getElementById('contact').offsetTop - 100, behavior: 'smooth' });
            else if (text.includes('التخصصات')) window.scrollTo({ top: document.getElementById('majors').offsetTop - 100, behavior: 'smooth' });
            else if (text.includes('الشهادات')) window.scrollTo({ top: document.getElementById('journey').offsetTop - 100, behavior: 'smooth' });
            else if (text.includes('الدعم')) window.scrollTo({ top: document.getElementById('support').offsetTop - 100, behavior: 'smooth' });
            chatPopup.classList.remove('open');
        });
    });

    // ═══════════════════════════════════════════════════
    // RIPPLE EFFECT ON BUTTONS
    // ═══════════════════════════════════════════════════
    const rippleCSS = document.createElement('style');
    rippleCSS.textContent = '@keyframes rippleAnim{to{transform:scale(4);opacity:0}}';
    document.head.appendChild(rippleCSS);

    document.querySelectorAll('.btn, .submit-btn, .welcome-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const r = this.getBoundingClientRect();
            const size = Math.max(r.width, r.height);
            const ripple = document.createElement('span');
            ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px;background:rgba(255,255,255,0.3);border-radius:50%;transform:scale(0);animation:rippleAnim 0.6s ease-out forwards;pointer-events:none`;
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        });
    });

    // ═══════════════════════════════════════════════════
    // FORM SUBMIT ANIMATION
    // ═══════════════════════════════════════════════════
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            playClick();
            const btn = contactForm.querySelector('.submit-btn');
            btn.innerHTML = '<span>✓ تم الإرسال بنجاح</span>';
            btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            setTimeout(() => {
                btn.innerHTML = '<span>إرسال الرسالة</span> <i class="fas fa-paper-plane"></i>';
                btn.style.background = '';
                contactForm.reset();
            }, 3000);
        });
    }

    // ═══════════════════════════════════════════════════
    // LAZY IMAGE LOADING WITH FADE
    // ═══════════════════════════════════════════════════
    document.querySelectorAll('img').forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.8s ease';
        if (img.complete) img.style.opacity = '1';
        else img.addEventListener('load', () => { img.style.opacity = '1'; });
    });

    // ═══════════════════════════════════════════════════
    // CARD GLOW FOLLOW
    // ═══════════════════════════════════════════════════
    document.querySelectorAll('.stat-card, .journey-card, .story-card, .leader-card, .support-card, .partner-item, .video-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
            card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        });
    });

    // ═══════════════════════════════════════════════════
    // VIDEO MODAL LOGIC (FAILSAFE DYNAMIC VERSION)
    // ═══════════════════════════════════════════════════
    const videoModal = document.getElementById('videoModal');
    const videoContainer = document.getElementById('videoModalContent');

    window.forcePlayVideo = function(vSrc) {
        if (!vSrc || !videoModal || !videoContainer) return;
        
        // Wipe old content just in case
        videoContainer.innerHTML = '';
        
        // Check if it's a YouTube link
        const isYouTube = vSrc.includes('youtube.com') || vSrc.includes('youtu.be');

        if (isYouTube) {
            // YouTube iframe Setup
            let ytSrc = vSrc;
            // Convert standard watch link to embed link if needed
            if (ytSrc.includes('watch?v=')) {
                ytSrc = ytSrc.replace('watch?v=', 'embed/');
            }
            // Auto-play the YouTube iframe
            if (!ytSrc.includes('?')) {
                ytSrc += '?autoplay=1';
            } else {
                ytSrc += '&autoplay=1';
            }

            const iframe = document.createElement('iframe');
            iframe.src = ytSrc;
            iframe.style.width = '100%';
            iframe.style.aspectRatio = '16/9';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '16px';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            
            videoContainer.appendChild(iframe);
            
        } else {
            // Local Video Setup (MP4)
            const safeUrl = encodeURI(vSrc);
            const player = document.createElement('video');
            player.id = 'mainVideo';
            player.controls = true;
            player.autoplay = true;
            player.style.width = '100%';
            player.style.height = 'auto';
            player.style.maxHeight = '80vh';
            player.style.background = '#000';
            player.style.outline = 'none';
            player.style.borderRadius = '16px';
            
            const source = document.createElement('source');
            source.src = safeUrl;
            source.type = 'video/mp4';
            
            player.appendChild(source);
            videoContainer.appendChild(player);
        }
        
        // Open modal
        videoModal.classList.add('open');
        
        if (typeof playClick === 'function') playClick();
    };

    window.forceCloseVideo = function() {
        if (videoModal && videoContainer) {
            videoModal.classList.remove('open');
            // Destroy the video element completely to stop playback and buffer
            videoContainer.innerHTML = '';
        }
        if (typeof playClick === 'function') playClick();
    };

    // Click outside to close
    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                forceCloseVideo();
            }
        });
    }

    // ==========================================
    // MAJORS MODAL LOGIC & DATA
    // ==========================================
    const majorsData = {
        'it': {
            title: 'تكنولوجيا المعلومات (IT)',
            icon: 'fas fa-laptop-code',
            desc: `
                <div class="major-detail-section">
                    <h3><i class="fas fa-info-circle"></i> نبذة عن التخصص</h3>
                    <p>يعتبر تخصص تكنولوجيا المعلومات من أهم ركائز المستقبل الرقمي. يركز هذا البرنامج المعتمد (BTEC) على تزويد الطالب بالمهارات العملية والنظرية اللازمة لفهم وتطوير الأنظمة البرمجية، إدارة الشبكات، وحماية البيانات من الاختراقات الأمنية السيبرانية.</p>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-layer-group"></i> محاور الدراسة (المستويات)</h3>
                    <ul>
                        <li><strong>المستوى الأول:</strong> أساسيات الحاسوب، مقدمة في البرمجة، والتعامل مع قواعد البيانات البسيطة.</li>
                        <li><strong>المستوى الثاني:</strong> تطوير المواقع الإلكترونية، تحليل النظم، وبناء تطبيقات الهواتف الذكية.</li>
                        <li><strong>المستوى الثالث:</strong> الأمن السيبراني المتقدم، الحوسبة السحابية، والذكاء الاصطناعي.</li>
                    </ul>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-briefcase"></i> مجالات العمل المستقبلية</h3>
                    <div class="tags-container">
                        <span class="skill-tag">مطور ويب (Web Developer)</span>
                        <span class="skill-tag">مهندس أمن سيبراني</span>
                        <span class="skill-tag">مدير شبكات وأنظمة</span>
                        <span class="skill-tag">محلل بيانات</span>
                        <span class="skill-tag">مطور تطبيقات موبايل</span>
                    </div>
                </div>
            `
        },
        'hospitality': {
            title: 'الضيافة والفندقة',
            icon: 'fas fa-hotel',
            desc: `
                <div class="major-detail-section">
                    <h3><i class="fas fa-info-circle"></i> نبذة عن التخصص</h3>
                    <p>يهدف تخصص الضيافة والفندقة إلى إعداد جيل احترافي قادر على إدارة المنشآت السياحية والفندقية بأعلى المعايير العالمية. يتميز هذا التخصص بالتدريب العملي المكثف في بيئات فندقية حقيقية، خاصة في مدينة العقبة السياحية التي تعتبر بيئة مثالية لهذا المجال.</p>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-layer-group"></i> محاور الدراسة (المستويات)</h3>
                    <ul>
                        <li><strong>المستوى الأول:</strong> مهارات التواصل، الإتيكيت السياحي، ومبادئ خدمة العملاء.</li>
                        <li><strong>المستوى الثاني:</strong> إدارة الأقسام الأمامية للحجوزات، الإشراف الداخلي، وتنظيم الفعاليات والمؤتمرات.</li>
                        <li><strong>المستوى الثالث:</strong> الإدارة الفندقية الاستراتيجية، إدارة الجودة السياحية، والتسويق الفندقي.</li>
                    </ul>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-briefcase"></i> مجالات العمل المستقبلية</h3>
                    <div class="tags-container">
                        <span class="skill-tag">مدير فندق / منتجع</span>
                        <span class="skill-tag">مدير علاقات عامة سياحية</span>
                        <span class="skill-tag">منسق فعاليات ومؤتمرات</span>
                        <span class="skill-tag">مسؤول حجوزات</span>
                        <span class="skill-tag">مرشد سياحي معتمد</span>
                    </div>
                </div>
            `
        },
        'electrical': {
            title: 'الهندسة الكهربائية',
            icon: 'fas fa-bolt',
            desc: `
                <div class="major-detail-section">
                    <h3><i class="fas fa-info-circle"></i> نبذة عن التخصص</h3>
                    <p>تخصص هندسي حيوي يجمع بين دراسة الأنظمة الكهربائية التقليدية وتكنولوجيا الطاقة المتجددة الحديثة. يتدرب الطالب عملياً على تصميم، تركيب، وصيانة الأنظمة الكهربائية المعقدة والمتحكمات المنطقية القابلة للبرمجة (PLC).</p>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-layer-group"></i> محاور الدراسة (المستويات)</h3>
                    <ul>
                        <li><strong>المستوى الأول:</strong> مبادئ الدوائر الكهربائية، السلامة المهنية، والقياسات الكهربائية.</li>
                        <li><strong>المستوى الثاني:</strong> التمديدات الكهربائية المعمارية والصناعية، دراسة الآلات والمحركات الكهربائية.</li>
                        <li><strong>المستوى الثالث:</strong> أنظمة الطاقة المتجددة (الخلايا الشمسية)، الأتمتة الصناعية، والتحكم الذكي (Smart Homes).</li>
                    </ul>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-briefcase"></i> مجالات العمل المستقبلية</h3>
                    <div class="tags-container">
                        <span class="skill-tag">فني طاقة شمسية</span>
                        <span class="skill-tag">مشرف تركيبات كهربائية</span>
                        <span class="skill-tag">فني صيانة مصانع (PLC)</span>
                        <span class="skill-tag">مصمم شبكات إنارة</span>
                        <span class="skill-tag">مراقب جودة كهربائية</span>
                    </div>
                </div>
            `
        },
        'mechanical': {
            title: 'الهندسة الميكانيكية',
            icon: 'fas fa-car-battery',
            desc: `
                <div class="major-detail-section">
                    <h3><i class="fas fa-info-circle"></i> نبذة عن التخصص</h3>
                    <p>يعد تخصص الهندسة الميكانيكية وصيانة المركبات عصب الصناعة الحديثة. يتعلم الطالب كيفية تشخيص الأعطال الميكانيكية، صيانة أنظمة التبريد والتكييف، وفهم تكنولوجيا السيارات الحديثة بما فيها السيارات الهجينة والكهربائية.</p>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-layer-group"></i> محاور الدراسة (المستويات)</h3>
                    <ul>
                        <li><strong>المستوى الأول:</strong> أساسيات الميكانيكا، استخدام عدد وأدوات الورش، ومبادئ اللحام.</li>
                        <li><strong>المستوى الثاني:</strong> أنظمة نقل الحركة، صيانة محركات الاحتراق الداخلي، وفحص السيارات بواسطة الكمبيوتر.</li>
                        <li><strong>المستوى الثالث:</strong> صيانة السيارات الهجينة (Hybrid) والكهربائية (EV)، وأنظمة الهيدروليك الصناعية.</li>
                    </ul>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-briefcase"></i> مجالات العمل المستقبلية</h3>
                    <div class="tags-container">
                        <span class="skill-tag">فحص وصيانة سيارات كهربائية و Hybrid</span>
                        <span class="skill-tag">فني صيانة ميكانيكية للمصانع</span>
                        <span class="skill-tag">خبير أنظمة تدفئة وتكييف (HVAC)</span>
                        <span class="skill-tag">فني خراطة طباعة 3D CNC</span>
                        <span class="skill-tag">مدير ورشة صيانة مركبات</span>
                    </div>
                </div>
            `
        },
        'beauty': {
            title: 'التجميل والعناية بالبشرة',
            icon: 'fas fa-cut',
            desc: `
                <div class="major-detail-section">
                    <h3><i class="fas fa-info-circle"></i> نبذة عن التخصص</h3>
                    <p>تخصص فني ومهني يركز على إكساب الطالب مهارات عالية في فنون العناية بالشعر، البشرة، والمكياج السينمائي واليومي. يتميز هذا التخصص بالمرونة وإمكانية إطلاق الطالب لمشروعه الخاص فور التخرج.</p>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-layer-group"></i> محاور الدراسة (المستويات)</h3>
                    <ul>
                        <li><strong>المستوى الأول:</strong> أساسيات العناية بالشعر، تقنيات القص والصبغات، والصحة العامة للصالونات.</li>
                        <li><strong>المستوى الثاني:</strong> العناية العميقة بالبشرة (Skin Care)، والمكياج الاحترافي لمختلف المناسبات، وتركيب الأظافر (Nail Art).</li>
                    </ul>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-briefcase"></i> مجالات العمل المستقبلية</h3>
                    <div class="tags-container">
                        <span class="skill-tag">خبير/ة تجميل ومكياج سينمائي</span>
                        <span class="skill-tag">مدير صالون تجميل أو SPA</span>
                        <span class="skill-tag">أخصائي عناية بالبشرة</span>
                        <span class="skill-tag">مصفف شعر احترافي</span>
                        <span class="skill-tag">صاحب عمل مستقل (Freelancer)</span>
                    </div>
                </div>
            `
        },
        'cooking': {
            title: 'فنون الطهي',
            icon: 'fas fa-utensils',
            desc: `
                <div class="major-detail-section">
                    <h3><i class="fas fa-info-circle"></i> نبذة عن التخصص</h3>
                    <p>يعتبر فن الطهي من التخصصات التي تشهد طلباً هائلاً عالمياً وفي مدينة العقبة خصوصاً. يدرب هذا التخصص الطالب ليصبح شيفاً محترفاً قادراً على إدارة المطابخ الكبرى، ابتكار الوصفات، وتطبيق معايير سلامة الأغذية الهاسب (HACCP) الصارمة.</p>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-layer-group"></i> محاور الدراسة (المستويات)</h3>
                    <ul>
                        <li><strong>المستوى الأول:</strong> أساسيات التقطيع وإعداد المكونات، الطبخ الشرقي والغربي، وقواعد السلامة والنظافة في المطابخ.</li>
                        <li><strong>المستوى الثاني:</strong> صناعة الحلويات، إدارة المخزون والمشتريات، وابتكار الأطباق الفاخرة، والإشراف على فريق المطبخ.</li>
                    </ul>
                </div>
                <div class="major-detail-section">
                    <h3><i class="fas fa-briefcase"></i> مجالات العمل المستقبلية</h3>
                    <div class="tags-container">
                        <span class="skill-tag">شيف تنفيذي (Executive Chef)</span>
                        <span class="skill-tag">شيف حلويات ومعجنات (Pastry Chef)</span>
                        <span class="skill-tag">مدير مطاعم وكافيهات</span>
                        <span class="skill-tag">مراقب جودة أغذية</span>
                        <span class="skill-tag">استشاري قوائم طعام</span>
                    </div>
                </div>
            `
        }
    };

    window.openMajorModal = function(majorKey) {
        const data = majorsData[majorKey];
        if (!data) return;

        const modal = document.getElementById('majorModal');
        const titleEl = document.getElementById('majorModalTitle');
        const iconEl = document.getElementById('majorModalIcon');
        const bodyEl = document.getElementById('majorModalBody');

        titleEl.textContent = data.title;
        iconEl.innerHTML = '<i class="' + data.icon + '"></i>';
        bodyEl.innerHTML = data.desc;

        modal.classList.add('open');
        if (typeof playClick === 'function') playClick();
    };

    window.closeMajorModal = function() {
        const modal = document.getElementById('majorModal');
        if (modal) {
            modal.classList.remove('open');
            if (typeof playClick === 'function') playClick();
        }
    };

})();
