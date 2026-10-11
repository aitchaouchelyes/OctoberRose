"use strict";
const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Menu mobile ---------- */
$("menuBtn").addEventListener("click", () => {
  const open = $("nav").classList.toggle("is-open");
  $("menuBtn").setAttribute("aria-expanded", open);
});
$("nav").addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    $("nav").classList.remove("is-open");
    $("menuBtn").setAttribute("aria-expanded", "false");
  }
});

/* ---------- Barre de progression, en-tête, lien actif ---------- */
(function scrollEffects() {
  const bar = $("progressTop"), header = $("siteHeader");
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    header.classList.toggle("is-stuck", h.scrollTop > 10);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll(".nav a")];
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove("is-active"));
      const a = map.get(en.target.id);
      if (a) a.classList.add("is-active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((_, id) => { const s = $(id); if (s) io.observe(s); });
})();

/* ---------- Ondes au clic + effet magnétique sur les boutons ---------- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn || reduceMotion) return;
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  const dot = document.createElement("span");
  dot.className = "ripple";
  dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  btn.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove());
});
if (canHover && !reduceMotion) {
  document.querySelectorAll(".btn--primary").forEach((b) => {
    b.addEventListener("mousemove", (e) => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.15;
      const y = (e.clientY - r.top - r.height / 2) * 0.25;
      b.style.transform = `translate(${x}px, ${y - 3}px)`;
    });
    b.addEventListener("mouseleave", () => { b.style.transform = ""; });
  });
}

/* ---------- Confettis ---------- */
function confetti() {
  if (reduceMotion) return;
  const cv = document.createElement("canvas");
  cv.className = "confetti";
  const ctx = cv.getContext("2d");
  const w = (cv.width = innerWidth), h = (cv.height = innerHeight);
  const palette = ["#f4a6c0", "#d82b66", "#ffffff", "#14357a", "#ff7aa8"];
  const bits = Array.from({ length: 140 }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 200, y: h * 0.6,
    vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 6,
    s: Math.random() * 8 + 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: palette[(Math.random() * palette.length) | 0],
  }));
  document.body.appendChild(cv);
  const t0 = performance.now();
  (function frame(t) {
    const age = t - t0;
    ctx.clearRect(0, 0, w, h);
    bits.forEach((b) => {
      b.vy += 0.38; b.x += b.vx; b.y += b.vy; b.vx *= 0.99; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.globalAlpha = Math.max(0, 1 - age / 2800);
      ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
      ctx.restore();
    });
    if (age < 2800) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

/* ---------- Fond binaire du hero (clin d'œil au logo) ---------- */
(function binaryRain() {
  const cv = $("binary");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const size = 18, trail = 9;
  let w = 0, h = 0, cols = [], running = true, last = 0;

  const makeCol = (i, initial) => ({
    x: i * size * 1.6,
    y: initial ? Math.random() * h : -trail * size,
    v: 20 + Math.random() * 40,
    chars: Array.from({ length: trail }, () => (Math.random() > 0.5 ? "1" : "0")),
  });
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Array.from({ length: Math.ceil(w / (size * 1.6)) }, (_, i) => makeCol(i, true));
    draw(0);
  }
  function draw(dt) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `500 ${size}px "JetBrains Mono", monospace`;
    cols.forEach((c, i) => {
      c.y += c.v * dt;
      if (c.y - trail * size > h) cols[i] = makeCol(i, false);
      c.chars.forEach((ch, k) => {
        const a = (1 - k / trail) * 0.35;
        ctx.fillStyle = k === 0 ? `rgba(244,166,192,${a + 0.25})` : `rgba(120,160,230,${a})`;
        ctx.fillText(ch, c.x, c.y - k * size);
      });
    });
  }
  function loop(t) {
    if (!running) return;
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    draw(dt);
    requestAnimationFrame(loop);
  }
  resize();
  addEventListener("resize", resize);
  if (reduceMotion) return;
  new IntersectionObserver(([en]) => {
    const was = running;
    running = en.isIntersecting;
    if (running && !was) { last = performance.now(); requestAnimationFrame(loop); }
  }).observe(cv.parentElement);
  requestAnimationFrame(loop);
})();

