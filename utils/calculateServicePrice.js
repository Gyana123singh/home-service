function calculateServicePrice(service, selections) {
  let basePrice = service.discountedPrice || service.price || 0;
  let addonsPrice = 0;

  const breakdown = [];

  for (const selected of selections) {
    const req = service.requirements.find((r) => r.label === selected.label);
    if (!req) continue;

    const opt = req.options.find((o) => o.label === selected.value);
    if (!opt) continue;

    addonsPrice += opt.extraPrice || 0;

    breakdown.push({
      label: selected.label,
      value: selected.value,
      extraPrice: opt.extraPrice || 0,
    });
  }

  const totalPrice = Math.max(basePrice + addonsPrice, 0);

  return {
    basePrice,
    addonsPrice,
    totalPrice,
    breakdown,
  };
}

module.exports = { calculateServicePrice };
