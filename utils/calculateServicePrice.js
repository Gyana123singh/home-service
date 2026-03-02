function calculateServicePrice(service, selections) {
  // ✅ Safe discounted price handling
  let basePrice =
    service.discountedPrice !== undefined && service.discountedPrice !== null
      ? service.discountedPrice
      : service.price || 0;

  let addonsPrice = 0;
  const breakdown = [];

  for (const selected of selections) {
    // ✅ Case-insensitive match for requirement
    const req = service.requirements.find(
      (r) =>
        r.label.trim().toLowerCase() === selected.label.trim().toLowerCase(),
    );

    if (!req) continue;

    // ✅ Case-insensitive match for option
    const opt = req.options.find(
      (o) =>
        o.label.trim().toLowerCase() === selected.value.trim().toLowerCase(),
    );

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
