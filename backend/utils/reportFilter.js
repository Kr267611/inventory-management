const buildFilter = (query) => {

  let filter = {};

  // 📅 Date Range
  if (query.fromDate && query.toDate) {
    filter.createdAt = {
      $gte: new Date(query.fromDate),
      $lte: new Date(query.toDate)
    };
  }

  // 🏢 Company
  if (query.company) {
    filter.company = query.company;
  }

  // 👤 Customer
  if (query.customer) {
    filter.customer = query.customer;
  }

  // 🏭 Supplier
  if (query.supplier) {
    filter.supplier = query.supplier;
  }

  // 🧵 Fabric
  if (query.fabric) {
    filter.fabric = query.fabric;
  }

  // 🎨 Color
  if (query.color) {
    filter.color = query.color;
  }

  // 🎨 Design
  if (query.design) {
    filter.design = query.design;
  }

  // 📦 Location
  if (query.location) {
    filter.location = query.location;
  }

  return filter;
};

module.exports = buildFilter;