(function(){
'use strict';

const KEY='fda-site-language';
const SUPPORTED=['it','en','de','fr','es'];
const LOCALE={it:'it-IT',en:'en-GB',de:'de-DE',fr:'fr-FR',es:'es-ES'};

const T={
it:{
 country:'Paese di consegna *',phonePrefix:'Prefisso',phoneNumber:'Numero',selectCountry:'Seleziona Paese',province:'Provincia / Regione',provincePh:'es. MN / Madrid',invalidProvince:'Per l’Italia inserisci la sigla della provincia di 2 lettere.',invalidPhone:'Inserisci un numero di telefono valido per il Paese selezionato.',shippingPending:'Da confermare',internationalReason:'Spedizione internazionale: costo da confermare prima dell’evasione.',goodsTotalPending:'Totale prodotti · spedizione da confermare',shippingCalcError:'Non riesco a calcolare la spedizione in questo momento.',posteItalyReason:kg=>'Poste Delivery Web · peso stimato '+weightText(kg)+' kg',posteIntlReason:(kg,zone)=>'Poste Delivery International Standard · peso stimato: '+weightText(kg)+' kg · Zona '+zone,postePendingReason:kg=>'Poste Italiane · peso stimato: '+weightText(kg)+' kg · tariffa da confermare per questa destinazione',
 cartTitle:'Il tuo cestino',cartEmpty:'Il cestino è ancora vuoto. Scegli ciò che ti incuriosisce e aggiungilo qui.',quantity:'quantità',points:'Punti Ape',remove:'rimuovi',orderPoints:'Punti Ape di questo ordine',totalProducts:'Totale prodotti',continueOrder:"Continua con l'ordine →",goal:'100 Punti Ape = cesto omaggio con 5 prodotti a scelta.',cartFab:'Il tuo cestino',addFirst:'Aggiungi almeno un prodotto prima di continuare.',
 checkoutEyebrow:'Il tuo ordine',checkoutTitle:'Concludi il tuo ordine',checkoutIntro:"Un percorso semplice, dall'indirizzo alla conferma finale.",steps:['1 · Dati','2 · Consegna','3 · Riepilogo','4 · Conferma'],
 step1Title:'Dove possiamo associare questo ordine?',name:'Nome e cognome *',email:'Email *',phone:'Telefono *',city:'Comune / Città *',address:'Via e numero civico *',cap:'CAP *',province:'Provincia *',provincePh:'es. MN',continue:'Continua →',
 step2Title:"Come vuoi ricevere l'ordine?",courier:'Corriere',courierDesc:'Consegna indicativa entro 5–6 giorni.',courierDescEU:'Poste Delivery International Standard · consegna indicativa in 10–15 giorni lavorativi, oltre il giorno di spedizione.',courierDescExtraEU:'Poste Delivery International Standard · consegna indicativa in 10–25 giorni lavorativi, oltre il giorno di spedizione e salvo formalità doganali.',pickup:'Ritiro / accordo diretto',pickupDesc:'Lo definiamo con te senza aggiungere passaggi inutili.',notes:'Note per la consegna',optional:'Facoltativo',back:'← Indietro',showSummary:'Vedi il riepilogo →',
 step3Title:'Controlla tutto prima di continuare',shipping:'Spedizione',checking:'Verifica in corso…',total:'Totale',free:'Gratuita',pointsOrder:'Punti Ape con questo ordine',pointsGoal:'Si aggiungono al tuo Saldo Api. A 100 punti puoi comporre un cesto omaggio con 5 prodotti a scelta.',
 step4Title:'Vai al pagamento',step4Intro:"Controlla i dati e continua al pagamento sicuro con carta.",sendOrder:'Vai al pagamento →',sending:'Apertura pagamento…',
 successTitle:'Ordine inviato',orderCode:'Codice ordine',successIntro:'Abbiamo ricevuto il tuo ordine. Ti contatteremo utilizzando i recapiti che hai indicato.',earned:'Hai guadagnato',successGoal:'Continua ad accumularli: a 100 punti puoi comporre un cesto omaggio con 5 prodotti a scelta.',downloadPdf:'Scarica il riepilogo PDF',backSite:'Torna alla Fabbrica delle Api',
 missing:'Completa i campi obbligatori prima di continuare.',invalidEmail:'Inserisci un indirizzo email valido.',invalidCap:'Inserisci un codice postale valido per il Paese selezionato.',invalidAddress:'Inserisci un indirizzo di consegna valido.',addressVerify:"Non riesco a verificare l’indirizzo. Controlla via, numero civico, codice postale, città e Paese.",emptyCart:'Il cestino è vuoto.',sendError:"Non è stato possibile inviare l’ordine. Riprova.",timeout:"L’invio sta impiegando troppo tempo. L’ordine non è stato cancellato: riprova tra poco.",network:"Non riesco a collegarmi al servizio ordini in questo momento. Riprova tra poco.",
 toCalculate:'Da calcolare',pickupReason:'Ritiro / accordo diretto',order200Reason:'Ordine da €200 o più',localReason:d=>'Consegna locale gratuita · '+d+' km da Castel d’Ario',courierReason:'Corriere · consegna indicativa 5–6 giorni',
 pdfCountry:'Paese',pdfShippingPending:'Da confermare', pdfTitle:"Riepilogo dell'ordine",pdfTotals:'Totali',pdfCustomer:'Dati acquirente',pdfProducts:'Prodotti',pdfProduct:'Prodotto',pdfQty:'Q.tà',pdfUnit:'Prezzo',pdfSubtotal:'Subtotale',pdfDelivery:'Consegna',pdfNotes:'Note',pdfNoNotes:'Nessuna nota',pdfGoods:'Prodotti',pdfShipping:'Spedizione',pdfTotal:'Totale',pdfPoints:'Punti Ape',pdfDate:'Data ordine',pdfNonFiscal:'Riepilogo ordine - documento non fiscale',pdfContact:'La Fabbrica delle Api - althea12830@gmail.com',pdfDownloadError:'Non riesco a creare il PDF in questo momento. Riprova.',pdfFile:'ordine'
},
en:{
 country:'Delivery country *',phonePrefix:'Country code',phoneNumber:'Number',selectCountry:'Select country',province:'Province / Region',provincePh:'e.g. MN / Madrid',invalidProvince:'For Italy, enter the 2-letter province code.',invalidPhone:'Enter a valid phone number for the selected country.',shippingPending:'To be confirmed',internationalReason:'International shipping: cost will be confirmed before fulfilment.',goodsTotalPending:'Products total · shipping to be confirmed',shippingCalcError:'I cannot calculate shipping right now.',posteItalyReason:kg=>'Poste Delivery Web · estimated weight: '+weightText(kg)+' kg',posteIntlReason:(kg,zone)=>'Poste Delivery International Standard · estimated weight: '+weightText(kg)+' kg · Zone '+zone,postePendingReason:kg=>'Poste Italiane · estimated weight: '+weightText(kg)+' kg · rate to be confirmed for this destination',
 cartTitle:'Your cart',cartEmpty:'Your cart is still empty. Choose what interests you and add it here.',quantity:'quantity',points:'Bee Points',remove:'remove',orderPoints:'Bee Points for this order',totalProducts:'Products total',continueOrder:'Continue with order →',goal:'100 Bee Points = complimentary basket with 5 products of your choice.',cartFab:'Your cart',addFirst:'Add at least one product before continuing.',
 checkoutEyebrow:'Your order',checkoutTitle:'Complete your order',checkoutIntro:'A simple journey from your address to final confirmation.',steps:['1 · Details','2 · Delivery','3 · Summary','4 · Confirmation'],
 step1Title:'Who should we associate this order with?',name:'Full name *',email:'Email *',phone:'Phone *',city:'Town / City *',address:'Street and number *',cap:'Postal code *',province:'Province *',provincePh:'e.g. MN',continue:'Continue →',
 step2Title:'How would you like to receive your order?',courier:'Courier',courierDesc:'Estimated delivery within 5–6 days.',courierDescEU:'Poste Delivery International Standard · estimated delivery in 10–15 working days, plus the shipping day.',courierDescExtraEU:'Poste Delivery International Standard · estimated delivery in 10–25 working days, plus the shipping day and excluding customs clearance.',pickup:'Pickup / direct arrangement',pickupDesc:'We will arrange it with you without unnecessary steps.',notes:'Delivery notes',optional:'Optional',back:'← Back',showSummary:'View summary →',
 step3Title:'Check everything before continuing',shipping:'Shipping',checking:'Checking…',total:'Total',free:'Free',pointsOrder:'Bee Points with this order',pointsGoal:'They are added to your Bee Points balance. At 100 points you can create a complimentary basket with 5 products of your choice.',
 step4Title:'Go to payment',step4Intro:'Check your details and continue to secure card payment.',sendOrder:'Go to payment →',sending:'Opening payment…',
 successTitle:'Order sent',orderCode:'Order code',successIntro:'We have received your order. We will contact you using the details you provided.',earned:'You earned',successGoal:'Keep collecting them: at 100 points you can create a complimentary basket with 5 products of your choice.',downloadPdf:'Download order PDF',backSite:'Back to La Fabbrica delle Api',
 missing:'Complete all required fields before continuing.',invalidEmail:'Enter a valid email address.',invalidCap:'Enter a valid postal code for the selected country.',invalidAddress:'Enter a valid delivery address.',addressVerify:'I cannot verify the address. Check street, number, postal code, city and country.',emptyCart:'Your cart is empty.',sendError:'The order could not be sent. Please try again.',timeout:'Sending is taking too long. Your order has not been deleted: please try again shortly.',network:'I cannot connect to the order service right now. Please try again shortly.',
 toCalculate:'To be calculated',pickupReason:'Pickup / direct arrangement',order200Reason:'Order of €200 or more',localReason:d=>'Free local delivery · '+d+' km from Castel d’Ario',courierReason:'Courier · estimated delivery 5–6 days',
 pdfCountry:'Country',pdfShippingPending:'To be confirmed', pdfTitle:'Order summary',pdfTotals:'Totals',pdfCustomer:'Customer details',pdfProducts:'Products',pdfProduct:'Product',pdfQty:'Qty',pdfUnit:'Price',pdfSubtotal:'Subtotal',pdfDelivery:'Delivery',pdfNotes:'Notes',pdfNoNotes:'No notes',pdfGoods:'Products',pdfShipping:'Shipping',pdfTotal:'Total',pdfPoints:'Bee Points',pdfDate:'Order date',pdfNonFiscal:'Order summary - non-fiscal document',pdfContact:'La Fabbrica delle Api - althea12830@gmail.com',pdfDownloadError:'I cannot create the PDF right now. Please try again.',pdfFile:'order'
},
de:{
 country:'Lieferland *',phonePrefix:'Vorwahl',phoneNumber:'Nummer',selectCountry:'Land auswählen',province:'Provinz / Region',provincePh:'z. B. MN / Madrid',invalidProvince:'Für Italien bitte das zweistellige Provinzkürzel eingeben.',invalidPhone:'Gib eine gültige Telefonnummer für das gewählte Land ein.',shippingPending:'Zu bestätigen',internationalReason:'Internationaler Versand: Die Kosten werden vor der Bearbeitung bestätigt.',goodsTotalPending:'Produktsumme · Versand wird bestätigt',shippingCalcError:'Der Versand kann momentan nicht berechnet werden.',posteItalyReason:kg=>'Poste Delivery Web · geschätztes Gewicht: '+weightText(kg)+' kg',posteIntlReason:(kg,zone)=>'Poste Delivery International Standard · geschätztes Gewicht: '+weightText(kg)+' kg · Zone '+zone,postePendingReason:kg=>'Poste Italiane · geschätztes Gewicht: '+weightText(kg)+' kg · Tarif für dieses Ziel zu bestätigen',
 cartTitle:'Dein Warenkorb',cartEmpty:'Dein Warenkorb ist noch leer. Wähle etwas aus und füge es hier hinzu.',quantity:'Menge',points:'Bienenpunkte',remove:'entfernen',orderPoints:'Bienenpunkte dieser Bestellung',totalProducts:'Produktsumme',continueOrder:'Bestellung fortsetzen →',goal:'100 Bienenpunkte = Geschenkkorb mit 5 Produkten nach Wahl.',cartFab:'Dein Warenkorb',addFirst:'Füge mindestens ein Produkt hinzu, bevor du fortfährst.',
 checkoutEyebrow:'Deine Bestellung',checkoutTitle:'Bestellung abschließen',checkoutIntro:'Ein einfacher Weg von der Adresse bis zur endgültigen Bestätigung.',steps:['1 · Daten','2 · Lieferung','3 · Übersicht','4 · Bestätigung'],
 step1Title:'Wem dürfen wir diese Bestellung zuordnen?',name:'Vor- und Nachname *',email:'E-Mail *',phone:'Telefon *',city:'Ort / Stadt *',address:'Straße und Hausnummer *',cap:'PLZ *',province:'Provinz *',provincePh:'z. B. MN',continue:'Weiter →',
 step2Title:'Wie möchtest du deine Bestellung erhalten?',courier:'Kurier',courierDesc:'Voraussichtliche Lieferung innerhalb von 5–6 Tagen.',courierDescEU:'Poste Delivery International Standard · voraussichtliche Lieferung in 10–15 Werktagen zuzüglich Versandtag.',courierDescExtraEU:'Poste Delivery International Standard · voraussichtliche Lieferung in 10–25 Werktagen zuzüglich Versandtag und vorbehaltlich Zollabfertigung.',pickup:'Abholung / direkte Vereinbarung',pickupDesc:'Wir stimmen die Abholung direkt mit dir ab.',notes:'Hinweise zur Lieferung',optional:'Optional',back:'← Zurück',showSummary:'Übersicht anzeigen →',
 step3Title:'Bitte alles prüfen, bevor du fortfährst',shipping:'Versand',checking:'Wird geprüft…',total:'Gesamt',free:'Kostenlos',pointsOrder:'Bienenpunkte mit dieser Bestellung',pointsGoal:'Sie werden deinem Bienenpunkte-Konto gutgeschrieben. Bei 100 Punkten kannst du einen Geschenkkorb mit 5 Produkten nach Wahl zusammenstellen.',
 step4Title:'Zur Zahlung',step4Intro:'Prüfe deine Daten und fahre mit der sicheren Kartenzahlung fort.',sendOrder:'Zur Zahlung →',sending:'Zahlung wird geöffnet…',
 successTitle:'Bestellung gesendet',orderCode:'Bestellcode',successIntro:'Wir haben deine Bestellung erhalten. Wir kontaktieren dich über die angegebenen Kontaktdaten.',earned:'Du hast erhalten',successGoal:'Sammle weiter: Bei 100 Punkten kannst du einen Geschenkkorb mit 5 Produkten nach Wahl zusammenstellen.',downloadPdf:'Bestellübersicht als PDF',backSite:'Zurück zu La Fabbrica delle Api',
 missing:'Fülle alle Pflichtfelder aus, bevor du fortfährst.',invalidEmail:'Gib eine gültige E-Mail-Adresse ein.',invalidCap:'Gib eine gültige Postleitzahl für das gewählte Land ein.',invalidAddress:'Gib eine gültige Lieferadresse ein.',addressVerify:'Die Adresse kann nicht geprüft werden. Kontrolliere Straße, Hausnummer, PLZ, Ort und Land.',emptyCart:'Dein Warenkorb ist leer.',sendError:'Die Bestellung konnte nicht gesendet werden. Bitte versuche es erneut.',timeout:'Das Senden dauert zu lange. Deine Bestellung wurde nicht gelöscht: Bitte versuche es gleich noch einmal.',network:'Der Bestellservice ist momentan nicht erreichbar. Bitte versuche es gleich noch einmal.',
 toCalculate:'Wird berechnet',pickupReason:'Abholung / direkte Vereinbarung',order200Reason:'Bestellung ab €200',localReason:d=>'Kostenlose lokale Lieferung · '+d+' km von Castel d’Ario',courierReason:'Kurier · voraussichtliche Lieferung 5–6 Tage',
 pdfCountry:'Land',pdfShippingPending:'Zu bestätigen', pdfTitle:'Bestellübersicht',pdfTotals:'Summen',pdfCustomer:'Kundendaten',pdfProducts:'Produkte',pdfProduct:'Produkt',pdfQty:'Menge',pdfUnit:'Preis',pdfSubtotal:'Zwischensumme',pdfDelivery:'Lieferung',pdfNotes:'Hinweise',pdfNoNotes:'Keine Hinweise',pdfGoods:'Produkte',pdfShipping:'Versand',pdfTotal:'Gesamt',pdfPoints:'Bienenpunkte',pdfDate:'Bestelldatum',pdfNonFiscal:'Bestellübersicht - kein Steuerbeleg',pdfContact:'La Fabbrica delle Api - althea12830@gmail.com',pdfDownloadError:'Das PDF kann momentan nicht erstellt werden. Bitte versuche es erneut.',pdfFile:'bestellung'
},
fr:{
 country:'Pays de livraison *',phonePrefix:'Indicatif',phoneNumber:'Numéro',selectCountry:'Sélectionnez le pays',province:'Province / Région',provincePh:'ex. MN / Madrid',invalidProvince:"Pour l’Italie, saisissez le code de province à 2 lettres.",invalidPhone:'Saisissez un numéro de téléphone valide pour le pays sélectionné.',shippingPending:'À confirmer',internationalReason:'Livraison internationale : le coût sera confirmé avant traitement.',goodsTotalPending:'Total produits · livraison à confirmer',shippingCalcError:'Impossible de calculer la livraison pour le moment.',posteItalyReason:kg=>'Poste Delivery Web · poids estimé : '+weightText(kg)+' kg',posteIntlReason:(kg,zone)=>'Poste Delivery International Standard · poids estimé : '+weightText(kg)+' kg · Zone '+zone,postePendingReason:kg=>'Poste Italiane · poids estimé : '+weightText(kg)+' kg · tarif à confirmer pour cette destination',
 cartTitle:'Votre panier',cartEmpty:'Votre panier est encore vide. Choisissez ce qui vous intéresse et ajoutez-le ici.',quantity:'quantité',points:'Points Abeille',remove:'supprimer',orderPoints:'Points Abeille de cette commande',totalProducts:'Total des produits',continueOrder:'Continuer la commande →',goal:'100 Points Abeille = panier cadeau avec 5 produits au choix.',cartFab:'Votre panier',addFirst:'Ajoutez au moins un produit avant de continuer.',
 checkoutEyebrow:'Votre commande',checkoutTitle:'Finaliser votre commande',checkoutIntro:"Un parcours simple, de l'adresse à la confirmation finale.",steps:['1 · Coordonnées','2 · Livraison','3 · Récapitulatif','4 · Confirmation'],
 step1Title:'À qui devons-nous associer cette commande ?',name:'Nom et prénom *',email:'E-mail *',phone:'Téléphone *',city:'Commune / Ville *',address:'Rue et numéro *',cap:'Code postal *',province:'Province *',provincePh:'ex. MN',continue:'Continuer →',
 step2Title:'Comment souhaitez-vous recevoir votre commande ?',courier:'Transporteur',courierDesc:'Livraison estimée sous 5–6 jours.',courierDescEU:'Poste Delivery International Standard · livraison indicative sous 10–15 jours ouvrés, en plus du jour d’expédition.',courierDescExtraEU:'Poste Delivery International Standard · livraison indicative sous 10–25 jours ouvrés, en plus du jour d’expédition et hors formalités douanières.',pickup:'Retrait / accord direct',pickupDesc:'Nous le définirons avec vous sans étapes inutiles.',notes:'Notes de livraison',optional:'Facultatif',back:'← Retour',showSummary:'Voir le récapitulatif →',
 step3Title:'Vérifiez tout avant de continuer',shipping:'Livraison',checking:'Vérification…',total:'Total',free:'Gratuite',pointsOrder:'Points Abeille avec cette commande',pointsGoal:'Ils sont ajoutés à votre solde Points Abeille. À 100 points, vous pouvez composer un panier cadeau avec 5 produits au choix.',
 step4Title:'Passer au paiement',step4Intro:'Vérifiez vos informations puis continuez vers le paiement sécurisé par carte.',sendOrder:'Passer au paiement →',sending:'Ouverture du paiement…',
 successTitle:'Commande envoyée',orderCode:'Code commande',successIntro:'Nous avons reçu votre commande. Nous vous contacterons avec les coordonnées indiquées.',earned:'Vous avez gagné',successGoal:'Continuez à les cumuler : à 100 points, vous pouvez composer un panier cadeau avec 5 produits au choix.',downloadPdf:'Télécharger le récapitulatif PDF',backSite:'Retour à La Fabbrica delle Api',
 missing:'Complétez tous les champs obligatoires avant de continuer.',invalidEmail:'Saisissez une adresse e-mail valide.',invalidCap:'Saisissez un code postal valide pour le pays sélectionné.',invalidAddress:'Saisissez une adresse de livraison valide.',addressVerify:"Impossible de vérifier l’adresse. Contrôlez la rue, le numéro, le code postal, la ville et le pays.",emptyCart:'Votre panier est vide.',sendError:"La commande n’a pas pu être envoyée. Réessayez.",timeout:"L’envoi prend trop de temps. Votre commande n’a pas été supprimée : réessayez dans un instant.",network:"Impossible de joindre le service de commande pour le moment. Réessayez dans un instant.",
 toCalculate:'À calculer',pickupReason:'Retrait / accord direct',order200Reason:'Commande de 200 € ou plus',localReason:d=>'Livraison locale gratuite · '+d+' km de Castel d’Ario',courierReason:'Transporteur · livraison estimée 5–6 jours',
 pdfCountry:'Pays',pdfShippingPending:'À confirmer', pdfTitle:'Récapitulatif de commande',pdfTotals:'Totaux',pdfCustomer:'Coordonnées client',pdfProducts:'Produits',pdfProduct:'Produit',pdfQty:'Qté',pdfUnit:'Prix',pdfSubtotal:'Sous-total',pdfDelivery:'Livraison',pdfNotes:'Notes',pdfNoNotes:'Aucune note',pdfGoods:'Produits',pdfShipping:'Livraison',pdfTotal:'Total',pdfPoints:'Points Abeille',pdfDate:'Date de commande',pdfNonFiscal:'Récapitulatif de commande - document non fiscal',pdfContact:'La Fabbrica delle Api - althea12830@gmail.com',pdfDownloadError:'Impossible de créer le PDF pour le moment. Réessayez.',pdfFile:'commande'
},
es:{
 country:'País de entrega *',phonePrefix:'Prefijo',phoneNumber:'Número',selectCountry:'Selecciona el país',province:'Provincia / Región',provincePh:'ej. MN / Madrid',invalidProvince:'Para Italia, introduce la sigla de provincia de 2 letras.',invalidPhone:'Introduce un número de teléfono válido para el país seleccionado.',shippingPending:'Por confirmar',internationalReason:'Envío internacional: el coste se confirmará antes de tramitar el pedido.',goodsTotalPending:'Total productos · envío por confirmar',shippingCalcError:'No puedo calcular el envío en este momento.',posteItalyReason:kg=>'Poste Delivery Web · peso estimado: '+weightText(kg)+' kg',posteIntlReason:(kg,zone)=>'Poste Delivery International Standard · peso estimado: '+weightText(kg)+' kg · Zona '+zone,postePendingReason:kg=>'Poste Italiane · peso estimado: '+weightText(kg)+' kg · tarifa por confirmar para este destino',
 cartTitle:'Tu carrito',cartEmpty:'Tu carrito todavía está vacío. Elige lo que te interese y añádelo aquí.',quantity:'cantidad',points:'Puntos Abeja',remove:'eliminar',orderPoints:'Puntos Abeja de este pedido',totalProducts:'Total productos',continueOrder:'Continuar con el pedido →',goal:'100 Puntos Abeja = cesta regalo con 5 productos a elegir.',cartFab:'Tu carrito',addFirst:'Añade al menos un producto antes de continuar.',
 checkoutEyebrow:'Tu pedido',checkoutTitle:'Completa tu pedido',checkoutIntro:'Un recorrido sencillo desde la dirección hasta la confirmación final.',steps:['1 · Datos','2 · Entrega','3 · Resumen','4 · Confirmación'],
 step1Title:'¿A quién debemos asociar este pedido?',name:'Nombre y apellidos *',email:'Email *',phone:'Teléfono *',city:'Municipio / Ciudad *',address:'Calle y número *',cap:'Código postal *',province:'Provincia *',provincePh:'ej. MN',continue:'Continuar →',
 step2Title:'¿Cómo quieres recibir el pedido?',courier:'Mensajería',courierDesc:'Entrega estimada en 5–6 días.',courierDescEU:'Poste Delivery International Standard · entrega estimada en 10–15 días laborables, más el día del envío.',courierDescExtraEU:'Poste Delivery International Standard · entrega estimada en 10–25 días laborables, más el día del envío y salvo trámites aduaneros.',pickup:'Recogida / acuerdo directo',pickupDesc:'Lo acordaremos contigo sin pasos innecesarios.',notes:'Notas para la entrega',optional:'Opcional',back:'← Atrás',showSummary:'Ver resumen →',
 step3Title:'Revísalo todo antes de continuar',shipping:'Envío',checking:'Comprobando…',total:'Total',free:'Gratis',pointsOrder:'Puntos Abeja con este pedido',pointsGoal:'Se añaden a tu saldo de Puntos Abeja. Con 100 puntos puedes crear una cesta regalo con 5 productos a elegir.',
 step4Title:'Ir al pago',step4Intro:'Comprueba tus datos y continúa al pago seguro con tarjeta.',sendOrder:'Ir al pago →',sending:'Abriendo el pago…',
 successTitle:'Pedido enviado',orderCode:'Código de pedido',successIntro:'Hemos recibido tu pedido. Nos pondremos en contacto contigo utilizando los datos indicados.',earned:'Has ganado',successGoal:'Sigue acumulándolos: con 100 puntos puedes crear una cesta regalo con 5 productos a elegir.',downloadPdf:'Descargar resumen PDF',backSite:'Volver a La Fabbrica delle Api',
 missing:'Completa todos los campos obligatorios antes de continuar.',invalidEmail:'Introduce un correo electrónico válido.',invalidCap:'Introduce un código postal válido para el país seleccionado.',invalidAddress:'Introduce una dirección de entrega válida.',addressVerify:'No puedo verificar la dirección. Comprueba calle, número, código postal, ciudad y país.',emptyCart:'Tu carrito está vacío.',sendError:'No se ha podido enviar el pedido. Inténtalo de nuevo.',timeout:'El envío está tardando demasiado. Tu pedido no se ha eliminado: vuelve a intentarlo en unos instantes.',network:'No puedo conectar con el servicio de pedidos en este momento. Inténtalo de nuevo en unos instantes.',
 toCalculate:'Por calcular',pickupReason:'Recogida / acuerdo directo',order200Reason:'Pedido de 200 € o más',localReason:d=>'Entrega local gratuita · '+d+' km de Castel d’Ario',courierReason:'Mensajería · entrega estimada 5–6 días',
 pdfCountry:'País',pdfShippingPending:'Por confirmar', pdfTitle:'Resumen del pedido',pdfTotals:'Totales',pdfCustomer:'Datos del cliente',pdfProducts:'Productos',pdfProduct:'Producto',pdfQty:'Cant.',pdfUnit:'Precio',pdfSubtotal:'Subtotal',pdfDelivery:'Entrega',pdfNotes:'Notas',pdfNoNotes:'Sin notas',pdfGoods:'Productos',pdfShipping:'Envío',pdfTotal:'Total',pdfPoints:'Puntos Abeja',pdfDate:'Fecha del pedido',pdfNonFiscal:'Resumen del pedido - documento no fiscal',pdfContact:'La Fabbrica delle Api - althea12830@gmail.com',pdfDownloadError:'No puedo crear el PDF en este momento. Inténtalo de nuevo.',pdfFile:'pedido'
}
};

function language(){
  try{const l=localStorage.getItem(KEY);if(SUPPORTED.includes(l))return l;}catch(_){}
  const h=(document.documentElement.lang||'it').slice(0,2).toLowerCase();
  return SUPPORTED.includes(h)?h:'it';
}
function tr(key){const l=language();return (T[l]&&T[l][key])??T.it[key]??key;}
function locale(){return LOCALE[language()]||LOCALE.it;}
function currency(value){return new Intl.NumberFormat(locale(),{style:'currency',currency:'EUR'}).format(Number(value||0));}
function weightText(value){
  return new Intl.NumberFormat(locale(),{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value||0));
}
function setText(sel,value){const el=document.querySelector(sel);if(el)el.textContent=value;}
function fieldLabel(id,value){const el=document.getElementById(id);const label=el?.closest('.field')?.querySelector('label');if(label)label.textContent=value;}
function cachedTranslation(original,l=language()){
  if(l==='it')return original;
  try{
    const c=JSON.parse(localStorage.getItem('fda-translation-cache-v2-'+l)||'{}')||{};
    if(c[original])return c[original];
  }catch(_){}
  return original;
}
const BUS=new Set(['millefiori','melone','fragola','pesca','arancia']);
function productRoot(id){return document.getElementById(BUS.has(id)?'miele-'+id:'prodotto-'+id);}
function productName(id,fallback){
  const l=language();if(l==='it')return fallback;
  const n=productRoot(id)?.querySelector('h3')?.textContent?.trim();
  if(n&&n!==fallback)return n;
  return cachedTranslation(fallback,l);
}
function productSize(id,fallback){
  const l=language();if(l==='it')return fallback;
  const root=productRoot(id);
  const n=(root?.querySelector('.catalog-price span')||root?.querySelector('.product-price span'))?.textContent?.trim();
  if(n&&n!==fallback)return n.replace(/^1\s+[^·]+·\s*/,'');
  return cachedTranslation(fallback,l);
}

const CHECKOUT_EU_COUNTRIES=new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
const CHECKOUT_COUNTRIES={
  AL:{dial:"+355"},
  AD:{dial:"+376"},
  AM:{dial:"+374"},
  AT:{dial:"+43"},
  AZ:{dial:"+994"},
  BY:{dial:"+375"},
  BE:{dial:"+32"},
  BA:{dial:"+387"},
  BG:{dial:"+359"},
  HR:{dial:"+385"},
  CY:{dial:"+357"},
  CZ:{dial:"+420"},
  DK:{dial:"+45"},
  EE:{dial:"+372"},
  FI:{dial:"+358"},
  FR:{dial:"+33"},
  GE:{dial:"+995"},
  DE:{dial:"+49"},
  GR:{dial:"+30"},
  HU:{dial:"+36"},
  IS:{dial:"+354"},
  IE:{dial:"+353"},
  IT:{dial:"+39"},
  XK:{dial:"+383"},
  LV:{dial:"+371"},
  LI:{dial:"+423"},
  LT:{dial:"+370"},
  LU:{dial:"+352"},
  MT:{dial:"+356"},
  MD:{dial:"+373"},
  MC:{dial:"+377"},
  ME:{dial:"+382"},
  NL:{dial:"+31"},
  MK:{dial:"+389"},
  NO:{dial:"+47"},
  PL:{dial:"+48"},
  PT:{dial:"+351"},
  RO:{dial:"+40"},
  RU:{dial:"+7"},
  SM:{dial:"+378"},
  RS:{dial:"+381"},
  SK:{dial:"+421"},
  SI:{dial:"+386"},
  ES:{dial:"+34"},
  SE:{dial:"+46"},
  CH:{dial:"+41"},
  TR:{dial:"+90"},
  UA:{dial:"+380"},
  GB:{dial:"+44"},
  VA:{dial:"+39"},
  AX:{dial:"+358"},
  FO:{dial:"+298"},
  GI:{dial:"+350"},
  GG:{dial:"+44"},
  IM:{dial:"+44"},
  JE:{dial:"+44"},
  SJ:{dial:"+47"}
};
function countryCode(){return document.getElementById('coCountry')?.value||'';}
function countryName(code,l=language()){
  if(!CHECKOUT_COUNTRIES[code])return code;
  try{return new Intl.DisplayNames([LOCALE[l]||LOCALE.it],{type:'region'}).of(code)||code;}catch(_){return code;}
}
function normalizePhone(value,country){
  let raw=String(value||'').trim();
  if(!raw||!CHECKOUT_COUNTRIES[country])return '';
  raw=raw.replace(/[()\s.-]/g,'');
  if(raw.startsWith('00'))raw='+'+raw.slice(2);
  if(raw.startsWith('+'))return raw;
  return CHECKOUT_COUNTRIES[country].dial+' '+raw;
}
function applyCountryFields(forceDial=false){
  const x=T[language()]||T.it;
  const select=document.getElementById('coCountry');
  if(select){
    const selected=select.value;
    const items=Object.keys(CHECKOUT_COUNTRIES).map(code=>({code,name:countryName(code)})).sort((a,b)=>a.name.localeCompare(b.name,LOCALE[language()]||LOCALE.it));
    select.innerHTML='<option value="">'+x.selectCountry+'</option>'+items.map(item=>'<option value="'+item.code+'">'+item.name+'</option>').join('');
    select.value=selected;
  }
  fieldLabel('coCountry',x.country);
  fieldLabel('coPhone',x.phone);
  const code=countryCode();
  const prefix=document.getElementById('coPhonePrefix');
  const phone=document.getElementById('coPhone');
  const suggested=code&&CHECKOUT_COUNTRIES[code]?CHECKOUT_COUNTRIES[code].dial:'';
  if(prefix){
    const previousAuto=prefix.dataset.autoDial||'';
    const current=prefix.value.trim();
    if(forceDial || !current || current===previousAuto){
      prefix.value=suggested;
      prefix.dataset.autoDial=suggested;
      if(phone)phone.dataset.e164='';
    }
    prefix.placeholder=x.phonePrefix;
    prefix.setAttribute('aria-label',x.phonePrefix);
  }
  if(phone){
    phone.placeholder=x.phoneNumber;
    phone.setAttribute('aria-label',x.phoneNumber);
  }
  const prov=document.getElementById('coProvince');
  if(prov){
    prov.placeholder=x.provincePh;
    prov.required=code==='IT';
    const label=prov.closest('.field')?.querySelector('label');
    if(label){
      const base=String(x.province||'').replace(/\s*\*\s*$/,'').trim();
      label.textContent=base+(code==='IT'?' *':'');
    }
  }

  const deliveryOptions=document.querySelectorAll('.delivery-option');
  const courierInput=document.querySelector('input[name="delivery"][value="courier"]');
  const pickupInput=document.querySelector('input[name="delivery"][value="pickup"]');
  if(deliveryOptions[1])deliveryOptions[1].style.display=code==='IT'?'':'none';
  if(code!=='IT' && pickupInput?.checked && courierInput){
    courierInput.checked=true;
    pickupInput.checked=false;
  }
  const courierText=deliveryOptions[0]?.querySelector('p');
  if(courierText){
    courierText.textContent=code==='IT'?x.courierDesc:(CHECKOUT_EU_COUNTRIES.has(code)?x.courierDescEU:x.courierDescExtraEU);
  }
}
window.purchaseNormalizePhone=normalizePhone;
window.purchaseCountryName=countryName;
window.purchaseApplyCountryFields=applyCountryFields;

function apply(){
  const x=T[language()]||T.it;
  setText('#cartDrawer .cart-head h2',x.cartTitle);
  const fab=document.getElementById('cartFab');if(fab&&fab.firstChild)fab.firstChild.nodeValue=x.cartFab+' ';
  const cp=document.getElementById('cartPoints')?.previousElementSibling;if(cp)cp.textContent=x.orderPoints;
  const ct=document.getElementById('cartTotal')?.previousElementSibling;if(ct)ct.textContent=x.totalProducts;
  setText('#startCheckout',x.continueOrder);
  setText('#cartDrawer .cart-note',x.goal);

  setText('#checkoutOverlay .checkout-top .eyebrow',x.checkoutEyebrow);
  setText('#checkoutOverlay .checkout-top h2',x.checkoutTitle);
  setText('#checkoutOverlay .checkout-top p',x.checkoutIntro);
  x.steps.forEach((v,i)=>setText('.checkout-step[data-step-pill="'+(i+1)+'"]',v));

  setText('.checkout-screen[data-step="1"] h3',x.step1Title);
  fieldLabel('coName',x.name);fieldLabel('coEmail',x.email);fieldLabel('coCountry',x.country);fieldLabel('coPhone',x.phone);fieldLabel('coCity',x.city);fieldLabel('coAddress',x.address);fieldLabel('coCap',x.cap);fieldLabel('coProvince',x.province);
  applyCountryFields();
  setText('.checkout-screen[data-step="1"] [data-next="2"]',x.continue);

  setText('.checkout-screen[data-step="2"] h3',x.step2Title);
  const opts=document.querySelectorAll('.delivery-option');
  if(opts[0]){
    const s=opts[0].querySelector('strong'),p=opts[0].querySelector('p');
    if(s)s.textContent=x.courier;
    if(p){
      const cc=countryCode();
      p.textContent=cc==='IT'?x.courierDesc:(CHECKOUT_EU_COUNTRIES.has(cc)?x.courierDescEU:x.courierDescExtraEU);
    }
  }
  if(opts[1]){const s=opts[1].querySelector('strong'),p=opts[1].querySelector('p');if(s)s.textContent=x.pickup;if(p)p.textContent=x.pickupDesc;}
  fieldLabel('coNotes',x.notes);const notes=document.getElementById('coNotes');if(notes)notes.placeholder=x.optional;
  setText('.checkout-screen[data-step="2"] [data-back="1"]',x.back);setText('.checkout-screen[data-step="2"] [data-next="3"]',x.showSummary);

  setText('.checkout-screen[data-step="3"] h3',x.step3Title);
  const api=document.querySelector('.checkout-screen[data-step="3"] .summary-api');
  if(api){const strong=api.querySelector('strong'),div=api.querySelector('div');if(strong)strong.innerHTML='<span id="summaryPoints">'+(document.getElementById('summaryPoints')?.textContent||'0')+'</span> '+x.pointsOrder;if(div)div.textContent=x.pointsGoal;}
  setText('.checkout-screen[data-step="3"] [data-back="2"]',x.back);setText('.checkout-screen[data-step="3"] [data-next="4"]',x.continue);

  setText('.checkout-screen[data-step="4"] h3',x.step4Title);
  setText('.checkout-screen[data-step="4"] > p',x.step4Intro);
  setText('.checkout-screen[data-step="4"] [data-back="3"]',x.back);setText('#confirmOrder',x.sendOrder);

  setText('.checkout-screen[data-step="5"] h3',x.successTitle);
  setText('.checkout-screen[data-step="5"] .success-wrap > p',x.successIntro);
  const sa=document.querySelector('.checkout-screen[data-step="5"] .success-api');
  if(sa){const strong=sa.querySelector('strong'),div=sa.querySelector('div');if(strong)strong.innerHTML=x.earned+' <span id="successPoints">'+(document.getElementById('successPoints')?.textContent||'0')+'</span> '+x.points;if(div)div.textContent=x.successGoal;}
  setText('#downloadOrderPdf',x.downloadPdf);setText('#finishCheckout',x.backSite);
  const close=document.getElementById('checkoutClose');if(close)close.setAttribute('aria-label',x.back);
}

async function translateText(text,l){
  if(!text||l==='it')return text;
  const cached=cachedTranslation(text,l);if(cached!==text)return cached;
  try{
    const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl='+encodeURIComponent(l)+'&dt=t&q='+encodeURIComponent(text);
    const res=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer'});
    if(!res.ok)return text;
    const data=await res.json();
    const out=Array.isArray(data?.[0])?data[0].map(v=>Array.isArray(v)?(v[0]||''):'').join(''):text;
    if(out&&out!==text){
      try{const key='fda-translation-cache-v2-'+l;const c=JSON.parse(localStorage.getItem(key)||'{}')||{};c[text]=out;localStorage.setItem(key,JSON.stringify(c));}catch(_){}
      return out;
    }
  }catch(_){}
  return text;
}
function pdfSafe(v){return String(v??'').replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'");}
function dateText(iso,l){try{return new Intl.DateTimeFormat(LOCALE[l]||LOCALE.it,{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));}catch(_){return iso||'';}}

async function downloadPdf(order){
  const l=order?.language&&SUPPORTED.includes(order.language)?order.language:language();
  const x=T[l]||T.it;
  if(!order||!window.jspdf?.jsPDF){alert(x.pdfDownloadError);return;}
  try{
    const items=await Promise.all((order.items||[]).map(async item=>({
      ...item,
      pdfName:await translateText(item.name,l),
      pdfSize:await translateText(item.size,l)
    })));
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:'a4'});
    const W=210,M=15,R=W-M;
    let y=0,page=1;
    function header(){
      doc.setFillColor(16,57,44);doc.rect(0,0,W,32,'F');
      doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text('LA FABBRICA DELLE API',M,17);
      doc.setTextColor(25,38,31);y=42;
    }
    function footer(){
      doc.setDrawColor(220,211,194);doc.line(M,282,R,282);
      doc.setTextColor(105,115,109);doc.setFontSize(8);doc.setFont('helvetica','normal');
      doc.text(pdfSafe(x.pdfNonFiscal),M,288);doc.text(String(page),R,288,{align:'right'});
    }
    function newPage(){footer();doc.addPage();page++;header();}
    function need(mm){if(y+mm>277)newPage();}
    function section(title){
      need(12);doc.setTextColor(152,101,14);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(pdfSafe(title).toUpperCase(),M,y);y+=7;doc.setTextColor(25,38,31);
    }
    function line(label,value){
      const val=pdfSafe(value||'-');const lines=doc.splitTextToSize(val,125);need(Math.max(7,lines.length*5+2));
      doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(pdfSafe(label)+':',M,y);
      doc.setFont('helvetica','normal');doc.text(lines,62,y);y+=Math.max(7,lines.length*5+2);
    }
    header();
    doc.setFont('helvetica','bold');doc.setFontSize(22);doc.setTextColor(20,48,37);doc.text(pdfSafe(x.pdfTitle),M,y);y+=10;
    line(x.orderCode,order.id);
    line(x.pdfDate,dateText(order.createdAt,l));

    section(x.pdfCustomer);
    line(x.name.replace(' *',''),order.customer?.name);
    line(x.email.replace(' *',''),order.customer?.email);
    line(x.phone.replace(' *',''),order.customer?.phone);
    line(x.pdfCountry,purchaseCountryName(order.customer?.country||'',l));
    line(x.address.replace(' *',''),(order.customer?.address||'')+', '+(order.customer?.cap||'')+' '+(order.customer?.city||'')+(order.customer?.province?' ('+order.customer.province+')':''));

    section(x.pdfProducts);
    need(10);
    doc.setFillColor(244,237,223);doc.rect(M,y-5,W-2*M,8,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(45,55,49);
    doc.text(pdfSafe(x.pdfProduct),M+2,y);doc.text(pdfSafe(x.pdfQty),123,y,{align:'right'});doc.text(pdfSafe(x.pdfUnit),157,y,{align:'right'});doc.text(pdfSafe(x.pdfSubtotal),R-2,y,{align:'right'});y+=7;

    for(const item of items){
      const name=pdfSafe(item.pdfName||item.name);const size=pdfSafe(item.pdfSize||item.size);
      const nameLines=doc.splitTextToSize(name,92);const rowH=Math.max(12,nameLines.length*5+7);need(rowH+2);
      doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(25,38,31);doc.text(nameLines,M+2,y);
      doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100,110,104);doc.text(size,M+2,y+nameLines.length*5);
      doc.setTextColor(25,38,31);doc.setFontSize(9);doc.text(String(item.qty||1),123,y,{align:'right'});
      doc.text(new Intl.NumberFormat(LOCALE[l]||LOCALE.it,{style:'currency',currency:'EUR'}).format(Number(item.price||item.unitPrice||0)),157,y,{align:'right'});
      doc.setFont('helvetica','bold');doc.text(new Intl.NumberFormat(LOCALE[l]||LOCALE.it,{style:'currency',currency:'EUR'}).format(Number(item.price||item.unitPrice||0)*(item.qty||1)),R-2,y,{align:'right'});
      y+=rowH;doc.setDrawColor(232,225,213);doc.line(M,y-3,R,y-3);
    }

    section(x.pdfDelivery);
    const deliveryLabel=order.delivery==='pickup'?x.pickup:x.courier;
    line(x.pdfDelivery,deliveryLabel);
    if(order.shippingReason)line(x.pdfShipping,order.shippingReason);
    line(x.pdfNotes,order.notes||x.pdfNoNotes);

    section(x.pdfTotals);
    line(x.pdfGoods,new Intl.NumberFormat(LOCALE[l]||LOCALE.it,{style:'currency',currency:'EUR'}).format(Number(order.goodsTotal||0)));
    line(x.pdfShipping,order.shippingPending?x.pdfShippingPending:new Intl.NumberFormat(LOCALE[l]||LOCALE.it,{style:'currency',currency:'EUR'}).format(Number(order.shipping||0)));
    if(Number(order.shippingWeightKg||0)>0) line(l==='it'?'Peso spedizione stimato':(l==='es'?'Peso estimado del envío':l==='fr'?'Poids estimé de l’envoi':l==='de'?'Geschätztes Versandgewicht':'Estimated shipping weight'),new Intl.NumberFormat(LOCALE[l]||LOCALE.it,{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(order.shippingWeightKg))+' kg');
    doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(20,48,37);need(10);
    doc.text(pdfSafe(order.shippingPending?x.goodsTotalPending:x.pdfTotal)+':',M,y);doc.text(new Intl.NumberFormat(LOCALE[l]||LOCALE.it,{style:'currency',currency:'EUR'}).format(Number(order.total||0)),R,y,{align:'right'});y+=9;
    doc.setFillColor(255,243,201);doc.roundedRect(M,y-2,W-2*M,13,3,3,'F');
    doc.setTextColor(93,72,18);doc.setFontSize(11);doc.text(pdfSafe(x.pdfPoints)+': '+String(order.points||0),M+4,y+6);y+=18;

    need(18);doc.setTextColor(95,105,99);doc.setFont('helvetica','normal');doc.setFontSize(8.5);
    const contact=doc.splitTextToSize(pdfSafe(x.pdfContact),W-2*M);doc.text(contact,M,y);
    footer();
    doc.save((x.pdfFile||'order')+'-'+String(order.id||'').replace(/[^A-Za-z0-9_-]/g,'')+'.pdf');
  }catch(error){
    console.error('[PDF ordine]',error);alert(x.pdfDownloadError);
  }
}

window.purchaseLanguage=language;
window.purchaseT=tr;
window.purchaseCurrency=currency;
window.purchaseProductName=productName;
window.purchaseProductSize=productSize;
window.applyPurchaseLanguage=apply;
window.downloadCustomerOrderPdf=downloadPdf;
window.purchaseModuleReady=true;
})();