(function(){
'use strict';

const KEY='fda-site-language';
const SUPPORTED=['it','en','de','fr','es'];
const NAMES={
  it:'🇮🇹 Italiano',
  en:'🇬🇧 English',
  de:'🇩🇪 Deutsch',
  fr:'🇫🇷 Français',
  es:'🇪🇸 Español'
};
let lang='it';
let translating=false;
let observer=null;
const originals=new WeakMap();
const attrOriginals=new WeakMap();
const pending=new Map();

const CORE={
  en:{
    "Home":"Home",
    "Alveoterapia":"Alveotherapy",
    "Alveoterapia Integrata":"Integrated Alveotherapy",
    "ALVEOTERAPIA INTEGRATA":"INTEGRATED ALVEOTHERAPY",
    "Chi siamo":"About us",
    "Bacheca":"News",
    "Contatti":"Contact",
    "Prodotti & Shop":"Products & Shop",
    "Parliamone":"Let's talk",
    "Linea Veleni":"Bee Venom Line",
    "LINEA VELENI":"BEE VENOM LINE",
    "Il Centro":"The Centre",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Busatello Oasis",
    "Primavera · Estate":"Spring · Summer",
    "Autunno · Inverno":"Autumn · Winter",
    "Carrello":"Cart",
    "Il tuo carrello":"Your cart",
    "Selezione":"Selection",
    "Tutte le linee":"All collections",
    "Linea Alimenti":"Food Collection",
    "Linea Integratori":"Supplements Collection",
    "Linea Cosmesi e Tesori in Cera d’Api":"Cosmetics & Beeswax Treasures",
    "Linea Cosmetica al Veleno d’Api":"Bee Venom Cosmetic Line",
    "Pagamento":"Payment",
    "Spedizione":"Shipping",
    "Totale da pagare":"Total to pay"
  },
  de:{
    "Home":"Startseite",
    "Alveoterapia":"Alveotherapie",
    "Alveoterapia Integrata":"Integrierte Alveotherapie",
    "ALVEOTERAPIA INTEGRATA":"INTEGRIERTE ALVEOTHERAPIE",
    "Chi siamo":"Über uns",
    "Bacheca":"Aktuelles",
    "Contatti":"Kontakt",
    "Prodotti & Shop":"Produkte & Shop",
    "Parliamone":"Sprechen wir darüber",
    "Linea Veleni":"Bienengift-Linie",
    "LINEA VELENI":"BIENENGIFT-LINIE",
    "Il Centro":"Das Zentrum",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Oase Busatello",
    "Primavera · Estate":"Frühling · Sommer",
    "Autunno · Inverno":"Herbst · Winter",
    "Carrello":"Warenkorb",
    "Il tuo carrello":"Dein Warenkorb",
    "Selezione":"Auswahl",
    "Tutte le linee":"Alle Linien",
    "Linea Alimenti":"Lebensmittel-Linie",
    "Linea Integratori":"Nahrungsergänzungsmittel",
    "Linea Cosmesi e Tesori in Cera d’Api":"Kosmetik & Schätze aus Bienenwachs",
    "Linea Cosmetica al Veleno d’Api":"Kosmetiklinie mit Bienengift",
    "Pagamento":"Zahlung",
    "Spedizione":"Versand",
    "Totale da pagare":"Gesamtbetrag"
  },
  fr:{
    "Home":"Accueil",
    "Alveoterapia":"Alvéothérapie",
    "Alveoterapia Integrata":"Alvéothérapie Intégrée",
    "ALVEOTERAPIA INTEGRATA":"ALVÉOTHÉRAPIE INTÉGRÉE",
    "Chi siamo":"Qui sommes-nous",
    "Bacheca":"Actualités",
    "Contatti":"Contact",
    "Prodotti & Shop":"Produits & Boutique",
    "Parliamone":"Parlons-en",
    "Linea Veleni":"Ligne Venin d'Abeille",
    "LINEA VELENI":"LIGNE VENIN D'ABEILLE",
    "Il Centro":"Le Centre",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Oasis du Busatello",
    "Primavera · Estate":"Printemps · Été",
    "Autunno · Inverno":"Automne · Hiver",
    "Carrello":"Panier",
    "Il tuo carrello":"Votre panier",
    "Selezione":"Sélection",
    "Tutte le linee":"Toutes les gammes",
    "Linea Alimenti":"Gamme Alimentaire",
    "Linea Integratori":"Gamme Compléments",
    "Linea Cosmesi e Tesori in Cera d’Api":"Cosmétiques & Trésors en Cire d'Abeille",
    "Linea Cosmetica al Veleno d’Api":"Gamme Cosmétique au Venin d'Abeille",
    "Pagamento":"Paiement",
    "Spedizione":"Livraison",
    "Totale da pagare":"Total à payer"
  },
  es:{
    "Home":"Inicio",
    "Alveoterapia":"Alveoterapia",
    "Alveoterapia Integrata":"Alveoterapia Integrada",
    "ALVEOTERAPIA INTEGRATA":"ALVEOTERAPIA INTEGRADA",
    "Chi siamo":"Quiénes somos",
    "Bacheca":"Novedades",
    "Contatti":"Contacto",
    "Prodotti & Shop":"Productos & Tienda",
    "Parliamone":"Hablemos",
    "Linea Veleni":"Línea Veneno de Abeja",
    "LINEA VELENI":"LÍNEA VENENO DE ABEJA",
    "Il Centro":"El Centro",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Oasis del Busatello",
    "Primavera · Estate":"Primavera · Verano",
    "Autunno · Inverno":"Otoño · Invierno",
    "Carrello":"Carrito",
    "Il tuo carrello":"Tu carrito",
    "Selezione":"Selección",
    "Tutte le linee":"Todas las líneas",
    "Linea Alimenti":"Línea Alimentación",
    "Linea Integratori":"Línea Complementos",
    "Linea Cosmesi e Tesori in Cera d’Api":"Cosmética & Tesoros de Cera de Abeja",
    "Linea Cosmetica al Veleno d’Api":"Línea Cosmética con Veneno de Abeja",
    "Pagamento":"Pago",
    "Spedizione":"Envío",
    "Totale da pagare":"Total a pagar"
  }
};


const ALVEO_CORE_TRANSLATIONS={
  en:{
    "Anteprima parziale · 5 pagine reali. Il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Partial preview · 5 real pages. The complete 37-page PDF is available after purchase.",
    "Sfoglia cinque pagine reali: copertina, indice, introduzione e la Colazione 1 completa.":"Browse five real pages: cover, contents, introduction and the complete Breakfast 1.",
    "LA FABBRICA DELLE API · ALVEO DIGITALE":"LA FABBRICA DELLE API · ALVEO DIGITALE",
    "Colazione 1 · Varianti e idee":"Breakfast 1 · Variations and ideas",
    "Colazione 1 · Ricetta":"Breakfast 1 · Recipe",
    "Introduzione":"Introduction",
    "Indice":"Contents",
    "Copertina":"Cover",
    "Alveo Digitale":"Alveo Digitale",
    "L’alveare continua anche fuori dal Centro.":"The hive experience continues beyond the Centre.",
    "Ricette, idee e contenuti digitali legati al mondo della Fabbrica delle Api. Nessun pacco da aspettare: scegli il contenuto e portalo con te.":"Recipes, ideas and digital content inspired by the world of La Fabbrica delle Api. No parcel to wait for: choose your content and take it with you.",
    "Scopri i contenuti →":"Discover the content →",
    "Vai direttamente allo shop":"Go straight to the shop",
    "01 · Scegli":"01 · Choose",
    "Trova il contenuto che vuoi portare con te.":"Find the content you want to take with you.",
    "02 · Acquista":"02 · Buy",
    "Lo aggiungi al carrello come un normale prodotto.":"Add it to your cart like any other product.",
    "03 · Nessuna spedizione":"03 · No shipping",
    "Il contenuto è digitale: non vengono applicati costi di spedizione.":"The content is digital: no shipping costs apply.",
    "Disponibile ora":"Available now",
    "10 Colazioni dell’Alveare":"10 Breakfasts from the Hive",
    "La prima uscita Premium di Alveo Digitale.":"The first Premium release from Alveo Digitale.",
    "Ricette & idee · Edizione Premium":"Recipes & ideas · Premium Edition",
    "10 Colazioni dell’Alveare – Edizione Premium":"10 Breakfasts from the Hive – Premium Edition",
    "Un magazine digitale illustrato da consultare e riutilizzare: 10 ricette complete, 20 idee lampo, planner, lista della spesa, quiz e una piccola esperienza di degustazione dei mieli. È disponibile in italiano, inglese, tedesco, francese e spagnolo; dopo il pagamento viene proposta la versione corrispondente alla lingua scelta sul sito.":"An illustrated digital magazine to browse and reuse: 10 complete recipes, 20 quick ideas, a planner, shopping list, quiz and a small honey-tasting experience. Available in Italian, English, German, French and Spanish; after payment, the version matching the language selected on the site is offered.",
    "Digitale":"Digital",
    "Spedizione €0":"Shipping €0",
    "👁 Sfoglia anteprima":"👁 Browse preview",
    "Apri la scheda e acquista →":"Open the product page and buy →",
    "Alveo Digitale è una categoria viva.":"Alveo Digitale is a living category.",
    "Questo è il primo contenuto disponibile; nuovi prodotti digitali potranno essere aggiunti senza trasformare la Bottega in una semplice raccolta di file.":"This is the first available content; new digital products can be added without turning the Shop into a simple file collection.",
    "10 Colazioni dell’Alveare · Anteprima":"10 Breakfasts from the Hive · Preview",
    "Chiudi ✕":"Close ✕",
    "Sfoglia tre pagine reali dell’edizione Premium prima di acquistare.":"Browse three real pages from the Premium Edition before buying.",
    "Presentazione":"Introduction",
    "Una ricetta completa":"One complete recipe",
    "Una pagina extra":"One extra page",
    "← Indietro":"← Back",
    "Avanti →":"Next →",
    "Anteprima parziale · il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Partial preview · the complete 37-page PDF is available after purchase."
  },
  de:{
    "Anteprima parziale · 5 pagine reali. Il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Teilvorschau · 5 echte Seiten. Das vollständige 37-seitige PDF ist nach dem Kauf verfügbar.",
    "Sfoglia cinque pagine reali: copertina, indice, introduzione e la Colazione 1 completa.":"Sehen Sie fünf echte Seiten: Titelseite, Inhalt, Einführung und das vollständige Frühstück 1.",
    "Colazione 1 · Varianti e idee":"Frühstück 1 · Varianten und Ideen",
    "Colazione 1 · Ricetta":"Frühstück 1 · Rezept",
    "Introduzione":"Einführung",
    "Indice":"Inhalt",
    "Copertina":"Titelseite",
    "Alveo Digitale":"Alveo Digitale",
    "L’alveare continua anche fuori dal Centro.":"Das Erlebnis des Bienenstocks geht auch außerhalb des Zentrums weiter.",
    "Ricette, idee e contenuti digitali legati al mondo della Fabbrica delle Api. Nessun pacco da aspettare: scegli il contenuto e portalo con te.":"Rezepte, Ideen und digitale Inhalte rund um die Welt von La Fabbrica delle Api. Kein Paket, auf das Sie warten müssen: Inhalt auswählen und direkt mitnehmen.",
    "Scopri i contenuti →":"Inhalte entdecken →",
    "Vai direttamente allo shop":"Direkt zum Shop",
    "01 · Scegli":"01 · Auswählen",
    "Trova il contenuto che vuoi portare con te.":"Finden Sie den Inhalt, den Sie mitnehmen möchten.",
    "02 · Acquista":"02 · Kaufen",
    "Lo aggiungi al carrello come un normale prodotto.":"Fügen Sie ihn wie ein normales Produkt zum Warenkorb hinzu.",
    "03 · Nessuna spedizione":"03 · Kein Versand",
    "Il contenuto è digitale: non vengono applicati costi di spedizione.":"Der Inhalt ist digital: Es fallen keine Versandkosten an.",
    "Disponibile ora":"Jetzt verfügbar",
    "10 Colazioni dell’Alveare":"10 Frühstücke aus dem Bienenstock",
    "La prima uscita Premium di Alveo Digitale.":"Die erste Premium-Ausgabe von Alveo Digitale.",
    "Ricette & idee · Edizione Premium":"Rezepte & Ideen · Premium-Ausgabe",
    "10 Colazioni dell’Alveare – Edizione Premium":"10 Frühstücke aus dem Bienenstock – Premium-Ausgabe",
    "Un magazine digitale illustrato da consultare e riutilizzare: 10 ricette complete, 20 idee lampo, planner, lista della spesa, quiz e una piccola esperienza di degustazione dei mieli. È disponibile in italiano, inglese, tedesco, francese e spagnolo; dopo il pagamento viene proposta la versione corrispondente alla lingua scelta sul sito.":"Ein illustriertes digitales Magazin zum Nachschlagen und Wiederverwenden: 10 vollständige Rezepte, 20 schnelle Ideen, Planer, Einkaufsliste, Quiz und eine kleine Honigverkostung. Verfügbar auf Italienisch, Englisch, Deutsch, Französisch und Spanisch; nach der Zahlung wird die Version in der auf der Website gewählten Sprache angeboten.",
    "Digitale":"Digital",
    "Spedizione €0":"Versand €0",
    "👁 Sfoglia anteprima":"👁 Vorschau ansehen",
    "Apri la scheda e acquista →":"Produktseite öffnen und kaufen →",
    "Alveo Digitale è una categoria viva.":"Alveo Digitale ist eine lebendige Kategorie.",
    "Questo è il primo contenuto disponibile; nuovi prodotti digitali potranno essere aggiunti senza trasformare la Bottega in una semplice raccolta di file.":"Dies ist der erste verfügbare Inhalt; weitere digitale Produkte können ergänzt werden, ohne den Shop in eine einfache Dateisammlung zu verwandeln.",
    "10 Colazioni dell’Alveare · Anteprima":"10 Frühstücke aus dem Bienenstock · Vorschau",
    "Chiudi ✕":"Schließen ✕",
    "Sfoglia tre pagine reali dell’edizione Premium prima di acquistare.":"Sehen Sie sich vor dem Kauf drei echte Seiten der Premium-Ausgabe an.",
    "Presentazione":"Einführung",
    "Una ricetta completa":"Ein vollständiges Rezept",
    "Una pagina extra":"Eine Zusatzseite",
    "← Indietro":"← Zurück",
    "Avanti →":"Weiter →",
    "Anteprima parziale · il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Teilvorschau · das vollständige 37-seitige PDF ist nach dem Kauf verfügbar."
  },
  fr:{
    "Anteprima parziale · 5 pagine reali. Il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Aperçu partiel · 5 vraies pages. Le PDF complet de 37 pages est disponible après l’achat.",
    "Sfoglia cinque pagine reali: copertina, indice, introduzione e la Colazione 1 completa.":"Feuilletez cinq vraies pages : couverture, sommaire, introduction et le Petit-déjeuner 1 complet.",
    "Colazione 1 · Varianti e idee":"Petit-déjeuner 1 · Variantes et idées",
    "Colazione 1 · Ricetta":"Petit-déjeuner 1 · Recette",
    "Indice":"Sommaire",
    "Copertina":"Couverture",
    "Alveo Digitale":"Alveo Digitale",
    "L’alveare continua anche fuori dal Centro.":"L’expérience de la ruche continue aussi hors du Centre.",
    "Ricette, idee e contenuti digitali legati al mondo della Fabbrica delle Api. Nessun pacco da aspettare: scegli il contenuto e portalo con te.":"Recettes, idées et contenus numériques liés à l’univers de La Fabbrica delle Api. Aucun colis à attendre : choisissez votre contenu et emportez-le avec vous.",
    "Scopri i contenuti →":"Découvrir les contenus →",
    "Vai direttamente allo shop":"Aller directement à la boutique",
    "01 · Scegli":"01 · Choisissez",
    "Trova il contenuto che vuoi portare con te.":"Trouvez le contenu que vous souhaitez emporter avec vous.",
    "02 · Acquista":"02 · Achetez",
    "Lo aggiungi al carrello come un normale prodotto.":"Ajoutez-le au panier comme un produit normal.",
    "03 · Nessuna spedizione":"03 · Aucune livraison",
    "Il contenuto è digitale: non vengono applicati costi di spedizione.":"Le contenu est numérique : aucun frais de livraison ne s’applique.",
    "Disponibile ora":"Disponible maintenant",
    "10 Colazioni dell’Alveare":"10 Petits-déjeuners de la Ruche",
    "La prima uscita Premium di Alveo Digitale.":"La première édition Premium d’Alveo Digitale.",
    "Ricette & idee · Edizione Premium":"Recettes & idées · Édition Premium",
    "10 Colazioni dell’Alveare – Edizione Premium":"10 Petits-déjeuners de la Ruche – Édition Premium",
    "Un magazine digitale illustrato da consultare e riutilizzare: 10 ricette complete, 20 idee lampo, planner, lista della spesa, quiz e una piccola esperienza di degustazione dei mieli. È disponibile in italiano, inglese, tedesco, francese e spagnolo; dopo il pagamento viene proposta la versione corrispondente alla lingua scelta sul sito.":"Un magazine numérique illustré à consulter et réutiliser : 10 recettes complètes, 20 idées express, un planning, une liste de courses, un quiz et une petite expérience de dégustation des miels. Disponible en italien, anglais, allemand, français et espagnol ; après le paiement, la version correspondant à la langue choisie sur le site est proposée.",
    "Digitale":"Numérique",
    "Spedizione €0":"Livraison 0 €",
    "👁 Sfoglia anteprima":"👁 Feuilleter l’aperçu",
    "Apri la scheda e acquista →":"Ouvrir la fiche et acheter →",
    "Alveo Digitale è una categoria viva.":"Alveo Digitale est une catégorie vivante.",
    "Questo è il primo contenuto disponibile; nuovi prodotti digitali potranno essere aggiunti senza trasformare la Bottega in una semplice raccolta di file.":"Il s’agit du premier contenu disponible ; de nouveaux produits numériques pourront être ajoutés sans transformer la boutique en simple collection de fichiers.",
    "10 Colazioni dell’Alveare · Anteprima":"10 Petits-déjeuners de la Ruche · Aperçu",
    "Chiudi ✕":"Fermer ✕",
    "Sfoglia tre pagine reali dell’edizione Premium prima di acquistare.":"Feuilletez trois vraies pages de l’Édition Premium avant d’acheter.",
    "Presentazione":"Présentation",
    "Una ricetta completa":"Une recette complète",
    "Una pagina extra":"Une page supplémentaire",
    "← Indietro":"← Retour",
    "Avanti →":"Suivant →",
    "Anteprima parziale · il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Aperçu partiel · le PDF complet de 37 pages est disponible après l’achat."
  },
  es:{
    "Anteprima parziale · 5 pagine reali. Il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Vista previa parcial · 5 páginas reales. El PDF completo de 37 páginas está disponible después de la compra.",
    "Sfoglia cinque pagine reali: copertina, indice, introduzione e la Colazione 1 completa.":"Explora cinco páginas reales: portada, índice, introducción y el Desayuno 1 completo.",
    "Colazione 1 · Varianti e idee":"Desayuno 1 · Variantes e ideas",
    "Colazione 1 · Ricetta":"Desayuno 1 · Receta",
    "Introduzione":"Introducción",
    "Indice":"Índice",
    "Copertina":"Portada",
    "Alveo Digitale":"Alveo Digitale",
    "L’alveare continua anche fuori dal Centro.":"La experiencia de la colmena continúa también fuera del Centro.",
    "Ricette, idee e contenuti digitali legati al mondo della Fabbrica delle Api. Nessun pacco da aspettare: scegli il contenuto e portalo con te.":"Recetas, ideas y contenidos digitales vinculados al mundo de La Fabbrica delle Api. No hay que esperar ningún paquete: elige el contenido y llévalo contigo.",
    "Scopri i contenuti →":"Descubre los contenidos →",
    "Vai direttamente allo shop":"Ir directamente a la tienda",
    "01 · Scegli":"01 · Elige",
    "Trova il contenuto che vuoi portare con te.":"Encuentra el contenido que quieres llevar contigo.",
    "02 · Acquista":"02 · Compra",
    "Lo aggiungi al carrello come un normale prodotto.":"Añádelo al carrito como un producto normal.",
    "03 · Nessuna spedizione":"03 · Sin envío",
    "Il contenuto è digitale: non vengono applicati costi di spedizione.":"El contenido es digital: no se aplican gastos de envío.",
    "Disponibile ora":"Disponible ahora",
    "10 Colazioni dell’Alveare":"10 Desayunos de la Colmena",
    "La prima uscita Premium di Alveo Digitale.":"La primera edición Premium de Alveo Digitale.",
    "Ricette & idee · Edizione Premium":"Recetas e ideas · Edición Premium",
    "10 Colazioni dell’Alveare – Edizione Premium":"10 Desayunos de la Colmena – Edición Premium",
    "Un magazine digitale illustrato da consultare e riutilizzare: 10 ricette complete, 20 idee lampo, planner, lista della spesa, quiz e una piccola esperienza di degustazione dei mieli. È disponibile in italiano, inglese, tedesco, francese e spagnolo; dopo il pagamento viene proposta la versione corrispondente alla lingua scelta sul sito.":"Una revista digital ilustrada para consultar y reutilizar: 10 recetas completas, 20 ideas rápidas, planificador, lista de la compra, quiz y una pequeña experiencia de degustación de mieles. Está disponible en italiano, inglés, alemán, francés y español; después del pago se ofrece la versión correspondiente al idioma elegido en el sitio.",
    "Digitale":"Digital",
    "Spedizione €0":"Envío 0 €",
    "👁 Sfoglia anteprima":"👁 Ver vista previa",
    "Apri la scheda e acquista →":"Abrir la ficha y comprar →",
    "Alveo Digitale è una categoria viva.":"Alveo Digitale es una categoría viva.",
    "Questo è il primo contenuto disponibile; nuovi prodotti digitali potranno essere aggiunti senza trasformare la Bottega in una semplice raccolta di file.":"Este es el primer contenido disponible; podrán añadirse nuevos productos digitales sin convertir la tienda en una simple colección de archivos.",
    "10 Colazioni dell’Alveare · Anteprima":"10 Desayunos de la Colmena · Vista previa",
    "Chiudi ✕":"Cerrar ✕",
    "Sfoglia tre pagine reali dell’edizione Premium prima di acquistare.":"Explora tres páginas reales de la Edición Premium antes de comprar.",
    "Presentazione":"Presentación",
    "Una ricetta completa":"Una receta completa",
    "Una pagina extra":"Una página extra",
    "← Indietro":"← Atrás",
    "Avanti →":"Siguiente →",
    "Anteprima parziale · il PDF completo da 37 pagine è disponibile dopo l’acquisto.":"Vista previa parcial · el PDF completo de 37 páginas está disponible después de la compra."
  }
};
for(const code of ['en','de','fr','es']) Object.assign(CORE[code],ALVEO_CORE_TRANSLATIONS[code]);

const ATTRS=['title','aria-label','placeholder','alt'];

function cacheKeyFor(l){return 'fda-translation-cache-v3-'+l;}
function loadCache(l){
  try{return JSON.parse(localStorage.getItem(cacheKeyFor(l))||'{}')||{};}catch(_){return {};}
}
let cache={};
function saveCache(){
  if(lang==='it')return;
  try{localStorage.setItem(cacheKeyFor(lang),JSON.stringify(cache));}catch(_){}
}

function style(){
  if(document.getElementById('fda-language-style'))return;
  const s=document.createElement('style');
  s.id='fda-language-style';
  s.textContent='#fda-language-test{display:flex;align-items:center;gap:9px;color:#fff;font:800 12px/1.1 Arial,sans-serif;border:1px solid rgba(255,255,255,.32);border-radius:999px;padding:5px 6px 5px 10px;background:rgba(0,0,0,.18);white-space:nowrap}#fda-language-test span{font-weight:800}#fda-language-select{border:0;border-radius:999px;background:#f2b83f;color:#171717;padding:8px 10px;font-weight:900;outline:none;cursor:pointer}#fda-language-test.fallback{position:fixed;right:12px;top:12px;z-index:99999;box-shadow:0 5px 20px rgba(0,0,0,.3)}#fda-points-link{display:inline-flex;align-items:center;gap:6px;margin-left:6px;padding:8px 11px;border-radius:999px;background:#f2b83f;color:#171717!important;text-decoration:none!important;font:900 12px/1 Arial,sans-serif;white-space:nowrap;border:1px solid rgba(0,0,0,.12)}#fda-points-link:hover{filter:brightness(.96)}@media(max-width:900px){#fda-language-test{font-size:11px;padding-left:8px}#fda-language-test span{display:none}#fda-language-select{max-width:150px}}';
  document.head.appendChild(s);
}

function pointsLabel(l){
  return ({it:'🐝 Saldo Punti Ape',en:'🐝 Bee Points Balance',de:'🐝 Bienenpunkte-Saldo',fr:'🐝 Solde Points Abeille',es:'🐝 Saldo Puntos Abeja'})[l]||'🐝 Saldo Punti Ape';
}
function selector(){
  style();
  let box=document.getElementById('fda-language-test');
  if(!box){
    box=document.createElement('div');
    box.id='fda-language-test';
    const opts=SUPPORTED.map(v=>'<option value="'+v+'">'+NAMES[v]+'</option>').join('');
    box.innerHTML='<span>🌐 Lingua / Language</span><select id="fda-language-select" aria-label="Lingua / Language">'+opts+'</select>';
    const target=document.getElementById('center-home-bar')||document.querySelector('header nav')||document.querySelector('header .nav')||document.querySelector('header');
    if(target)target.appendChild(box);else{box.classList.add('fallback');document.body.appendChild(box);}
    box.querySelector('select').addEventListener('change',e=>setLang(e.target.value));
  }
  let points=document.getElementById('fda-points-link');
  if(!points){
    points=document.createElement('a');
    points.id='fda-points-link';
    points.href='/punti-ape';
    points.setAttribute('aria-label','Saldo Punti Ape');
    box.insertAdjacentElement('afterend',points);
  }
  points.textContent=pointsLabel(lang);
  const sel=document.getElementById('fda-language-select');
  if(sel)sel.value=lang;
}

function cleanText(v){return String(v||'').replace(/\s+/g,' ').trim();}
function shouldTranslate(x){
  if(!x||x.length<2)return false;
  if(/^[-+€$£%\d\s.,:/()]+$/.test(x))return false;
  if(/^(APIS\d+|BIO|INCI|PDF|QR|URL)$/i.test(x))return false;
  if(/^https?:\/\//i.test(x))return false;
  return /[A-Za-zÀ-ÿ]/.test(x);
}

async function directGoogleTranslate(text,target){
  const clean=cleanText(text);
  if(!clean||target==='it')return clean;
  try{
    const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl='+encodeURIComponent(target)+'&dt=t&q='+encodeURIComponent(clean);
    const res=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
    if(!res.ok)return clean;
    const data=await res.json();
    const out=Array.isArray(data?.[0])?data[0].map(v=>Array.isArray(v)?(v[0]||''):'').join(''):clean;
    return String(out||clean).trim()||clean;
  }catch(_){return clean;}
}

async function remoteTranslateBatch(texts){
  if(lang==='it')return texts;
  const unique=[...new Set((texts||[]).map(cleanText).filter(shouldTranslate))];
  const unresolved=unique.filter(text=>!(CORE[lang]||{})[text]&&!cache[text]);
  if(!unresolved.length)return unique.map(text=>(CORE[lang]||{})[text]||cache[text]||text);

  for(let start=0;start<unresolved.length;start+=20){
    const chunk=unresolved.slice(start,start+20);
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      let res;
      try{
        res=await fetch('/api/site-translate',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({target:lang,texts:chunk}),
          signal:controller.signal
        });
        if(!res.ok){
          const q=encodeURIComponent(JSON.stringify(chunk));
          res=await fetch('/api/site-translate-get?target='+encodeURIComponent(lang)+'&q='+q,{
            method:'GET',
            signal:controller.signal,
            cache:'no-store'
          });
        }
      }finally{clearTimeout(timer);}
      const data=await res.json().catch(()=>null);
      if(res.ok&&data?.ok&&Array.isArray(data.translations)){
        chunk.forEach((text,i)=>{
          const out=String(data.translations[i]||text).trim();
          if(out&&out!==text)cache[text]=out;
        });
      }
      const stillMissing=chunk.filter(text=>!cache[text]&&!(CORE[lang]||{})[text]);
      if(stillMissing.length){
        let cursor=0;
        const workers=Array.from({length:4},async()=>{
          while(cursor<stillMissing.length){
            const text=stillMissing[cursor++];
            const out=await directGoogleTranslate(text,lang);
            if(out&&out!==text)cache[text]=out;
          }
        });
        await Promise.all(workers);
      }
      saveCache();
    }catch(_){}
  }
  return unique.map(text=>(CORE[lang]||{})[text]||cache[text]||text);
}

async function remoteTranslate(text){
  if(lang==='it')return text;
  const fixed=(CORE[lang]||{})[text];
  if(fixed)return fixed;
  if(cache[text])return cache[text];
  const k=lang+'\n'+text;
  if(pending.has(k))return pending.get(k);
  const job=(async()=>{
    await remoteTranslateBatch([text]);
    return cache[text]||text;
  })();
  pending.set(k,job);
  try{return await job;}finally{pending.delete(k);}
}

async function translateTextNode(node){
  if(lang==='it'||!node||node.nodeType!==3)return;
  const p=node.parentElement;
  if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))return;
  if(p.closest && p.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return;
  const raw=node.nodeValue||'', x=cleanText(raw);
  if(!shouldTranslate(x))return;
  if(!originals.has(node))originals.set(node,raw);
  const out=await remoteTranslate(x);
  if(lang==='it'||!out||out===x)return;
  const leading=(raw.match(/^\s*/)||[''])[0];
  const trailing=(raw.match(/\s*$/)||[''])[0];
  node.nodeValue=leading+out+trailing;
}

