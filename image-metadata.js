const SITE_ORIGIN = "https://justymedia.co.uk";

const DEFAULT_IMAGE_RIGHTS = Object.freeze({
  creator: Object.freeze({ "@type": "Person", name: "Andrew Ambrose" }),
  creditText: "Andrew Ambrose / Justy Media",
  copyrightNotice: "\u00A9 Andrew Ambrose / Justy Media",
  license: `${SITE_ORIGIN}/image-licensing/`,
  acquireLicensePage: `${SITE_ORIGIN}/image-licensing/`
});

function normaliseImage(image, structuredDataDefaults = {}) {
  const record = Array.isArray(image)
    ? { file: image[0], alt: image[1], width: image[2], height: image[3], structuredData: image[4] }
    : image;
  return {
    ...record,
    structuredData: { ...structuredDataDefaults, ...(record.structuredData || {}) }
  };
}

function absoluteImageUrl(value) {
  return new URL(value, `${SITE_ORIGIN}/`).href;
}

function creatorObject(creator) {
  if (!creator) return DEFAULT_IMAGE_RIGHTS.creator;
  if (typeof creator === "string") return { "@type": "Person", name: creator };
  return creator;
}

function imageObject(image, structuredDataDefaults = {}) {
  const record = normaliseImage(image, structuredDataDefaults);
  const rights = record.structuredData;
  if (rights.licenseEligible !== true) return null;

  const hasOwnershipOverride = Boolean(rights.creator || rights.copyrightOwner);
  const creator = creatorObject(rights.creator);
  const creatorName = creator.name || DEFAULT_IMAGE_RIGHTS.creator.name;
  const copyrightOwner = rights.copyrightOwner || creatorName;

  return {
    "@type": "ImageObject",
    contentUrl: absoluteImageUrl(record.src),
    ...(record.alt ? { caption: record.alt } : {}),
    ...(record.width ? { width: record.width } : {}),
    ...(record.height ? { height: record.height } : {}),
    creator,
    creditText: rights.creditText || (hasOwnershipOverride ? creatorName : DEFAULT_IMAGE_RIGHTS.creditText),
    copyrightNotice: rights.copyrightNotice || (hasOwnershipOverride ? `\u00A9 ${copyrightOwner}` : DEFAULT_IMAGE_RIGHTS.copyrightNotice),
    license: rights.license || DEFAULT_IMAGE_RIGHTS.license,
    acquireLicensePage: rights.acquireLicensePage || DEFAULT_IMAGE_RIGHTS.acquireLicensePage
  };
}

function imageObjects(images, structuredDataDefaults = {}) {
  const unique = new Map();
  for (const image of images || []) {
    const schema = imageObject(image, structuredDataDefaults);
    if (schema) unique.set(schema.contentUrl, schema);
  }
  return [...unique.values()];
}

module.exports = {
  SITE_ORIGIN,
  DEFAULT_IMAGE_RIGHTS,
  normaliseImage,
  imageObject,
  imageObjects
};
