/* =========================================================
   SAWA STORE - PRODUCT DETAILS
   RTL / PREMIUM E-COMMERCE / JUMIA-STYLE
   ========================================================= */

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import "./ProductDetails.css";

import { CartContext } from "../context/CartContext";

import {
  addReview,
  getReviews,
  getRating,
} from "../services/reviewService";

import Navbar from "../components/Navbar/Navbar.jsx";
import Footer from "../components/Footer/Footer.jsx";


/* =========================================================
   HELPERS
   ========================================================= */

const normalizeText = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};


const toNumber = (
  value,
  fallback = 0
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(
    String(value)
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(number)
    ? number
    : fallback;
};


const formatPrice = (value) => {
  const number = toNumber(
    value,
    0
  );

  return new Intl.NumberFormat(
    "ar-EG",
    {
      maximumFractionDigits: 0,
    }
  ).format(number);
};


const getObjectValue = (
  object,
  keys,
  fallback = ""
) => {
  if (
    !object ||
    typeof object !== "object"
  ) {
    return fallback;
  }

  for (const key of keys) {
    const value = object[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
};


/* =========================================================
   ARRAY / OBJECT HELPERS
   ========================================================= */

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.entries(value).map(
      ([key, item]) => {
        if (
          item &&
          typeof item === "object" &&
          !Array.isArray(item)
        ) {
          return {
            ...item,
            id:
              item.id ||
              item.key ||
              key,
          };
        }

        return {
          id: key,
          value: item,
          name: item,
          label: item,
        };
      }
    );
  }

  return [];
};


const getFirstNonEmpty = (
  ...values
) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};


/* =========================================================
   IMAGE HELPERS
   ========================================================= */

const normalizeImage = (
  image
) => {
  if (!image) {
    return "";
  }

  if (
    typeof image === "string"
  ) {
    return image.trim();
  }

  if (
    typeof image === "object"
  ) {
    return (
      image.url ||
      image.src ||
      image.image ||
      image.path ||
      image.secure_url ||
      image.secureUrl ||
      ""
    );
  }

  return "";
};


const collectImages = (
  source
) => {
  if (
    !source ||
    typeof source !== "object"
  ) {
    return [];
  }

  const result = [];

  const add = (value) => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const nested =
        value.url ||
        value.src ||
        value.image ||
        value.path ||
        value.secure_url ||
        value.secureUrl;

      if (nested) {
        add(nested);
        return;
      }

      Object.values(value).forEach(
        (item) => {
          if (
            typeof item === "string" ||
            Array.isArray(item)
          ) {
            add(item);
          }
        }
      );

      return;
    }

    const normalized =
      normalizeImage(value);

    if (normalized) {
      result.push(normalized);
    }
  };

  add(source.image);
  add(source.images);
  add(source.gallery);
  add(source.photos);
  add(source.productImages);
  add(source.media);
  add(source.thumbnail);
  add(source.imageUrl);
  add(source.imageURL);
  add(source.photo);

  return [
    ...new Set(result),
  ];
};


const getVariantImages = (
  variant
) => {
  if (
    !variant ||
    typeof variant !== "object"
  ) {
    return [];
  }

  return collectImages(
    variant
  );
};


/* =========================================================
   OPTION HELPERS
   ========================================================= */

const getOptionValue = (
  option
) => {
  if (
    option === null ||
    option === undefined
  ) {
    return "";
  }

  if (
    typeof option === "string" ||
    typeof option === "number"
  ) {
    return String(option).trim();
  }

  if (
    Array.isArray(option)
  ) {
    if (!option.length) {
      return "";
    }

    return getOptionValue(
      option[0]
    );
  }

  return String(
    getFirstNonEmpty(
      option.value,
      option.name,
      option.label,
      option.title,
      option.option,
      option.text,
      option.displayValue,
      option.displayName
    )
  ).trim();
};


const getOptionId = (
  option
) => {
  if (
    option === null ||
    option === undefined
  ) {
    return "";
  }

  if (
    typeof option !== "object"
  ) {
    return normalizeText(
      getOptionValue(option)
    );
  }

  return String(
    getFirstNonEmpty(
      option.id,
      option.valueId,
      option.optionId,
      option.key,
      getOptionValue(option)
    )
  );
};


const getGroupName = (
  group
) => {
  if (
    group === null ||
    group === undefined
  ) {
    return "";
  }

  if (
    typeof group === "string"
  ) {
    return group.trim();
  }

  return String(
    getFirstNonEmpty(
      group.name,
      group.title,
      group.label,
      group.displayName,
      group.groupName,
      group.attributeName,
      group.attribute,
      group.key,
      group.optionName
    )
  ).trim();
};


const getGroupId = (
  group,
  index = 0
) => {
  if (
    !group ||
    typeof group !== "object"
  ) {
    return `group-${index}`;
  }

  return String(
    getFirstNonEmpty(
      group.id,
      group.groupId,
      group.key,
      group.attributeKey,
      group.attribute,
      group.name,
      group.title,
      `group-${index}`
    )
  );
};


/* =========================================================
   GET GROUP OPTIONS
   ========================================================= */

const getGroupOptions = (
  group
) => {
  if (
    group === null ||
    group === undefined
  ) {
    return [];
  }

  if (
    typeof group === "string" ||
    typeof group === "number"
  ) {
    return [
      {
        value: String(group),
      },
    ];
  }

  if (
    Array.isArray(group)
  ) {
    return group;
  }

  if (
    typeof group !== "object"
  ) {
    return [];
  }

  const possibleSources = [
    group.options,
    group.values,
    group.items,
    group.choices,
    group.variants,
    group.optionValues,
    group.children,
  ];

  for (
    const source of possibleSources
  ) {
    const array =
      asArray(source);

    if (array.length) {
      return array;
    }
  }

  const ignoredKeys = new Set([
    "id",
    "groupId",
    "key",
    "name",
    "title",
    "label",
    "displayName",
    "groupName",
    "attribute",
    "attributeKey",
    "attributeName",
    "options",
    "values",
    "items",
    "choices",
    "variants",
    "optionValues",
    "children",
    "price",
    "oldPrice",
    "stock",
    "sku",
    "image",
    "images",
  ]);

  const dynamicOptions =
    Object.entries(group)
      .filter(
        ([key]) =>
          !ignoredKeys.has(key)
      )
      .map(
        ([key, value]) => {
          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
          ) {
            return {
              ...value,
              id:
                value.id ||
                value.optionId ||
                key,
              value:
                value.value ||
                value.name ||
                value.label ||
                key,
              name:
                value.name ||
                value.label ||
                value.title ||
                key,
              label:
                value.label ||
                value.name ||
                value.title ||
                key,
            };
          }

          return {
            id: key,
            value:
              value === undefined ||
              value === null
                ? key
                : value,
            name: key,
            label: key,
          };
        }
      );

  return dynamicOptions;
};


/* =========================================================
   NORMALIZE DIRECT VARIANT GROUPS
   ========================================================= */

const normalizeDirectVariantGroups = (
  rawGroups
) => {
  const groups =
    asArray(rawGroups);

  if (!groups.length) {
    return [];
  }

  return groups
    .map(
      (
        rawGroup,
        groupIndex
      ) => {
        if (
          rawGroup === null ||
          rawGroup === undefined
        ) {
          return null;
        }

        let group =
          rawGroup;

        if (
          typeof rawGroup === "string"
        ) {
          group = {
            id:
              `group-${groupIndex}`,
            name:
              rawGroup,
            options: [],
          };
        }

        const id =
          getGroupId(
            group,
            groupIndex
          );

        const name =
          getGroupName(
            group
          ) ||
          `الخيار ${groupIndex + 1}`;

        const rawOptions =
          getGroupOptions(
            group
          );

        const options =
          asArray(rawOptions)
            .map(
              (
                rawOption,
                optionIndex
              ) => {
                if (
                  rawOption === null ||
                  rawOption === undefined ||
                  rawOption === ""
                ) {
                  return null;
                }

                const objectOption =
                  rawOption &&
                  typeof rawOption ===
                    "object" &&
                  !Array.isArray(
                    rawOption
                  )
                    ? rawOption
                    : {
                        value:
                          rawOption,
                      };

                const value =
                  getOptionValue(
                    objectOption
                  );

                if (!value) {
                  return null;
                }

                const optionId =
                  String(
                    getFirstNonEmpty(
                      objectOption.id,
                      objectOption.valueId,
                      objectOption.optionId,
                      objectOption.key,
                      `${id}-option-${optionIndex}`
                    )
                  );

                const label =
                  String(
                    getFirstNonEmpty(
                      objectOption.label,
                      objectOption.name,
                      objectOption.title,
                      objectOption.displayName,
                      value
                    )
                  );

                const stockValue =
                  objectOption.stock;

                return {
                  ...objectOption,

                  id: optionId,

                  value,

                  label,

                  name:
                    String(
                      getFirstNonEmpty(
                        objectOption.name,
                        objectOption.label,
                        objectOption.title,
                        value
                      )
                    ),

                  price:
                    toNumber(
                      objectOption.price,
                      0
                    ),

                  oldPrice:
                    toNumber(
                      objectOption.oldPrice,
                      0
                    ),

                  stock:
                    stockValue ===
                      "" ||
                    stockValue ===
                      null ||
                    stockValue ===
                      undefined
                      ? null
                      : toNumber(
                          stockValue,
                          0
                        ),

                  sku:
                    getObjectValue(
                      objectOption,
                      [
                        "sku",
                        "SKU",
                        "code",
                        "productCode",
                      ],
                      ""
                    ),

                  images:
                    getVariantImages(
                      objectOption
                    ),
                };
              }
            )
            .filter(Boolean);

        return {
          ...group,

          id,

          name,

          title:
            name,

          label:
            getFirstNonEmpty(
              group.label,
              name
            ),

          attributeKey:
            String(
              getFirstNonEmpty(
                group.attributeKey,
                group.attribute,
                group.key,
                id
              )
            ),

          options,
        };
      }
    )
    .filter(
      (group) =>
        group &&
        group.name &&
        Array.isArray(
          group.options
        ) &&
        group.options.length > 0
    );
};


/* =========================================================
   LEGACY VARIANTS
   ========================================================= */

const normalizeLegacyVariants = (
  product
) => {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return [];
  }

  const possibleSources = [
    product.variants,
    product.variantOptions,
    product.productVariants,
    product.variantItems,
    product.items,
  ];

  for (
    const source of possibleSources
  ) {
    const variants =
      asArray(source);

    if (
      variants.length
    ) {
      return variants.filter(
        (variant) =>
          variant &&
          typeof variant ===
            "object"
      );
    }
  }

  return [];
};


/* =========================================================
   LEGACY VARIANT ATTRIBUTE NORMALIZATION
   ========================================================= */

const getVariantAttributeSources = (
  variant
) => {
  if (
    !variant ||
    typeof variant !== "object"
  ) {
    return [];
  }

  return [
    variant.attributes,
    variant.options,
    variant.specifications,
    variant.optionValues,
    variant.values,
    variant.variantAttributes,
    variant.selectedOptions,
  ].filter(
    (value) =>
      value !== undefined &&
      value !== null
  );
};