async function translateElementAttrs(el){
  if(lang==='it'||!el||el.nodeType!==1)return;
  if(el.closest && el.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return;
  let map=attrOriginals.get(el);
  if(!map){map={};attrOriginals.set(el,map);}
  for(const a of ATTRS){
    if(!el.hasAttribute(a))continue;
    const raw=el.getAttribute(a)||'', x=cleanText(raw);
    if(!shouldTranslate(x))continue;
    if(!(a in map))map[a]=raw;
    const out=await remoteTranslate(x);
    if(lang!=='it'&&out&&out!==x)el.setAttribute(a,out);
  }
}

function collect(root){
  const texts=[],els=[];
  if(!root)return {texts,els};
  if(root.nodeType===3)texts.push(root);
  if(root.nodeType===1)els.push(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let n;
  while((n=w.nextNode())){if(n.nodeType===3)texts.push(n);else els.push(n);}
  return {texts,els};
}

function applyCoreImmediately(root){
  if(lang==='it')return;
  const dict=CORE[lang]||{};
  const {texts,els}=collect(root||document.body);
  for(const node of texts){
    const p=node.parentElement;
    if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))continue;
    if(p.closest && p.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))continue;
    const raw=node.nodeValue||'', x=cleanText(raw);
    if(!x||!dict[x])continue;
    if(!originals.has(node))originals.set(node,raw);
    const leading=(raw.match(/^\s*/)||[''])[0];
    const trailing=(raw.match(/\s*$/)||[''])[0];
    node.nodeValue=leading+dict[x]+trailing;
  }
  for(const el of els){
    if(el.closest && el.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))continue;
    let map=attrOriginals.get(el);
    if(!map){map={};attrOriginals.set(el,map);}
    for(const a of ATTRS){
      if(!el.hasAttribute(a))continue;
      const raw=el.getAttribute(a)||'', x=cleanText(raw);
      if(!x||!dict[x])continue;
      if(!(a in map))map[a]=raw;
      el.setAttribute(a,dict[x]);
    }
  }
}

