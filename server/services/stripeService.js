// services/stripeService.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erro no webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // tratar evento
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const priceId = session.metadata?.plan || session.subscription;

    console.log("✅ Pagamento concluído");
    console.log("Email:", email);
    console.log("Plano (priceId):", priceId);

    // 👉 aqui você poderia salvar no banco usando seu cliente do db.js
    // exemplo:
    // await pool.query("INSERT INTO pagamentos (email, plano) VALUES ($1, $2)", [email, priceId])
  }

  res.json({ received: true });
};