const normalizeAttributeEntries = (
  source
) => {
  if (
    source === null ||
    source === undefined
  ) {
    return [];
  }

  if (
    Array.isArray(source)
  ) {
    const result = [];

    source.forEach(
      (item, index) => {
        if (
          item === null ||
          item === undefined
        ) {
          return;
        }

        if (
          typeof item === "string" ||
          typeof item === "number"
        ) {
          result.push({
            key:
              `attribute-${index}`,
            value:
              String(item),
          });

          return;
        }

        if (
          typeof item === "object"
        ) {
          const key =
            getFirstNonEmpty(
              item.id,
              item.key,
              item.name,
              item.label,
              item.title,
              item.attribute,
              item.attributeKey,
              `attribute-${index}`
            );

          const value =
            getFirstNonEmpty(
              item.value,
              item.selectedValue,
              item.option,
              item.optionValue,
              item.name,
              item.label,
              item.title
            );

          if (
            String(value).trim()
          ) {
            result.push({
              key:
                String(key),
              value:
                String(value).trim(),
              raw:
                item,
            });
          }
        }
      }
    );

    return result;
  }

  if (
    typeof source === "object"
  ) {
    return Object.entries(
      source
    )
      .map(
        ([key, value]) => ({
          key,
          value:
            getOptionValue(
              value
            ),
          raw:
            value,
        })
      )
      .filter(
        (item) =>
          item.value
      );
  }

  return [];
};


const getVariantAllAttributes = (
  variant
) => {
  const entries = [];

  const sources =
    getVariantAttributeSources(
      variant
    );

  sources.forEach(
    (source) => {
      normalizeAttributeEntries(
        source
      ).forEach(
        (entry) => {
          const alreadyExists =
            entries.some(
              (item) =>
                normalizeText(
                  item.key
                ) ===
                  normalizeText(
                    entry.key
                  ) &&
                normalizeText(
                  item.value
                ) ===
                  normalizeText(
                    entry.value
                  )
            );

          if (
            !alreadyExists
          ) {
            entries.push(
              entry
            );
          }
        }
      );
    }
  );

  return entries;
};


/* =========================================================
   FIND VARIANT ATTRIBUTE VALUE
   ========================================================= */

const findVariantAttributeValue = (
  variant,
  group
) => {
  if (
    !variant ||
    !group
  ) {
    return "";
  }

  const entries =
    getVariantAllAttributes(
      variant
    );

  if (!entries.length) {
    return "";
  }

  const groupId =
    normalizeText(
      group.id
    );

  const groupName =
    normalizeText(
      group.name
    );

  const attributeKey =
    normalizeText(
      group.attributeKey
    );

  for (
    const entry of entries
  ) {
    const normalizedKey =
      normalizeText(
        entry.key
      );

    if (
      normalizedKey ===
        groupId ||
      normalizedKey ===
        groupName ||
      normalizedKey ===
        attributeKey
    ) {
      return String(
        entry.value
      ).trim();
    }
  }

  for (
    const entry of entries
  ) {
    const normalizedKey =
      normalizeText(
        entry.key
      );

    if (
      groupName &&
      (
        normalizedKey.includes(
          groupName
        ) ||
        groupName.includes(
          normalizedKey
        )
      )
    ) {
      return String(
        entry.value
      ).trim();
    }
  }

  return "";
};


/* =========================================================
   EXTRACT GROUPS FROM LEGACY VARIANTS
   ========================================================= */

const extractVariantGroupsFromLegacy =
  (
    variants
  ) => {
    if (
      !Array.isArray(
        variants
      ) ||
      !variants.length
    ) {
      return [];
    }

    const groupsMap =
      new Map();

    variants.forEach(
      (
        variant
      ) => {
        const entries =
          getVariantAllAttributes(
            variant
          );

        entries.forEach(
          (
            entry
          ) => {
            const groupKey =
              normalizeText(
                entry.key
              );

            if (!groupKey) {
              return;
            }

            if (
              !groupsMap.has(
                groupKey
              )
            ) {
              groupsMap.set(
                groupKey,
                {
                  id:
                    String(
                      entry.key
                    ),
                  name:
                    String(
                      entry.key
                    ),
                  attributeKey:
                    String(
                      entry.key
                    ),
                  options: [],
                }
              );
            }

            const group =
              groupsMap.get(
                groupKey
              );

            const normalizedValue =
              normalizeText(
                entry.value
              );

            const exists =
              group.options.some(
                (option) =>
                  normalizeText(
                    option.value
                  ) ===
                  normalizedValue
              );

            if (
              exists
            ) {
              return;
            }

            const optionData =
              {
                ...(entry.raw &&
                typeof entry.raw ===
                  "object"
                  ? entry.raw
                  : {}),
              };

            const variantImages =
              getVariantImages(
                variant
              );

            const variantPrice =
              toNumber(
                variant.price,
                0
              );

            const variantOldPrice =
              toNumber(
                variant.oldPrice,
                0
              );

            const variantStock =
              variant.stock !==
                undefined &&
              variant.stock !==
                null &&
              variant.stock !==
                ""
                ? toNumber(
                    variant.stock,
                    0
                  )
                : null;

            const variantSKU =
              getObjectValue(
                variant,
                [
                  "sku",
                  "SKU",
                  "code",
                  "productCode",
                ],
                ""
              );

            group.options.push({
              ...optionData,

              id:
                `${group.id}__${normalizeText(
                  entry.value
                )}`,

              value:
                String(
                  entry.value
                ).trim(),

              label:
                String(
                  entry.value
                ).trim(),

              name:
                String(
                  entry.value
                ).trim(),

              price:
                variantPrice,

              oldPrice:
                variantOldPrice,

              stock:
                variantStock,

              sku:
                variantSKU,

              images:
                variantImages,

              variantId:
                variant.id ||
                variant.variantId ||
                "",
            });
          }
        );
      }
    );

    return Array.from(
      groupsMap.values()
    ).filter(
      (group) =>
        group.options.length > 0
    );
  };


/* =========================================================
   MAIN VARIANT GROUP NORMALIZER
   ========================================================= */

const normalizeVariantGroups = (
  product
) => {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return [];
  }

  const directSources = [
    product.variantGroups,
    product.variantSettings?.groups,
    product.optionGroups,
    product.optionsGroups,
    product.productOptionGroups,
    product.productOptions,
  ];

  for (
    const source of directSources
  ) {
    const groups =
      normalizeDirectVariantGroups(
        source
      );

    if (
      groups.length > 0
    ) {
      return groups;
    }
  }

  const legacyVariants =
    normalizeLegacyVariants(
      product
    );

  if (
    legacyVariants.length > 0
  ) {
    const extracted =
      extractVariantGroupsFromLegacy(
        legacyVariants
      );

    if (
      extracted.length > 0
    ) {
      return extracted;
    }
  }

  const possibleObjectSources = [
    product.variantGroups,
    product.variantSettings?.groups,
    product.optionGroups,
    product.optionsGroups,
  ];

  for (
    const source of possibleObjectSources
  ) {
    if (
      source &&
      typeof source ===
        "object" &&
      !Array.isArray(source)
    ) {
      const groups =
        normalizeDirectVariantGroups(
          Object.entries(
            source
          ).map(
            ([key, value]) => {
              if (
                value &&
                typeof value ===
                  "object" &&
                !Array.isArray(
                  value
                )
              ) {
                return {
                  ...value,
                  id:
                    value.id ||
                    key,
                  name:
                    value.name ||
                    value.title ||
                    value.label ||
                    key,
                };
              }

              return {
                id: key,
                name: key,
                options: value,
              };
            }
          )
        );

      if (
        groups.length > 0
      ) {
        return groups;
      }
    }
  }

  return [];
};


/* =========================================================
   VARIANT MATCHING
   ========================================================= */

const variantMatchesSelection = (
  variant,
  groups,
  selectedOptions
) => {
  if (
    !variant ||
    !Array.isArray(groups) ||
    !groups.length
  ) {
    return false;
  }

  const selectedKeys =
    Object.keys(
      selectedOptions || {}
    );

  if (
    !selectedKeys.length
  ) {
    return false;
  }

  for (
    const group of groups
  ) {
    const selected =
      selectedOptions?.[
        group.id
      ];

    if (!selected) {
      return false;
    }

    const variantValue =
      findVariantAttributeValue(
        variant,
        group
      );

    if (!variantValue) {
      return false;
    }

    const selectedValue =
      getOptionValue(
        selected
      );

    if (
      normalizeText(
        variantValue
      ) !==
      normalizeText(
        selectedValue
      )
    ) {
      return false;
    }
  }

  return true;
};


/* =========================================================
   SHARE ICONS
   ========================================================= */

