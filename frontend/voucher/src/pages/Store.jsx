import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./Store.css";
import { shops as fakeStores, MENU_STORE_KEYS, CART_SCRIPT_URL } from "../data/data.js";
import { useCart } from "../context/CartContext.jsx";

// يحسب ملخص الاختيارات: بيفرق بين مجموعة "priceMode: absolute" (زي الحجم - كل اختيار له سعر مستقل كامل)
// ومجموعات الإضافة العادية (زي الصوصات - بتتضاف فوق السعر الأساسي)
function getConfigSummaryAndPrice(item, choicesMap) {
  let summaryParts = [];
  let discountableAdd = 0;
  let nonDiscountableAdd = 0;
  let baseOverride = null; // لو اتحدد، ده بيبقى السعر الأساسي بدل item.price
  let baseOverrideDiscountable = true;

  (item.options || []).forEach((group, gIndex) => {
    const isDiscountable = group.discountable !== false;
    const isAbsolute = group.priceMode === "absolute";
    const sel = choicesMap[gIndex];

    const applyChoice = (choice) => {
      summaryParts.push(choice.label);
      if (isAbsolute) {
        baseOverride = Number(choice.price) || 0;
        baseOverrideDiscountable = isDiscountable;
      } else {
        const add = Number(choice.priceAdd) || 0;
        if (isDiscountable) discountableAdd += add;
        else nonDiscountableAdd += add;
      }
    };

    if (group.required) {
      if (sel !== undefined && group.choices[sel]) applyChoice(group.choices[sel]);
    } else {
      const arr = sel || [];
      arr.forEach((ci) => {
        if (group.choices[ci]) applyChoice(group.choices[ci]);
      });
    }
  });

  return {
    summary: summaryParts.join("، "),
    discountableAdd,
    nonDiscountableAdd,
    baseOverride,
    baseOverrideDiscountable,
  };
}

// بيتأكد إن كل الأوبشنز الإجبارية (زي الحجم) اتحددت
function allRequiredSelected(item, choicesMap) {
  return (item.options || []).every(
    (group, gIndex) => !group.required || choicesMap[gIndex] !== undefined
  );
}

// بيحسب السعر قبل وبعد الخصم:
// - لو فيه حجم بسعر مستقل (baseOverride) بيتحط بدل سعر الصنف الأساسي
// - الإضافات القابلة للخصم بتتجمع مع السعر الأساسي قبل حساب نسبة الخصم
// - الإضافات الغير قابلة للخصم (زي الصوص) بتتضاف بسعرها الكامل بعد الخصم
function computeConfiguredPrices(item, cfg) {
  const hasOverride = cfg.baseOverride !== null && cfg.baseOverride !== undefined;
  const baseAmount = hasOverride ? cfg.baseOverride : (item.price || 0);
  const baseIsDiscountable = hasOverride ? cfg.baseOverrideDiscountable !== false : true;

  const discountPercent = item.discount_percent || 0;

  const discountableBase = (baseIsDiscountable ? baseAmount : 0) + (cfg.discountableAdd || 0);
  const discountedBase = Math.round(discountableBase - (discountableBase * discountPercent) / 100);

  const nonDiscountableBase = baseIsDiscountable ? 0 : baseAmount;

  const before = baseAmount + (cfg.discountableAdd || 0) + (cfg.nonDiscountableAdd || 0);
  const after = discountedBase + nonDiscountableBase + (cfg.nonDiscountableAdd || 0);

  return { before, after };
}

