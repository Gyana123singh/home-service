function calculateServicePrice(service, selections = []) {
  if (!service) {
    throw new Error("Service not found");
  }

  // ✅ Base price from service
  let basePrice = Number(service.price) || 0;

  let addonsPrice = 0;
  const breakdown = [];

  if (!Array.isArray(selections)) selections = [];

  // ✅ Only process if requirements exist
  if (service.requirements && service.requirements.length > 0) {
    for (const selected of selections) {
      if (!selected?.label || !selected?.value) continue;

      const selectedLabel = selected.label.toLowerCase().trim();
      const selectedValue = selected.value.toLowerCase().trim();

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
        label: selected.label,
        value: selected.value,
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