/* ---------- Affiche : inclinaison 3D qui suit la souris ---------- */
(function tilt() {
  const poster = $("poster");
  if (!poster || !canHover || reduceMotion) return;
  const inner = poster.querySelector(".poster__inner");
  poster.addEventListener("mousemove", (e) => {
    const r = poster.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    inner.style.setProperty("--ry", `${(px - 0.5) * 14}deg`);
    inner.style.setProperty("--rx", `${(0.5 - py) * 14}deg`);
    inner.style.setProperty("--mx", `${px * 100}%`);
    inner.style.setProperty("--my", `${py * 100}%`);
  });
  poster.addEventListener("mouseleave", () => {
    inner.style.setProperty("--ry", "0deg");
    inner.style.setProperty("--rx", "0deg");
  });
})();

/* ---------- Terminal du hero ---------- */
const termLines = [
  '<span class="d">$</span> <span class="k">octobre-rose</span> --rappels',
  "",
  '<span class="d">auto-examen</span>      1 fois par mois',
  '<span class="d">examen clinique</span>  dès 25 ans, 1 fois/an',
  '<span class="d">mammographie</span>     50-74 ans, tous les 2 ans',
  "",
  '<span class="d">#</span> à vous de jouer<span class="cursor"></span>',
];
(function typeTerminal() {
  const el = $("terminal");
  const full = termLines.join("\n");
  if (reduceMotion) { el.innerHTML = full; return; }
  let line = 0, out = "";
  const next = () => {
    if (line >= termLines.length) return;
    out += (line ? "\n" : "") + termLines[line++];
    el.innerHTML = out;
    setTimeout(next, 450);
  };
  setTimeout(next, 700);
})();

/* ---------- Auto-examen ---------- */
const steps = [
  { title: "Observation de face", text: "Placez-vous devant un miroir bien éclairé, bras le long du corps puis mains sur les hanches. Observez la forme, la symétrie et la peau des deux seins.", watch: "Un changement de taille, une asymétrie nouvelle, une ride, un mamelon qui rentre ou une rougeur.", tip: "Une légère asymétrie est fréquente. Ce qui compte, c'est un changement récent." },
  { title: "Observation de profil, bras levés", text: "Levez les deux bras au-dessus de la tête et tournez lentement de trois-quarts pour voir chaque profil. Ce mouvement fait bouger les tissus et peut révéler une rétraction.", watch: "La peau doit se soulever régulièrement, sans pli fixe ni fossette inhabituelle.", tip: "Prenez votre temps, c'est un rendez-vous avec vous-même." },
  { title: "Palpation circulaire", text: "Allongée ou sous la douche (le savon facilite le glissement), levez le bras gauche et palpez le sein gauche avec la pulpe de trois doigts de la main droite : index, majeur, annulaire.", watch: "Faites de petits cercles en spirale, du bord extérieur vers le centre, avec trois pressions : légère, moyenne, profonde. Répétez de l'autre côté.", tip: "Utilisez le plat des doigts serrés, jamais le bout des ongles." },
  { title: "Aisselle et mamelon", text: "Prolongez la palpation jusque dans le creux de l'aisselle, où se trouvent les ganglions. Pressez ensuite très doucement le mamelon entre le pouce et l'index.", watch: "Un ganglion dur ou sensible sous l'aisselle, un écoulement liquide ou teinté au mamelon.", tip: "Si vous trouvez quelque chose, ne paniquez pas : la majorité des boules sont bénignes. Consultez pour vérifier." },
];
let step = 0;
const stepTabs = [0, 1, 2, 3].map((i) => $("stepTab" + i));
// Précharge les illustrations (même dossier que index.html)
steps.forEach((_, i) => { new Image().src = `step-${i + 1}.svg`; });

