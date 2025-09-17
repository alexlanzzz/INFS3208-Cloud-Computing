import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JourneyMap from "./JourneyMap";
import BottomNav from "./BottomNav";

// Must match the key used when saving journey items
const LS_JOURNEY_KEY = "frame8.myJourney.v1";

// Read your Google Places key from env or replace with your constant
const GOOGLE_PLACES_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

/* ---------- utils ---------- */

// Build a Places API v1 photo URL from a photo name
function buildPhotoUrl(photoName, { maxHeight = 600, maxWidth = 800 } = {}) {
  if (!photoName) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`;
}

// Default/fallback image (adjust to your project path)
function getDefaultImage(type) {
  return `/images/defaults/${type || "place"}.jpg`;
}

// Prefer English fields when available
function getTitle(item) {
  return item.title_en || item.name_en || item.title || item.name || "Untitled";
}
function getAddress(item) {
  return item.address_en || item.address || "";
}

// Resolve an image URL for a journey item
function resolveImage(item) {
  if (item.img) return item.img;
  if (item.image) return item.image;

  if (item.photo_name) {
    const url = buildPhotoUrl(item.photo_name);
    if (url) return url;
  }

  const photoName = item.photos?.[0]?.name;
  if (photoName) {
    const url = buildPhotoUrl(photoName);
    if (url) return url;
  }

  return getDefaultImage(item.type);
}

// Group items by YYYY-MM-DD; prefer scheduled `start`, fallback to `addedAt`
function groupByDate(items) {
  return items.reduce((acc, it, index) => {
    const iso = it.start || it.addedAt;
    const day = iso ? iso.slice(0, 10) : "Unscheduled";
    (acc[day] = acc[day] || []).push({ item: it, index });
    return acc;
  }, {});
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatMapDate(day) {
  if (!day || day === "Unscheduled") {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}-${now.getFullYear()}`;
  }
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) {
    return typeof day === "string" ? day : "Trip Map";
  }
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}-${d.getFullYear()}`;
}

/* ---------- component ---------- */

export default function MyJourney() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [journey, setJourney] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_JOURNEY_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!isMapOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMapOpen]);

  const removeJourneyItem = (targetIndex) => {
    setJourney((prev) => {
      const next = prev.filter((_, idx) => idx !== targetIndex);
      if (next.length === prev.length) {
        return prev;
      }
      localStorage.setItem(LS_JOURNEY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const navigate = useNavigate();

  if (!journey.length) {
    return (
      <div style={{ padding: 16, paddingBottom: 100 }}>
        <h2 style={{ marginTop: 0 }}>My Journey</h2>
        <p>No places yet. Swipe right on destinations to add them here.</p>
        <BottomNav active="journey" />
      </div>
    );
  }

  const buckets = groupByDate(journey);
  const days = Object.keys(buckets).sort();
  const scheduledDays = days.filter((d) => d !== "Unscheduled");
  const mapDateLabel = formatMapDate(scheduledDays[0]);

  return (
    <div style={{ padding: 16, paddingBottom: 120, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Brisbane</h2>
        <span style={{ color: "#6b7280" }}>
          {days[0] !== "Unscheduled" && days[days.length - 1] !== "Unscheduled"
            ? `${days[0]} — ${days[days.length - 1]}`
            : ""}
        </span>
        <button
          onClick={() => setIsMapOpen(true)}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #d1d5db",
            background: "white",
            borderRadius: 12,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 14,
            color: "#1f2937",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
            <path d="M9 4v14" />
            <path d="M15 6v14" />
          </svg>
          <span style={{ fontWeight: 600 }}>Map View</span>
        </button>
      </div>

      <div style={{ marginTop: 16, position: "relative", paddingLeft: 56 }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 26,
            width: 4,
            background: "#e5e7eb",
            borderRadius: 2,
          }}
        />

        {days.map((day) => {
          const items = [...buckets[day]].sort(
            (a, b) =>
              new Date(a.item.start || a.item.addedAt) -
              new Date(b.item.start || b.item.addedAt)
          );

          return (
            <section key={day} style={{ marginBottom: 24 }}>
              <div style={{ position: "relative", margin: "12px 0 8px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: -56,
                    top: 0,
                    width: 48,
                    textAlign: "right",
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  {day === "Unscheduled" ? "—" : day.slice(5).replace("-", "/")}
                </div>
              </div>

              {items.map((entry, idx) => {
                const a = entry.item;
                const title = getTitle(a);
                const addr = getAddress(a);
                const imageUrl = resolveImage(a);

                return (
                  <article
                    key={`${day}-${entry.index}`}
                    style={{
                      margin: "12px 0 18px 0",
                      background: "white",
                      borderRadius: 12,
                      boxShadow: "0 8px 20px rgba(0,0,0,.08)",
                      overflow: "hidden",
                      width: "min(760px, 100%)",
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: -38,
                          top: 18,
                          width: 18,
                          height: 18,
                          background: "#3b82f6",
                          borderRadius: "50%",
                          boxShadow: "0 0 0 4px #dbeafe",
                        }}
                      />
                    </div>

                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={title}
                        onError={(e) => (e.currentTarget.src = getDefaultImage(a.type))}
                        style={{ width: "100%", height: 160, objectFit: "cover" }}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeJourneyItem(entry.index)}
                      aria-label="Remove from journey"
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        border: "none",
                        background: "rgba(17, 24, 39, 0.65)",
                        color: "white",
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>

                    <div style={{ padding: "14px 16px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          {a.start && a.end
                            ? `${fmtTime(a.start)} — ${fmtTime(a.end)} `
                            : ""}
                          {title}
                        </div>

                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                          {addr && (
                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                              {addr}
                            </span>
                          )}
                          <button
                            type="button"
                            style={{
                              border: "1px solid #e5e7eb",
                              background: "white",
                              borderRadius: 8,
                              padding: "4px 10px",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate("/comment", {
                                state: { destination: a },
                              })
                            }
                          >
                            comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>

      {isMapOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 300,
          }}
        >
          <JourneyMap
            height="100%"
            style={{
              borderRadius: 0,
              boxShadow: "none",
              height: "100%",
              minHeight: "100%",
              background: "#000",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 16,
              right: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "white",
            }}
          >
            <button
              onClick={() => setIsMapOpen(false)}
              aria-label="Back"
              style={{
                border: "none",
                background: "rgba(17, 24, 39, 0.6)",
                color: "white",
                width: 46,
                height: 46,
                borderRadius: 23,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div
              style={{
                background: "rgba(17, 24, 39, 0.6)",
                padding: "10px 24px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 18,
              }}
            >
              {mapDateLabel}
            </div>
            <div style={{ width: 46 }} />
          </div>
        </div>
      )}

      <BottomNav active="journey" />
    </div>
  );
}