async function translateRoot(root){
  if(lang==='it'||translating)return;
  translating=true;
  try{
    const target=root||document.body;
    applyCoreImmediately(target);
    document.documentElement.dataset.siteLanguage=lang;

    const {texts,els}=collect(target);
    const textQueue=texts.filter(n=>{
      const p=n.parentElement;
      if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))return false;
      if(p.closest && p.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return false;
      return shouldTranslate(cleanText(n.nodeValue||''));
    });

    // Give visible text priority so the page changes language immediately.
    textQueue.sort((a,b)=>{
      const ar=a.parentElement?.getBoundingClientRect?.();
      const br=b.parentElement?.getBoundingClientRect?.();
      const av=ar && ar.bottom>=0 && ar.top<=innerHeight*1.5 ? 0 : 1;
      const bv=br && br.bottom>=0 && br.top<=innerHeight*1.5 ? 0 : 1;
      return av-bv;
    });

    const attrQueue=els.filter(el=>{
      if(el.closest && el.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return false;
      return ATTRS.some(a=>el.hasAttribute(a)&&shouldTranslate(cleanText(el.getAttribute(a)||'')));
    });

    const batchTexts=[];
    for(const n of textQueue)batchTexts.push(cleanText(n.nodeValue||''));
    for(const el of attrQueue){
      for(const a of ATTRS){
        if(el.hasAttribute(a)){
          const x=cleanText(el.getAttribute(a)||'');
          if(shouldTranslate(x))batchTexts.push(x);
        }
      }
    }
    if(document.title)batchTexts.push(cleanText(document.title));
    await remoteTranslateBatch(batchTexts);

    const textWorkers=Array.from({length:10},async()=>{
      while(textQueue.length&&lang!=='it'){
        const n=textQueue.shift();
        await translateTextNode(n);
      }
    });
    const attrWorkers=Array.from({length:4},async()=>{
      while(attrQueue.length&&lang!=='it'){
        const el=attrQueue.shift();
        await translateElementAttrs(el);
      }
    });

    await Promise.all([...textWorkers,...attrWorkers]);

    if(document.title){
      const title=cleanText(document.title);
      const out=await remoteTranslate(title);
      if(lang!=='it'&&out)document.title=out;
    }
  }finally{
    translating=false;
  }
}