function showStep(i) {
  step = i;
  const s = steps[i];
  stepTabs.forEach((t, k) => {
    t.setAttribute("aria-selected", k === i);
    t.tabIndex = k === i ? 0 : -1;
  });
  const p = $("stepPanel");
  p.setAttribute("aria-labelledby", "stepTab" + i);
  p.innerHTML = `<div><h3></h3><p class="t"></p><div class="watch"><strong>À surveiller</strong><span class="w"></span></div><p class="tip"></p></div>
    <img class="stepper__img" src="step-${i + 1}.svg" alt="Illustration de l'étape ${i + 1}" width="300" height="300">`;
  p.querySelector("h3").textContent = s.title;
  p.querySelector(".t").textContent = s.text;
  p.querySelector(".w").textContent = s.watch;
  p.querySelector(".tip").textContent = s.tip;
  p.classList.remove("swap"); void p.offsetWidth; p.classList.add("swap");
  $("stepBar").style.width = ((i + 1) / steps.length) * 100 + "%";
  $("prevStep").disabled = i === 0;
  $("nextStep").textContent = i === steps.length - 1 ? "Recommencer" : "Suivant";
}
stepTabs.forEach((t, i) => {
  t.addEventListener("click", () => showStep(i));
  t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : steps.length - 1)) % steps.length;
    showStep(n); stepTabs[n].focus();
  });
});
$("prevStep").addEventListener("click", () => showStep(Math.max(0, step - 1)));
$("nextStep").addEventListener("click", () => showStep((step + 1) % steps.length));

