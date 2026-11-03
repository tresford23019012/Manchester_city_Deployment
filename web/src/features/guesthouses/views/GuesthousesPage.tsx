import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../../models/services/api";
import type { RequestDto } from "../../../models/services/w3/requestsApi";
import { useEffect, useState } from "react";
import GuesthouseForm from "./GuesthouseForm";
import ExportCSV from "./ExportCSV";
import type {
  Guesthouse,
  GuesthouseStatus,
} from "./GuesthouseForm";
import "./App.css";

import { mapGuesthouse, loadGuesthouses, saveDetails, setStatus, uploadPhoto, removePhoto, PAGE_SIZE, statuses } from "../models/guesthouseStore";
import type { GuesthouseDto, Listing } from "../models/guesthouseStore";

function statusLabel(status: GuesthouseStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function actionLabel(status: GuesthouseStatus) {
  if (status === "published") return "Publish";
  if (status === "suspended") return "Suspend";
  return "Draft";
}

function GuesthousesPage() {
  const [guesthouses, setGuesthouses] = useState<Listing[]>([]);
  const [loading,setLoading] = useState(true);
  const [loadError,setLoadError] = useState("");
  const [busy,setBusy] = useState(false);
  const [params,setParams] = useSearchParams();
  const requestId = params.get("requestId");
  const editId = params.get("edit");
  const [sourceRequest,setSourceRequest] = useState<RequestDto>();
  async function refresh() {
    setLoading(true);setLoadError("");
    try {setGuesthouses(await loadGuesthouses());}
    catch(e) {setLoadError(e instanceof Error ? e.message : "Unable to load listings.");}
    finally {setLoading(false);}
  }
  useEffect(()=>{void refresh();},[]);
  useEffect(()=>{
    let alive=true;
    if(requestId) api<RequestDto>(`/admin/requests/${encodeURIComponent(requestId)}`).then(r=>{
      if(alive) {setSourceRequest(r);setShowForm(true);}
    }).catch(e=>{if(alive)setLoadError(e.message);});
    return ()=>{alive=false;};
  },[requestId]);
  useEffect(()=>{
    let alive=true;
    if(editId) api<GuesthouseDto>(`/admin/guesthouses/${encodeURIComponent(editId)}`).then(g=>{
      if(alive) {setEditingGuesthouse(mapGuesthouse(g));setShowForm(true);}
    }).catch(e=>{if(alive)setLoadError(e.message);});
    return ()=>{alive=false;};
  },[editId]);

  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingGuesthouse, setEditingGuesthouse] =
    useState<Listing | undefined>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const storageBlocked = loading || busy || Boolean(loadError);

  const cities = [
    ...new Set(guesthouses.map((guesthouse) => guesthouse.city)),
  ].sort();

  const invalidPriceRange =
    (minPrice !== "" && Number(minPrice) < 0) ||
    (maxPrice !== "" && Number(maxPrice) < 0) ||
    (minPrice !== "" &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice));

  const filteredGuesthouses = guesthouses
    .filter((guesthouse) => {
      const text = search.trim().toLowerCase();

      return (
        !invalidPriceRange &&
        (guesthouse.name.toLowerCase().includes(text) ||
          guesthouse.city.toLowerCase().includes(text)) &&
        (!cityFilter || guesthouse.city === cityFilter) &&
        (!statusFilter || guesthouse.status === statusFilter) &&
        (minPrice === "" ||
          guesthouse.pricePerNight >= Number(minPrice)) &&
        (maxPrice === "" ||
          guesthouse.pricePerNight <= Number(maxPrice))
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return a.pricePerNight - b.pricePerNight;
      }

      if (sortBy === "price-high") {
        return b.pricePerNight - a.pricePerNight;
      }

      if (sortBy === "city") {
        return (
          a.city.localeCompare(b.city) ||
          a.name.localeCompare(b.name)
        );
      }

      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGuesthouses.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const pageGuesthouses = filteredGuesthouses.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const allPageSelected =
    pageGuesthouses.length > 0 &&
    pageGuesthouses.every((guesthouse) =>
      selectedIds.includes(guesthouse.id),
    );

  function resetSelectionAndPage() {
    setSelectedIds([]);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCityFilter("");
    setStatusFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("name");
    resetSelectionAndPage();
  }

  function openForm(guesthouse?: Listing) {
    setEditingGuesthouse(guesthouse);
    setMessage("");
    setActionError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setSourceRequest(undefined);
    setParams({});
    setEditingGuesthouse(undefined);
  }

  async function saveGuesthouse(guesthouse: Guesthouse, files: File[]) {
    setBusy(true);
    let saved: Listing | undefined;
    try {
      saved = await saveDetails({...guesthouse,requestId:sourceRequest?.id}, Boolean(editingGuesthouse));
      // Keep the server id immediately: retrying after a photo/status failure updates this draft.
      setEditingGuesthouse(saved);
      for (const photo of saved.photos || []) {
        if (!(guesthouse.images || []).includes(photo.url)) saved = await removePhoto(saved.id,photo.publicId);
      }
      for (const file of files) saved = await uploadPhoto(saved.id,file);
      if(saved.status !== guesthouse.status) saved = await setStatus(saved.id,guesthouse.status);
      setGuesthouses(current=>[...current.filter(g=>g.id!==saved!.id),saved!]);
      closeForm();clearFilters();setMessage(`${saved.name} saved successfully.`);
    } catch(e) {
      if(saved) {setEditingGuesthouse(saved);setGuesthouses(current=>[...current.filter(g=>g.id!==saved!.id),saved!]);}
      const message=(saved ? "Listing details were saved, but some photos or the status could not be saved. Reopen the listing to review and finish the changes. " : "")+(e instanceof Error ? e.message : "Save failed.");
      if(saved) { closeForm();setActionError(message); } else { throw new Error(message); }
    } finally {setBusy(false);}
  }

  function toggleSelection(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function toggleSelectPage() {
    const pageIds = pageGuesthouses.map(
      (guesthouse) => guesthouse.id,
    );

    setSelectedIds((previous) =>
      allPageSelected
        ? previous.filter((id) => !pageIds.includes(id))
        : [...new Set([...previous, ...pageIds])],
    );
  }

  async function changeStatuses(
    ids: string[],
    nextStatus: GuesthouseStatus,
  ) {
    const affected = guesthouses.filter(
      (guesthouse) =>
        ids.includes(guesthouse.id) &&
        guesthouse.status !== nextStatus,
    );

    if (affected.length === 0) {
      setActionError("");
      setMessage(
        `Selected listings are already ${statusLabel(nextStatus)}.`,
      );
      return;
    }

    const target =
      ids.length === 1
        ? `"${affected[0].name}"`
        : `${affected.length} guesthouses`;

    const explanation =
      nextStatus === "published"
        ? "Published listings are intended for public discovery."
        : "Draft and suspended listings are hidden from public discovery.";

    const confirmed = window.confirm(
      `Change ${target} to ${statusLabel(nextStatus)}?\n\n` +
        explanation,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setActionError("");

    try {
      setBusy(true);
      const result = await api<{updated:number;failed:{id:string;reason:string}[]}>("/admin/guesthouses/bulk-status","POST",{ids,status:nextStatus});
      await refresh();
      if(result.failed.length) throw new Error(`${result.updated} updated; ${result.failed.map(f=>`${f.id}: ${f.reason}`).join("; ")}`);

      setSelectedIds([]);

      setMessage(
        `${affected.length} listing(s) changed to ` +
          `${statusLabel(nextStatus)}.`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update listing statuses.",
      );
    } finally { setBusy(false); }
  }

  return (
    <div className={`app has-sidebar ${darkMode ? "dark" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <svg
            width="40"
            height="48"
            viewBox="0 0 40 48"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 3C11 3 5 9 5 17C5 23 8 27 12 31L15 36H25L28 31C32 27 35 23 35 17C35 9 29 3 20 3Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M15 40H25M17 44H23M20 34V23M14 18L20 24L26 18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <strong>LOCATEBASE</strong>
        </div>

        <nav aria-label="Guesthouse navigation"><Link to="/admin">Dashboard</Link><Link to="/admin/requests">Requests</Link><Link to="/admin/users">Users</Link>
          <button
            type="button"
            className={!showForm ? "active" : ""}
            aria-current={!showForm ? "page" : undefined}
            onClick={closeForm}
          >
            <span aria-hidden="true">⌂</span>
            <span>Guesthouses</span>
          </button>

          <button
            type="button"
            className={showForm && !editingGuesthouse ? "active" : ""}
            aria-current={
              showForm && !editingGuesthouse ? "page" : undefined
            }
            disabled={storageBlocked || showForm}
            onClick={() => openForm()}
          >
            <span aria-hidden="true">⊞</span>
            <span>Add guesthouse</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            aria-pressed={darkMode}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀ Light mode" : "☾ Dark mode"}
          </button>

          <div className="admin-profile">
            <span aria-hidden="true">G</span>

            <div>
              <strong>Guesthouse administrator</strong>
              <small>Property admin</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {showForm ? (
          <GuesthouseForm
            key={showForm ? "editor" : "closed"}
            initialGuesthouse={editingGuesthouse}
            sourceRequest={sourceRequest}
            saving={busy}
            onSave={saveGuesthouse}
            onClose={closeForm}
          />
        ) : (
          <>
            <div className="page-heading">
              <h1>Guesthouses</h1>

              <p className="subtitle">
                Manage all {guesthouses.length} properties in your
                portfolio.
              </p>

              <button
                type="button"
                className="olive-button add-guesthouse-button"
                disabled={storageBlocked}
                onClick={() => openForm()}
              >
                + Add guesthouse
              </button>
            </div>

            {loading && <p role="status">Loading guesthouses…</p>}
            {loadError && <div role="alert">{loadError}<button onClick={refresh}>Try again</button></div>}

            {actionError && (
              <p className="form-error" role="alert">
                {actionError}
              </p>
            )}

            {message && (
              <p className="success-message" role="status">
                {message}
              </p>
            )}

            <section
              className="list-panel"
              aria-labelledby="list-heading"
            >
              <div className="panel-heading">
                <h2 id="list-heading">Guesthouse list</h2>

                <span aria-live="polite">
                  {filteredGuesthouses.length} matching listings
                </span>
              </div>

              <div className="filter-bar">
                <label className="search-field">
                  Search
                  <input
                    type="search"
                    placeholder="Search guesthouses..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      resetSelectionAndPage();
                    }}
                  />
                </label>

                <details className="advanced-filters">
                  <summary>Filters & sorting</summary>

                  <div className="advanced-filter-fields">
                    <label>
                      City
                      <select
                        value={cityFilter}
                        onChange={(event) => {
                          setCityFilter(event.target.value);
                          resetSelectionAndPage();
                        }}
                      >
                        <option value="">All cities</option>

                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Status
                      <select
                        value={statusFilter}
                        onChange={(event) => {
                          setStatusFilter(event.target.value);
                          resetSelectionAndPage();
                        }}
                      >
                        <option value="">All statuses</option>

                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Minimum price (P)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="No minimum"
                        value={minPrice}
                        onChange={(event) => {
                          setMinPrice(event.target.value);
                          resetSelectionAndPage();
                        }}
                      />
                    </label>

                    <label>
                      Maximum price (P)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="No maximum"
                        value={maxPrice}
                        onChange={(event) => {
                          setMaxPrice(event.target.value);
                          resetSelectionAndPage();
                        }}
                      />
                    </label>

                    <label>
                      Sort by
                      <select
                        value={sortBy}
                        onChange={(event) => {
                          setSortBy(event.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="name">Name A–Z</option>
                        <option value="city">City A–Z</option>
                        <option value="price-low">
                          Cheapest first
                        </option>
                        <option value="price-high">
                          Most expensive first
                        </option>
                      </select>
                    </label>
                  </div>
                </details>

                <button type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>

              {invalidPriceRange && (
                <p className="form-error" role="alert">
                  Prices cannot be negative, and minimum price
                  cannot exceed maximum price.
                </p>
              )}

              <ExportCSV
                guesthouses={filteredGuesthouses}
                selectedIds={selectedIds}
              />

              {selectedIds.length > 0 && (
                <div className="demo-notice">
                  <strong role="status">
                    {selectedIds.length} selected across all pages
                  </strong>

                  <div
                    role="group"
                    aria-label="Bulk status actions"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    {statuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={storageBlocked}
                        onClick={() =>
                          changeStatuses(selectedIds, status)
                        }
                      >
                        {actionLabel(status)} selected
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                    >
                      Clear selection
                    </button>
                  </div>
                </div>
              )}

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">
                        <input
                          type="checkbox"
                          aria-label="Select all guesthouses on this page"
                          checked={allPageSelected}
                          disabled={
                            storageBlocked ||
                            pageGuesthouses.length === 0
                          }
                          onChange={toggleSelectPage}
                        />
                      </th>

                      <th scope="col">Property</th>
                      <th scope="col">Rating</th>
                      <th scope="col">Nightly rate</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageGuesthouses.map((guesthouse) => (
                      <tr key={guesthouse.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${guesthouse.name}`}
                            checked={selectedIds.includes(
                              guesthouse.id,
                            )}
                            disabled={storageBlocked}
                            onChange={() =>
                              toggleSelection(guesthouse.id)
                            }
                          />
                        </td>

                        <td className="guesthouse-name">
                          <div className="property-cell">
                            {guesthouse.images?.[0] ? (
                              <img
                                src={guesthouse.images[0]}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <span
                                className="property-placeholder"
                                aria-hidden="true"
                              >
                                ⌂
                              </span>
                            )}

                            <div>
                              {guesthouse.name}
                              <small>
                                {guesthouse.city}, Botswana
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {guesthouse.averageRating !== undefined
                            ? `★ ${guesthouse.averageRating.toFixed(2)}`
                            : "★ —"}
                        </td>

                        <td>
                          P {guesthouse.pricePerNight.toFixed(2)}
                        </td>

                        <td>
                          <span
                            className={`status ${guesthouse.status}`}
                          >
                            {guesthouse.status}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="edit-link"
                              disabled={storageBlocked}
                              aria-label={`Edit ${guesthouse.name}`}
                              onClick={() => openForm(guesthouse)}
                            >
                              Edit
                            </button>

                            <select
                              aria-label={`Change status for ${guesthouse.name}`}
                              value={guesthouse.status}
                              disabled={storageBlocked}
                              onChange={(event) =>
                                changeStatuses(
                                  [guesthouse.id],
                                  event.target
                                    .value as GuesthouseStatus,
                                )
                              }
                            >
                              {statuses.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {statusLabel(status)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {pageGuesthouses.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          {invalidPriceRange
                            ? "Correct the price range to see listings."
                            : "No guesthouses match your search."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <nav
                aria-label="Guesthouse pagination"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  padding: "20px",
                }}
              >
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                  }}
                >
                  {filteredGuesthouses.length === 0
                    ? "Showing 0 listings"
                    : `Showing ${startIndex + 1}–${Math.min(
                        startIndex + PAGE_SIZE,
                        filteredGuesthouses.length,
                      )} of ${filteredGuesthouses.length}`}
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "12px",
                  }}
                >
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>

                  <span aria-live="polite">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </nav>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default GuesthousesPage;