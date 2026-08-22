import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import "./Delivery.css";
import "./Cart.css";
import { useCart } from "../context/CartContext.jsx";
import { CART_SCRIPT_URL, WHATSAPP_NUMBER } from "../data/data.js";

const CARD_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfL4bWVRHsgjOa2I5J2RC38pF2olaUMWsVghwxfuz9MrJyslA/formResponse";

const CARD_FORM_ENTRIES = {
  name: "entry.1441889611",
  phone: "entry.1738070286",
  address: "entry.766948384",
  store: "entry.384682150",
  cardTier: "entry.336839636",
  cardPrice: "entry.1754502734",
  shippingFee: "entry.483753397",
  total: "entry.89843056",
  source: "entry.732120729",
  status: "entry.1092939406",
};

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    removeDeliveryItems,
    updateCardQty,
    removeCard,
    clearCart,
    deliverySubtotalBefore,
    deliverySubtotalAfter,
    hasDelivery,
    deliveryFeeTotal,
    cardsSubtotal,
    cardsShippingTotal,
    grandTotal,
    itemsCount,
  } = useCart();

  const [form, setForm] = useState({ name: "", whatsapp: "", address: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const isEmpty = itemsCount === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEmpty) return;
    setSending(true);

    let messageParts = [`طلب جديد من السلة 🛒`, `الاسم: ${form.name}`, `رقم الواتساب: ${form.whatsapp}`, `العنوان: ${form.address}`, ""];

    let deliveryItemsText = "";
    if (hasDelivery) {
      messageParts.push(`--- دليفري من ${cart.restaurant} ---`);
      deliveryItemsText = cart.deliveryItems
        .map((i) => `${i.name} × ${i.qty} = ${i.discounted_price * i.qty} ج.م`)
        .join(" | ");
      cart.deliveryItems.forEach((i) => {
        messageParts.push(`- ${i.name} × ${i.qty} = ${i.discounted_price * i.qty} ج.م`);
      });
      messageParts.push(`إجمالي الأصناف بعد الخصم: ${deliverySubtotalAfter} ج.م`);
      messageParts.push(`رسوم التوصيل: ${deliveryFeeTotal} ج.م`);
      messageParts.push("");
    }

    let cardsText = "";
    if (cart.cardItems.length > 0) {
      messageParts.push(`--- كروت الخصم ---`);
     cardsText = cart.cardItems
        .map((c) => `${c.name} × ${c.qty} = ${c.price * c.qty} ج.م`)
        .join(" | ");
      cart.cardItems.forEach((c) => {
       messageParts.push(`- ${c.name} × ${c.qty} = ${c.price * c.qty} ج.م`);
      });
      messageParts.push("");
    }
const totalShippingFee =
      (hasDelivery ? deliveryFeeTotal : 0) + (cart.cardItems.length > 0 ? 10 : 0);

    messageParts.push(`رسوم الشحن: ${totalShippingFee} ج.م`);
    messageParts.push(`الإجمالي النهائي: ${grandTotal} ج.م`);

    const whatsappMessage = messageParts.join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank"
    );

    const orderData = {
      first_name: form.name,
      whatsapp: form.whatsapp,
      address: form.address,
      restaurant: hasDelivery ? cart.restaurant : "",
      delivery_items: deliveryItemsText,
      delivery_subtotal_before: hasDelivery ? deliverySubtotalBefore : "",
      delivery_subtotal_after: hasDelivery ? deliverySubtotalAfter : "",
      delivery_fee: hasDelivery ? deliveryFeeTotal : "",
      cards: cardsText,
      cards_subtotal: cart.cardItems.length > 0 ? cardsSubtotal : "",
      cards_shipping: cart.cardItems.length > 0 ? cardsShippingTotal : "",
      grand_total: grandTotal,
    };

    const payload = new Blob([JSON.stringify(orderData)], { type: "text/plain;charset=utf-8" });
    const sent = navigator.sendBeacon(CART_SCRIPT_URL, payload);

    if (!sent) {
      fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8