export default function Store() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addCard, addDeliveryItems } = useCart();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [quantities, setQuantities] = useState({});

  // selections[itemIndex] = [{ key, choicesMap, summary, priceAdd, qty }]
  const [selections, setSelections] = useState({});
  const [optionModal, setOptionModal] = useState(null); // { item, index }
  const [modalChoices, setModalChoices] = useState({});
  const [modalQty, setModalQty] = useState(1);

  const getQuantity = (index) => quantities[index] || 0;

  const increaseQty = (index) => {
    setQuantities((prev) => ({
      ...prev,
      [index]: getQuantity(index) + 1,
    }));
  };

  const decreaseQty = (index) => {
    setQuantities((prev) => ({
      ...prev,
      [index]: Math.max(0, getQuantity(index) - 1),
    }));
  };

  const openOptionModal = (item, index) => {
    setOptionModal({ item, index });
    setModalChoices({});
    setModalQty(1);
  };

  const closeOptionModal = () => {
    setOptionModal(null);
    setModalChoices({});
    setModalQty(1);
  };

  const selectRequiredChoice = (gIndex, cIndex) => {
    setModalChoices((prev) => {
      if (prev[gIndex] === cIndex) {
        const next = { ...prev };
        delete next[gIndex];
        return next;
      }
      return { ...prev, [gIndex]: cIndex };
    });
  };

  const toggleOptionalChoice = (gIndex, cIndex) => {
    setModalChoices((prev) => {
      const arr = prev[gIndex] ? [...prev[gIndex]] : [];
      const pos = arr.indexOf(cIndex);
      if (pos >= 0) arr.splice(pos, 1);
      else arr.push(cIndex);
      return { ...prev, [gIndex]: arr };
    });
  };

  const confirmAddConfiguredItem = () => {
    if (!optionModal) return;
    const { item, index } = optionModal;

    if (!allRequiredSelected(item, modalChoices)) {
      alert("من فضلك اختار كل الأوبشنز المطلوبة");
      return;
    }

    const { summary, discountableAdd, nonDiscountableAdd, baseOverride, baseOverrideDiscountable } =
      getConfigSummaryAndPrice(item, modalChoices);
    const key = JSON.stringify(modalChoices);

    setSelections((prev) => {
      const existing = prev[index] || [];
      const foundIdx = existing.findIndex((c) => c.key === key);
      let updated;
      if (foundIdx >= 0) {
        updated = existing.map((c, i) =>
          i === foundIdx ? { ...c, qty: c.qty + modalQty } : c
        );
      } else {
        updated = [
          ...existing,
          {
            key,
            choicesMap: modalChoices,
            summary,
            discountableAdd,
            nonDiscountableAdd,
            baseOverride,
            baseOverrideDiscountable,
            qty: modalQty,
          },
        ];
      }
      return { ...prev, [index]: updated };
    });

    closeOptionModal();
  };

  const updateConfigQty = (index, key, delta) => {
    setSelections((prev) => {
      const existing = prev[index] || [];
      const updated = existing
        .map((c) => (c.key === key ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
        .filter((c) => c.qty > 0);
      return { ...prev, [index]: updated };
    });
  };

  const configuredItemsCount = Object.values(selections).reduce(
    (sum, configs) => sum + configs.reduce((s, c) => s + (c.qty || 0), 0),
    0
  );

  const selectedItemsCount =
    Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0) + configuredItemsCount;

  const handleAddToCart = () => {
    const simpleItems = menuItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !(item.options && item.options.length > 0))
      .map(({ item, index }) => ({ ...item, qty: getQuantity(index) }))
      .filter((item) => item.qty > 0);

    const configuredItems = [];
    Object.entries(selections).forEach(([indexStr, configs]) => {
      const item = menuItems[Number(indexStr)];
      if (!item) return;
      configs.forEach((cfg) => {
        if (cfg.qty <= 0) return;
        const { before, after } = computeConfiguredPrices(item, cfg);
        configuredItems.push({
          itemId: `${item.itemId}-${cfg.key}`,
          name: cfg.summary ? `${item.name} (${cfg.summary})` : item.name,
          price: before,
          discounted_price: after,
          images: item.images,
          qty: cfg.qty,
        });
      });
    });

    const selectedItems = [...simpleItems, ...configuredItems];

    if (selectedItems.length === 0) return;

    addDeliveryItems(store.name, store.id, selectedItems);
    navigate("/cart");
  };

  useEffect(() => {
    const found = fakeStores.find((s) => String(s.id) === String(id)) || fakeStores[0];
    setStore(found);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!store) return;
    const menuKey = MENU_STORE_KEYS[store.id];
    if (!menuKey) {
      setMenuItems([]);
      return;
    }

    const fetchMenu = async () => {
      setMenuLoading(true);
      try {
        const res = await fetch(CART_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "getMenu", storeId: menuKey }),
        });
        const data = await res.json();
        if (data.success) {
          setMenuItems(data.items);
        } else {
          setMenuItems([]);
        }
      } catch (err) {
        console.error("فشل تحميل المنيو:", err);
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, [store]);

  useEffect(() => {
    if (selectedImageIndex === null || !store?.images?.length) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        setSelectedImageIndex(
          (prev) => (prev + 1) % store.images.length
        );
      }

      if (e.key === "ArrowLeft") {
        setSelectedImageIndex(
          (prev) => (prev - 1 + store.images.length) % store.images.length
        );
      }

      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, store]);

  if (loading) return <p>Loading...</p>;

  if (!store) return <p>Store not found</p>;

  return (
    <div className="store-page">
      <div className="store-header">
        {/* STATUS */}
        {store.status && (
          <div className={`status-badge ${store.status.toLowerCase()}`}>
            {store.status}
          </div>
        )}

        {/* LOGO */}
        {store.logos?.[0] && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <img
              className="store-image"
              src={`/${store.logos[0]}`}
              alt={store.name}
            />

            <div className="store-actions">
              <button
                type="button"
                className="register-btn"
                onClick={() => {
                  addCard({
                    id: `store-card-${store.id}`,
                    name: `${store.name} - VE Card`,
                    price: 10,
                    store: store.name,
                  });
                  navigate("/cart");
                }}
              >
                احصل على خصم - {store.name}
              </button>
            </div>
          </div>
        )}

        <h2>{store.name}</h2>

        <p>{store.description}</p>

        {/* Notes */}
        {store.note && <div className="store-note">
          <strong>⚠️ Note:</strong> {store.note}
        </div>}

        {/* links */}
        {store.links && <div className="links_store">
          <a
            href={store.links}
            target="_blank"
            rel="noopener noreferrer"
            className="link_store"
          >
            Visit Link
          </a>
        </div>}

        {/* STORE IMAGES */}
        {store.images?.length > 0 && (
          <div className="store-images">
            {store.images.map((img, index) => (
              <img
                key={index}
                src={`/${img}`}
                alt={`${store.name} ${index + 1}`}
                className="store-gallery-img"
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}

        {/* IMAGE MODAL */}
        {selectedImageIndex !== null && (
          <div
            className="image-modal"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button
              className="nav-btn prev"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(
                  (prev) =>
                    (prev - 1 + store.images.length) %
                    store.images.length
                );
              }}
            >
              ❮
            </button>

            <img
              src={`/${store.images[selectedImageIndex]}`}
              alt={`Preview ${selectedImageIndex + 1}`}
              className="modal-image"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              className="nav-btn next"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(
                  (prev) => (prev + 1) % store.images.length
                );
              }}
            >
              ❯
            </button>
          </div>
        )}

        {/* DISCOUNT */}
        {store.percentage && (
          <div className="percentage-badge">
            {store.percentage} OFF
          </div>
        )}

        {/* MENU (restaurants only) */}
        {menuLoading && <p style={{ textAlign: "center" }}>جارٍ تحميل المنيو...</p>}

        {!menuLoading && menuItems.length > 0 && (
          <div className="store-menu">
            <h3>المنيو</h3>
            <div className="menu-list">
              {menuItems.map((item, index) => {
                const hasOptions = item.options && item.options.length > 0;
                const qty = getQuantity(index);
                const unitPrice = item.discounted_price ?? item.price;
                const totalPrice = (unitPrice * qty).toFixed(2);

                return (
                  <div className="menu-item" key={item.itemId || index}>
                    <div className="menu-item-info">
                     {item.images?.[0] && (
                      <img
                       src={item.images[0]}
                       alt={item.name}
                       className="menu-item-thumb"
                     />
                    )}
                      <span className="menu-item-name">{item.name}</span>
                    </div>

                    <span className="menu-item-prices">
                      <span className="price-before">{item.price} ج.م</span>
                      <span className="price-after">{item.discounted_price} ج.م</span>
                    </span>

                    {!hasOptions && (
                      <>
                        <div className="quantity-control">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => decreaseQty(index)}
                          >
                            −
                          </button>
                          <span className="qty-value">{qty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => increaseQty(index)}
                          >
                            +
                          </button>
                        </div>

                        {qty > 0 && (
                          <div className="item-total-price">
                            الإجمالي: {totalPrice} ج.م
                          </div>
                        )}
                      </>
                    )}

                    {hasOptions && (
                      <>
                        <button
                          type="button"
                          className="option-select-btn"
                          onClick={() => openOptionModal(item, index)}
                        >
                          🎛️ اختار وأضف
                        </button>

                        {(selections[index] || []).map((cfg) => {
                          const cfgUnitPrice = computeConfiguredPrices(item, cfg).after;
                          return (
                            <div key={cfg.key} className="config-row">
                              <span className="config-row-summary">
                                {cfg.summary || "بدون إضافات"}
                              </span>
                              <div className="quantity-control">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => updateConfigQty(index, cfg.key, -1)}
                                >
                                  −
                                </button>
                                <span className="qty-value">{cfg.qty}</span>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => updateConfigQty(index, cfg.key, 1)}
                                >
                                  +
                                </button>
                              </div>
                              <span className="item-total-price">
                                {(cfgUnitPrice * cfg.qty).toFixed(2)} ج.م
                              </span>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OPTIONS MODAL */}
        {optionModal && (
          <div className="options-modal-overlay" onClick={closeOptionModal}>
            <div className="options-modal" onClick={(e) => e.stopPropagation()}>
              <h4 className="options-modal-title">{optionModal.item.name}</h4>

              {optionModal.item.options.map((group, gIndex) => (
                <div key={gIndex} className="option-group">
                  <p className="option-group-title">
                    {group.name}{" "}
                    {group.required && <span className="option-group-required-star">*</span>}
                  </p>
                  {group.choices.map((choice, cIndex) => {
                    const isChecked = group.required
                      ? modalChoices[gIndex] === cIndex
                      : (modalChoices[gIndex] || []).includes(cIndex);
                    return (
                      <button
                        type="button"
                        key={cIndex}
                        className={`option-choice-btn${isChecked ? " selected" : ""}`}
                        onClick={() =>
                          group.required
                            ? selectRequiredChoice(gIndex, cIndex)
                            : toggleOptionalChoice(gIndex, cIndex)
                        }
                      >
                        <span className="option-choice-label">
                          {choice.label}
                          {group.priceMode === "absolute"
                            ? Number(choice.price) > 0 && (
                                <span className="option-choice-price">{choice.price} ج.م</span>
                              )
                            : Number(choice.priceAdd) > 0 && (
                                <span className="option-choice-price">+{choice.priceAdd} ج.م</span>
                              )}
                        </span>
                        <span className="option-choice-icon">{isChecked ? "🗑" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="options-modal-qty-row">
                <span>الكمية</span>
                <div className="quantity-control">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="qty-value">{modalQty}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setModalQty((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="options-modal-total">
                الإجمالي:{" "}
                {(() => {
                  const cfg = getConfigSummaryAndPrice(optionModal.item, modalChoices);
                  const { after } = computeConfiguredPrices(optionModal.item, cfg);
                  return (after * modalQty).toFixed(2);
                })()}{" "}
                ج.م
              </p>

              <button
                type="button"
                className="options-modal-confirm-btn"
                onClick={confirmAddConfiguredItem}
              >
                إضافة للسلة
              </button>
              <button
                type="button"
                className="options-modal-cancel-btn"
                onClick={closeOptionModal}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* ADD TO CART - floating button */}
        {selectedItemsCount > 0 && (
          <div className="floating-add-to-cart">
            <button
              type="button"
              className="add-to-cart-btn"
              onClick={handleAddToCart}
            >
              أضف للسلة ({selectedItemsCount})
            </button>
          </div>
        )}
      </div>

      {/* ADDRESSES */}
      <div className="store-addresses">
        <h3>Addresses</h3>

        {store.addresses?.map((address, index) => (
          <p key={index}>{address}</p>
        ))}
      </div>
    </div>
  );
}
