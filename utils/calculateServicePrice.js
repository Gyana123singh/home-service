function calculateServicePrice(service, selections = []) {
  if (!service) {
    throw new Error("Service not found");
  }

  // base price
  let basePrice = Number(service.price || service.originalPrice) || 0;

  let addonsPrice = 0;
  const breakdown = [];

  if (!Array.isArray(selections)) selections = [];

  if (service.requirements && service.requirements.length > 0) {
    for (const selected of selections) {
      const label = selected.label;
      const value = selected.value || selected.option; // ✅ FIX

      if (!label || !value) continue;

      const selectedLabel = label.toLowerCase().trim();
      const selectedValue = value.toLowerCase().trim();

      const requirement = service.requirements.find(
        (r) => r.label?.toLowerCase().trim() === selectedLabel,
      );

      if (!requirement) continue;

      const option = requirement.options.find(
        (o) => o.label?.toLowerCase().trim() === selectedValue,
      );

      if (!option) continue;

      const extra = Number(option.extraPrice) || 0;

      addonsPrice += extra;

      breakdown.push({
        label,
        value,
        extraPrice: extra,
      });
    }
  }

  const unitPrice = basePrice + addonsPrice;

  return {
    basePrice,
    addonsPrice,
    totalPrice: unitPrice,
    breakdown,
  };
}

module.exports = { calculateServicePrice };
