// api/checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // facoltativo ma utile per coerenza API
  apiVersion: "2024-06-20",
});

// Cambia se il tuo dominio GitHub Pages è diverso
const ALLOWED_ORIGIN = "https://cleo6920.github.io";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // In Vercel la body è già parsata se invii application/json correttamente
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Body non JSON:", body);
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    // ci aspettiamo un totale in centesimi
    const totaleCents = Number(body?.totaleCents);
    if (!Number.isInteger(totaleCents) || totaleCents <= 0) {
      console.error("totaleCents non valido:", body?.totaleCents);
      return res.status(400).json({ error: "totaleCents must be a positive integer" });
    }

    // (opzionale) descrizione, es. carrello riassunto
    const description = body?.description || "Acquisto miele";

    // URL di ritorno: usiamo GitHub Pages, che hai già verificato
    const successUrl = "https://cleo6920.github.io/miele-backend/success.html";
    const cancelUrl  = "https://cleo6920.github.io/miele-backend/cancel.html";

    // Crea la Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Ordine Oasi del Busatello",
              description,
            },
            unit_amount: totaleCents, // IMPORTANTE: in centesimi
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // per avere nome + indirizzo
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["IT"],
      },
      // (facoltativo) invoice_creation, metadata ecc...
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    // Log utilissimo da leggere in Vercel → Deployments → (deploy) → Runtime Logs
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: "Server error creating checkout session" });
  }
}
