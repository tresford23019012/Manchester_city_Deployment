import { useState } from "react";
import type { Guesthouse } from "./GuesthouseForm";

type ExportCSVProps = {
  guesthouses: Guesthouse[];
  selectedIds: string[];
};

function csvCell(value: unknown): string {
  let text = String(value ?? "");

  // Prevent text from being interpreted as a spreadsheet formula.
  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function csvNumber(value: number | undefined): string {
  return value !== undefined && Number.isFinite(value)
    ? String(value)
    : "";
}

function ExportCSV({
  guesthouses,
  selectedIds,
}: ExportCSVProps) {
  const [message, setMessage] = useState("");

  const exportRows =
    selectedIds.length > 0
      ? guesthouses.filter((guesthouse) =>
          selectedIds.includes(guesthouse.id),
        )
      : guesthouses;

  function downloadCSV() {
    try {
      const headings = [
        "ID",
        "Name",
        "City",
        "Description",
        "Address",
        "Price per night (BWP)",
        "Contact phone",
        "Contact email",
        "Status",
        "Amenities",
        "Latitude",
        "Longitude",
        "Photo URLs",
      ];

      const records = exportRows.map((guesthouse) =>
        [
          csvCell(guesthouse.id),
          csvCell(guesthouse.name),
          csvCell(guesthouse.city),
          csvCell(guesthouse.description),
          csvCell(guesthouse.address),
          csvNumber(guesthouse.pricePerNight),
          csvCell(guesthouse.contactPhone),
          csvCell(guesthouse.contactEmail),
          csvCell(guesthouse.status),
          csvCell((guesthouse.amenities ?? []).join("; ")),
          csvNumber(guesthouse.latitude),
          csvNumber(guesthouse.longitude),
          csvCell((guesthouse.images ?? []).join("; ")),
        ].join(","),
      );

      const csv =
        "\uFEFF" +
        [
          headings.map(csvCell).join(","),
          ...records,
        ].join("\r\n");

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const date = new Date();

      const dateText = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      link.href = url;
      link.download = `guesthouses-${dateText}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setMessage(
        `CSV download started for ${exportRows.length} listing(s).`,
      );
    } catch {
      setMessage("Unable to export. Please try again.");
    }
  }

  return (
    <div style={{ padding: "0 20px 20px" }}>
      <button
        type="button"
        className="olive-button"
        disabled={exportRows.length === 0}
        onClick={downloadCSV}
      >
        {selectedIds.length > 0
          ? `Export selected (${exportRows.length})`
          : `Export matching (${exportRows.length})`}
      </button>

      <p className="subtitle" style={{ fontSize: "13px" }}>
        Select rows to export specific guesthouses. Otherwise,
        all listings matching your search and filters are exported
        across every page.
      </p>

      <p role="status" style={{ fontSize: "13px" }}>
        {message}
      </p>
    </div>
  );
}

export default ExportCSV;