import React, { useMemo } from "react";
import {
  FaDownload,
  FaBoxOpen,
  FaShoppingCart,
  FaMoneyBillWave,
  FaUsers,
  FaFileAlt,
  FaCheckCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const reports = [
  {
    key: "inward-report",
    title: "Inward Report",
    description: "View all inward transaction reports",
    button: "View Inward Report",
    icon: <FaDownload />,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    key: "inventory-report",
    title: "Inventory Report",
    description: "View inventory & stock reports",
    button: "View Inventory Report",
    icon: <FaBoxOpen />,
    color: "#10b981",
    bg: "#ecfdf5",
  },
  {
    key: "sales-report",
    title: "Sales Report",
    description: "View all sales transaction reports",
    button: "View Sales Report",
    icon: <FaShoppingCart />,
    color: "#f97316",
    bg: "#fff7ed",
  },
  {
    key: "payment-report",
    title: "Payment Report",
    description: "View payment transaction reports",
    button: "View Payment Report",
    icon: <FaMoneyBillWave />,
    color: "#9333ea",
    bg: "#faf5ff",
  },
  {
    key: "party-wise-report",
    title: "Party-Wise Report",
    description: "View reports by supplier / customer",
    button: "View Party-Wise Report",
    icon: <FaUsers />,
    color: "#ec4899",
    bg: "#fdf2f8",
  },
  {
    key: "summary-report",
    title: "Summary Report",
    description: "View summary & overall reports",
    button: "View Summary Report",
    icon: <FaFileAlt />,
    color: "#06b6d4",
    bg: "#ecfeff",
  },
];

function ReportMaster() {
  const navigate = useNavigate();

  const handleReportClick = (reportKey) => {
    navigate(`/dashboard/reports/${reportKey}`);
  };

  // Dynamic date — har din update hoga
  const { todayDate, todayTime } = useMemo(() => {
    const now = new Date();
    return {
      todayDate: now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
      todayTime: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  }, []);

  return (
    <div className="report-page">
      {/* Header */}
      <div className="report-page__header">
        <h1 className="report-page__title">Reports</h1>
        <div className="report-breadcrumb">
          <span>Home</span>
          <span className="report-breadcrumb__sep">/</span>
          <span className="report-breadcrumb__current">Reports</span>
        </div>
      </div>

      {/* Report Cards */}
      <div className="report-grid">
        {reports.map((report) => (
          <div
            className="report-card"
            key={report.key}
            onClick={() => handleReportClick(report.key)}
          >
            <div className="report-card__top">
              <div
                className="report-card__icon"
                style={{ background: report.color }}
              >
                {report.icon}
              </div>
              <div className="report-card__head">
                <h3 className="report-card__title">{report.title}</h3>
                <p className="report-card__desc">{report.description}</p>
              </div>
            </div>

            <button
              className="report-btn"
              style={{
                color: report.color,
                borderColor: report.color,
                background: report.bg,
              }}
            >
              {report.button}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Stats */}
      <div className="report-stats">
        <div className="report-stat">
          <div className="report-stat__icon report-stat__icon--blue">
            <FaFileAlt />
          </div>
          <div>
            <div className="report-stat__label">Total Reports</div>
            <div className="report-stat__value">6</div>
            <div className="report-stat__hint">All reports available</div>
          </div>
        </div>

        <div className="report-stat">
          <div className="report-stat__icon report-stat__icon--green">
            <FaCheckCircle />
          </div>
          <div>
            <div className="report-stat__label">Last Generated</div>
            <div className="report-stat__value">Today</div>
            <div className="report-stat__hint">{todayDate}</div>
          </div>
        </div>

        <div className="report-stat">
          <div className="report-stat__icon report-stat__icon--purple">
            <FaCalendarAlt />
          </div>
          <div>
            <div className="report-stat__label">Last Updated</div>
            <div className="report-stat__value">{todayTime}</div>
            <div className="report-stat__hint">By Admin User</div>
          </div>
        </div>
      </div>

      <style>{`
        .report-page, .report-page * { box-sizing: border-box; }
        .report-page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          // padding: 24px;
        }

        /* HEADER */
        .report-page__header { margin-bottom: 24px; }
        .report-page__title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }
        .report-breadcrumb {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }
        .report-breadcrumb__sep { color: #cbd5e1; }
        .report-breadcrumb__current { color: #2563eb; font-weight: 500; }

        /* GRID */
        .report-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        /* CARD */
        .report-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .report-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.04);
          border-color: #cbd5e1;
        }

        .report-card__top {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .report-card__icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        .report-card:hover .report-card__icon {
          transform: scale(1.08) rotate(4deg);
        }
        .report-card__head { min-width: 0; }
        .report-card__title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.3;
        }
        .report-card__desc {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }

        .report-btn {
          margin-top: auto;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .report-card:hover .report-btn {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        /* STATS ROW */
        .report-stats {
          margin-top: 28px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .report-stat {
          display: flex;
          gap: 14px;
          padding: 20px;
          align-items: center;
        }
        .report-stat:not(:last-child) {
          border-right: 1px solid #e5e7eb;
        }
        .report-stat__icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .report-stat__icon--blue   { background: #eff6ff; color: #2563eb; }
        .report-stat__icon--green  { background: #ecfdf5; color: #10b981; }
        .report-stat__icon--purple { background: #faf5ff; color: #9333ea; }
        .report-stat__label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }
        .report-stat__value {
          margin: 4px 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }
        .report-stat__hint {
          font-size: 12px;
          color: #64748b;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .report-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .report-page { padding: 16px; }
          .report-stats { grid-template-columns: 1fr; }
          .report-stat:not(:last-child) {
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }
        }
        @media (max-width: 560px) {
          .report-grid { grid-template-columns: 1fr; }
          .report-page__title { font-size: 20px; }
          .report-card { padding: 18px; }
        }
      `}</style>
    </div>
  );
}

export default ReportMaster;