// api/checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// consenti sia GitHub Pages che Vercel
const ALLOWED_ORIGINS = [
  "https://cleo6920.github.io",
  "https://miele-backend.vercel.app",
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // fallback (utile se richiami direttamente l'API da un tool)
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // body JSON
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } 
      catch { return res.status(400).json({ error: "Invalid JSON body" }); }
    }

    const totaleCents = Number(body?.totaleCents);
    if (!Number.isInteger(totaleCents) || totaleCents <= 0) {
      return res.status(400).json({ error: "totaleCents must be a positive integer" });
    }

    const description = body?.description || "Acquisto miele";

    // base URL in base a chi chiama
    const origin = req.headers.origin;
    const base =
      origin && ALLOWED_ORIGINS.includes(origin)
        ? origin.startsWith("https://cleo6920.github.io")
          ? "https://cleo6920.github.io/miele-backend"
          : "https://miele-backend.vercel.app"
        : "https://cleo6920.github.io/miele-backend";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Ordine Oasi del Busatello", description },
            unit_amount: totaleCents, // in centesimi
          },
          quantity: 1,
        },
      ],
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["IT"] },
      success_url: `${base}/success.html`,
      cancel_url: `${base}/cancel.html`,
    });

    // ritorna sia id che url (così il frontend può usare quello che preferisce)
    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: "Server error creating checkout session" });
  }
}
