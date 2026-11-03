import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { RequestDto } from "../../../models/services/w3/requestsApi";
import "./GuesthouseForm.css";

export type GuesthouseStatus =
  | "published"
  | "draft"
  | "suspended";

export type Guesthouse = {
  id: string;
  requestId?: string;
  contactWhatsapp?: string;
  name: string;
  city: string;
  description: string;
  address: string;
  pricePerNight: number;
  contactPhone: string;
  contactEmail: string;
  status: GuesthouseStatus;
  images?: string[];
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  averageRating?: number;
};

type GuesthouseFormProps = {
  initialGuesthouse?: Guesthouse;
  onSave: (guesthouse: Guesthouse, files: File[]) => Promise<void>;
  sourceRequest?: RequestDto;
  saving: boolean;
  onClose: () => void;
};

const MAX_PHOTOS = 7;

const AMENITIES = [
  "WiFi",
  "Parking",
  "Breakfast",
  "Air conditioning",
  "Swimming pool",
  "Restaurant",
  "Laundry",
  "Wheelchair access",
];

const STATUSES: GuesthouseStatus[] = [
  "published",
  "draft",
  "suspended",
];

function GuesthouseForm({
  initialGuesthouse,
  sourceRequest,
  saving,
  onSave,
  onClose,
}: GuesthouseFormProps) {
  const uploadBusyRef = useRef(false);

  const [pendingFiles,setPendingFiles] = useState<File[]>([]);
  const [name, setName] = useState(
    initialGuesthouse?.name ?? sourceRequest?.guesthouseName ?? "",
  );
  const [city, setCity] = useState(
    initialGuesthouse?.city ?? sourceRequest?.city ?? "",
  );
  const [description, setDescription] = useState(
    initialGuesthouse?.description ?? sourceRequest?.description ?? "",
  );
  const [address, setAddress] = useState(
    initialGuesthouse?.address ?? sourceRequest?.address ?? "",
  );
  const [price, setPrice] = useState(
    initialGuesthouse
      ? String(initialGuesthouse.pricePerNight)
      : sourceRequest ? String(sourceRequest.pricePerNight) : "",
  );
  const [phone, setPhone] = useState(
    initialGuesthouse?.contactPhone ?? sourceRequest?.phone ?? "",
  );
  const [email, setEmail] = useState(
    initialGuesthouse?.contactEmail ?? "",
  );
  const [status, setStatus] = useState<GuesthouseStatus>(
    initialGuesthouse?.status ?? "draft",
  );
  const [images, setImages] = useState<string[]>(
    initialGuesthouse?.images ?? [],
  );
  const [amenities, setAmenities] = useState<string[]>(
    initialGuesthouse?.amenities ?? [],
  );
  const [latitude, setLatitude] = useState(
    initialGuesthouse?.latitude !== undefined
      ? String(initialGuesthouse.latitude)
      : "",
  );
  const [longitude, setLongitude] = useState(
    initialGuesthouse?.longitude !== undefined
      ? String(initialGuesthouse.longitude)
      : "",
  );

  const [activePhoto, setActivePhoto] = useState(0);
  const uploading = false;
  const [dragging, setDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [error, setError] = useState("");

  const isEditing = Boolean(initialGuesthouse);

  const availableAmenities = [
    ...new Set([...AMENITIES, ...amenities]),
  ];

  const currentPhoto = Math.min(
    activePhoto,
    Math.max(0, images.length - 1),
  );

  function toggleAmenity(amenity: string) {
    setAmenities((previous) =>
      previous.includes(amenity)
        ? previous.filter((item) => item !== amenity)
        : [...previous, amenity],
    );
  }

  async function handlePhotos(files: File[]) {
    if (files.length === 0 || uploadBusyRef.current) {
      return;
    }

    setError("");
    setUploadMessage("");
    setDragging(false);

    if (images.length + pendingFiles.length + files.length > MAX_PHOTOS) {
      setError(
        `You can add only ${MAX_PHOTOS - images.length - pendingFiles.length} more photos.`,
      );
      return;
    }

    for (const file of files) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        )
      ) {
        setError(
          `${file.name}: choose a JPEG, PNG or WebP image.`,
        );
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setError(
          `${file.name}: each photo must be 8 MB or smaller.`,
        );
        return;
      }
    }

    setPendingFiles(previous=>[...previous,...files]);
    setUploadMessage(`${files.length} photo(s) selected. They will upload when you save.`);
  }

  function removePhoto(index: number) {
    setImages((previous) =>
      previous.filter((_, photoIndex) => photoIndex !== index),
    );

    setActivePhoto(0);
    setError("");
    setUploadMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploadBusyRef.current || saving) {
      return;
    }

    setError("");

    const priceNumber = Number(price);
    const latitudeNumber = Number(latitude);
    const longitudeNumber = Number(longitude);

    if (!name.trim() || !city.trim() || !description.trim()) {
      setError("Enter a name, city and description.");
      return;
    }

    if (
      !Number.isFinite(priceNumber) ||
      priceNumber > 1000000 || priceNumber <= 0
    ) {
      setError("Enter a price greater than zero and at most 1,000,000.");
      return;
    }

    if (
      latitude.trim() === "" ||
      !Number.isFinite(latitudeNumber) ||
      Math.abs(latitudeNumber) > 90
    ) {
      setError("Enter a latitude between -90 and 90.");
      return;
    }

    if (
      longitude.trim() === "" ||
      !Number.isFinite(longitudeNumber) ||
      Math.abs(longitudeNumber) > 180
    ) {
      setError("Enter a longitude between -180 and 180.");
      return;
    }

    if (!/^\+?[\d\s()-]{7,20}$/.test(phone.trim())) {
      setError("Enter a valid contact phone number.");
      return;
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Enter a valid email address.");
      return;
    }

    if (images.length > MAX_PHOTOS) {
      setError("A guesthouse can have only seven photos.");
      return;
    }

    try {
      await onSave({
        ...initialGuesthouse,
        id: initialGuesthouse?.id ?? "",
        name: name.trim(),
        city: city.trim(),
        description: description.trim(),
        address: address.trim(),
        pricePerNight: priceNumber,
        contactPhone: phone.trim(),
        contactEmail: email.trim(),
        status,
        images,
        amenities,
        latitude: latitudeNumber,
        longitude: longitudeNumber,
      }, pendingFiles);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the guesthouse.",
      );
    }
  }

  return (
    <section
      className="guesthouse-editor"
      aria-labelledby="form-title"
    >
      <div className="editor-heading">
        <h1 id="form-title">
          {isEditing ? "Edit guesthouse" : "Add guesthouse"}
        </h1>

        <p className="subtitle">
          {isEditing
            ? "Update the property details."
            : "Create a new property listing for your portfolio."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {sourceRequest && <p>Linked to request for {sourceRequest.guesthouseName}. Add the verified coordinates before publishing.</p>}
        {pendingFiles.length > 0 && <div>{pendingFiles.map((f,i)=><p key={i}>{f.name} <button type="button" disabled={saving} onClick={()=>setPendingFiles(files=>files.filter((_,j)=>j!==i))}>Remove selected photo</button></p>)}</div>}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <fieldset
          className="guesthouse-fields"
          disabled={uploading || saving}
        >
          <div className="editor-columns">
            <div className="editor-left">
              <section className="editor-card">
                <h2>Basic information</h2>

                <div className="guesthouse-form-grid">
                  <label className="full-width">
                    Guesthouse name *
                    <input
                      required
                      value={name}
                      placeholder="e.g. Acacia Rest Guesthouse"
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                    />
                  </label>

                  <label className="full-width">
                    Description *
                    <textarea
                      required
                      rows={3}
                      value={description}
                      placeholder="Tell guests what makes this place special"
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    City *
                    <input
                      required
                      value={city}
                      placeholder="City"
                      onChange={(event) =>
                        setCity(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Country
                    <input value="Botswana" readOnly />
                  </label>

                  <label className="full-width">
                    Address
                    <input
                      value={address}
                      placeholder="Street address"
                      onChange={(event) =>
                        setAddress(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Contact phone *
                    <input
                      required
                      type="tel"
                      value={phone}
                      placeholder="+267 71 000 000"
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Contact email
                    <input
                      type="email"
                      value={email}
                      placeholder="guesthouse@example.com"
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="editor-card">
                <h2>Pricing & location</h2>

                <div className="guesthouse-form-grid">
                  <label className="full-width">
                    Nightly rate (P) *
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={price}
                      placeholder="0.00"
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Latitude *
                    <input
                      required
                      type="number"
                      min="-90"
                      max="90"
                      step="any"
                      value={latitude}
                      onChange={(event) =>
                        setLatitude(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Longitude *
                    <input
                      required
                      type="number"
                      min="-180"
                      max="180"
                      step="any"
                      value={longitude}
                      onChange={(event) =>
                        setLongitude(event.target.value)
                      }
                    />
                  </label>
                </div>

                <p className="photo-help">
                  Enter the guesthouse’s actual coordinates.
                </p>
              </section>

              <section className="editor-card">
                <h2>Amenities</h2>

                <div className="amenities-grid">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity}>
                      <input
                        type="checkbox"
                        checked={amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="editor-right">
              <section className="editor-card">
                <div className="photo-heading">
                  <h2>Photos</h2>
                  <span>
                    {images.length} / {MAX_PHOTOS}
                  </span>
                </div>

                <label
                  className={`photo-upload ${
                    dragging ? "is-dragging" : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();

                    if (!uploading) {
                      setDragging(true);
                    }
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);

                    if (!uploading) {
                      void handlePhotos(
                        Array.from(event.dataTransfer.files),
                      );
                    }
                  }}
                >
                  <span className="upload-icon" aria-hidden="true">
                    ▧
                  </span>

                  <strong>Drop photos here</strong>
                  <span>or choose files</span>
                  <small>JPEG, PNG, WebP · up to 8 MB</small>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    aria-label="Choose guesthouse photos"
                    disabled={images.length + pendingFiles.length >= MAX_PHOTOS}
                    onChange={(event) => {
                      const files = Array.from(
                        event.target.files ?? [],
                      );

                      event.target.value = "";
                      void handlePhotos(files);
                    }}
                  />
                </label>

                <p className="photo-help" role="status">
                  {uploadMessage}
                </p>

                {images.length > 0 && (
                  <div
                    className="photo-carousel"
                    aria-label="Guesthouse photo gallery"
                  >
                    <img
                      src={images[currentPhoto]}
                      alt={`Guesthouse photo ${currentPhoto + 1}`}
                    />

                    {images.length > 1 && (
                      <div className="carousel-controls">
                        <button
                          type="button"
                          aria-label="Previous photo"
                          onClick={() =>
                            setActivePhoto(
                              (currentPhoto - 1 + images.length) %
                                images.length,
                            )
                          }
                        >
                          ‹
                        </button>

                        <span aria-live="polite">
                          {currentPhoto + 1} / {images.length}
                        </span>

                        <button
                          type="button"
                          aria-label="Next photo"
                          onClick={() =>
                            setActivePhoto(
                              (currentPhoto + 1) % images.length,
                            )
                          }
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="photo-grid">
                  {images.map((image, index) => (
                    <div className="photo-card" key={index}>
                      <button
                        type="button"
                        className="photo-thumbnail"
                        aria-label={`View photo ${index + 1}`}
                        aria-pressed={currentPhoto === index}
                        onClick={() => setActivePhoto(index)}
                      >
                        <img
                          src={image}
                          alt={`Guesthouse photo ${index + 1}`}
                        />
                      </button>

                      <button
                        type="button"
                        className="remove-photo"
                        aria-label={`Remove photo ${index + 1}`}
                        onClick={() => removePhoto(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="editor-card">
                <h2>Publishing</h2>

                <p className="photo-help">
                  Choose whether this guesthouse is visible in
                  the marketplace.
                </p>

                <div
                  className="publishing-options"
                  role="group"
                  aria-label="Listing status"
                >
                  {STATUSES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={
                        status === option ? "olive-button" : ""
                      }
                      aria-pressed={status === option}
                      onClick={() => setStatus(option)}
                    >
                      {option.charAt(0).toUpperCase() +
                        option.slice(1)}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </fieldset>

        <div className="form-actions">
          <button
            type="button"
            disabled={uploading || saving}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="olive-button"
            disabled={uploading || saving}
          >
            {saving
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create guesthouse"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default GuesthouseForm;