function setLang(v){
  const next=SUPPORTED.includes(v)?v:'it';
  try{localStorage.setItem(KEY,next);}catch(_){}
  const sel=document.getElementById('fda-language-select');
  if(sel)sel.value=next;
  document.documentElement.dataset.siteLanguage=next;
  if(next===lang){
    if(next!=='it')translateRoot(document.body);
    return;
  }
  lang=next;
  location.reload();
}

async function translateNow(root){
  if(lang==='it'||!root)return;
  applyCoreImmediately(root);
  const {texts,els}=collect(root);
  const textNodes=texts.filter(n=>{
    const p=n.parentElement;
    if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))return false;
    return shouldTranslate(cleanText(n.nodeValue||''));
  });
  const attrEls=els.filter(el=>ATTRS.some(a=>el.hasAttribute(a)&&shouldTranslate(cleanText(el.getAttribute(a)||''))));
  const batch=[];
  textNodes.forEach(n=>batch.push(cleanText(n.nodeValue||'')));
  attrEls.forEach(el=>ATTRS.forEach(a=>{
    if(el.hasAttribute(a)){
      const x=cleanText(el.getAttribute(a)||'');
      if(shouldTranslate(x))batch.push(x);
    }
  }));
  await remoteTranslateBatch(batch);

  for(const node of textNodes){
    const raw=node.nodeValue||'', x=cleanText(raw);
    const out=(CORE[lang]||{})[x]||cache[x]||x;
    if(out&&out!==x){
      const leading=(raw.match(/^\s*/)||[''])[0];
      const trailing=(raw.match(/\s*$/)||[''])[0];
      node.nodeValue=leading+out+trailing;
    }
  }
  for(const el of attrEls){
    for(const a of ATTRS){
      if(!el.hasAttribute(a))continue;
      const raw=el.getAttribute(a)||'', x=cleanText(raw);
      const out=(CORE[lang]||{})[x]||cache[x]||x;
      if(out&&out!==x)el.setAttribute(a,out);
    }
  }
}
window.fdaTranslateNow=translateNow;
window.fdaCurrentSiteLanguage=()=>lang;

