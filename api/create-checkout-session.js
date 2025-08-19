// api/create-checkout-session.js
const Stripe = require('stripe');

// Inizializza Stripe con la tua chiave segreta di test.
// Questa chiave deve essere impostata come variabile d'ambiente su Vercel (STRIPE_SECRET_KEY)
// NON mettere la chiave segreta direttamente qui nel codice!
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Solo le richieste POST sono permesse per questa API
  if (req.method === 'POST') {
    try {
      // Estrai gli articoli del carrello e l'email del cliente dal corpo della richiesta
      const { line_items, customerEmail } = req.body;

      // Validazione base: assicurati che ci siano articoli
      if (!Array.isArray(line_items) || line_items.length === 0) {
        return res.status(400).json({ error: 'Nessun articolo fornito per il checkout.' });
      }

      // Crea una sessione di Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], // Permetti pagamenti con carta
        line_items: line_items, // Gli articoli del carrello
        mode: 'payment', // Modalità di pagamento singolo
        // URL a cui reindirizzare l'utente dopo il successo/cancellazione del pagamento
        // req.headers.origin sarà l'URL del tuo sito (es. https://tuosito.vercel.app)
        success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`, // Pagina di successo
        cancel_url: `${req.headers.origin}/cancel.html`, // Pagina di cancellazione
        customer_email: customerEmail, // Pre-compila l'email del cliente su Stripe Checkout
        metadata: {
            // Qui puoi aggiungere dati che ti serviranno dopo il pagamento,
            // come l'ID utente o un riferimento all'ordine nel tuo database.
            // Questi dati saranno accessibili tramite webhook.
            customer_email: customerEmail,
        }
      });

      // Restituisci l'URL della sessione di checkout al frontend
      res.status(200).json({ sessionId: session.id, url: session.url });

    } catch (err) {
      console.error('Errore nella creazione della sessione Stripe Checkout:', err.message);
      // In caso di errore, restituisci un messaggio al frontend
      res.status(500).json({ error: err.message });
    }
  } else {
    // Se il metodo HTTP non è POST, restituisci un errore 405
    res.setHeader('Allow', 'POST');
    res.status(405).end('Metodo non permesso');
  }
};