$("icsBtn").addEventListener("click", () => {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Octobre Rose//Auto-examen//FR", "BEGIN:VEVENT",
    "UID:auto-examen-mensuel@octobre-rose", "DTSTAMP:20261004T080000Z", "DTSTART;VALUE=DATE:20261105",
    "SUMMARY:Auto-examen des seins", "DESCRIPTION:Cinq minutes pour l'auto-examen mensuel.",
    "RRULE:FREQ=MONTHLY;BYMONTHDAY=5", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = "rappel-auto-examen.ics";
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ---------- Choix du jeu ---------- */
function showGame(mode) {
  const swipe = mode === "swipe";
  $("swipeGame").hidden = !swipe;
  $("quizGame").hidden = swipe;
  $("tabSwipe").setAttribute("aria-selected", swipe);
  $("tabQuiz").setAttribute("aria-selected", !swipe);
}
$("tabSwipe").addEventListener("click", () => showGame("swipe"));
$("tabQuiz").addEventListener("click", () => showGame("quiz"));

/* ---------- Mythe ou réalité ---------- */
const claims = [
  { t: "Le cancer du sein ne touche que les femmes ayant des antécédents familiaux.", real: false, e: "Plus de 80 % des femmes touchées n'ont aucun antécédent familial direct. Le dépistage concerne tout le monde." },
  { t: "Détecté tôt, le cancer du sein se guérit dans environ 9 cas sur 10.", real: true, e: "La détection précoce permet des traitements plus légers et de très grandes chances de guérison." },
  { t: "Les hommes ne peuvent pas avoir de cancer du sein.", real: false, e: "C'est rare (moins de 1 % des cas), mais les hommes ont aussi une glande mammaire." },
  { t: "Une mammographie de dépistage est recommandée tous les 2 ans entre 50 et 74 ans.", real: true, e: "C'est le rythme du dépistage organisé, avec une double lecture des images." },
  { t: "Une douleur dans le sein signifie forcément un cancer.", real: false, e: "Les douleurs mammaires sont très fréquentes et le plus souvent bénignes (hormones, kystes). Un avis médical reste prudent." },
  { t: "Une activité physique régulière réduit le risque de cancer du sein.", real: true, e: "Une activité modérée d'au moins 30 minutes par jour contribue à réduire le risque." },
];
let cIdx = 0, cScore = 0, cLocked = false;
const card = $("swipeCard");

function showClaim() {
  cLocked = false;
  $("swipeIdx").textContent = cIdx + 1;
  $("swipeTotal").textContent = claims.length;
  card.textContent = claims[cIdx].t;
  card.style.transform = ""; card.style.opacity = "1";
  card.classList.remove("is-ok", "is-ko", "is-in"); void card.offsetWidth; card.classList.add("is-in");
  $("swipeFb").hidden = true; $("swipeNext").hidden = true; $("swipeBtns").hidden = false;
}
function answerClaim(saidReal) {
  if (cLocked) return;
  cLocked = true;
  const c = claims[cIdx], ok = saidReal === c.real;
  if (ok) cScore++;
  card.classList.remove("is-drag");
  card.style.transform = `translateX(${saidReal ? 50 : -50}px) rotate(${saidReal ? 4 : -4}deg)`;
  card.style.opacity = ".7";
  card.classList.add(ok ? "is-ok" : "is-ko");
  setHints(0, 0);
  const fb = $("swipeFb");
  fb.className = "feedback " + (ok ? "feedback--ok" : "feedback--ko");
  fb.innerHTML = "<strong></strong><span></span>";
  fb.firstChild.textContent = ok ? "Bonne réponse" : "Pas tout à fait";
  fb.lastChild.textContent = (c.real ? "C'est vrai. " : "C'est un mythe. ") + c.e;
  fb.hidden = false; $("swipeBtns").hidden = true; $("swipeNext").hidden = false;
}
function setHints(myth, real) {
  $("hintMyth").style.opacity = myth;
  $("hintReal").style.opacity = real;
}
$("btnMyth").addEventListener("click", () => answerClaim(false));
$("btnReal").addEventListener("click", () => answerClaim(true));
$("btnSwipeNext").addEventListener("click", () => {
  if (++cIdx < claims.length) return showClaim();
  $("swipePlay").hidden = true; $("swipeEnd").hidden = false;
  $("swipeScore").textContent = `${cScore} / ${claims.length}`;
  if (cScore >= 5) confetti();
});
$("swipeReset").addEventListener("click", () => {
  cIdx = 0; cScore = 0; $("swipePlay").hidden = false; $("swipeEnd").hidden = true; showClaim();
});
// Glisser la carte avec le doigt ou la souris
let dragX = null;
card.addEventListener("pointerdown", (e) => {
  if (cLocked) return;
  dragX = e.clientX;
  card.setPointerCapture(e.pointerId);
  card.classList.add("is-drag");
});
card.addEventListener("pointermove", (e) => {
  if (dragX === null) return;
  const dx = e.clientX - dragX;
  card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
  setHints(Math.min(1, Math.max(0, -dx / 90)), Math.min(1, Math.max(0, dx / 90)));
});
function endDrag(e) {
  if (dragX === null) return;
  const dx = e.clientX - dragX;
  dragX = null;
  card.classList.remove("is-drag");
  setHints(0, 0);
  if (Math.abs(dx) > 90) answerClaim(dx > 0); else card.style.transform = "";
}
card.addEventListener("pointerup", endDrag);
card.addEventListener("pointercancel", endDrag);
// Flèches du clavier
$("swipeGame").addEventListener("keydown", (e) => {
  if ($("swipeBtns").hidden) return;
  if (e.key === "ArrowLeft") answerClaim(false);
  if (e.key === "ArrowRight") answerClaim(true);
});

/* ---------- Quiz ---------- */
const quiz = [
  { q: "À partir de quel âge un examen clinique annuel des seins est-il recommandé ?", o: ["Dès 25 ans", "À partir de 50 ans", "Après la ménopause uniquement", "À 18 ans"], a: 0, e: "Dès 25 ans, un professionnel de santé examine les seins une fois par an." },
  { q: "Quelle est la fréquence de la mammographie de dépistage entre 50 et 74 ans ?", o: ["Tous les 6 mois", "Tous les ans", "Tous les 2 ans", "Tous les 5 ans"], a: 2, e: "Le dépistage organisé propose une mammographie tous les 2 ans, avec seconde lecture." },
  { q: "Quel est le taux de guérison d'un cancer du sein détecté tôt ?", o: ["Environ 50 %", "Environ 70 %", "Environ 90 %", "Environ 30 %"], a: 2, e: "Près de 9 femmes sur 10 guérissent quand le cancer est détecté tôt." },
  { q: "Quel signe doit amener à consulter ?", o: ["Un pli ou une fossette apparus sur la peau", "Un écoulement au mamelon", "Une boule dure, même indolore", "Tous ces signes"], a: 3, e: "Chacun de ces signes justifie un avis médical pour en trouver l'origine." },
  { q: "L'auto-palpation remplace-t-elle la mammographie ?", o: ["Oui, elle est aussi précise", "Non, elle la complète", "Oui, en été", "Seulement après 60 ans"], a: 1, e: "La mammographie repère des anomalies que les doigts ne sentent pas." },
  { q: "Quand faire l'auto-examen dans le cycle ?", o: ["Pendant les règles", "Quelques jours après les règles", "Juste avant les règles", "Le jour de l'ovulation"], a: 1, e: "Après les règles, les seins sont plus souples et moins sensibles." },
  { q: "Les hommes peuvent-ils avoir un cancer du sein ?", o: ["Non, c'est impossible", "Oui, mais moins de 1 % des cas", "Oui, autant que les femmes", "Seulement s'ils fument"], a: 1, e: "Les hommes ont une glande mammaire, donc le risque existe, même s'il est faible." },
  { q: "Quelle habitude aide à se protéger ?", o: ["Marcher 30 minutes par jour", "Limiter l'alcool", "Manger varié", "Toutes ces réponses"], a: 3, e: "Ces habitudes contribuent toutes à réduire le risque." },
  { q: "Que signifie « double lecture » d'une mammographie ?", o: ["La radio est faite deux fois", "Deux radiologues la lisent", "La patiente la relit", "Elle est lue sur deux écrans"], a: 1, e: "Un second radiologue relit les mammographies jugées normales." },
  { q: "Quel est le symbole mondial de la lutte contre le cancer du sein ?", o: ["Le ruban rouge", "Le ruban rose", "Le trèfle vert", "Le tournesol"], a: 1, e: "Le ruban rose symbolise la solidarité et la sensibilisation." },
];
let qIdx = 0, qScore = 0;

function showQuestion() {
  const q = quiz[qIdx];
  $("quizIdx").textContent = qIdx + 1;
  $("quizScoreLive").textContent = qScore;
  $("quizBar").style.width = ((qIdx + 1) / quiz.length) * 100 + "%";
  $("quizQ").textContent = q.q;
  $("quizExp").hidden = true; $("quizNextBox").hidden = true;
  const box = $("quizOpts"); box.innerHTML = "";
  q.o.forEach((txt, i) => {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = '<span class="opt__key"></span><span class="opt__txt"></span>';
    b.firstChild.textContent = "ABCD"[i];
    b.lastChild.textContent = txt;
    b.addEventListener("click", () => pickOption(i));
    box.appendChild(b);
  });
}
function pickOption(i) {
  const q = quiz[qIdx], btns = $("quizOpts").children;
  [...btns].forEach((b) => (b.disabled = true));
  btns[q.a].classList.add("is-right");
  if (i === q.a) qScore++; else btns[i].classList.add("is-wrong");
  $("quizScoreLive").textContent = qScore;
  $("quizExp").textContent = q.e;
  $("quizExp").hidden = false; $("quizNextBox").hidden = false;
  $("quizNext").textContent = qIdx === quiz.length - 1 ? "Voir mon score" : "Question suivante";
}
$("quizNext").addEventListener("click", () => {
  if (++qIdx < quiz.length) return showQuestion();
  $("quizPlay").hidden = true; $("quizEnd").hidden = false;
  $("quizScore").textContent = `${qScore} / ${quiz.length}`;
  $("quizMsg").textContent = qScore >= 9 ? "Excellents réflexes. Partagez-les autour de vous."
    : qScore >= 6 ? "Bon score. Relisez le guide d'auto-examen pour compléter."
    : "Un bon point de départ. Le guide d'auto-examen ci-dessus vous aidera à progresser.";
  if (qScore >= 8) confetti();
});
$("quizReset").addEventListener("click", () => {
  qIdx = 0; qScore = 0; $("quizPlay").hidden = false; $("quizEnd").hidden = true; showQuestion();
});

/* ---------- Mur de messages ---------- */
const colors = [["#d82b66", "Rose vif"], ["#a81c4e", "Framboise"], ["#f06f98", "Rose clair"], ["#14357a", "Bleu nuit"], ["#f4a6c0", "Rose poudré"]];
const symbolPaths = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  star: '<path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
};
const symbolNames = { heart: "Cœur", star: "Étoile", sun: "Soleil", shield: "Bouclier" };
const STORE = "octobre-rose-mur";
let color = colors[0][0], symbol = "heart";

function ribbonSvg(c, s) {
  return `<svg class="ribbon" viewBox="0 0 100 120" aria-hidden="true"><path d="M50 15C35 15 20 35 30 65L15 110l20-5 15-27 15 27 20 5-15-45C80 35 65 15 50 15z" fill="${c}"/><circle cx="50" cy="45" r="15" fill="#fff"/><g transform="translate(38 33) scale(.5)" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${symbolPaths[s]}</g></svg>`;
}
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; } };
const save = (list) => { try { localStorage.setItem(STORE, JSON.stringify(list)); } catch {} };

