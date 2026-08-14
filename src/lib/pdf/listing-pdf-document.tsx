import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";
import {
  formatAreaWithSqm,
  formatPriceLabel,
  getProjectCategory,
  parseAreaToSqft,
  parsePriceToAed,
  publicAppUrl,
  type Property,
} from "@/lib/property-data";
import { buildDubaiFacts, formatAedFull } from "@/lib/pdf/dubai-facts";

/**
 * Modelled on how Dubai developers present their own projects: a colour cover
 * carrying only the name and the price, then generous single-column spreads
 * with one idea to a band.
 *
 * The earlier layout read as a web page printed to PDF — chips, filled cards,
 * rounded panels, a rule under every heading. Developer brochures use almost
 * none of that, so none of it survives here. Space and type do the work
 * instead, and the only rules left are hairlines under section titles.
 */

const ink = "#1c1a16";
const inkSoft = "#3a3630";
const muted = "#7c7568";
const hairline = "#ded5c4";
const cream = "#fbf9f5";
const creamDeep = "#f3eee4";

// Standard PDF fonts ship with react-pdf, so nothing is fetched at render
// time — a fire-and-forget generation gains no network failure points.
const serif = "Times-Roman";
const serifBold = "Times-Bold";

const styles = StyleSheet.create({
  // --- cover ---------------------------------------------------------------
  cover: { flexDirection: "column", height: "100%" },
  coverBand: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 62 },
  coverEyebrow: {
    fontSize: 8,
    fontFamily: "Helvetica",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  coverTitle: { fontSize: 40, fontFamily: serif, lineHeight: 1.16 },
  coverRule: { width: 54, height: 1, marginTop: 26, marginBottom: 22 },
  coverPlace: {
    fontSize: 10,
    fontFamily: "Helvetica",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  coverFoot: {
    paddingHorizontal: 62,
    paddingBottom: 46,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  coverPriceLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  coverPrice: { fontSize: 23, fontFamily: serif },
  coverDeveloper: {
    fontSize: 9,
    fontFamily: "Helvetica",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "right",
  },

  // --- inner pages ---------------------------------------------------------
  page: {
    paddingTop: 44,
    paddingBottom: 46,
    paddingHorizontal: 62,
    fontSize: 10,
    color: ink,
    fontFamily: "Helvetica",
    backgroundColor: cream,
  },
  runningHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  runningHeadText: {
    fontSize: 7.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: muted,
  },

  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: muted,
    paddingBottom: 7,
    borderBottomWidth: 0.7,
    borderBottomColor: hairline,
    marginBottom: 16,
  },
  band: { marginBottom: 34 },

  // Four numbers across, no boxes — the spacing separates them.
  figureRow: { flexDirection: "row", justifyContent: "space-between" },
  figure: { flex: 1, paddingRight: 14 },
  figureLabel: {
    fontSize: 7,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: muted,
    marginBottom: 6,
  },
  figureValue: { fontSize: 15, fontFamily: serif, color: ink },

  priceRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8 },
  priceValue: { fontSize: 30, fontFamily: serif },
  priceQualifier: {
    fontSize: 8,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: muted,
    marginBottom: 8,
    marginLeft: 12,
  },
  priceNote: { fontSize: 9, color: muted },

  // Plain rows rather than progress bars.
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: hairline,
  },
  planLabel: { fontSize: 10, color: inkSoft },
  planPercent: { fontSize: 10, fontFamily: "Helvetica-Bold" },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: hairline,
  },
  detailLabel: { fontSize: 9.5, color: muted },
  detailValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: ink },

  // A measured column — roughly 65 characters, which is what makes body copy
  // read as editorial rather than as a form.
  body: { fontSize: 10, lineHeight: 1.75, color: inkSoft, maxWidth: 400 },
  listLine: { fontSize: 10, lineHeight: 1.75, color: inkSoft, maxWidth: 400 },

  note: {
    fontSize: 8,
    lineHeight: 1.6,
    color: muted,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: hairline,
  },

  // --- location ------------------------------------------------------------
  locationTitle: { fontSize: 26, fontFamily: serif, marginBottom: 10 },
  locationPlace: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: muted,
    marginBottom: 34,
  },
  qrRow: { flexDirection: "row", alignItems: "center" },
  qr: { width: 104, height: 104 },
  qrAside: { marginLeft: 24, maxWidth: 300 },
  qrCaption: {
    fontSize: 7.5,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: muted,
    marginBottom: 7,
  },
  qrLink: { fontSize: 10, textDecoration: "underline" },
  foot: {
    position: "absolute",
    left: 62,
    right: 62,
    bottom: 30,
    fontSize: 7.5,
    color: muted,
  },
});

export interface ListingPdfDocumentProps {
  property: Property;
  /**
   * Taken off the developer's own brochure cover, so the cover and section
   * accents carry their colour rather than one fixed palette for everyone.
   */
  accent: string;
  /** QR for the Google Maps pin on the closing page. */
  mapQrDataUrl: string;
  generatedAt: string;
}

