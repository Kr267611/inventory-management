import { api, onWrite } from "./api";

/* Company, customer, design jaisi 12 lists mahino me ek-do baar badalti hain,
   par Inward, Sales, Payment, Inventory aur saari reports har baar khulte hi
   inhe dobara mangwaate the.

   Ab browser me yaad rakhte hain: page turant khulta hai, aur peeche se nayi
   copy aa jaati hai agli baar ke liye. Kuch bhi save / badla / delete hua to
   yaad rakhi hui copy turant saaf — is computer pe purani list nahi dikhegi.

   Sirf ye master lists. Stock, sales, payments hamesha taaza aate hain. */

const STORE_KEY = "masters-cache-v1";
const MAX_AGE = 24 * 60 * 60 * 1000; // isse purani copy kabhi mat dikhao

let inFlight = null; // do page ek saath maangein to ek hi request
let generation = 0;  // save/delete hone pe badhta hai — beech me aayi purani copy save na ho

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!saved?.data || !saved.at || Date.now() - saved.at > MAX_AGE) return null;
    return saved.data;
  } catch {
    return null;
  }
}

function save(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // storage band ya bhara hua — koi baat nahi, agli baar seedha mangwa lenge
  }
}

export function clearMastersCache() {
  generation++;
  inFlight = null;
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* storage band hai */
  }
}

onWrite(clearMastersCache);

// Har page ko apni copy — ek page list badle to dusre pe asar na pade
const copy = (m) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.isArray(v) ? [...v] : v]));

async function fetchFresh() {
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
}

function refresh() {
  if (!inFlight) {
    const startedAt = generation;
    const p = fetchFresh()
      .then((data) => {
        if (startedAt === generation) save(data); // beech me kuch save hua to ye purani hai
        return data;
      })
      .finally(() => {
        if (inFlight === p) inFlight = null;
      });
    inFlight = p;
  }
  return inFlight;
}

export const fetchAllMasters = async () => {
  const saved = readSaved();
  if (saved) {
    refresh().catch(() => {}); // agli baar ke liye chupke se nayi copy
    return copy(saved);
  }
  return copy(await refresh());
};