const ShareIcon = ({
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8.6 13.5L15.4 17.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M15.4 6.5L8.6 10.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);


const FacebookIcon = ({
  size = 25,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.8v8h3.4Z" />
  </svg>
);


const MessengerIcon = ({
  size = 25,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 2.4C6.48 2.4 2.4 6.35 2.4 11.56C2.4 14.44 3.83 17 6.04 18.63V22L9.08 20.32C10 20.57 10.96 20.72 12 20.72C17.52 20.72 21.6 16.77 21.6 11.56C21.6 6.35 17.52 2.4 12 2.4Z"
      fill="currentColor"
    />
    <path
      d="M6.35 15.18L9.72 11.6L11.64 13.1L15.25 9.3L17.65 9.3L14.28 12.88L12.36 11.38L8.75 15.18H6.35Z"
      fill="white"
    />
  </svg>
);


const WhatsAppIcon = ({
  size = 25,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 2.3C6.64 2.3 2.3 6.64 2.3 12C2.3 13.72 2.75 15.34 3.55 16.77L2.35 21.65L7.35 20.48C8.75 21.25 10.34 21.7 12 21.7C17.36 21.7 21.7 17.36 21.7 12C21.7 6.64 17.36 2.3 12 2.3Z"
      fill="currentColor"
    />
    <path
      d="M16.32 13.91C16.08 13.79 14.9 13.21 14.68 13.13C14.45 13.04 14.29 13 14.12 13.24C13.96 13.48 13.48 14.02 13.34 14.18C13.2 14.35 13.06 14.37 12.82 14.25C12.58 14.13 11.81 13.88 10.9 13.07C10.19 12.44 9.71 11.66 9.57 11.42C9.44 11.18 9.56 11.05 9.68 10.93C9.79 10.82 9.92 10.64 10.04 10.5C10.16 10.36 10.2 10.25 10.28 10.08C10.36 9.91 10.32 9.77 10.26 9.65C10.2 9.53 9.72 8.34 9.52 7.86C9.33 7.4 9.14 7.46 8.99 7.45C8.85 7.44 8.69 7.44 8.52 7.44C8.35 7.44 8.08 7.5 7.85 7.74C7.62 7.98 6.97 8.59 6.97 9.79C6.97 10.99 7.87 12.15 8 12.31C8.12 12.48 9.77 15.02 12.3 16.11C12.9 16.37 13.37 16.52 13.73 16.63C14.34 16.82 14.9 16.79 15.34 16.73C15.83 16.66 16.84 16.12 17.05 15.53C17.26 14.94 17.26 14.44 17.2 14.34C17.14 14.24 16.97 14.18 16.73 14.06C16.61 14 16.47 13.96 16.32 13.91Z"
      fill="white"
    />
  </svg>
);


const TelegramIcon = ({
  size = 25,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M21.54 4.16L18.47 19.63C18.24 20.72 17.61 20.99 16.72 20.48L11.87 16.91L9.53 19.16C9.27 19.42 9.05 19.64 8.55 19.64L8.9 14.68L17.91 6.54C18.3 6.19 17.82 5.99 17.3 6.34L6.16 13.36L1.36 11.85C0.32 11.52 0.3 10.8 1.58 10.32L20.36 3.06C21.23 2.74 21.99 3.25 21.54 4.16Z"
      fill="currentColor"
    />
  </svg>
);


const InstagramIcon = ({
  size = 25,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      stroke="currentColor"
      strokeWidth="1.9"
    />
    <circle
      cx="12"
      cy="12"
      r="4"
      stroke="currentColor"
      strokeWidth="1.9"
    />
    <circle
      cx="17.4"
      cy="6.7"
      r="1.1"
      fill="currentColor"
    />
  </svg>
);


const LinkIcon = ({
  size = 23,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10.6 13.4C9.82 12.62 9.82 11.38 10.6 10.6L13.4 7.8C14.96 6.24 17.49 6.24 19.05 7.8C20.61 9.36 20.61 11.89 19.05 13.45L17.3 15.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M13.4 10.6C14.18 11.38 14.18 12.62 13.4 13.4L10.6 16.2C9.04 17.76 6.51 17.76 4.95 16.2C3.39 14.64 3.39 12.11 4.95 10.55L6.7 8.8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function ProductDetails({
  product,
}) {
  const navigate =
    useNavigate();

  const cartContext =
    useContext(
      CartContext
    );

  const addToCart =
    cartContext?.addToCart;


  /* =======================================================
     STATE
     ======================================================= */

  const [
    currentProduct,
    setCurrentProduct,
  ] = useState(
    product || null
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState({});

  const [
    selectedVariant,
    setSelectedVariant,
  ] = useState(null);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState("");

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false);

  const [
    lightboxIndex,
    setLightboxIndex,
  ] = useState(0);

  const [zoom, setZoom] =
    useState(1);

  const [reviews, setReviews] =
    useState([]);

  const [
    averageRating,
    setAverageRating,
  ] = useState(0);

  const [
    reviewCount,
    setReviewCount,
  ] = useState(0);

  const [
    userRating,
    setUserRating,
  ] = useState(0);

  const [comment, setComment] =
    useState("");

  const [
    reviewLoading,
    setReviewLoading,
  ] = useState(false);

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState("");

  const [copied, setCopied] =
    useState(false);

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  const [
    relatedProducts,
    setRelatedProducts,
  ] = useState([]);

  const [
    recentProducts,
    setRecentProducts,
  ] = useState([]);

  const [
    showAllReviews,
    setShowAllReviews,
  ] = useState(false);

  const [
    addingToCart,
    setAddingToCart,
  ] = useState(false);

  const [
    cartMessage,
    setCartMessage,
  ] = useState("");

  const [
    imageTouchStart,
    setImageTouchStart,
  ] = useState(null);

  const [
    imageTouchDelta,
    setImageTouchDelta,
  ] = useState(0);

  const [
    subcategory,
    setSubcategory,
  ] = useState(null);

  const [
    openVariantGroupId,
    setOpenVariantGroupId,
  ] = useState(null);

  const reviewRef =
    useRef(null);

  const mainImageRef =
    useRef(null);


  /* =======================================================
     LOAD FULL PRODUCT
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadFullProduct =
      async () => {
        if (!product) {
          if (mounted) {
            setCurrentProduct(
              null
            );
          }

          return;
        }

        setLoading(true);
        setError("");

        try {
          if (!product.id) {
            if (mounted) {
              setCurrentProduct(
                product
              );
            }

            return;
          }

          const productRef =
            doc(
              db,
              "products",
              product.id
            );

          const snapshot =
            await getDoc(
              productRef
            );

          if (
            mounted &&
            snapshot.exists()
          ) {
            setCurrentProduct({
              ...product,
              ...snapshot.data(),
              id: snapshot.id,
            });
          } else if (mounted) {
            setCurrentProduct(
              product
            );
          }
        } catch (err) {
          console.error(
            "ProductDetails load error:",
            err
          );

          if (mounted) {
            setCurrentProduct(
              product
            );

            setError(
              "تعذر تحميل بعض بيانات المنتج، لكن يمكنك متابعة التصفح."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadFullProduct();

    return () => {
      mounted = false;
    };
  }, [product]);


  /* =======================================================
     LOAD PRODUCT SUBCATEGORY
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSubcategory =
      async () => {
        if (!currentProduct) {
          if (mounted) {
            setSubcategory(
              null
            );
          }

          return;
        }

        const subcategoryId =
          currentProduct.subcategoryId ||
          currentProduct.subCategoryId ||
          currentProduct.categoryId ||
          "";

        const directSubcategory =
          currentProduct.subcategory;

        if (
          directSubcategory &&
          typeof directSubcategory ===
            "object"
        ) {
          const directName =
            getObjectValue(
              directSubcategory,
              [
                "name",
                "title",
                "label",
                "categoryName",
                "displayName",
              ],
              ""
            );

          if (directName) {
            if (mounted) {
              setSubcategory(
                directSubcategory
              );
            }

            return;
          }
        }

        if (
          typeof directSubcategory ===
            "string" &&
          directSubcategory.trim()
        ) {
          if (mounted) {
            setSubcategory({
              name:
                directSubcategory.trim(),
            });
          }

          return;
        }

        if (!subcategoryId) {
          if (mounted) {
            setSubcategory(
              null
            );
          }

          return;
        }

        try {
          const categoryRef =
            doc(
              db,
              "categories",
              String(
                subcategoryId
              )
            );

          const snapshot =
            await getDoc(
              categoryRef
            );

          if (
            mounted &&
            snapshot.exists()
          ) {
            setSubcategory({
              id: snapshot.id,
              ...snapshot.data(),
            });
          } else if (mounted) {
            setSubcategory(
              null
            );
          }
        } catch (err) {
          console.error(
            "Product subcategory load error:",
            err
          );

          if (mounted) {
            setSubcategory(
              null
            );
          }
        }
      };

    loadSubcategory();

    return () => {
      mounted = false;
    };
  }, [
    currentProduct?.id,
    currentProduct?.categoryId,
    currentProduct?.subcategoryId,
    currentProduct?.subCategoryId,
    currentProduct?.subcategory,
  ]);


  /* =======================================================
     NORMALIZED DATA
     ======================================================= */

  const variantGroups =
    useMemo(
      () =>
        normalizeVariantGroups(
          currentProduct
        ),
      [currentProduct]
    );

  const legacyVariants =
    useMemo(
      () =>
        normalizeLegacyVariants(
          currentProduct
        ),
      [currentProduct]
    );


  /* =======================================================
     PRODUCT IMAGES
     ======================================================= */

  const productImages =
    useMemo(
      () =>
        collectImages(
          currentProduct
        ),
      [currentProduct]
    );


  /* =======================================================
     VARIANT IMAGES
     ======================================================= */

  const selectedVariantImages =
    useMemo(() => {
      if (!selectedVariant) {
        return [];
      }

      return getVariantImages(
        selectedVariant
      );
    }, [
      selectedVariant,
    ]);


  const selectedOptionImages =
    useMemo(() => {
      const images = [];

      variantGroups.forEach(
        (group) => {
          const selected =
            selectedOptions[
              group.id
            ];

          if (!selected) {
            return;
          }

          const option =
            group.options.find(
              (item) =>
                getOptionId(
                  item
                ) ===
                getOptionId(
                  selected
                )
            );

          if (!option) {
            return;
          }

          images.push(
            ...getVariantImages(
              option
            )
          );
        }
      );

      return [
        ...new Set(images),
      ];
    }, [
      variantGroups,
      selectedOptions,
    ]);


  const allGalleryImages =
    useMemo(() => {
      return [
        ...new Set([
          ...selectedVariantImages,
          ...selectedOptionImages,
          ...productImages,
        ]),
      ];
    }, [
      productImages,
      selectedVariantImages,
      selectedOptionImages,
    ]);


  /* =======================================================
     RESET SELECTION WHEN PRODUCT CHANGES
     ======================================================= */

  useEffect(() => {
    setQuantity(1);
    setSelectedOptions({});
    setSelectedVariant(null);
    setZoom(1);
    setOpenVariantGroupId(null);
    setShareOpen(false);

    if (productImages.length) {
      setSelectedImage(
        productImages[0]
      );
    } else {
      setSelectedImage("");
    }

    setLightboxIndex(0);
  }, [
    currentProduct?.id,
    productImages.length,
  ]);


  /* =======================================================
     KEEP SELECTED IMAGE VALID
     ======================================================= */

  useEffect(() => {
    if (!allGalleryImages.length) {
      setSelectedImage("");
      return;
    }

    if (
      !allGalleryImages.includes(
        selectedImage
      )
    ) {
      setSelectedImage(
        allGalleryImages[0]
      );
    }
  }, [
    allGalleryImages,
    selectedImage,
  ]);


  /* =======================================================
     FIND MATCHING VARIANT
     ======================================================= */

  const matchingVariant =
    useMemo(() => {
      if (
        !legacyVariants.length ||
        !variantGroups.length
      ) {
        return null;
      }

      const allSelected =
        variantGroups.every(
          (group) =>
            selectedOptions[
              group.id
            ]
        );

      if (!allSelected) {
        return null;
      }

      return (
        legacyVariants.find(
          (variant) =>
            variantMatchesSelection(
              variant,
              variantGroups,
              selectedOptions
            )
        ) || null
      );
    }, [
      legacyVariants,
      variantGroups,
      selectedOptions,
    ]);


  useEffect(() => {
    if (matchingVariant) {
      setSelectedVariant(
        matchingVariant
      );
    } else {
      setSelectedVariant(
        null
      );
    }
  }, [
    matchingVariant,
  ]);


  /* =======================================================
     SELECTED OPTIONS
     ======================================================= */

  const selectedOptionObjects =
    useMemo(() => {
      const result = [];

      variantGroups.forEach(
        (group) => {
          const selected =
            selectedOptions[
              group.id
            ];

          if (!selected) {
            return;
          }

          const option =
            group.options.find(
              (item) =>
                getOptionId(
                  item
                ) ===
                getOptionId(
                  selected
                )
            );

          if (option) {
            result.push({
              group,
              option,
            });
          }
        }
      );

      return result;
    }, [
      variantGroups,
      selectedOptions,
    ]);


  /* =======================================================
     PRODUCT PRICES
     ======================================================= */

  const basePrice =
    useMemo(
      () =>
        toNumber(
          getObjectValue(
            currentProduct,
            [
              "price",
              "salePrice",
              "sellingPrice",
              "currentPrice",
            ],
            0
          )
        ),
      [currentProduct]
    );


  const baseOldPrice =
    useMemo(
      () =>
        toNumber(
          getObjectValue(
            currentProduct,
            [
              "oldPrice",
              "comparePrice",
              "originalPrice",
              "beforePrice",
            ],
            0
          )
        ),
      [currentProduct]
    );


  const variantPrice =
    selectedVariant
      ? toNumber(
          selectedVariant.price,
          0
        )
      : 0;


  const variantOldPrice =
    selectedVariant
      ? toNumber(
          selectedVariant.oldPrice,
          0
        )
      : 0;


  const optionPrices =
    selectedOptionObjects
      .map(
        ({ option }) =>
          toNumber(
            option.price,
            0
          )
      )
      .filter(
        (price) =>
          price > 0
      );


  const currentPrice =
    variantPrice > 0
      ? variantPrice
      : optionPrices.length > 0
      ? Math.max(
          ...optionPrices
        )
      : basePrice;


  const optionOldPrices =
    selectedOptionObjects
      .map(
        ({ option }) =>
          toNumber(
            option.oldPrice,
            0
          )
      )
      .filter(
        (price) =>
          price > 0
      );


  const currentOldPrice =
    variantOldPrice > 0
      ? variantOldPrice
      : optionOldPrices.length > 0
      ? Math.max(
          ...optionOldPrices
        )
      : baseOldPrice;


  const productDiscount =
    currentOldPrice >
      currentPrice &&
    currentPrice > 0
      ? Math.round(
          (
            (
              currentOldPrice -
              currentPrice
            ) /
            currentOldPrice
          ) *
            100
        )
      : toNumber(
          currentProduct?.discount,
          0
        );


  /* =======================================================
     STOCK / SKU
     ======================================================= */

  const baseStockRaw =
    getObjectValue(
      currentProduct,
      [
        "stock",
        "quantity",
        "inventory",
        "availableStock",
      ],
      null
    );


  const baseStock =
    baseStockRaw === null ||
    baseStockRaw === ""
      ? null
      : toNumber(
          baseStockRaw,
          0
        );


  const selectedOptionStocks =
    selectedOptionObjects
      .map(
        ({ option }) =>
          option.stock === null ||
          option.stock ===
            undefined
            ? null
            : toNumber(
                option.stock,
                0
              )
      )
      .filter(
        (value) =>
          value !== null
      );


  const currentStock =
    selectedVariant &&
    selectedVariant.stock !==
      undefined &&
    selectedVariant.stock !==
      null &&
    selectedVariant.stock !==
      ""
      ? toNumber(
          selectedVariant.stock,
          0
        )
      : selectedOptionStocks.length
      ? Math.min(
          ...selectedOptionStocks
        )
      : baseStock;


  const selectedOptionSKU =
    selectedOptionObjects
      .map(
        ({ option }) =>
          getObjectValue(
            option,
            [
              "sku",
              "SKU",
              "code",
              "productCode",
            ],
            ""
          )
      )
      .find(Boolean) || "";


  const currentSKU =
    getObjectValue(
      selectedVariant,
      [
        "sku",
        "SKU",
        "code",
        "productCode",
      ],
      ""
    ) ||
    selectedOptionSKU ||
    getObjectValue(
      currentProduct,
      [
        "sku",
        "SKU",
        "code",
        "productCode",
        "articleNo",
        "model",
      ],
      ""
    );


  /* =======================================================
     CATEGORY / SUBCATEGORY / SELLER
     ======================================================= */

  const subcategoryName =
    getObjectValue(
      subcategory,
      [
        "name",
        "title",
        "label",
        "categoryName",
        "displayName",
      ],
      ""
    );


  const explicitSellerName =
    getObjectValue(
      currentProduct,
      [
        "sellerName",
        "vendorName",
      ],
      ""
    );


  const sellerName =
    explicitSellerName ||
    subcategoryName ||
    getObjectValue(
      currentProduct,
      [
        "seller",
        "storeName",
      ],
      ""
    ) ||
    "متجر سوا";


  const sellerRating =
    toNumber(
      getObjectValue(
        currentProduct,
        [
          "sellerRating",
          "sellerReview",
          "sellerScore",
        ],
        0
      ),
      0
    );


  const productTitle =
    getObjectValue(
      currentProduct,
      [
        "title",
        "name",
        "productName",
      ],
      "منتج"
    );


  const categoryName =
    subcategoryName ||
    (
      typeof currentProduct?.category ===
      "string"
        ? currentProduct.category
        : getObjectValue(
            currentProduct?.category,
            [
              "name",
              "title",
            ],
            ""
          )
    );


  const brand =
    getObjectValue(
      currentProduct,
      [
        "brand",
        "brandName",
        "manufacturer",
      ],
      ""
    );


  const description =
    getObjectValue(
      currentProduct,
      [
        "description",
        "longDescription",
        "details",
        "productDescription",
      ],
      ""
    );


  /* =======================================================
     SPECS
     ======================================================= */

  const mainSpecs =
    useMemo(() => {
      const source =
        currentProduct?.mainSpecs ||
        currentProduct?.specifications ||
        currentProduct?.specs ||
        {};

      const rows = [];

      if (
        Array.isArray(source)
      ) {
        source.forEach(
          (item) => {
            if (!item) {
              return;
            }

            const label =
              item.label ||
              item.name ||
              item.key ||
              item.title;

            const value =
              item.value ||
              item.content ||
              item.text;

            if (
              normalizeText(
                label
              ) ===
                normalizeText(
                  "الفئة"
                ) ||
              normalizeText(
                label
              ) ===
                normalizeText(
                  "category"
                ) ||
              normalizeText(
                label
              ) ===
                normalizeText(
                  "categoryname"
                )
            ) {
              return;
            }

            if (
              label &&
              value !== undefined &&
              value !== ""
            ) {
              rows.push({
                label,
                value,
              });
            }
          }
        );
      } else if (
        source &&
        typeof source ===
          "object"
      ) {
        Object.entries(
          source
        ).forEach(
          ([key, value]) => {
            if (
              normalizeText(
                key
              ) ===
                normalizeText(
                  "الفئة"
                ) ||
              normalizeText(
                key
              ) ===
                normalizeText(
                  "category"
                ) ||
              normalizeText(
                key
              ) ===
                normalizeText(
                  "categoryName"
                )
            ) {
              return;
            }

            if (
              value !== undefined &&
              value !== null &&
              value !== ""
            ) {
              rows.push({
                label: key,
                value:
                  String(value),
              });
            }
          }
        );
      }

      const fallbackSpecs =
        [
          [
            "العلامة التجارية",
            brand,
          ],
          [
            "SKU",
            currentSKU,
          ],
          [
            "الموديل",
            currentProduct?.model,
          ],
          [
            "اللون",
            currentProduct?.color,
          ],
          [
            "الخامة",
            currentProduct?.material ||
              currentProduct
                ?.mainMaterial,
          ],
          [
            "النوع",
            currentProduct?.type,
          ],
          [
            "الجنس",
            currentProduct?.gender,
          ],
        ];

      fallbackSpecs.forEach(
        ([label, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            const exists =
              rows.some(
                (row) =>
                  normalizeText(
                    row.label
                  ) ===
                  normalizeText(
                    label
                  )
              );

            if (!exists) {
              rows.push({
                label,
                value:
                  String(value),
              });
            }
          }
        }
      );

      return rows;
    }, [
      currentProduct,
      brand,
      currentSKU,
    ]);


  /* =======================================================
     REVIEWS
     ======================================================= */

  const loadReviews =
    useCallback(
      async () => {
        if (
          !currentProduct?.id
        ) {
          return;
        }

        try {
          const result =
            await getReviews(
              currentProduct.id
            );

          const list =
            Array.isArray(
              result
            )
              ? result
              : [];

          setReviews(list);

          const ratingResult =
            await getRating(
              currentProduct.id
            );

          if (
            typeof ratingResult ===
            "number"
          ) {
            setAverageRating(
              ratingResult
            );
          } else if (
            ratingResult &&
            typeof ratingResult ===
              "object"
          ) {
            setAverageRating(
              toNumber(
                ratingResult.average ||
                  ratingResult.rating ||
                  ratingResult.avg,
                0
              )
            );
          } else {
            const ratings =
              list
                .map(
                  (review) =>
                    toNumber(
                      review.rating,
                      0
                    )
                )
                .filter(
                  (rating) =>
                    rating > 0
                );

            const average =
              ratings.length
                ? ratings.reduce(
                    (
                      sum,
                      value
                    ) =>
                      sum + value,
                    0
                  ) /
                  ratings.length
                : 0;

            setAverageRating(
              average
            );
          }

          setReviewCount(
            list.length
          );
        } catch (err) {
          console.error(
            "Reviews error:",
            err
          );

          setReviews([]);
          setReviewCount(0);
          setAverageRating(0);
        }
      },
      [
        currentProduct?.id,
      ]
    );


  useEffect(() => {
    loadReviews();
  }, [
    loadReviews,
  ]);


  /* =======================================================
     RELATED PRODUCTS
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadRelatedProducts =
      async () => {
        if (
          !currentProduct?.id
        ) {
          return;
        }

        try {
          const productsRef =
            collection(
              db,
              "products"
            );

          let snapshot;

          if (
            currentProduct.categoryId
          ) {
            const q =
              query(
                productsRef,
                where(
                  "categoryId",
                  "==",
                  currentProduct.categoryId
                ),
                limit(12)
              );

            snapshot =
              await getDocs(q);
          } else {
            const q =
              query(
                productsRef,
                limit(12)
              );

            snapshot =
              await getDocs(q);
          }

          const products =
            snapshot.docs
              .map(
                (item) => ({
                  id: item.id,
                  ...item.data(),
                })
              )
              .filter(
                (item) =>
                  item.id !==
                  currentProduct.id
              )
              .slice(0, 8);

          if (mounted) {
            setRelatedProducts(
              products
            );
          }
        } catch (err) {
          console.error(
            "Related products error:",
            err
          );

          if (mounted) {
            setRelatedProducts(
              []
            );
          }
        }
      };

    loadRelatedProducts();

    return () => {
      mounted = false;
    };
  }, [
    currentProduct?.id,
    currentProduct?.categoryId,
  ]);


  /* =======================================================
     RECENTLY VIEWED
     ======================================================= */

  useEffect(() => {
    if (
      !currentProduct?.id
    ) {
      return;
    }

    try {
      const key =
        "sawa_recently_viewed_products";

      const stored =
        JSON.parse(
          localStorage.getItem(
            key
          ) || "[]"
        );

      const compactProduct = {
        id:
          currentProduct.id,

        title:
          productTitle,

        name:
          productTitle,

        image:
          allGalleryImages[0] ||
          "",

        price:
          currentPrice,

        oldPrice:
          currentOldPrice,
      };

      const filtered =
        Array.isArray(
          stored
        )
          ? stored.filter(
              (item) =>
                item &&
                item.id !==
                  currentProduct.id
            )
          : [];

      const updated = [
        compactProduct,
        ...filtered,
      ].slice(0, 12);

      localStorage.setItem(
        key,
        JSON.stringify(updated)
      );

      setRecentProducts(
        updated
          .filter(
            (item) =>
              item.id !==
              currentProduct.id
          )
          .slice(0, 6)
      );
    } catch (err) {
      console.error(
        "Recently viewed error:",
        err
      );
    }
  }, [
    currentProduct?.id,
    productTitle,
    currentPrice,
    currentOldPrice,
    allGalleryImages,
  ]);


  /* =======================================================
     VARIANT SELECTION
     ======================================================= */

  const handleOptionSelect = (
    group,
    option
  ) => {
    if (
      !group ||
      !option
    ) {
      return;
    }

    setSelectedOptions(
      (previous) => {
        const next = {
          ...previous,
        };

        const current =
          previous[
            group.id
          ];

        if (
          current &&
          getOptionId(
            current
          ) ===
            getOptionId(
              option
            )
        ) {
          delete next[
            group.id
          ];
        } else {
          next[group.id] =
            option;
        }

        return next;
      }
    );

    setQuantity(1);
    setCartMessage("");

    const images =
      getVariantImages(
        option
      );

    if (images.length) {
      setSelectedImage(
        images[0]
      );
    }
  };


  /* =======================================================
     QUANTITY
     ======================================================= */

  const increaseQuantity =
    () => {
      if (
        currentStock !== null &&
        currentStock !== undefined &&
        quantity >= currentStock
      ) {
        return;
      }

      setQuantity(
        (value) =>
          value + 1
      );
    };


  const decreaseQuantity =
    () => {
      setQuantity(
        (value) =>
          Math.max(
            1,
            value - 1
          )
      );
    };


  /* =======================================================
     GALLERY
     ======================================================= */

  const openLightbox = (
    index = 0
  ) => {
    if (
      !allGalleryImages.length
    ) {
      return;
    }

    setLightboxIndex(
      index
    );

    setSelectedImage(
      allGalleryImages[
        index
      ]
    );

    setZoom(1);
    setLightboxOpen(true);
  };


  const closeLightbox =
    () => {
      setLightboxOpen(
        false
      );

      setZoom(1);
    };


  const nextImage = () => {
    if (
      !allGalleryImages.length
    ) {
      return;
    }

    setLightboxIndex(
      (index) =>
        (index + 1) %
        allGalleryImages.length
    );

    setZoom(1);
  };


  const previousImage =
    () => {
      if (
        !allGalleryImages.length
      ) {
        return;
      }

      setLightboxIndex(
        (index) =>
          (
            index -
            1 +
            allGalleryImages.length
          ) %
          allGalleryImages.length
      );

      setZoom(1);
    };


  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const handleKeyDown =
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeLightbox();
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          previousImage();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          nextImage();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    lightboxOpen,
    allGalleryImages.length,
  ]);


  const handleImageTouchStart =
    (event) => {
      const touch =
        event.touches?.[0];

      if (!touch) {
        return;
      }

      setImageTouchStart(
        touch.clientX
      );

      setImageTouchDelta(0);
    };


  const handleImageTouchMove =
    (event) => {
      if (
        imageTouchStart ===
        null
      ) {
        return;
      }

      const touch =
        event.touches?.[0];

      if (!touch) {
        return;
      }

      setImageTouchDelta(
        touch.clientX -
          imageTouchStart
      );
    };


  const handleImageTouchEnd =
    () => {
      if (
        imageTouchStart ===
        null
      ) {
        return;
      }

      if (
        Math.abs(
          imageTouchDelta
        ) > 50 &&
        allGalleryImages.length >
          1
      ) {
        const currentIndex =
          Math.max(
            0,
            allGalleryImages.indexOf(
              selectedImage
            )
          );

        if (
          imageTouchDelta >
          0
        ) {
          const nextIndex =
            (
              currentIndex -
              1 +
              allGalleryImages.length
            ) %
            allGalleryImages.length;

          setSelectedImage(
            allGalleryImages[
              nextIndex
            ]
          );

          setLightboxIndex(
            nextIndex
          );
        } else {
          const nextIndex =
            (
              currentIndex +
              1
            ) %
            allGalleryImages.length;

          setSelectedImage(
            allGalleryImages[
              nextIndex
            ]
          );

          setLightboxIndex(
            nextIndex
          );
        }
      }

      setImageTouchStart(
        null
      );

      setImageTouchDelta(0);
    };


  /* =======================================================
     SHARE
     ======================================================= */

  const getProductShareUrl =
    () => {
      try {
        return window.location.href;
      } catch {
        return "";
      }
    };


  const copyProductLink =
    async () => {
      const productUrl =
        getProductShareUrl();

      if (!productUrl) {
        return false;
      }

      try {
        if (
          navigator.clipboard &&
          typeof navigator.clipboard
            .writeText ===
            "function"
        ) {
          await navigator.clipboard.writeText(
            productUrl
          );
        } else {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            productUrl;

          textarea.style.position =
            "fixed";

          textarea.style.opacity =
            "0";

          textarea.style.pointerEvents =
            "none";

          document.body.appendChild(
            textarea
          );

          textarea.focus();
          textarea.select();

          document.execCommand(
            "copy"
          );

          document.body.removeChild(
            textarea
          );
        }

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(false);
          },
          2200
        );

        return true;
      } catch (err) {
        console.error(
          "Copy product link error:",
          err
        );

        return false;
      }
    };


  const openShareMenu =
    () => {
      setShareOpen(true);
    };


  const closeShareMenu =
    () => {
      setShareOpen(false);
    };


  const handleNativeShare =
    async () => {
      const productUrl =
        getProductShareUrl();

      const shareData = {
        title:
          productTitle,

        text:
          productTitle,

        url:
          productUrl,
      };

      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            shareData
          );

          setShareOpen(false);

          return;
        }

        await copyProductLink();
      } catch (err) {
        if (
          err?.name !==
          "AbortError"
        ) {
          console.error(
            "Native share error:",
            err
          );
        }
      }
    };


  const handleSocialShare =
    async (
      platform
    ) => {
      const productUrl =
        getProductShareUrl();

      if (!productUrl) {
        return;
      }

      const encodedUrl =
        encodeURIComponent(
          productUrl
        );

      const encodedTitle =
        encodeURIComponent(
          productTitle
        );

      const shareText =
        `${productTitle}\n${productUrl}`;

      const encodedShareText =
        encodeURIComponent(
          shareText
        );

      let shareUrl = "";

      if (
        platform ===
        "whatsapp"
      ) {
        shareUrl =
          `https://wa.me/?text=${encodedShareText}`;
      }

      if (
        platform ===
        "telegram"
      ) {
        shareUrl =
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
      }

      if (
        platform ===
        "facebook"
      ) {
        shareUrl =
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      }

      /*
        Messenger و Instagram
        لا يوجد لهما endpoint عام مضمون
        لمشاركة رابط خارجي بنفس طريقة WhatsApp
        وTelegram، لذلك ننسخ الرابط أولًا
        ثم نفتح المنصة.
      */
      if (
        platform ===
        "messenger"
      ) {
        await copyProductLink();

        window.open(
          "https://www.messenger.com/",
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      if (
        platform ===
        "instagram"
      ) {
        await copyProductLink();

        window.open(
          "https://www.instagram.com/",
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      if (shareUrl) {
        window.open(
          shareUrl,
          "_blank",
          "noopener,noreferrer"
        );

        setShareOpen(false);
      }
    };


  /* =======================================================
     ADD TO CART
     ======================================================= */

  const addProductToCart =
    async (
      goToCart = false
    ) => {
      if (
        !currentProduct ||
        !addToCart
      ) {
        return;
      }

      if (
        currentStock !== null &&
        currentStock <= 0
      ) {
        setCartMessage(
          "المنتج غير متوفر حاليًا."
        );

        return;
      }

      if (
        currentStock !== null &&
        quantity >
          currentStock
      ) {
        setCartMessage(
          `المتاح حاليًا ${currentStock} فقط.`
        );

        return;
      }

      const missingGroup =
        variantGroups.find(
          (group) =>
            !selectedOptions[
              group.id
            ]
        );

      if (missingGroup) {
        setOpenVariantGroupId(missingGroup.id);

        setCartMessage(
          `من فضلك اختار ${missingGroup.name}.`
        );

        return;
      }

      setAddingToCart(
        true
      );

      setCartMessage("");

      try {
        const selectionKey =
          variantGroups
            .map(
              (group) =>
                `${group.id}:${getOptionId(
                  selectedOptions[
                    group.id
                  ]
                )}`
            )
            .join("|");

        const cartId =
          selectionKey
            ? `${currentProduct.id}__${selectionKey}`
            : currentProduct.id;

        const cartItem = {
          ...currentProduct,

          id: cartId,

          productId:
            currentProduct.id,

          originalProductId:
            currentProduct.id,

          title:
            productTitle,

          name:
            productTitle,

          image:
            selectedImage ||
            allGalleryImages[0] ||
            currentProduct.image ||
            "",

          images:
            allGalleryImages,

          price:
            currentPrice,

          oldPrice:
            currentOldPrice,

          stock:
            currentStock,

          sku:
            currentSKU,

          quantity,

          sellerName,

          subcategoryId:
            currentProduct.subcategoryId ||
            currentProduct.subCategoryId ||
            currentProduct.categoryId ||
            "",

          selectedVariant:
            selectedVariant ||
            null,

          selectedOptions:
            Object.fromEntries(
              variantGroups.map(
                (group) => [
                  group.id,
                  selectedOptions[
                    group.id
                  ] || null,
                ]
              )
            ),
        };

        await Promise.resolve(
          addToCart(
            cartItem
          )
        );

        setCartMessage(
          "تمت إضافة المنتج إلى السلة بنجاح."
        );

        if (goToCart) {
          navigate(
            "/cart"
          );
        }
      } catch (err) {
        console.error(
          "Add to cart error:",
          err
        );

        setCartMessage(
          "حصل خطأ أثناء إضافة المنتج للسلة."
        );
      } finally {
        setAddingToCart(
          false
        );
      }
    };


  /* =======================================================
     REVIEWS
     ======================================================= */

  const submitReview =
    async (event) => {
      event.preventDefault();

      if (
        !currentProduct?.id
      ) {
        return;
      }

      if (!userRating) {
        setReviewMessage(
          "اختار تقييمك الأول."
        );

        return;
      }

      if (
        !comment.trim()
      ) {
        setReviewMessage(
          "اكتب تعليقك."
        );

        return;
      }

      setReviewLoading(
        true
      );

      setReviewMessage("");

      try {
        await addReview(
          currentProduct.id,
          {
            rating:
              userRating,

            comment:
              comment.trim(),

            verifiedPurchase:
              false,

            createdAt:
              new Date(),
          }
        );

        setComment("");
        setUserRating(0);

        setReviewMessage(
          "تم إرسال تقييمك بنجاح."
        );

        await loadReviews();
      } catch (err) {
        console.error(
          "Add review error:",
          err
        );

        setReviewMessage(
          "تعذر إرسال التقييم حاليًا."
        );
      } finally {
        setReviewLoading(
          false
        );
      }
    };


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const goBack =
    () => {
      if (
        window.history.length >
        1
      ) {
        navigate(-1);
      } else {
        navigate("/");
      }
    };


  const goToReviews =
    () => {
      reviewRef.current?.scrollIntoView(
        {
          behavior:
            "smooth",

          block:
            "start",
        }
      );
    };


  /* =======================================================
     RATING STARS
     ======================================================= */

  const renderStars =
    (
      rating = 0,
      size = "normal"
    ) => {
      const rounded =
        Math.round(
          toNumber(
            rating,
            0
          )
        );

      return (
        <span
          className={`pd-stars pd-stars-${size}`}
          aria-label={`${rating} من 5`}
        >
          {[1, 2, 3, 4, 5].map(
            (star) => (
              <span
                key={star}
                className={
                  star <=
                  rounded
                    ? "pd-star active"
                    : "pd-star"
                }
              >
                ★
              </span>
            )
          )}
        </span>
      );
    };


  /* =======================================================
     RELATED CARD
     ======================================================= */

  const renderProductCard =
    (item) => {
      if (!item) {
        return null;
      }

      const itemImages =
        collectImages(
          item
        );

      const image =
        itemImages[0] ||
        "";

      const itemPrice =
        toNumber(
          item.price ||
            item.salePrice,
          0
        );

      const itemOldPrice =
        toNumber(
          item.oldPrice,
          0
        );

      return (
        <button
          type="button"
          className="pd-related-card"
          key={item.id}
          onClick={() =>
            navigate(
              `/product/${item.id}`,
              {
                state: {
                  product:
                    item,
                },
              }
            )
          }
        >
          <div className="pd-related-image">
            {image ? (
              <img
                src={image}
                alt={
                  item.title ||
                  item.name ||
                  "منتج"
                }
                loading="lazy"
              />
            ) : (
              <div className="pd-no-image">
                لا توجد صورة
              </div>
            )}
          </div>

          <div className="pd-related-content">

            <h3>
              {item.title ||
                item.name ||
                "منتج"}
            </h3>

            <div className="pd-related-price">
              {formatPrice(
                itemPrice
              )}{" "}
              ج.م
            </div>

            {itemOldPrice >
              itemPrice && (
              <div className="pd-related-old">
                {formatPrice(
                  itemOldPrice
                )}{" "}
                ج.م
              </div>
            )}

          </div>
        </button>
      );
    };


  /* =======================================================
     EMPTY PRODUCT
     ======================================================= */

  if (
    !currentProduct &&
    !loading
  ) {
    return (
      <div
        className="pd-page"
        dir="rtl"
      >

        <Navbar />

        <div className="pd-empty">

          <div className="pd-empty-icon">
            🛍️
          </div>

          <h2>
            المنتج غير موجود
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="pd-primary-btn"
          >
            العودة للرئيسية
          </button>

        </div>

        <Footer />

      </div>
    );
  }


  /* =======================================================
     DISPLAY
     ======================================================= */

  const visibleReviews =
    showAllReviews
      ? reviews
      : reviews.slice(
          0,
          4
        );


  return (
    <div
      className="pd-page"
      dir="rtl"
    >

      <Navbar />


      <div className="pd-topbar">

        <div className="pd-topbar-inner">

          <button
            type="button"
            className="pd-top-action"
            onClick={
              goBack
            }
          >
            <span>
              ‹
            </span>

            رجوع
          </button>


          <div className="pd-breadcrumb">

            الرئيسية

            <span>
              ›
            </span>

            {categoryName ||
              "المنتجات"}

            <span>
              ›
            </span>

            <strong>
              {productTitle}
            </strong>

          </div>


          <div className="pd-top-actions">

            <button
              type="button"
              className="pd-icon-button pd-share-top-button"
              onClick={
                openShareMenu
              }
              aria-label="مشاركة المنتج"
              aria-haspopup="dialog"
              aria-expanded={
                shareOpen
              }
              title="مشاركة المنتج"
            >
              <ShareIcon
                size={21}
              />
              <span>مشاركة</span>
            </button>

            <button
              type="button"
              className="pd-icon-button"
              onClick={() =>
                navigate(
                  "/cart"
                )
              }
              aria-label="السلة"
            >
              🛒
            </button>

          </div>

        </div>

      </div>


      {error && (
        <div className="pd-warning">
          {error}
        </div>
      )}


      <main className="pd-container">

        <section className="pd-product-header">

          <div className="pd-product-header-main">

            <div className="pd-brand-row">

              {brand && (
                <span className="pd-brand">
                  {brand}
                </span>
              )}

              {productDiscount >
                0 && (
                <span className="pd-sale-badge">
                  خصم{" "}
                  {productDiscount}%
                </span>
              )}

            </div>


            <h1 className="pd-title">
              {productTitle}
            </h1>


            <div className="pd-meta-row">

              <button
                type="button"
                className="pd-rating-link"
                onClick={
                  goToReviews
                }
              >

                {renderStars(
                  averageRating
                )}

                <span>
                  {averageRating
                    ? averageRating.toFixed(
                        1
                      )
                    : "0.0"}
                </span>

                <span>
                  (
                  {reviewCount}{" "}
                  تقييم)
                </span>

              </button>


              {currentSKU && (
                <span className="pd-sku">
                  SKU:{" "}
                  {currentSKU}
                </span>
              )}

            </div>

          </div>


          <div className="pd-seller-box">

            <span className="pd-seller-label">
              البائع
            </span>

            <strong>
              {sellerName}
            </strong>

            {sellerRating >
              0 && (
              <span className="pd-seller-rating">
                {sellerRating}% تقييم البائع
              </span>
            )}

          </div>

        </section>


        <section className="pd-product-layout">

          <div className="pd-media-card">

            <div className="pd-media-layout">

              <div className="pd-thumbnails">

                {allGalleryImages
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (
                      image,
                      index
                    ) => (
                      <button
                        type="button"
                        key={`${image}-${index}`}
                        className={
                          selectedImage ===
                          image
                            ? "pd-thumb active"
                            : "pd-thumb"
                        }
                        onClick={() => {
                          setSelectedImage(
                            image
                          );

                          setLightboxIndex(
                            index
                          );

                          setZoom(1);
                        }}
                      >

                        <img
                          src={image}
                          alt={`${productTitle} ${index + 1}`}
                        />

                      </button>
                    )
                  )}

                {!allGalleryImages.length && (
                  <div className="pd-thumb-placeholder">
                    —
                  </div>
                )}

              </div>


              <div className="pd-main-media">

                {productDiscount >
                  0 && (
                  <span className="pd-image-sale">
                    -
                    {
                      productDiscount
                    }
                    %
                  </span>
                )}


                <button
                  type="button"
                  className="pd-image-share"
                  onClick={
                    openShareMenu
                  }
                  aria-label="مشاركة المنتج"
                  aria-haspopup="dialog"
                  aria-expanded={
                    shareOpen
                  }
                >
                  <ShareIcon
                    size={20}
                  />
                </button>


                {selectedImage ? (

                  <div
                    ref={
                      mainImageRef
                    }
                    className="pd-image-stage"
                    onTouchStart={
                      handleImageTouchStart
                    }
                    onTouchMove={
                      handleImageTouchMove
                    }
                    onTouchEnd={
                      handleImageTouchEnd
                    }
                    onWheel={(
                      event
                    ) => {
                      if (
                        event.deltaY <
                        0
                      ) {
                        setZoom(
                          (value) =>
                            Math.min(
                              2.5,
                              value +
                                0.15
                            )
                        );
                      } else {
                        setZoom(
                          (value) =>
                            Math.max(
                              1,
                              value -
                                0.15
                            )
                        );
                      }
                    }}
                  >

                    <button
                      type="button"
                      className="pd-main-image-button"
                      onClick={() =>
                        openLightbox(
                          Math.max(
                            0,
                            allGalleryImages.indexOf(
                              selectedImage
                            )
                          )
                        )
                      }
                    >

                      <img
                        src={
                          selectedImage
                        }
                        alt={
                          productTitle
                        }
                        className="pd-main-image"
                        style={{
                          transform: `scale(${zoom})`,
                        }}
                      />

                    </button>


                    <span className="pd-zoom-hint">
                      اضغط للتكبير
                    </span>

                  </div>

                ) : (

                  <div className="pd-no-main-image">

                    <span>
                      🖼️
                    </span>

                    <p>
                      لا توجد صورة للمنتج
                    </p>

                  </div>

                )}


                {allGalleryImages.length >
                  1 && (

                  <div className="pd-media-count">

                    {Math.max(
                      1,
                      allGalleryImages.indexOf(
                        selectedImage
                      ) + 1
                    )}

                    {" / "}

                    {
                      allGalleryImages.length
                    }

                  </div>

                )}

              </div>

            </div>

          </div>


          <div className="pd-buy-card">

            <div className="pd-price-block">

              {currentOldPrice >
                currentPrice && (

                <div className="pd-old-price">

                  {formatPrice(
                    currentOldPrice
                  )}{" "}
                  ج.م

                </div>

              )}


              <div className="pd-price">

                {formatPrice(
                  currentPrice
                )}{" "}

                <small>
                  ج.م
                </small>

              </div>


              {productDiscount >
                0 && (

                <span className="pd-discount">

                  وفر{" "}

                  {formatPrice(
                    Math.max(
                      0,
                      currentOldPrice -
                        currentPrice
                    )
                  )}{" "}
                  ج.م

                </span>

              )}

            </div>


            {/* =========================================
                PRODUCT VARIANT GROUPS
                كل متغير = زر مستقل باسمه
                ========================================= */}

            {variantGroups.length >
              0 && (

              <div
                className="pd-product-options-box"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >

                <div
                  className="pd-product-variant-buttons"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
                    gap: "10px",
                  }}
                >

                  {variantGroups.map((group) => {
                    const selected =
                      selectedOptions[group.id];

                    const isOpen =
                      openVariantGroupId === group.id;

                    const selectedLabel =
                      selected
                        ? getOptionValue(selected)
                        : "";

                    return (
                      <button
                        type="button"
                        key={group.id}
                        className={[
                          "pd-product-options-button",
                          "pd-variant-group-trigger",
                          isOpen ? "active" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() =>
                          setOpenVariantGroupId(
                            (value) =>
                              value === group.id
                                ? null
                                : group.id
                          )
                        }
                        aria-expanded={isOpen}
                        aria-controls={`pd-variant-panel-${group.id}`}
                        style={{
                          width: "100%",
                          minHeight: "58px",
                          borderRadius: "17px",
                          border: isOpen
                            ? "1px solid rgba(212,175,55,0.70)"
                            : "1px solid rgba(7,26,54,0.10)",
                          background: isOpen
                            ? "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.98))"
                            : "rgba(255,255,255,0.96)",
                          color: "#071A36",
                          boxShadow: isOpen
                            ? "0 10px 26px rgba(7,26,54,0.10)"
                            : "0 5px 18px rgba(7,26,54,0.05)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          padding: "10px 13px",
                          textAlign: "right",
                          transition: "all .22s ease",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                            minWidth: 0,
                          }}
                        >
                          <span
                            className="pd-product-options-icon"
                            style={{
                              width: "32px",
                              height: "32px",
                              flex: "0 0 32px",
                              borderRadius: "11px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isOpen
                                ? "#071A36"
                                : "#f4f6fa",
                              color: isOpen
                                ? "#D4AF37"
                                : "#071A36",
                              fontSize: "15px",
                            }}
                          >
                            ⚙️
                          </span>

                          <span
                            className="pd-product-options-title"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              minWidth: 0,
                              lineHeight: 1.25,
                            }}
                          >
                            <strong
                              style={{
                                fontSize: "14px",
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                              }}
                            >
                              {group.name}
                            </strong>

                            <small
                              style={{
                                marginTop: "3px",
                                color: selectedLabel
                                  ? "#8a6a12"
                                  : "#7b8494",
                                fontSize: "11px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                              }}
                            >
                              {selectedLabel ||
                                `اختار ${group.name}`}
                            </small>
                          </span>
                        </span>

                        <span
                          className="pd-product-options-arrow"
                          aria-hidden="true"
                          style={{
                            flex: "0 0 auto",
                            fontSize: "18px",
                            fontWeight: 900,
                            color: isOpen
                              ? "#D4AF37"
                              : "#071A36",
                            transform: isOpen
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "transform .22s ease",
                          }}
                        >
                          ⌄
                        </span>
                      </button>
                    );
                  })}

                </div>

                {variantGroups.map((group) => {
                  if (openVariantGroupId !== group.id) {
                    return null;
                  }

                  const selected =
                    selectedOptions[group.id];

                  return (
                    <div
                      className="pd-variant-group"
                      key={group.id}
                      id={`pd-variant-panel-${group.id}`}
                      style={{
                        padding: "15px",
                        borderRadius: "19px",
                        border: "1px solid rgba(7,26,54,0.08)",
                        background: "linear-gradient(180deg, #ffffff, #f8fafc)",
                        boxShadow: "0 10px 28px rgba(7,26,54,0.06)",
                      }}
                    >

                      <div
                        className="pd-variant-heading"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <strong
                          style={{
                            color: "#071A36",
                            fontSize: "14px",
                            fontWeight: 900,
                          }}
                        >
                          {group.name}
                        </strong>

                        {selected && (
                          <span
                            style={{
                              padding: "5px 9px",
                              borderRadius: "999px",
                              background: "rgba(212,175,55,0.12)",
                              color: "#8a6a12",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            {getOptionValue(selected)}
                          </span>
                        )}
                      </div>

                      <div className="pd-options">
                        {group.options.map(
                          (option, optionIndex) => {
                            const isSelected =
                              selected &&
                              getOptionId(selected) ===
                                getOptionId(option);

                            const optionStock =
                              option.stock;

                            const unavailable =
                              optionStock !== null &&
                              optionStock !== undefined &&
                              optionStock <= 0;

                            const optionImages =
                              getVariantImages(option);

                            const optionPrice =
                              toNumber(option.price, 0);

                            const optionOldPrice =
                              toNumber(option.oldPrice, 0);

                            return (
                              <button
                                type="button"
                                key={`${getOptionId(option)}-${optionIndex}`}
                                disabled={unavailable}
                                className={[
                                  "pd-option",
                                  isSelected ? "selected" : "",
                                  unavailable ? "disabled" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                onClick={() =>
                                  handleOptionSelect(
                                    group,
                                    option
                                  )
                                }
                              >
                                {optionImages.length > 0 && (
                                  <img
                                    src={optionImages[0]}
                                    alt=""
                                  />
                                )}

                                <span className="pd-option-name">
                                  {option.label}
                                </span>

                                {optionPrice > 0 && (
                                  <span className="pd-option-price">
                                    {formatPrice(optionPrice)} ج.م
                                  </span>
                                )}

                                {optionOldPrice > optionPrice &&
                                  optionOldPrice > 0 && (
                                    <small className="pd-option-old-price">
                                      {formatPrice(optionOldPrice)} ج.م
                                    </small>
                                  )}

                                {optionStock !== null &&
                                  optionStock !== undefined && (
                                    <small className="pd-option-stock">
                                      {optionStock > 0
                                        ? `متوفر: ${optionStock}`
                                        : "غير متوفر"}
                                    </small>
                                  )}

                                {isSelected && (
                                  <b className="pd-option-check">
                                    ✓
                                  </b>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>

            )}

            <div className="pd-stock-row">

              {currentStock ===
                null ||
              currentStock ===
                undefined ? (

                <span className="pd-stock available">
                  ✓ متاح للطلب
                </span>

              ) : currentStock >
                0 ? (

                <span className="pd-stock available">

                  ✓ متوفر

                  {currentStock <=
                    10 && (
                    <>
                      {" "}
                      — متبقي{" "}
                      {
                        currentStock
                      }{" "}
                      فقط
                    </>
                  )}

                </span>

              ) : (

                <span className="pd-stock unavailable">
                  غير متوفر حاليًا
                </span>

              )}

            </div>


            {selectedOptionObjects.length >
              0 && (

              <div className="pd-selected-options-summary">

                {selectedOptionObjects.map(
                  ({
                    group,
                    option,
                  }) => (

                    <div
                      className="pd-selected-option-row"
                      key={
                        group.id
                      }
                    >

                      <span>
                        {group.name}
                      </span>

                      <strong>
                        {
                          option.label
                        }
                      </strong>

                    </div>

                  )
                )}

              </div>

            )}


            <div className="pd-quantity-section">

              <span>
                الكمية
              </span>

              <div className="pd-quantity">

                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  disabled={
                    quantity <= 1
                  }
                >
                  −
                </button>

                <strong>
                  {quantity}
                </strong>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  disabled={
                    currentStock !==
                      null &&
                    currentStock !==
                      undefined &&
                    quantity >=
                      currentStock
                  }
                >
                  +
                </button>

              </div>

            </div>


            {cartMessage && (

              <div
                className={
                  cartMessage.includes(
                    "بنجاح"
                  )
                    ? "pd-success-message"
                    : "pd-error-message"
                }
              >
                {cartMessage}
              </div>

            )}


            <div className="pd-buy-actions">

              <button
                type="button"
                className="pd-buy-now"
                disabled={
                  addingToCart ||
                  currentStock ===
                    0
                }
                onClick={() =>
                  addProductToCart(
                    true
                  )
                }
              >
                {addingToCart
                  ? "جاري الإضافة..."
                  : "اشترِ الآن"}
              </button>


              <button
                type="button"
                className="pd-add-cart"
                disabled={
                  addingToCart ||
                  currentStock ===
                    0
                }
                onClick={() =>
                  addProductToCart(
                    false
                  )
                }
              >
                🛒{" "}
                {addingToCart
                  ? "جاري الإضافة..."
                  : "أضف إلى السلة"}
              </button>

            </div>

          </div>

        </section>


        <section className="pd-section pd-seller-section">

          <div className="pd-section-title">

            <h2>
              معلومات البائع
            </h2>

          </div>


          <div className="pd-seller-detail">

            <div className="pd-seller-avatar">
              {sellerName
                ?.charAt(0) ||
                "س"}
            </div>


            <div className="pd-seller-info">

              <strong>
                {sellerName}
              </strong>


              {sellerRating >
                0 ? (

                <div>

                  {renderStars(
                    sellerRating /
                      20
                  )}

                  <span>
                    {" "}
                    {sellerRating}%
                    تقييم البائع
                  </span>

                </div>

              ) : (

                <span>
                  متجر على سوا
                </span>

              )}

            </div>

          </div>

        </section>


        {(description ||
          mainSpecs.length >
            0) && (

          <section className="pd-section">

            <div className="pd-section-title">

              <h2>
                مواصفات المنتج
              </h2>

            </div>


            {description && (

              <div className="pd-description">

                {String(
                  description
                )
                  .split(
                    "\n"
                  )
                  .map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                      >
                        {
                          paragraph
                        }
                      </p>
                    )
                  )}

              </div>

            )}

          </section>

        )}


        {mainSpecs.length >
          0 && (

          <section className="pd-section">

            <div className="pd-section-title">

              <h2>
                المواصفات الرئيسية
              </h2>

            </div>


            <div className="pd-spec-table">

              {mainSpecs.map(
                (
                  spec,
                  index
                ) => (

                  <div
                    className="pd-spec-row"
                    key={`${spec.label}-${index}`}
                  >

                    <span className="pd-spec-label">
                      {
                        spec.label
                      }
                    </span>

                    <span className="pd-spec-value">
                      {
                        spec.value
                      }
                    </span>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        <section
          className="pd-section"
          ref={
            reviewRef
          }
        >

          <div className="pd-section-title pd-review-title">

            <div>

              <h2>
                تقييمات العملاء
              </h2>

              <div className="pd-review-summary">

                {renderStars(
                  averageRating,
                  "large"
                )}

                <strong>
                  {averageRating
                    ? averageRating.toFixed(
                        1
                      )
                    : "0.0"}
                </strong>

                <span>
                  من 5
                </span>

                <span>
                  •{" "}
                  {reviewCount}{" "}
                  تقييم
                </span>

              </div>

            </div>

          </div>


          {visibleReviews.length >
          0 ? (

            <div className="pd-reviews">

              {visibleReviews.map(
                (
                  review,
                  index
                ) => {

                  const rating =
                    toNumber(
                      review.rating,
                      0
                    );

                  const reviewer =
                    review.userName ||
                    review.name ||
                    review.author ||
                    "عميل";

                  const reviewText =
                    review.comment ||
                    review.text ||
                    review.review ||
                    "";

                  return (

                    <article
                      className="pd-review"
                      key={
                        review.id ||
                        index
                      }
                    >

                      <div className="pd-review-head">

                        <div className="pd-review-avatar">
                          {reviewer.charAt(
                            0
                          )}
                        </div>


                        <div>

                          <strong>
                            {
                              reviewer
                            }
                          </strong>

                          <div>
                            {renderStars(
                              rating
                            )}
                          </div>

                        </div>


                        {(review.verifiedPurchase ||
                          review.verified ||
                          review.isVerified) && (

                          <span className="pd-verified">
                            ✓ شراء موثق
                          </span>

                        )}

                      </div>


                      {reviewText && (

                        <p>
                          {
                            reviewText
                          }
                        </p>

                      )}


                      {review.createdAt && (

                        <small className="pd-review-date">

                          {String(
                            review.createdAt
                          )}

                        </small>

                      )}

                    </article>

                  );
                }
              )}

            </div>

          ) : (

            <div className="pd-no-reviews">
              لا توجد تقييمات حتى الآن.
            </div>

          )}


          {reviews.length >
            4 && (

            <button
              type="button"
              className="pd-outline-btn"
              onClick={() =>
                setShowAllReviews(
                  (value) =>
                    !value
                )
              }
            >
              {showAllReviews
                ? "عرض أقل"
                : `عرض كل التقييمات (${reviews.length})`}
            </button>

          )}


          <form
            className="pd-review-form"
            onSubmit={
              submitReview
            }
          >

            <h3>
              شاركنا تقييمك
            </h3>


            <div className="pd-rating-picker">

              {[1, 2, 3, 4, 5].map(
                (star) => (

                  <button
                    type="button"
                    key={star}
                    className={
                      star <=
                      userRating
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setUserRating(
                        star
                      )
                    }
                  >
                    ★
                  </button>

                )
              )}

            </div>


            <textarea
              value={
                comment
              }
              onChange={(
                event
              ) =>
                setComment(
                  event.target
                    .value
                )
              }
              placeholder="اكتب تجربتك مع المنتج..."
              rows={4}
            />


            <div className="pd-review-submit-row">

              <button
                type="submit"
                className="pd-primary-btn"
                disabled={
                  reviewLoading
                }
              >
                {reviewLoading
                  ? "جاري الإرسال..."
                  : "إرسال التقييم"}
              </button>


              {reviewMessage && (

                <span className="pd-review-message">
                  {
                    reviewMessage
                  }
                </span>

              )}

            </div>

          </form>

        </section>


        {relatedProducts.length >
          0 && (

          <section className="pd-section">

            <div className="pd-section-title">

              <h2>
                شاهد العملاء أيضًا
              </h2>

              <span>
                منتجات مشابهة
              </span>

            </div>


            <div className="pd-related-grid">

              {relatedProducts.map(
                renderProductCard
              )}

            </div>

          </section>

        )}


        {recentProducts.length >
          0 && (

          <section className="pd-section">

            <div className="pd-section-title">

              <h2>
                المنتجات التي تمت مشاهدتها مؤخرًا
              </h2>

            </div>


            <div className="pd-related-grid">

              {recentProducts.map(
                renderProductCard
              )}

            </div>

          </section>

        )}

      </main>


      <div className="pd-mobile-buybar">

        <div className="pd-mobile-price">

          <strong>
            {formatPrice(
              currentPrice
            )}
          </strong>

          <small>
            ج.م
          </small>

        </div>


        <button
          type="button"
          onClick={() =>
            addProductToCart(
              false
            )
          }
          disabled={
            addingToCart ||
            currentStock ===
              0
          }
        >
          🛒 أضف للسلة
        </button>

      </div>


      {/* =====================================================
          SHARE MODAL
          ===================================================== */}

      {shareOpen && (

        <div
          className="pd-share-overlay"
          role="presentation"
          onClick={
            closeShareMenu
          }
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 99999,
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding:
              "20px",
            background:
              "rgba(4, 12, 27, 0.58)",
            backdropFilter:
              "blur(8px)",
            WebkitBackdropFilter:
              "blur(8px)",
          }}
        >

          <div
            className="pd-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pd-share-title"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            style={{
              width:
                "min(100%, 470px)",
              maxHeight:
                "calc(100vh - 40px)",
              overflowY:
                "auto",
              borderRadius:
                "24px",
              background:
                "rgba(255,255,255,0.98)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.28)",
              border:
                "1px solid rgba(212,175,55,0.22)",
              padding:
                "22px",
              direction:
                "rtl",
              position:
                "relative",
            }}
          >

            <button
              type="button"
              onClick={
                closeShareMenu
              }
              aria-label="إغلاق المشاركة"
              style={{
                position:
                  "absolute",
                top:
                  "14px",
                left:
                  "14px",
                width:
                  "36px",
                height:
                  "36px",
                borderRadius:
                  "50%",
                border:
                  "1px solid rgba(7,26,54,0.10)",
                background:
                  "#f7f9fc",
                color:
                  "#071A36",
                fontSize:
                  "24px",
                lineHeight:
                  1,
                cursor:
                  "pointer",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              ×
            </button>


            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "4px 42px 18px",
              }}
            >

              <div
                style={{
                  width:
                    "52px",
                  height:
                    "52px",
                  borderRadius:
                    "16px",
                  margin:
                    "0 auto 12px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color:
                    "#D4AF37",
                  background:
                    "linear-gradient(135deg, #071A36, #0B1F3A)",
                  boxShadow:
                    "0 10px 24px rgba(7,26,54,0.18)",
                }}
              >
                <ShareIcon
                  size={27}
                />
              </div>


              <h3
                id="pd-share-title"
                style={{
                  margin:
                    0,
                  color:
                    "#071A36",
                  fontSize:
                    "20px",
                  fontWeight:
                    800,
                }}
              >
                مشاركة المنتج
              </h3>


              <p
                style={{
                  margin:
                    "7px 0 0",
                  color:
                    "#687386",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.7,
                  overflowWrap:
                    "anywhere",
                }}
              >
                {productTitle}
              </p>

            </div>


            <div
              className="pd-share-grid"
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap:
                  "12px",
              }}
            >

              <button
                type="button"
                onClick={() =>
                  handleSocialShare(
                    "facebook"
                  )
                }
                style={{
                  border:
                    "1px solid rgba(24,119,242,0.15)",
                  background:
                    "rgba(24,119,242,0.07)",
                  color:
                    "#1877F2",
                  borderRadius:
                    "17px",
                  minHeight:
                    "92px",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "7px",
                  fontWeight:
                    700,
                }}
              >
                <FacebookIcon />
                <span>
                  Facebook
                </span>
              </button>


              <button
                type="button"
                onClick={() =>
                  handleSocialShare(
                    "messenger"
                  )
                }
                style={{
                  border:
                    "1px solid rgba(0,132,255,0.15)",
                  background:
                    "rgba(0,132,255,0.07)",
                  color:
                    "#0084FF",
                  borderRadius:
                    "17px",
                  minHeight:
                    "92px",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "7px",
                  fontWeight:
                    700,
                }}
              >
                <MessengerIcon />
                <span>
                  Messenger
                </span>
              </button>


              <button
                type="button"
                onClick={() =>
                  handleSocialShare(
                    "whatsapp"
                  )
                }
                style={{
                  border:
                    "1px solid rgba(37,211,102,0.18)",
                  background:
                    "rgba(37,211,102,0.08)",
                  color:
                    "#16A34A",
                  borderRadius:
                    "17px",
                  minHeight:
                    "92px",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "7px",
                  fontWeight:
                    700,
                }}
              >
                <WhatsAppIcon />
                <span>
                  WhatsApp
                </span>
              </button>


              <button
                type="button"
                onClick={() =>
                  handleSocialShare(
                    "telegram"
                  )
                }
                style={{
                  border:
                    "1px solid rgba(42,171,238,0.18)",
                  background:
                    "rgba(42,171,238,0.08)",
                  color:
                    "#1597D0",
                  borderRadius:
                    "17px",
                  minHeight:
                    "92px",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "7px",
                  fontWeight:
                    700,
                }}
              >
                <TelegramIcon />
                <span>
                  Telegram
                </span>
              </button>


              <button
                type="button"
                onClick={() =>
                  handleSocialShare(
                    "instagram"
                  )
                }
                style={{
                  border:
                    "1px solid rgba(193,53,132,0.18)",
                  background:
                    "rgba(193,53,132,0.07)",
                  color:
                    "#C13584",
                  borderRadius:
                    "17px",
                  minHeight:
                    "92px",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "7px",
                  fontWeight:
                    700,
                }}
              >
                <InstagramIcon />
                <span>
                  Instagram
                </span>
              </button>


              <button
                type="button"
                onClick={
                  copyProductLink
                }
                style={{
                  border:
                    "1px solid rgba(7,26,54,0.12)",
                  background:
                    "#f7f9fc",
                  color:
                    "#071A36",
                  borderRadius:
                    "17px",
                  minHeight:
                    "92px",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "7px",
                  fontWeight:
                    700,
                }}
              >
                <LinkIcon />
                <span>
                  {copied
                    ? "تم النسخ ✓"
                    : "نسخ الرابط"}
                </span>
              </button>

            </div>


            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (

              <button
                type="button"
                onClick={
                  handleNativeShare
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    "14px",
                  minHeight:
                    "50px",
                  borderRadius:
                    "15px",
                  border:
                    "1px solid rgba(212,175,55,0.35)",
                  background:
                    "linear-gradient(135deg, #071A36, #0B1F3A)",
                  color:
                    "#fff",
                  cursor:
                    "pointer",
                  fontSize:
                    "14px",
                  fontWeight:
                    800,
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "8px",
                }}
              >
                <ShareIcon
                  size={19}
                />

                مشاركة من الجهاز
              </button>

            )}

          </div>

        </div>

      )}


      {copied && !shareOpen && (

        <div
          className="pd-copy-toast"
          role="status"
          style={{
            position:
              "fixed",
            right:
              "20px",
            bottom:
              "24px",
            zIndex:
              100000,
            padding:
              "12px 17px",
            borderRadius:
              "14px",
            background:
              "#071A36",
            color:
              "#fff",
            boxShadow:
              "0 12px 35px rgba(0,0,0,0.22)",
            fontSize:
              "13px",
            fontWeight:
              700,
            direction:
              "rtl",
          }}
        >
          تم نسخ رابط المنتج
        </div>

      )}


      {lightboxOpen && (

        <div
          className="pd-lightbox"
          onClick={
            closeLightbox
          }
        >

          <button
            type="button"
            className="pd-lightbox-close"
            onClick={
              closeLightbox
            }
            aria-label="إغلاق"
          >
            ×
          </button>


          <button
            type="button"
            className="pd-lightbox-prev"
            onClick={(
              event
            ) => {
              event.stopPropagation();

              previousImage();
            }}
            aria-label="الصورة السابقة"
          >
            ‹
          </button>


          <div
            className="pd-lightbox-content"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            {allGalleryImages[
              lightboxIndex
            ] && (

              <img
                src={
                  allGalleryImages[
                    lightboxIndex
                  ]
                }
                alt={
                  productTitle
                }
                style={{
                  transform: `scale(${zoom})`,
                }}
                onDoubleClick={() =>
                  setZoom(
                    (value) =>
                      value === 1
                        ? 2
                        : 1
                  )
                }
              />

            )}


            <div className="pd-lightbox-controls">

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.max(
                        1,
                        value -
                          0.25
                      )
                  )
                }
              >
                −
              </button>


              <span>

                {Math.round(
                  zoom * 100
                )}

                %

              </span>


              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.min(
                        3,
                        value +
                          0.25
                      )
                  )
                }
              >
                +
              </button>

            </div>

          </div>


          <button
            type="button"
            className="pd-lightbox-next"
            onClick={(
              event
            ) => {
              event.stopPropagation();

              nextImage();
            }}
            aria-label="الصورة التالية"
          >
            ›
          </button>

        </div>

      )}


      <Footer />

    </div>
  );
}


export default ProductDetails;