function startObserver(){
  if(observer)observer.disconnect();
  observer=new MutationObserver(ms=>{
    if(lang==='it'||translating)return;
    const roots=[];
    ms.forEach(m=>m.addedNodes&&m.addedNodes.forEach(n=>{
      if(n.nodeType===1||n.nodeType===3)roots.push(n.nodeType===3?n.parentNode:n);
    }));
    roots.forEach(r=>translateRoot(r));
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

async function start(){
  if(!document.querySelector('meta[name="google"][content="notranslate"]')){
    const meta=document.createElement('meta');meta.name='google';meta.content='notranslate';document.head.appendChild(meta);
  }
  document.documentElement.setAttribute('translate','no');
  document.documentElement.classList.add('notranslate');
  if(document.body){document.body.setAttribute('translate','no');document.body.classList.add('notranslate');}
  document.documentElement.classList.remove('translated-ltr','translated-rtl');
  if(document.body)document.body.classList.remove('translated-ltr','translated-rtl');
  let saved='';
  try{saved=localStorage.getItem(KEY)||'';}catch(_){}
  lang=SUPPORTED.includes(saved)?saved:'it';
  cache=loadCache(lang);
  selector();
  const sel=document.getElementById('fda-language-select');
  if(sel)sel.value=lang;
  if(lang!=='it'){
    applyCoreImmediately(document.body);
    document.documentElement.dataset.siteLanguage=lang;
    await translateRoot(document.body);
  }else document.documentElement.dataset.siteLanguage='it';
  startObserver();
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();