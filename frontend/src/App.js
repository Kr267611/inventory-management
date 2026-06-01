import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth/Auth";
import Dashboard from "./pages/Dashboard/Dashboard";
import DashboardHome from "./pages/Dashboard/DashboardHome";
import Inward from "./pages/Inward/Inward";
import Inventory from "./pages/Inventory/Inventory";
import Sales from "./pages/Sales/Sales";
import Payment from "./pages/Payment/Payment";
import Masters from "./pages/Masters/Masters";
import MasterHome from "./pages/Masters/MasterHome";
import Fabrics from "./pages/Masters/Fabrics";
import QualityMaster from "./pages/Masters/quality";
import Design from "./pages/Masters/Design";
import CompanyMaster from "./pages/Masters/CompanyMaster";
import Reports from "./pages/Reports/Reports";
import ReportMaster from "./pages/Reports/ReportMaster";
import Setting from "./pages/Setting/Setting";
import Color from "./pages/Masters/color";
import Location from "./pages/Masters/location";
import UomMaster from "./pages/Masters/Uom";
import SupplierMaster from "./pages/Masters/SupplierMaster";
import InwardReport from "./pages/Reports/InwardReport";
import InvReport from "./pages/Reports/InvReport";
import SalesReport from "./pages/Reports/SalesReport";
import PaymentReport from "./pages/Reports/PaymentReport";
import PartyWiseReport from "./pages/Reports/PartyWiseReport";
import SummaryReport from "./pages/Reports/SummaryReport";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />

      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="inward" element={<Inward />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="payment" element={<Payment />} />
        <Route path="reports" element={<Reports/>}>
          <Route index element={<ReportMaster />} />
          <Route path="inward-report" element={<InwardReport />} />
          <Route path="inventory-report" element={<InvReport />} />
          <Route path="sales-report" element={<SalesReport />} />
          <Route path="payment-report" element={<PaymentReport />} />
          <Route path="party-wise-report" element={<PartyWiseReport />} />
          <Route path="summary-report" element={<SummaryReport />} />
        </Route>

        {/* Masters - sidebar ke saath match */}
        <Route path="masters" element={<Masters />}>
          <Route index element={<MasterHome />} />
          <Route path="fabric"   element={<Fabrics />} />
          <Route path="quality"  element={<QualityMaster />} />
          <Route path="design"   element={<Design />} />
          <Route path="color"    element={<Color />} />
          <Route path="location" element={<Location />} /> 
          <Route path="company"  element={<CompanyMaster />} />
          <Route path="uom" element={<UomMaster />} />
          <Route path="supplier" element={<SupplierMaster />} />
        </Route>
        <Route path="setting" element={<Setting />} />
      </Route>
    </Routes>
  );
}

export default App;