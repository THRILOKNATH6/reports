# Order Load Pack Comparison Tool - File Structure

## Main Application Files

### 1. **order-load-pack-hide-zero-load.html** (Main HTML File - 88 lines)
- Contains the HTML structure for order comparison
- Includes file upload inputs, buttons, filters, and output containers
- Links to external CSS and JavaScript files
- Clean and minimal - only HTML structure

### 2. **styles.css** (Stylesheet - 329 lines)
- Contains all CSS styling for both pages
- Includes styles for:
  - Layout (body, sections, blocks)
  - Upload section and file inputs
  - Buttons and hover effects
  - Tables and data display
  - Filter section and controls
  - Summary cards
  - PO view sections
  - Daily summary sections
  - Badges and status indicators

### 3. **app.js** (JavaScript Application - 881 lines)
- Contains all application logic for order comparison
- Key functions include:
  - Excel file reading and processing
  - Data normalization and merging
  - Date conversion (Excel to JavaScript dates)
  - Filtering and searching
  - View rendering (loaded, not loaded, cleared, partial, PO view)
  - Export functionality (PDF and Excel)
  - Summary calculations

## Daily Summary Page Files

### 4. **daily-summary.html** (Daily Summary Page - 48 lines)
- Separate page for daily loading and packing summary
- Upload section for Load and Pack files only
- Date range filter
- Back button to main page

### 5. **daily-summary.js** (Daily Summary Logic - 298 lines)
- Standalone JavaScript for daily summary functionality
- Processes raw data with dates
- Aggregates by date, LINE, OC, Style, PO, Country, Colour
- Date range filtering
- Accurate quantity tracking per date

## Benefits of Separation

1. **Maintainability**: Easier to find and edit specific code
2. **Reusability**: CSS and JS can be reused in other projects
3. **Performance**: Browser can cache CSS and JS files separately
4. **Organization**: Clear separation of concerns (structure, style, behavior)
5. **Collaboration**: Multiple developers can work on different files
6. **Debugging**: Easier to debug when code is organized
7. **Modularity**: Daily summary is now a separate module

## File Sizes

- **Main Page**:
  - HTML: ~3.8 KB
  - CSS: ~4.9 KB (shared)
  - JavaScript: ~27.6 KB

- **Daily Summary Page**:
  - HTML: ~2.1 KB
  - CSS: ~4.9 KB (shared)
  - JavaScript: ~10.8 KB

Total: ~54.1 KB

## Usage

### Main Application
Open `order-load-pack-hide-zero-load.html` in a web browser to:
- Compare Order, Load, and Pack files
- View different filtered views
- Export to PDF or Excel
- Access PO view

### Daily Summary
Click the "Daily Summary" button from the main page, or directly open `daily-summary.html` to:
- Upload Load and Pack files
- View date-wise summary of loading and packing
- Filter by date range
- See detailed breakdown by LINE, OC, Style, PO, Country, Colour