/**
 * A Maps search rather than a coordinate pin: the listing stores a community
 * and an emirate, not a latitude, and a search on the project name resolves to
 * the development itself in Dubai.
 */
export function buildMapsUrl(property: Property) {
  // Deduplicated: a listing whose location and community are the same value
  // would otherwise repeat it in the query.
  const query = Array.from(
    new Set(
      [
        property.title,
        property.community ?? property.location,
        property.emirate ?? "Dubai",
      ].filter((part): part is string => Boolean(part?.trim())),
    ),
  ).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Cream on a dark cover, ink on a light one. */
function isDark(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return true;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.6;
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function RunningHead({ title, page }: { title: string; page: string }) {
  return (
    <View style={styles.runningHead} fixed>
      <Text style={styles.runningHeadText}>{title}</Text>
      <Text style={styles.runningHeadText}>{page}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function ListingPdfDocument({
  property,
  accent,
  mapQrDataUrl,
  generatedAt,
}: ListingPdfDocumentProps) {
  const category = getProjectCategory(property);
  const isRental = property.purpose === "For Rent";
  const priceAed = parsePriceToAed(property.price);
  const areaSqft = parseAreaToSqft(property.area);
  const facts = buildDubaiFacts(property);
  const listingUrl = `${publicAppUrl}/listing/${property.slug}`;
  const mapsUrl = buildMapsUrl(property);
  const place = `${property.community ?? property.location}${
    property.emirate ? `, ${property.emirate}` : ""
  }`;
  const generatedLabel = new Date(generatedAt).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const onCover = isDark(accent) ? cream : ink;
  const originalAed = property.originalPrice
    ? parsePriceToAed(property.originalPrice)
    : 0;
  const againstOriginal =
    originalAed > 0 && priceAed > 0
      ? ((priceAed - originalAed) / originalAed) * 100
      : undefined;

  const essentials: [string, string][] = [
    ["Developer", property.developer ?? "Private owner"],
    ["Community", property.community ?? property.location],
    ["Property type", property.type],
    ["Furnishing", property.furnishing],
    ["Parking", property.parking],
    ["Floor", property.floor],
    ["Ownership", property.ownership ?? "Freehold"],
    ["Construction status", property.constructionStatus],
  ];

  const terms: [string, string][] = [
    ["RERA / Trakheesi permit", facts.permitLabel],
    // A price-on-request listing parses to zero, and "AED 0" reads as a real
    // quote rather than a missing one — omit the row instead.
    ...(!isRental && priceAed > 0
      ? ([["DLD transfer fee (est., 4%)", facts.dldFeeLabel]] as [string, string][])
      : []),
    ...(property.serviceCharge
      ? ([["Service charge", property.serviceCharge]] as [string, string][])
      : []),
    ...(property.expectedYield
      ? ([["Expected net yield", property.expectedYield]] as [string, string][])
      : []),
    ["Agency fee", property.commissionCovered ? "Covered" : "Not covered"],
  ];

  return (
    <Document title={property.title} author={property.developer ?? property.title}>
      {/* --- cover ----------------------------------------------------- */}
      <Page size="A4" style={{ backgroundColor: accent }}>
        <View style={styles.cover}>
          <View style={styles.coverBand}>
            <Text style={[styles.coverEyebrow, { color: onCover, opacity: 0.72 }]}>
              {category}
            </Text>
            <Text style={[styles.coverTitle, { color: onCover }]}>
              {property.title}
            </Text>
            <View style={[styles.coverRule, { backgroundColor: onCover, opacity: 0.5 }]} />
            <Text style={[styles.coverPlace, { color: onCover, opacity: 0.82 }]}>
              {place}
            </Text>
          </View>
          <View style={styles.coverFoot}>
            <View>
              <Text style={[styles.coverPriceLabel, { color: onCover, opacity: 0.7 }]}>
                {property.priceQualifier || (isRental ? "Rent" : "Price")}
              </Text>
              <Text style={[styles.coverPrice, { color: onCover }]}>
                {formatPriceLabel(property.price)}
              </Text>
            </View>
            <Text style={[styles.coverDeveloper, { color: onCover, opacity: 0.7 }]}>
              {property.developer ?? "Realty by Rahul"}
            </Text>
          </View>
        </View>
      </Page>

      {/* --- the unit -------------------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <RunningHead title={property.title} page="The unit" />

        <View style={styles.band}>
          <SectionTitle>Price</SectionTitle>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>{formatPriceLabel(property.price)}</Text>
            <Text style={styles.priceQualifier}>
              {property.priceQualifier || (isRental ? "Rent" : "Price")}
            </Text>
          </View>
          {againstOriginal !== undefined && (
            <Text style={styles.priceNote}>
              {againstOriginal === 0
                ? `At the original price of ${property.originalPrice}.`
                : `${Math.abs(againstOriginal).toFixed(1)}% ${
                    againstOriginal < 0 ? "below" : "above"
                  } the original price of ${property.originalPrice}.`}
            </Text>
          )}
        </View>

        <View style={styles.band}>
          <SectionTitle>At a glance</SectionTitle>
          <View style={styles.figureRow}>
            <View style={styles.figure}>
              <Text style={styles.figureLabel}>
                {isResidential(property) ? "Bedrooms" : "Type"}
              </Text>
              <Text style={styles.figureValue}>
                {isResidential(property) ? `${property.bedrooms}` : property.type}
              </Text>
            </View>
            <View style={styles.figure}>
              <Text style={styles.figureLabel}>
                {isResidential(property) ? "Bathrooms" : "Parking"}
              </Text>
              <Text style={styles.figureValue}>
                {isResidential(property) ? `${property.bathrooms}` : property.parking}
              </Text>
            </View>
            <View style={styles.figure}>
              <Text style={styles.figureLabel}>Built-up area</Text>
              <Text style={styles.figureValue}>{formatAreaWithSqm(property.area)}</Text>
            </View>
            <View style={styles.figure}>
              <Text style={styles.figureLabel}>
                {category === "Rent" ? "Availability" : "Handover"}
              </Text>
              <Text style={styles.figureValue}>{property.handover ?? "Ready"}</Text>
            </View>
          </View>
        </View>

        {property.paymentMilestones && property.paymentMilestones.length > 0 && (
          <View style={styles.band}>
            <SectionTitle>Payment plan</SectionTitle>
            {property.paymentMilestones.map((milestone) => (
              <View key={milestone.label} style={styles.planRow}>
                <Text style={styles.planLabel}>{milestone.label}</Text>
                <Text style={styles.planPercent}>{milestone.percentage}%</Text>
              </View>
            ))}
            {property.postHandoverPaymentPlan && (
              <Text style={styles.priceNote}>
                A post-handover schedule is available on this project.
              </Text>
            )}
          </View>
        )}

        <View style={styles.band}>
          <SectionTitle>Project essentials</SectionTitle>
          {essentials.map(([label, value]) => (
            <DetailRow key={label} label={label} value={value} />
          ))}
        </View>

        <Text style={styles.foot} fixed>
          {property.title} · {place} · {listingUrl}
        </Text>
      </Page>

      {/* --- terms ----------------------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <RunningHead title={property.title} page="Terms" />

        <View style={styles.band}>
          <SectionTitle>About this property</SectionTitle>
          <Text style={styles.body}>{property.description}</Text>
        </View>

        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.band}>
            <SectionTitle>Amenities</SectionTitle>
            {/* A sentence rather than a row of pills — pills are what made the
                previous version read as a web page. */}
            <Text style={styles.listLine}>{property.amenities.join(" · ")}</Text>
          </View>
        )}

        {property.highlights.length > 0 && (
          <View style={styles.band}>
            <SectionTitle>Why this one</SectionTitle>
            {property.highlights.map((highlight) => (
              <Text key={highlight} style={styles.listLine}>
                — {highlight}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.band}>
          <SectionTitle>Ownership and fees</SectionTitle>
          {terms.map(([label, value]) => (
            <DetailRow key={label} label={label} value={value} />
          ))}
          {facts.goldenVisaEligible && (
            <Text style={styles.note}>
              At or above AED 2,000,000 this may qualify the owner for UAE
              Golden Visa real-estate residency, subject to current UAE
              government criteria. Indicative only — confirm eligibility with an
              immigration advisor.
            </Text>
          )}
        </View>

        <Text style={styles.foot} fixed>
          Prepared {generatedLabel} · Prices, fees and payment terms are indicative
          and subject to change. DLD fee is an estimate, not a final figure.
        </Text>
      </Page>

      {/* --- location -------------------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <RunningHead title={property.title} page="Location" />

        <Text style={styles.locationTitle}>
          {property.community ?? property.location}
        </Text>
        <Text style={styles.locationPlace}>
          {property.emirate ?? "Dubai"}
          {property.developer ? ` · ${property.developer}` : ""}
        </Text>

        <View style={styles.qrRow}>
          <Link src={mapsUrl}>
            <Image src={mapQrDataUrl} style={styles.qr} />
          </Link>
          <View style={styles.qrAside}>
            <Text style={styles.qrCaption}>Directions</Text>
            <Link src={mapsUrl} style={[styles.qrLink, { color: accent }]}>
              Open this location in Google Maps
            </Link>
          </View>
        </View>

        <Text style={styles.foot} fixed>
          {property.title} ·{" "}
          {areaSqft > 0 ? `${areaSqft.toLocaleString("en-US")} sq ft` : property.area}
          {priceAed > 0 ? ` · ${formatAedFull(priceAed)}` : ""} · {listingUrl}
        </Text>
      </Page>
    </Document>
  );
}

/** Bed and bath counts say nothing about an office or a plot. */
function isResidential(property: Property) {
  return !["Office", "Retail", "Warehouse", "Plot"].includes(property.type);
}