function renderWall(newId) {
  const list = load(), wall = $("wall");
  wall.innerHTML = "";
  $("wallCount").textContent = list.length ? `(${list.length})` : "";
  $("wallClear").hidden = !list.length;
  if (!list.length) {
    wall.innerHTML = '<div class="empty"><strong>Le mur est vide pour l\'instant.</strong>Écrivez le premier message avec le formulaire.</div>';
    return;
  }
  list.forEach((r) => {
    const tile = document.createElement("article");
    tile.className = "tile" + (r.date === newId ? " is-new" : "");
    tile.style.borderLeftColor = r.color;
    tile.innerHTML = ribbonSvg(r.color, r.symbol) + "<div><b></b><time></time><p></p></div>";
    tile.querySelector("b").textContent = r.author;
    tile.querySelector("time").textContent = new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    tile.querySelector("p").textContent = r.message;
    wall.appendChild(tile);
  });
}
function updatePreview() {
  $("pAuthor").textContent = $("rAuthor").value.trim() || "Votre prénom";
  $("pMsg").textContent = $("rMsg").value.trim() || "Votre message";
  $("rPreview").innerHTML = ribbonSvg(color, symbol);
  $("rCount").textContent = `${140 - $("rMsg").value.length} caractères restants`;
}
function pressOnly(group, btn) {
  group.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
}
colors.forEach(([hex, name], i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "swatch"; b.style.background = hex; b.title = name; b.setAttribute("aria-label", name);
  b.setAttribute("aria-pressed", i === 0);
  b.addEventListener("click", () => { color = hex; pressOnly($("swatches"), b); updatePreview(); });
  $("swatches").appendChild(b);
});
Object.keys(symbolPaths).forEach((key, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "symbol"; b.title = symbolNames[key]; b.setAttribute("aria-label", symbolNames[key]);
  b.setAttribute("aria-pressed", i === 0);
  b.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbolPaths[key]}</svg>`;
  b.addEventListener("click", () => { symbol = key; pressOnly($("symbols"), b); updatePreview(); });
  $("symbols").appendChild(b);
});
["rAuthor", "rMsg"].forEach((id) => $(id).addEventListener("input", updatePreview));
$("ribbonForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const author = $("rAuthor").value.trim(), message = $("rMsg").value.trim();
  if (!author || !message) return;
  const list = load();
  const date = new Date().toISOString();
  list.unshift({ author, message, color, symbol, date });
  save(list);
  e.target.reset(); updatePreview(); renderWall(date);
});
$("wallClear").addEventListener("click", () => {
  if (confirm("Supprimer tous les messages enregistrés sur cet appareil ?")) { save([]); renderWall(); }
});

/* ---------- Initialisation ---------- */
showStep(0);
showClaim();
showQuestion();
updatePreview();
renderWall();
