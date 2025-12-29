/**
 * Size Columns Configuration
 * 
 * Add all the size columns that your Excel files use.
 * The application will look for these column names in your files.
 * 
 * INSTRUCTIONS:
 * 1. Add any size names your files use
 * 2. Can be letter sizes (XS, S, M, L, XL)
 * 3. Can be numeric sizes (28, 30, 32, 34)
 * 4. Can be custom sizes (SMALL, MEDIUM, LARGE)
 * 5. Must match EXACTLY with your Excel column headers
 * 
 * EXAMPLES:
 * - Letter sizes: "XS", "S", "M", "L", "XL", "XXL"
 * - Numeric sizes: "28", "30", "32", "34", "36", "38"
 * - Extended sizes: "2XL", "3XL", "4XL", "5XL"
 * - Plus sizes: "1X", "2X", "3X", "4X", "5X"
 * - Tall sizes: "LT", "XLT", "2XT", "3XT"
 * - International: "UK8", "UK10", "EU38", "EU40"
 * - Custom: "ONESIZE", "FREE", "SMALL", "MEDIUM", "LARGE"
 */

const SIZES = [
    // Standard Letter Sizes
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",

    // Extended Sizes
    "2XL",
    "3XL",
    "4XL",
    "5XL",

    // Numeric Sizes (add more as needed)
    "28",
    "30",
    "32",
    "34",
    "36",
    "38",
    "40",
    "42",
    "44",
    "46",

    // Plus Sizes (uncomment if needed)
    "1X",
    "2X",
    "3X",
    "4X",
    "5X",
    "6X",

    // Tall Sizes (uncomment if needed)
    "LT",
    "XLT",
    "2XT",
    "3XT",
    "4XT",
    "5XT",

    // Add your custom sizes below:
    // "CUSTOM_SIZE_1",
    // "CUSTOM_SIZE_2",
];

/**
 * TIPS:
 * - Size names are case-sensitive
 * - Must match your Excel column headers exactly
 * - Add sizes in the order you want them to appear
 * - Remove sizes you don't use to improve performance
 * - You can add as many sizes as you need
 */
