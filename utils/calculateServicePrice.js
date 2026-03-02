function calculateServicePrice(service, selections) {
  if (!service) {
    throw new Error("Service data missing");
  }

  // ✅ Safe base price handling
  let basePrice =
    service.discountedPrice !== undefined && service.discountedPrice !== null
      ? Number(service.discountedPrice)
      : Number(service.price) || 0;

  let addonsPrice = 0;
  const breakdown = [];

  // ✅ Ensure selections is array
  if (!Array.isArray(selections)) {
    throw new Error("Selections must be an array");
  }

  for (const selected of selections) {
    // ✅ Skip invalid selection safely
    if (!selected || !selected.label || !selected.value) {
      console.warn("⚠️ Skipping invalid selection:", selected);
      continue;
    }

    // Safe normalized comparison
    const selectedLabel = String(selected.label).trim().toLowerCase();
    const selectedValue = String(selected.value).trim().toLowerCase();

    // ✅ Find matching requirement safely
    const req = service.requirements?.find((r) => {
      if (!r?.label) return false;
      return String(r.label).trim().toLowerCase() === selectedLabel;
    });

    if (!req) continue;

    // ✅ Find matching option safely
    const opt = req.options?.find((o) => {
      if (!o?.label) return false;
      return String(o.label).trim().toLowerCase() === selectedValue;
    });

    if (!opt) continue;

    const extra = Number(opt.extraPrice) || 0;
    addonsPrice += extra;

    breakdown.push({
      label: selected.label,
      value: selected.value,
      extraPrice: extra,
    });
  }

  const unitPrice = Math.max(basePrice + addonsPrice, 0);

  return {
    basePrice: Number(basePrice.toFixed(2)),
    addonsPrice: Number(addonsPrice.toFixed(2)),
    totalPrice: Number(unitPrice.toFixed(2)), // per unit
    breakdown,
  };
}

module.exports = { calculateServicePrice };