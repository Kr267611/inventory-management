import {api} from "./api";

export const fetchAllMasters = async () => {
  const [companies, locations, suppliers, customers, fabrics, qualities, designs, colors, uoms, transports, salespersons, paymentModes] =
    await Promise.all([
      api.get("/company"),
      api.get("/locations"),
      api.get("/suppliers"),
      api.get("/customer?activeOnly=true"),   // adding new master for data fetch for customer.
      api.get("/fabrics"),
      api.get("/quality"),
      api.get("/designs"),
      api.get("/colors"),
      api.get("/uoms"),
      api.get("/transport?activeOnly=true"),   // adding new master for data fetch for transport.
      api.get("/salesperson?activeOnly=true"), 
      api.get("/paymentmode?activeOnly=true")  // adding new master for data fetch for sales person.
    ]);
  return { companies, locations, suppliers, customers, fabrics, qualities, designs, colors, uoms, transports, salespersons, paymentModes };
};